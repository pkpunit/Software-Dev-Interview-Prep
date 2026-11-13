---
title: Spring Security Interview Questions & Answers
layout: docs
category: spring-boot
tags: [spring-security, authentication, authorization, jwt, oauth2, csrf, cors, filters, interview]
level: junior-to-senior
questions: 66
---

# Spring Security — Interview Questions & Answers

> **66 questions**: architecture (filter chain, `SecurityContext`, `AuthenticationManager`), authentication (sessions, passwords, JWT), OAuth2/OIDC, authorization (URL + method security), web attacks (CSRF/CORS/XSS), microservice security, testing and real debugging scenarios.
> Every answer follows the same pattern: **In one line** → **Explained simply** (analogy) → **Example / code** → **Interview tip / trap / follow-up**.
> **Modern style:** all code uses **Spring Security 6 / Spring Boot 3** (`SecurityFilterChain` bean, lambda DSL, `requestMatchers`, `@EnableMethodSecurity`). Older sources still show `WebSecurityConfigurerAdapter`, XML `<intercept-url>` and `antMatchers` — those are **removed/deprecated**; the concepts are the same and mapped where relevant.
> Sources: Javarevisited (25 Spring Security questions — free portion read), CodingShuttle (Spring Boot security questions), Spring Security reference docs, OWASP guidance, plus real interview scenarios. The Medium (neesri), Intervue and InterviewBit lists could not be opened automatically (bot-blocking/paywall), so their usual topics — filter chain, JWT, OAuth2, CSRF/CORS, method security — are covered from the standard question set.

**Legend:** 🟢 Easy &nbsp;|&nbsp; 🟡 Medium &nbsp;|&nbsp; 🔴 Hard &nbsp;|&nbsp; ⭐ Must-know (asked very often)

> 📎 **Companion pages:** `spring-boot-core.md` · `spring-aop.md` (method security is AOP) · `spring-boot-rest-api.md` · `spring-boot-microservices-kafka.md` · `spring-boot-testing.md`

---

## 📑 On this page

| # | Section | Questions |
|---|---------|-----------|
| 1 | [Fundamentals & Architecture](#1-fundamentals--architecture) | Q1 – Q14 |
| 2 | [Authentication](#2-authentication) | Q15 – Q26 |
| 3 | [JWT, OAuth2 & OpenID Connect](#3-jwt-oauth2--openid-connect) | Q27 – Q42 |
| 4 | [Authorization](#4-authorization) | Q43 – Q50 |
| 5 | [Web Attacks & Protections](#5-web-attacks--protections) | Q51 – Q58 |
| 6 | [Scenarios, Testing & Debugging](#6-scenarios-testing--debugging) | Q59 – Q66 |

**Quick revision — top 15 ⭐:** Q2 (authN vs authZ) · Q3 (filter chain) · Q5 (`SecurityContext`) · Q6 (`AuthenticationManager` flow) · Q9 (`SecurityFilterChain` bean) · Q10 (role vs authority) · Q11 (custom filter) · Q16 (stateless vs session) · Q20 (password hashing) · Q23 (401 vs 403) · Q27–28 (JWT + filter) · Q31 (JWT revocation) · Q35–36 (OAuth2 grants + PKCE) · Q44 (method security) · Q51–52 (CSRF & CORS)

---

## 1. Fundamentals & Architecture

### Q1. 🟢 What is Spring Security and what does it give you?
**In one line:** A framework that adds **authentication, authorization and protection against common attacks** to Spring applications, mostly through a chain of **servlet filters**.

**It provides:** login mechanisms (form, Basic, JWT, OAuth2/OIDC, SAML, LDAP), password hashing, session management, URL- and method-level access control, CSRF/CORS/security headers, integration with Spring MVC, Boot, Data and testing.
**Interview tip:** Say *"it works at the filter level, before requests reach controllers, and at the method level via AOP proxies."*

### Q2. ⭐🟢 Authentication vs authorization — which comes first? And 401 vs 403?
**In one line:** **Authentication = "who are you?"**; **authorization = "what are you allowed to do?"** Authentication always comes first.

**Explained simply (analogy — airport):** Showing your **passport and boarding pass** = authentication. Whether you may enter the **business lounge** = authorization.

| | Authentication | Authorization |
|---|----------------|---------------|
| Question | Who are you? | What can you access? |
| Inputs | Username/password, token, certificate | Roles, authorities, rules |
| Failure status | **401 Unauthorized** | **403 Forbidden** |
| Spring component | `AuthenticationManager` | `AuthorizationManager` / `@PreAuthorize` |

**Trap:** HTTP 401 is named "Unauthorized" but really means **"unauthenticated"**; 403 means **authenticated but not permitted**.

### Q3. ⭐🟡 Explain the Spring Security architecture — the filter chain.
**In one line:** Every request passes through an ordered **chain of security filters**; each filter handles one concern (CORS, CSRF, login, token parsing, authorization…) and either continues the chain or stops the request.

**Explained simply (analogy — airport security lanes):** ID check → baggage scan → metal detector → boarding gate. Each checkpoint can let you through or send you back.

```
Browser ─► Servlet Container (Tomcat)
              │
        DelegatingFilterProxy  (bridge: servlet world → Spring beans)
              │
        FilterChainProxy  ("springSecurityFilterChain" bean)
              │ picks the matching SecurityFilterChain for this URL
              ▼
   [ CorsFilter ] → [ CsrfFilter ] → [ LogoutFilter ] → [ UsernamePassword/Bearer/Basic filters ]
        → [ AnonymousAuthenticationFilter ] → [ ExceptionTranslationFilter ] → [ AuthorizationFilter ]
              │ (all passed)
              ▼
        DispatcherServlet → Controller
```
**Key components:** `FilterChainProxy` (the single entry filter), one or more **`SecurityFilterChain`** beans (a URL matcher + filter list), `SecurityContextHolder`, `AuthenticationManager`, `AuthorizationManager`.

### Q4. 🟡 Which filters are in the chain, and in what order?
**Order (simplified, Spring Security 6):**
1. `DisableEncodeUrlFilter`, `WebAsyncManagerIntegrationFilter`
2. **`SecurityContextHolderFilter`** — loads the `SecurityContext` (e.g., from the session). *(Replaced `SecurityContextPersistenceFilter` in 6.)*
3. `HeaderWriterFilter` — adds security headers
4. **`CorsFilter`**
5. **`CsrfFilter`**
6. `LogoutFilter`
7. **`UsernamePasswordAuthenticationFilter`** (form login) / `BasicAuthenticationFilter` / `BearerTokenAuthenticationFilter` (OAuth2 resource server)
8. `RequestCacheAwareFilter`, `SecurityContextHolderAwareRequestFilter`
9. **`AnonymousAuthenticationFilter`** — gives unauthenticated users an "anonymous" identity
10. `SessionManagementFilter`
11. **`ExceptionTranslationFilter`** — converts security exceptions to 401/403 responses
12. **`AuthorizationFilter`** — final access decision. *(Replaced `FilterSecurityInterceptor` in 6.)*

Your **custom JWT filter** typically goes **before `UsernamePasswordAuthenticationFilter`** (Q11). Print the real chain with `logging.level.org.springframework.security=DEBUG` — it lists filters at startup.

### Q5. ⭐🟡 What are `SecurityContext`, `SecurityContextHolder`, `Authentication`, `Principal` and `GrantedAuthority`?
**In one line:** The **"who is the current user" objects**, stored per thread.

| Object | Role |
|--------|------|
| **`SecurityContextHolder`** | Static access point; stores the context in a **`ThreadLocal`** (default strategy) |
| **`SecurityContext`** | Holds the current `Authentication` |
| **`Authentication`** | The user's identity + credentials + authorities + `isAuthenticated()` flag |
| **`Principal`** | "The user" — usually a `UserDetails` object (`authentication.getPrincipal()`) |
| **`GrantedAuthority`** | One permission/role string (`ROLE_ADMIN`, `orders:read`) |

```java
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
String username = auth.getName();
Collection<? extends GrantedAuthority> roles = auth.getAuthorities();

// In controllers – cleaner:
@GetMapping("/me")
public String me(@AuthenticationPrincipal UserDetails user) { return user.getUsername(); }
```
**Why `ThreadLocal`?** One request = one thread → the context is automatically "the current request's user". **Trap:** new threads (`@Async`, executors) **don't inherit it** (Q50). `getContext().getAuthentication()` can be `null`/anonymous — always check.

### Q6. ⭐🟡 How does the authentication process work? (`AuthenticationManager` → `ProviderManager` → `AuthenticationProvider`)
**In one line:** A filter builds an **unauthenticated `Authentication`** from the request, hands it to **`AuthenticationManager`**, which asks **`AuthenticationProvider`s**; the successful result is stored in the `SecurityContext`.

```
Filter (e.g. login/JWT)
   └─► new UsernamePasswordAuthenticationToken(user, pass)      [authenticated = false]
         └─► AuthenticationManager.authenticate(token)
               └─► ProviderManager  (loops over providers; first that supports the token type wins)
                     └─► DaoAuthenticationProvider
                           ├─ UserDetailsService.loadUserByUsername()   → UserDetails (hash from DB)
                           └─ PasswordEncoder.matches(raw, hash)
                     ◄── returns authenticated token (with authorities)   [authenticated = true]
   └─► SecurityContextHolder.getContext().setAuthentication(result)
```
Failures throw `AuthenticationException` (`BadCredentialsException`, `LockedException`, `DisabledException`…) → `AuthenticationEntryPoint` → **401**.
**Extending:** implement your own `AuthenticationProvider` for custom credentials (API key, OTP, LDAP-like systems).

### Q7. 🟢 What are `UserDetails` and `UserDetailsService`?
- **`UserDetails`** — Spring's user model: `getUsername()`, `getPassword()` (hash), `getAuthorities()`, `isEnabled()`, `isAccountNonLocked()`, `isAccountNonExpired()`, `isCredentialsNonExpired()`.
- **`UserDetailsService`** — one method, `loadUserByUsername(String)`; you implement it to load users from your DB/LDAP/API.
- Built-ins: `InMemoryUserDetailsManager`, `JdbcUserDetailsManager`. Example in Q19.

### Q8. 🟢 What happens when I just add `spring-boot-starter-security`?
**In one line:** **Everything gets locked down** with sensible defaults.

- **All endpoints** require authentication; **form login page** (`/login`) + **HTTP Basic** enabled.
- A default user **`user`** with a **random password printed at startup** (`Using generated security password: …`); override with `spring.security.user.name/password`.
- **CSRF protection ON**, **session-based** auth, standard **security headers**, `/logout`.
- **Trap:** an API call without credentials returns **401** (or redirects to `/login` for browsers); a `POST` without CSRF token returns **403** — the most common "why is my POST blocked?" cause.

### Q9. ⭐🟡 How do you configure Spring Security in Spring Boot 3 (no `WebSecurityConfigurerAdapter`)?
**In one line:** Declare a **`SecurityFilterChain` bean** using `HttpSecurity` and the **lambda DSL**.

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity                        // enables @PreAuthorize etc. (Q44)
public class SecurityConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http, JwtAuthFilter jwtFilter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())                                         // stateless API (Q51)
            .cors(Customizer.withDefaults())                                       // uses a CorsConfigurationSource bean (Q52)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/auth/**", "/actuator/health", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/products/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())                                     // deny-by-default style
            .exceptionHandling(e -> e
                .authenticationEntryPoint(restEntryPoint)                          // 401 JSON (Q23)
                .accessDeniedHandler(restAccessDenied))                            // 403 JSON
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean PasswordEncoder passwordEncoder() { return PasswordEncoderFactories.createDelegatingPasswordEncoder(); }

    @Bean AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}
```
**Old → new mapping:**
| Old (removed/deprecated) | Spring Security 6 |
|--------------------------|--------------------|
| `extends WebSecurityConfigurerAdapter` | `SecurityFilterChain` bean |
| `authorizeRequests()` | `authorizeHttpRequests()` |
| `antMatchers/mvcMatchers` | `requestMatchers` |
| `@EnableGlobalMethodSecurity` | `@EnableMethodSecurity` |
| `FilterSecurityInterceptor` | `AuthorizationFilter` |
| `.and()` chaining | lambdas |
| XML `<intercept-url>` | `requestMatchers(...)` rules |

### Q10. ⭐🟡 Role vs authority — what's the `ROLE_` prefix about?
**In one line:** Both are `GrantedAuthority` strings; a **role is an authority prefixed with `ROLE_`** by convention.

| | `hasRole("ADMIN")` | `hasAuthority("ROLE_ADMIN")` | `hasAuthority("orders:write")` |
|---|-------------------|-----------------------------|-------------------------------|
| Checks stored authority | `ROLE_ADMIN` (prefix added automatically) | `ROLE_ADMIN` | `orders:write` |

```java
User.withUsername("punit").password(hash).roles("ADMIN")                 // stores ROLE_ADMIN
User.withUsername("svc").password(hash).authorities("orders:read")       // stores as is
```
**Traps:** storing `"ROLE_ADMIN"` and using `roles("ROLE_ADMIN")` → `ROLE_ROLE_ADMIN`; using `hasRole("ROLE_ADMIN")` is also normalised in newer versions, but don't mix styles. JWT scopes become **`SCOPE_xxx`** authorities by default (Q38). **Design tip:** roles = coarse groups (ADMIN, USER); **authorities/permissions** = fine-grained actions.

### Q11. ⭐🟡 How do you write a custom security filter and where do you add it?
**In one line:** Extend **`OncePerRequestFilter`** (runs once per request) and register it with **`addFilterBefore/After`** relative to a known filter.

```java
@Component
public class ApiKeyFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String key = req.getHeader("X-API-KEY");
        if (key != null && keyService.isValid(key)) {
            var auth = new UsernamePasswordAuthenticationToken("service-a", null,
                           List.of(new SimpleGrantedAuthority("ROLE_SERVICE")));
            SecurityContextHolder.getContext().setAuthentication(auth);      // authenticate this request
        }
        chain.doFilter(req, res);                                              // ALWAYS continue the chain
    }
}
// http.addFilterBefore(apiKeyFilter, UsernamePasswordAuthenticationFilter.class);
```
**Options:** `addFilterBefore`, `addFilterAfter`, `addFilterAt`. **Traps:** forgetting `chain.doFilter` (request hangs/blank); annotating the filter with `@Component` makes Boot **also register it as a normal servlet filter** (it runs **twice**) — either don't make it a bean, or add a `FilterRegistrationBean` with `setEnabled(false)`. *(Older sources: extend `GenericFilterBean` — `OncePerRequestFilter` is the better choice.)*

### Q12. 🟡 Can you have multiple `SecurityFilterChain`s? Why?
**In one line:** Yes — different URL spaces can have **different security rules** (e.g., stateless API vs form-login admin console). The **first chain whose `securityMatcher` matches** handles the request.

```java
@Bean @Order(1)
SecurityFilterChain api(HttpSecurity http) throws Exception {
    http.securityMatcher("/api/**")
        .authorizeHttpRequests(a -> a.anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS)).csrf(c -> c.disable());
    return http.build();
}

@Bean @Order(2)
SecurityFilterChain web(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(a -> a.requestMatchers("/login", "/css/**").permitAll().anyRequest().authenticated())
        .formLogin(Customizer.withDefaults());
    return http.build();                                  // catch-all, lowest priority
}
```
**Trap:** a chain without `securityMatcher` matches **everything** — give it the **last** `@Order`.

### Q13. ⭐🟡 How do request matchers work — does order matter?
**In one line:** **Yes — rules are evaluated top to bottom, first match wins**, so write **specific → general** and end with a catch-all.

```java
.authorizeHttpRequests(a -> a
    .requestMatchers("/admin/**").hasRole("ADMIN")            // specific first
    .requestMatchers(HttpMethod.POST, "/orders").hasAuthority("orders:write")
    .requestMatchers("/public/**", "/login").permitAll()
    .anyRequest().authenticated())                             // catch-all LAST (deny-by-default)
```
**Traps:**
- `.anyRequest().permitAll()` first (or a broad `/**` early) **shadows** later rules → admin endpoints accidentally public.
- Spring Security 6 **throws an error if `anyRequest()` isn't last**.
- `/orders` vs `/orders/` and path-variable matching differences → use `/orders/**` carefully and test; the legacy XML `<intercept-url>` had the same "order matters" rule.
- Best practice: **whitelist** public URLs, **deny everything else** (`anyRequest().authenticated()` or `.denyAll()`).

### Q14. 🟡 What are `DelegatingFilterProxy` and `FilterChainProxy`?
**In one line:** `DelegatingFilterProxy` is a **servlet filter registered with the container** that **delegates to a Spring bean** (`springSecurityFilterChain`) — because servlet filters are created by the container, **before** Spring beans exist. That bean is **`FilterChainProxy`**, which holds the actual `SecurityFilterChain`s.

- In Spring Boot, **`SecurityFilterAutoConfiguration`** registers `DelegatingFilterProxy` for you (no `web.xml`).
- The target bean must implement `Filter`; its **lifecycle (`init/destroy`) is managed by Spring** by default (older `web.xml` option `targetFilterLifecycle=true` hands it to the container).
- `FilterChainProxy` adds features a plain filter couldn't: **multiple chains**, firewalling (`HttpFirewall` blocks malformed URLs like `//` or `%2e`), clearing the `SecurityContext` after the request.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; Next: [Authentication →](#2-authentication)

---

## 2. Authentication

### Q15. 🟢 Form login vs HTTP Basic vs token-based — when to use which?
| Mechanism | How credentials travel | Typical use |
|-----------|------------------------|-------------|
| **Form login** | HTML form POST → server session (cookie `JSESSIONID`) | Server-rendered web apps |
| **HTTP Basic** | `Authorization: Basic base64(user:pass)` **on every request** | Quick internal tools, service calls over **HTTPS only** (Base64 ≠ encryption) |
| **Bearer token (JWT/opaque)** | `Authorization: Bearer <token>` | REST APIs, SPAs, mobile, microservices |
| **OAuth2 / OIDC login** | Redirect to an identity provider | "Login with Google", enterprise SSO |
| **mTLS / API key** | Client certificate / header key | Service-to-service, B2B |

### Q16. ⭐🟡 Stateful (session) vs stateless authentication?
**In one line:** **Stateful** = the server remembers you (session); **stateless** = every request carries proof (token) and the server remembers nothing.

| | Session (stateful) | Token (stateless) |
|---|--------------------|-------------------|
| Server state | **Session store** (memory/Redis) | None (token is self-contained) |
| Scaling | Needs sticky sessions or **Spring Session + Redis** | **Horizontally scalable** easily |
| Logout/revocation | Easy (invalidate session) | **Hard** (Q31) |
| CSRF risk | **Yes** (cookies sent automatically) | Low (if token is in a header) |
| Best for | Traditional web apps | APIs, microservices, mobile |
```java
.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))   // never create/use sessions
```
**Interview tip:** "Stateless" also means disabling session creation **and** not relying on `SecurityContext` persistence between requests — each request re-authenticates via the token.

### Q17. 🟡 How does Spring Security manage sessions — fixation, concurrency, timeout?
- **Session fixation protection:** after login Spring **issues a new session id** (default `migrateSession`) so an attacker's pre-set id becomes useless.
- **Concurrent sessions:** `.sessionManagement(s -> s.maximumSessions(1).maxSessionsPreventsLogin(false))` (+ register `HttpSessionEventPublisher`) → a new login **expires the old session** (or blocks the new login).
- **Timeout:** `server.servlet.session.timeout=30m`; cookie flags `server.servlet.session.cookie.http-only=true`, `secure=true`, `same-site=strict|lax`.
- **Distributed apps:** **Spring Session** (Redis/JDBC) so any instance can read the session.

### Q18. 🟢 What is "remember-me"?
Keeps the user logged in after the session expires using a **long-lived cookie**. Two flavours: **hash-based** (cookie = signed hash; simple, weaker) and **persistent token** (stored in DB, rotated; safer). Treat it as lower assurance — require re-authentication for sensitive actions.

### Q19. ⭐🟡 How do you authenticate users stored in your own database (JPA)?
```java
@Entity
public class AppUser {
    @Id @GeneratedValue private Long id;
    @Column(unique = true) private String username;
    private String passwordHash;
    private boolean enabled = true;
    @ElementCollection(fetch = FetchType.EAGER) private Set<String> roles = new HashSet<>();   // "ADMIN", "USER"
}

@Service
public class DbUserDetailsService implements UserDetailsService {
    private final AppUserRepository repo;
    public DbUserDetailsService(AppUserRepository repo) { this.repo = repo; }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser u = repo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));   // generic message!
        return User.withUsername(u.getUsername())
                   .password(u.getPasswordHash())                  // stored HASH, e.g. {bcrypt}$2a$10$…
                   .roles(u.getRoles().toArray(String[]::new))     // ROLE_ prefix added
                   .disabled(!u.isEnabled())
                   .build();
    }
}
```
Declaring this `UserDetailsService` as a **bean** + a `PasswordEncoder` bean is enough — Boot wires a **`DaoAuthenticationProvider`** automatically.
**Security tips:** return the **same generic error** for "unknown user" and "wrong password" (avoid **user enumeration**); load roles eagerly (no `LazyInitializationException`, there's no session at that point).

### Q20. ⭐🟡 How should passwords be stored? What is `PasswordEncoder`?
**In one line:** **Never store plain text or fast hashes (MD5/SHA-1).** Store a **slow, salted, adaptive hash** (BCrypt/Argon2) through a `PasswordEncoder`.

```java
@Bean PasswordEncoder encoder() { return PasswordEncoderFactories.createDelegatingPasswordEncoder(); }

String hash = encoder.encode("secret");                 // {bcrypt}$2a$10$N9qo8uLOickgx2ZMRZoMy…
boolean ok = encoder.matches("secret", hash);           // re-hashes with the SAME salt/params and compares
```
| Encoder | Notes |
|---------|-------|
| **`BCryptPasswordEncoder`** | Default choice; **salt is built into** the hash; cost factor (default 10) |
| `Argon2PasswordEncoder` / `SCryptPasswordEncoder` | Memory-hard; stronger vs GPUs |
| `Pbkdf2PasswordEncoder` | FIPS-friendly |
| **`DelegatingPasswordEncoder`** | Prefixes hashes with `{id}` (`{bcrypt}`, `{argon2}`) so you can **upgrade algorithms without breaking old users** (`upgradeEncoding`) |
| `{noop}` / `NoOpPasswordEncoder` | **Tests only** |
**Traps:** `There is no PasswordEncoder mapped for the id "null"` → stored hash has **no `{id}` prefix** (use a `BCryptPasswordEncoder` bean or prefix the hash). Encoding methods: `encode()` (hash a raw password), `matches()` (verify), `upgradeEncoding()`.

### Q21. 🟡 Hashing vs encryption vs encoding — and what is a salt?
| | Reversible? | Purpose | Example |
|---|-------------|---------|---------|
| **Encoding** | Yes (no key) | Data format | Base64 (HTTP Basic is **not** secure) |
| **Encryption** | Yes (with key) | Confidentiality | AES, RSA |
| **Hashing** | **No** (one-way) | Verify without storing | BCrypt, Argon2, SHA-256 |

**Salt:** random data mixed into each password **before** hashing so **identical passwords produce different hashes** → defeats rainbow tables and mass cracking. BCrypt embeds the salt in its output. **Pepper:** an extra secret (kept outside the DB) mixed in — optional hardening.

### Q22. 🟡 How do you build a JSON login endpoint (`/auth/login`) with `AuthenticationManager`?
```java
@RestController @RequestMapping("/auth")
public class AuthController {
    private final AuthenticationManager authManager;
    private final JwtService jwt;

    @PostMapping("/login")
    public TokenResponse login(@RequestBody @Valid LoginRequest req) {
        Authentication auth = authManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.username(), req.password()));   // throws on failure
        return new TokenResponse(jwt.generate(auth));                                    // issue JWT (Q27)
    }
}
```
`/auth/**` must be `permitAll()`. **Session-based JSON login gotcha (Security 6):** the context is **no longer saved automatically** (`SecurityContextHolderFilter`) → after authenticating manually you must save it via `HttpSessionSecurityContextRepository`/`SecurityContextRepository.saveContext(...)` or the user appears logged out on the next request.

### Q23. ⭐🟡 `AuthenticationEntryPoint` vs `AccessDeniedHandler` — how do you return JSON 401/403?
**In one line:** `AuthenticationEntryPoint` handles **unauthenticated** access (→ **401**); `AccessDeniedHandler` handles **authenticated but forbidden** (→ **403**).

```java
@Component
class RestEntryPoint implements AuthenticationEntryPoint {
    public void commence(HttpServletRequest req, HttpServletResponse res, AuthenticationException ex) throws IOException {
        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        res.setContentType("application/json");
        res.getWriter().write("{\"error\":\"unauthorized\",\"message\":\"Authentication required\"}");
    }
}
@Component
class RestAccessDenied implements AccessDeniedHandler {
    public void handle(HttpServletRequest req, HttpServletResponse res, AccessDeniedException ex) throws IOException {
        res.setStatus(HttpServletResponse.SC_FORBIDDEN);
        res.setContentType("application/json");
        res.getWriter().write("{\"error\":\"forbidden\",\"message\":\"Access denied\"}");
    }
}
// http.exceptionHandling(e -> e.authenticationEntryPoint(entryPoint).accessDeniedHandler(denied));
```
**Trap:** exceptions thrown from **controller `@PreAuthorize`** reach `@ControllerAdvice` first — handle `AccessDeniedException` (and `AuthenticationException`) there too, or they may become 500. Without a custom entry point, browsers get a **redirect to `/login`** instead of 401.

### Q24. 🟡 How do success/failure handlers and logout work?
- `AuthenticationSuccessHandler` — e.g., redirect by role, issue a token, log the event.
- `AuthenticationFailureHandler` — return a message, count failures.
- **Logout:** `.logout(l -> l.logoutUrl("/logout").invalidateHttpSession(true).deleteCookies("JSESSIONID").logoutSuccessHandler(...))`. With **CSRF on, logout must be a POST**. For JWT there is nothing to invalidate server-side by default (Q31).

### Q25. 🟡 What is anonymous authentication? `permitAll()` vs ignoring a path?
- Unauthenticated users aren't "null" — they get an **`AnonymousAuthenticationToken`** (`ROLE_ANONYMOUS`) so rules like `permitAll()` and `isAnonymous()` work uniformly.
- **`requestMatchers(...).permitAll()`** → request **still goes through the whole filter chain** (headers, CSRF, logging) but access is allowed. ✅ preferred.
- **`WebSecurityCustomizer.ignoring()`** → **bypasses Spring Security entirely** (no headers, no protection) — only for static resources, and discouraged.

### Q26. 🟡 How do you protect against brute-force login attempts?
- Count failures with `AuthenticationFailureBadCredentialsEvent` listeners (per user/IP) → **temporary lock** (`UserDetails.isAccountNonLocked()`) or **exponential delay**.
- **Rate limiting** at the gateway/filter (Bucket4j, API gateway), **CAPTCHA** after N failures, **MFA**.
- Generic error messages, **no user enumeration**, strong password policy, alerting on spikes.
- Don't hard-lock forever (lets attackers lock out real users — DoS); prefer **progressive delays**.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Fundamentals](#1-fundamentals--architecture) &nbsp;|&nbsp; Next: [JWT, OAuth2 & OIDC →](#3-jwt-oauth2--openid-connect)

---

## 3. JWT, OAuth2 & OpenID Connect

### Q27. ⭐🟡 What is a JWT and what is its structure?
**In one line:** A **JSON Web Token** is a **signed, compact, self-contained** token: `header.payload.signature` (each Base64URL-encoded).

```
eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiJwdW5pdCIsInJvbGVzIjpbIkFETUlOIl0sImV4cCI6MTc2MzAwMDAwMH0 . 3x9…
   HEADER                         PAYLOAD (claims)                                                  SIGNATURE
{"alg":"HS256"}      {"sub":"punit","roles":["ADMIN"],"iat":…,"exp":…,"iss":"auth.acme.com","aud":"orders-api"}
```
- **Claims:** `sub` (subject), `iss` (issuer), `aud` (audience), `exp` (expiry), `iat`, `nbf`, `jti` (id) + your own.
- **Signature** = sign(header + payload, key) → tamper-proof, **not secret**.
**Traps:** the payload is **only encoded, not encrypted** — **never put passwords/PII** in it (use JWE if confidentiality is needed). Anyone with the token can **use** it (bearer) → use HTTPS and short lifetimes.

### Q28. ⭐🟡 Implement JWT authentication in Spring Boot — what are the pieces?
**Flow:** login → server issues JWT → client sends `Authorization: Bearer <jwt>` → filter validates → sets `SecurityContext`.

```java
@Service
public class JwtService {                                   // jjwt 0.12.x
    private final SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretBase64));   // ≥ 256-bit, from config/Vault

    public String generate(UserDetails u) {
        return Jwts.builder().subject(u.getUsername())
            .claim("roles", u.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList())
            .issuer("acme-auth").issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 15 * 60_000))     // 15 min
            .signWith(key).compact();
    }
    public Claims parse(String token) {                     // throws JwtException if invalid/expired
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Claims c = jwt.parse(header.substring(7));
                List<SimpleGrantedAuthority> auths = ((List<?>) c.get("roles")).stream()
                        .map(r -> new SimpleGrantedAuthority(r.toString())).toList();
                var auth = new UsernamePasswordAuthenticationToken(c.getSubject(), null, auths);
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (JwtException e) { /* invalid token → stay unauthenticated → entry point returns 401 */ }
        }
        chain.doFilter(req, res);
    }
}
```
Plus the `SecurityFilterChain` from Q9 (stateless, CSRF off, `addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)`).
**Interview tip:** In production prefer the built-in **OAuth2 Resource Server** support (Q37) over hand-rolled JWT filters — it handles key rotation, validation and error responses.

### Q29. 🟡 Access token vs refresh token — how does the flow work?
- **Access token:** short-lived (5–15 min), sent with every API call.
- **Refresh token:** long-lived (days), stored securely, sent **only to the token endpoint** to get a new access token.
```
login → {access(15m), refresh(7d)}
API call with access … expires → 401
POST /auth/refresh {refresh} → new access (+ NEW refresh: rotation)
```
**Best practices:** **rotate** refresh tokens (one-time use) and detect reuse → revoke the whole family; store refresh tokens **hashed server-side** (so they can be revoked); bind to device/client; httpOnly cookie for browsers.

### Q30. 🟡 Where should the client store tokens — `localStorage` or cookies?
| | `localStorage`/memory | **httpOnly + Secure + SameSite cookie** |
|---|----------------------|------------------------------------------|
| XSS can read it? | **Yes** (JS access) | **No** (httpOnly) |
| CSRF exposure | No (manual header) | **Yes** → needs SameSite/CSRF token |
| Verdict | Simple but XSS-sensitive | Generally safer for browsers; common with a **BFF** (backend-for-frontend) that holds tokens server-side |
Mobile apps: OS secure storage (Keychain/Keystore). Never log tokens.

### Q31. ⭐🔴 How do you log out / revoke a JWT? (the stateless problem)
**In one line:** A JWT is valid until `exp` — the server holds no state, so you can't "delete" it. You need **compensating strategies**.

**Options (combine them):**
1. **Short-lived access tokens** (≤15 min) + **refresh token rotation** → "logout" = revoke the refresh token.
2. **Denylist/blocklist** of revoked `jti`s in **Redis** with TTL = token's remaining life; check in the filter (adds state/lookup).
3. **Token versioning:** store `tokenVersion` per user; embed in JWT; bump on logout/password change → older tokens rejected.
4. **Rotate signing keys** (nuclear option — logs everyone out).
5. Use **opaque tokens + introspection** where instant revocation matters (Q41).
**Interview tip:** The honest answer: *"JWT trades easy revocation for scalability; I accept that with short TTLs and a refresh-token revocation list."*

### Q32. 🟡 HS256 vs RS256 — which signing algorithm?
| HS256 (HMAC, symmetric) | RS256 / ES256 (asymmetric) |
|-------------------------|----------------------------|
| **One shared secret** signs and verifies | **Private key signs**, **public key verifies** |
| Every verifying service must hold the secret → **leak risk grows** | Only the auth server holds the private key; services verify with the **public key** (JWKS endpoint) |
| Simple, fast | Better for microservices, **key rotation via `kid` + JWKS** |
Use **asymmetric** for multi-service/third-party scenarios. **Trap:** never accept `alg: none`; pin the expected algorithm.

### Q33. 🟡 What must you validate on every JWT?
**Signature** (correct key & algorithm), **`exp`/`nbf`** (with small clock skew), **`iss`** (expected issuer), **`aud`** (token intended for *this* API), and optionally `jti`/`scope`. Reject unsigned/`alg:none`. Spring's `JwtDecoder` + `JwtValidators.createDefaultWithIssuer(...)` do these; add an **audience validator** yourself (often forgotten).

### Q34. ⭐🟡 OAuth2 vs OpenID Connect vs JWT vs SAML — what's the difference?
**In one line:** **OAuth2 = authorization (delegated access)**, **OIDC = authentication layer on top of OAuth2**, **JWT = a token format**, **SAML = older XML-based SSO**.

**Explained simply (analogy — hotel key card):** OAuth2 = the front desk gives an app a **key card (access token)** that opens only certain doors (**scopes**), without handing over your passport. **OIDC** adds an **ID card (ID token)** that says *who you are*. **JWT** is just the plastic the card is made of.

| | Answers | Token | Typical use |
|---|---------|-------|-------------|
| OAuth 2.0 | "May this app access my data?" | Access token (any format) | API access, delegated permission |
| OpenID Connect | "Who is this user?" | **ID token (JWT)** + access token | "Login with Google", SSO |
| SAML 2.0 | "Who is this user?" (XML) | XML assertion | Legacy enterprise SSO |
**Trap:** "OAuth2 is for authentication" — it's **authorization**; use **OIDC** for login.

### Q35. ⭐🟡 What are the OAuth2 roles and grant types?
**Roles:** **Resource Owner** (user) · **Client** (app) · **Authorization Server** (issues tokens) · **Resource Server** (the API).

| Grant type | Use for | Status |
|-----------|---------|--------|
| **Authorization Code + PKCE** | Web apps, **SPAs, mobile** (user login) | ✅ **Recommended** |
| **Client Credentials** | **Machine-to-machine / service-to-service** (no user) | ✅ |
| **Refresh Token** | Get new access tokens | ✅ |
| Device Code | TVs/CLIs | ✅ |
| Implicit | Old SPAs (token in URL) | ❌ Deprecated/removed in OAuth 2.1 |
| Resource Owner Password | App collects user's password | ❌ Deprecated — avoid |

### Q36. ⭐🔴 Walk through the Authorization Code flow with PKCE.
```
1. User clicks "Login" in the client app.
2. Client generates code_verifier (random) → code_challenge = SHA256(verifier).
3. Browser redirects to Auth Server: /authorize?response_type=code&client_id&redirect_uri&scope=openid profile&state&code_challenge&code_challenge_method=S256
4. User authenticates + consents at the Auth Server (the client NEVER sees the password).
5. Auth Server redirects back: redirect_uri?code=ABC&state=…
6. Client (back channel) POST /token  {code, redirect_uri, client_id, code_verifier}
7. Auth Server verifies SHA256(verifier) == challenge → returns access_token (+ id_token + refresh_token).
8. Client calls the API with Authorization: Bearer <access_token>.
```
**Why PKCE?** Public clients (SPA/mobile) can't keep a client secret; PKCE proves **the same client that started the flow finishes it**, blocking **authorization-code interception**. **`state`** prevents CSRF on the redirect; **`nonce`** (OIDC) prevents ID-token replay.

### Q37. ⭐🟡 How do you make a Spring Boot API an OAuth2 Resource Server (validate JWTs)?
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.acme.com/realms/acme       # discovers JWKS & validates iss
          # or jwk-set-uri: https://auth.acme.com/.well-known/jwks.json
```
```java
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(a -> a
            .requestMatchers("/actuator/health").permitAll()
            .requestMatchers(HttpMethod.GET, "/orders/**").hasAuthority("SCOPE_orders.read")
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))     // BearerTokenAuthenticationFilter + JwtDecoder
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
        .csrf(c -> c.disable());
    return http.build();
}
```
Dependency: `spring-boot-starter-oauth2-resource-server`. It downloads the **public keys (JWKS)**, caches/rotates them, validates signature/`exp`/`iss`, and returns **401 with `WWW-Authenticate: Bearer`** automatically.

### Q38. 🟡 How do JWT claims become Spring authorities?
**Default:** the `scope`/`scp` claim → authorities **`SCOPE_<value>`**. Roles in custom claims (Keycloak `realm_access.roles`, Okta `groups`) need a converter:
```java
@Bean
JwtAuthenticationConverter jwtAuthConverter() {
    JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();      // SCOPE_ …
    JwtAuthenticationConverter conv = new JwtAuthenticationConverter();
    conv.setJwtGrantedAuthoritiesConverter(jwt -> {
        Collection<GrantedAuthority> out = new ArrayList<>(scopes.convert(jwt));
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles != null) roles.forEach(r -> out.add(new SimpleGrantedAuthority("ROLE_" + r)));
        return out;
    });
    return conv;
}
// .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(jwtAuthConverter())))
```

### Q39. 🟡 How do you add "Login with Google/GitHub" (OAuth2 client/OIDC login)?
```yaml
spring.security.oauth2.client.registration.google:
  client-id: ${GOOGLE_CLIENT_ID}
  client-secret: ${GOOGLE_CLIENT_SECRET}
  scope: openid,profile,email
```
```java
http.oauth2Login(Customizer.withDefaults());       // redirects, code exchange, session login — all handled
```
Starter: `spring-boot-starter-oauth2-client`. Map provider users to your DB users with a custom **`OidcUserService`/`OAuth2UserService`** (create-on-first-login, assign roles). Common providers have built-in presets (Google, GitHub, Facebook, Okta).

### Q40. 🟡 Who issues the tokens? (Authorization server options)
- **Keycloak** (popular open source; realms, roles, SSO, social login), **Okta/Auth0**, **Azure AD/Entra ID**, **AWS Cognito**.
- **Spring Authorization Server** — build your own OAuth2/OIDC server in Spring.
- **Don't write your own token issuer** unless you must — identity is easy to get subtly wrong.

### Q41. 🟡 Opaque token vs JWT — when to prefer opaque?
| JWT (self-contained) | Opaque token (random string) |
|----------------------|------------------------------|
| Resource server verifies **locally** (no network call) | Resource server calls the auth server's **introspection endpoint** (`oauth2ResourceServer(o -> o.opaqueToken(...))`) |
| Hard to revoke | **Instant revocation** |
| Claims visible to client | Claims hidden |
| Larger tokens | Small |
Choose **opaque** for strict revocation/privacy needs (banking, high-risk); **JWT** for scale and low latency.

### Q42. ⭐🔴 How do you secure microservices? (gateway, token relay, service-to-service)
**Typical design:**
```
Client ──(user token via OIDC)──► API Gateway ──► Service A ──► Service B
                                  validate JWT    token relay     OR  client-credentials token for service identity
```
1. **Central identity:** one authorization server (Keycloak/Okta) issues tokens.
2. **Edge validation:** gateway (Spring Cloud Gateway) validates JWT, rate-limits, routes — but **every service still validates tokens** (**zero trust**; never trust "internal" traffic).
3. **User context propagation:** **token relay** (`TokenRelay` filter / `WebClient` + `ServerOAuth2AuthorizedClientExchangeFilterFunction`) forwards the user's token to downstream calls.
4. **Service-to-service (no user):** **OAuth2 client-credentials** with narrow scopes, or **mTLS** (service mesh: Istio/Linkerd).
5. **Authorization:** coarse at gateway, **fine-grained in each service** (scopes/roles/ownership).
6. **Secrets** in Vault/K8s secrets; short token lifetimes; **audit logs** with correlation ids.
**Interview tip:** Mention **audience (`aud`) checks** so a token for service A can't be replayed against B.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Authentication](#2-authentication) &nbsp;|&nbsp; Next: [Authorization →](#4-authorization)

---

## 4. Authorization

### Q43. 🟢 How does URL-based authorization work?
Rules in `authorizeHttpRequests` are checked by the **`AuthorizationFilter`**, using an `AuthorizationManager` per rule (`permitAll`, `authenticated`, `hasRole`, `hasAuthority`, `hasAnyRole`, custom `access(...)`).
```java
.requestMatchers("/admin/**").hasRole("ADMIN")
.requestMatchers("/reports/**").hasAnyAuthority("reports:read", "ROLE_ADMIN")
.requestMatchers("/internal/**").access(new WebExpressionAuthorizationManager("hasIpAddress('10.0.0.0/8')"))
```
**Limit:** URL rules only see the **URL/method**, not business data ("can this user view *this* order?") → add **method/object-level** checks (Q44–46).

### Q44. ⭐🟡 What is method-level security? Compare `@PreAuthorize`, `@PostAuthorize`, `@Secured`, `@RolesAllowed`.
**In one line:** Annotations that enforce access **on service/controller methods** via **AOP proxies** — a second layer of defense behind URL rules.

```java
@Configuration @EnableMethodSecurity           // prePostEnabled = true by default; add securedEnabled/jsr250Enabled if needed
class MethodSecurityConfig { }

@Service
class OrderService {
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('orders:delete')")
    public void delete(Long id) { ... }
}
```
| Annotation | Evaluated | SpEL? | Notes |
|-----------|-----------|:-----:|-------|
| **`@PreAuthorize`** | **Before** the method | ✅ | Most powerful, **preferred** |
| **`@PostAuthorize`** | **After** (can inspect `returnObject`) | ✅ | Check result ownership |
| `@PreFilter` / `@PostFilter` | Filters collections in/out | ✅ | Convenient, but filters in memory |
| `@Secured("ROLE_ADMIN")` | Before | ❌ | Legacy; roles only (needs `securedEnabled`) |
| `@RolesAllowed("ADMIN")` | Before | ❌ | JSR-250 standard (needs `jsr250Enabled`) |
**Why method security?** Defense in depth, rules next to business logic, works for **non-web entry points** (messaging, schedulers, internal calls). On denial → `AccessDeniedException` (403).
**Old → new:** `@EnableGlobalMethodSecurity(prePostEnabled = true)` → `@EnableMethodSecurity`.

### Q45. 🟡 What can you do with SpEL in `@PreAuthorize`?
```java
@PreAuthorize("#userId == authentication.principal.id")                    // '#' → method parameter
public Profile get(Long userId) { ... }

@PreAuthorize("@orderSecurity.isOwner(#orderId, authentication)")           // '@' → call a Spring bean
public Order find(Long orderId) { ... }

@PreAuthorize("hasAuthority('SCOPE_orders.read') and #req.amount < 10000")  // mix roles + business data
public void approve(ApprovalRequest req) { ... }
```
**`@` references a bean; `#` references a method argument** (needs parameter names via `-parameters` — Boot's Maven/Gradle plugin enables it). Handy variables: `authentication`, `principal`, `returnObject` (post), `filterObject`.

### Q46. ⭐🟡 What is object-level authorization / IDOR and how do you prevent it?
**In one line:** **IDOR (Insecure Direct Object Reference)** = a user changes an id in the URL and reads **someone else's data** (`/orders/101` → `/orders/102`). It's a top OWASP issue — URL roles alone **don't** stop it.

**Fixes:**
```java
// 1) Scope the query to the caller (best: data never leaves the DB)
@Query("select o from Order o where o.id = :id and o.ownerId = :uid")
Optional<Order> findOwned(Long id, Long uid);

// 2) Pre-check with a bean
@PreAuthorize("@orderSecurity.isOwner(#id, authentication)")
public Order get(Long id) { ... }

// 3) Post-check
@PostAuthorize("returnObject.ownerId == authentication.principal.id")
public Order get(Long id) { ... }
```
Also: return **404 instead of 403** for others' resources (don't confirm existence), use non-guessable ids (UUIDs) as **defense in depth**, log denials.

### Q47. 🟡 RBAC vs ABAC vs permission-based access control?
- **RBAC** (role-based): user → roles → access. Simple (`ADMIN`, `MANAGER`), can explode into many roles.
- **Permission-based:** roles map to fine-grained **authorities** (`invoice:approve`) — checks use permissions, roles just bundle them. ✅ common compromise.
- **ABAC** (attribute-based): decisions use **attributes** (user dept, resource owner, time, amount, IP). In Spring: SpEL/`AuthorizationManager`, or policy engines (OPA, Cedar).
**Tip:** check **permissions in code**, assign **roles to users** — avoids `if (role == ...)` spaghetti.

### Q48. 🟡 What replaced `AccessDecisionManager` / voters?
**Spring Security 6** uses **`AuthorizationManager<T>`** (simpler: `check(Supplier<Authentication>, T) → AuthorizationDecision`). `AuthorizationFilter` (URLs) and method interceptors (`AuthorizationManagerBeforeMethodInterceptor`) call it. `AccessDecisionManager`/`AccessDecisionVoter` are deprecated. Custom rule:
```java
.requestMatchers("/tenant/{tenantId}/**").access((auth, ctx) ->
        new AuthorizationDecision(tenantService.canAccess(auth.get(), ctx.getVariables().get("tenantId"))))
```

### Q49. 🟡 Why isn't my `@PreAuthorize` working? (gotchas)
1. **`@EnableMethodSecurity` missing** (or old annotation used).
2. **Self-invocation** — `this.secured()` bypasses the proxy (see `spring-aop.md` Q22).
3. Method is **`private`/`final`/`static`** or bean created with `new`.
4. Annotation on an **interface** with CGLIB proxies — annotate the concrete class.
5. Bean isn't **Spring-managed** / secured class in another context (e.g., child context).
6. **Role prefix mismatch** (`hasRole('ADMIN')` vs stored `ADMIN` without `ROLE_`) (Q10).
7. Exception handled wrongly → 500 instead of 403 (add `AccessDeniedException` handler).
8. **Order with `@Transactional`:** security advice usually runs **before** the transaction opens — good (no DB work for denied calls).

### Q50. 🟡 How do you get the current user, and does it propagate to `@Async`/other threads?
```java
// Controller param
@GetMapping("/me") String me(@AuthenticationPrincipal Jwt jwt /* or UserDetails */) { ... }

// Anywhere
SecurityContextHolder.getContext().getAuthentication();
```
**Propagation:** the context is a **`ThreadLocal`** → **not** inherited by `@Async`, executor threads, `CompletableFuture`, parallel streams.
**Fixes:**
- `SecurityContextHolder.setStrategyName(MODE_INHERITABLETHREADLOCAL)` — only works for **threads created by** the request thread (not pools).
- Wrap executors: `new DelegatingSecurityContextAsyncTaskExecutor(executor)` / `DelegatingSecurityContextExecutor` / `DelegatingSecurityContextRunnable`.
- Or pass the **user id/principal explicitly** to async work (simplest, most robust).
**Same idea applies to MDC logging context.**

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← JWT, OAuth2 & OIDC](#3-jwt-oauth2--openid-connect) &nbsp;|&nbsp; Next: [Web Attacks & Protections →](#5-web-attacks--protections)

---

## 5. Web Attacks & Protections

### Q51. ⭐🟡 What is CSRF, how does Spring Security protect against it, and when can you disable it?
**In one line:** **Cross-Site Request Forgery** tricks a logged-in user's browser into sending an **unwanted request** to your site, because browsers **automatically attach cookies**.

**Explained simply (analogy):** You're logged into your bank. A malicious page contains a hidden form `POST bank.com/transfer?to=attacker`. Your browser helpfully attaches your session cookie → the bank thinks **you** sent it.

**Defense — Synchronizer token:** the server gives each session a **random CSRF token**; state-changing requests (POST/PUT/DELETE/PATCH) must include it (hidden field or `X-CSRF-TOKEN` header). An attacker's page **can't read** your token (same-origin policy) → forged request is rejected with **403**.
```java
http.csrf(Customizer.withDefaults());                                   // default ON for browser/session apps
// SPA with cookie-based CSRF:
http.csrf(c -> c.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()));   // JS reads XSRF-TOKEN cookie, sends header
// Stateless token API:
http.csrf(c -> c.disable());
```
**When to disable:** **stateless APIs that authenticate with an `Authorization: Bearer` header** (browsers don't attach it automatically). **Keep it ON** for any **cookie/session/Basic-in-browser** authentication.
**Extra defenses:** `SameSite` cookies (`Lax/Strict`), checking `Origin/Referer`.
**Trap:** "403 on every POST" right after adding Security = missing CSRF token (or you meant to disable it for a stateless API).

### Q52. ⭐🟡 How does CORS work and how do you configure it with Spring Security?
**In one line:** **CORS** is a **browser** rule: a page from origin A can call origin B only if B's response says so via `Access-Control-Allow-*` headers. It's about **browsers**, not servers/Postman.

**Flow:** for non-simple requests (JSON `Content-Type`, `Authorization` header, PUT/DELETE) the browser first sends a **preflight `OPTIONS`** request. **Preflight carries no credentials** → if Spring Security requires auth for it, it's rejected (**401/403**) and the real request never happens.

```java
@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration c = new CorsConfiguration();
    c.setAllowedOrigins(List.of("https://app.acme.com"));               // explicit origins
    c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
    c.setAllowedHeaders(List.of("Authorization","Content-Type"));
    c.setAllowCredentials(true);                                         // cookies/auth headers
    c.setMaxAge(3600L);                                                  // cache preflight
    UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", c);
    return src;
}
// in the chain:  http.cors(Customizer.withDefaults());     // CorsFilter runs BEFORE auth so preflight succeeds
```
**Traps:**
- **`@CrossOrigin` / `WebMvcConfigurer.addCorsMappings` alone is not enough** with Security — enable `http.cors(...)` so the **`CorsFilter`** is in the chain.
- **`allowedOrigins("*")` + `allowCredentials(true)` is invalid** → use explicit origins or `allowedOriginPatterns`.
- CORS errors show only in the **browser console**; the **server may have processed the request**.

### Q53. 🟡 CSRF vs CORS vs XSS — how are they different?
| | What it is | Who enforces/prevents |
|---|-----------|------------------------|
| **CORS** | Browser policy controlling **which origins may read responses** of cross-origin requests | Browser + server headers (relaxes the Same-Origin Policy) |
| **CSRF** | Attacker causes a **state-changing request using your cookies** | CSRF tokens, SameSite cookies |
| **XSS** | Attacker injects **script into your page** (steals tokens, acts as user) | Output encoding, CSP, input validation, httpOnly cookies |
**Key trap:** **CORS does not protect against CSRF** (the request is still *sent*; CORS only restricts reading the response). And XSS defeats CSRF protection (script can read the token).

### Q54. 🟡 How do you defend against XSS in a Spring app?
- **Escape output** by context — template engines (Thymeleaf `th:text`) escape by default; never inject raw HTML. For JSON APIs the **frontend** must render safely.
- **Content-Security-Policy** header: `http.headers(h -> h.contentSecurityPolicy(c -> c.policyDirectives("default-src 'self'")))`.
- **httpOnly** cookies, avoid storing tokens in `localStorage` (Q30).
- **Validate/sanitize** rich-text input (OWASP Java HTML Sanitizer); don't rely on blacklists.
- Spring Security sets `X-Content-Type-Options: nosniff` by default.

### Q55. 🟡 What security headers does Spring Security add, and which should you add?
**Defaults:** `X-Content-Type-Options: nosniff`, `Cache-Control: no-cache, no-store…` (for secured responses), `X-Frame-Options: DENY` (**clickjacking**), `Strict-Transport-Security` (HSTS, only on **HTTPS**), `X-XSS-Protection: 0` (legacy filter disabled).
**Add:** **CSP**, `Referrer-Policy`, `Permissions-Policy`. Configure with `http.headers(h -> h.httpStrictTransportSecurity(...).frameOptions(f -> f.sameOrigin()))`.

### Q56. 🟡 How do you prevent SQL injection and mass assignment?
- **SQL injection:** always **bind parameters** (JPA `:param`, `PreparedStatement`, Spring Data); **never concatenate** user input into JPQL/SQL; whitelist dynamic `ORDER BY` columns.
- **Mass assignment / over-posting:** don't bind request JSON straight to **entities** (attacker sets `"role":"ADMIN"`, `"id":…`); use **DTOs** with only allowed fields.
- **Validate input** (`@Valid`, Bean Validation) and **output-encode**.
- **Don't leak internals:** generic error messages, no stack traces (`server.error.include-stacktrace=never`).

### Q57. 🟡 How do you enable HTTPS/TLS and what is mTLS?
```properties
server.port=8443
server.ssl.enabled=true
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=${KEYSTORE_PASSWORD}
server.ssl.key-store-type=PKCS12
# mutual TLS:
server.ssl.client-auth=need
server.ssl.trust-store=classpath:truststore.p12
```
- **Force HTTPS:** `http.requiresChannel(c -> c.anyRequest().requiresSecure())` (behind a proxy set `server.forward-headers-strategy=framework`).
- In Kubernetes, TLS is often **terminated at the ingress/service mesh**.
- **mTLS** = **both sides** present certificates → strong **service-to-service** identity. Spring Boot 3.1+ supports **SSL bundles** (`spring.ssl.bundle.*`) with hot reload.

### Q58. 🟡 What other hardening do production Spring Boot apps need?
- **Actuator:** expose only `health,info` publicly; secure the rest (`management.endpoints.web.exposure.include`, separate management port, role `ACTUATOR`).
- **Secrets** in env/Vault, never in Git; rotate; don't log secrets/PII/tokens.
- **Dependency hygiene:** OWASP Dependency-Check/Dependabot, patch Spring CVEs (e.g., Spring4Shell, Log4Shell lessons).
- **Rate limiting & request size limits**, timeouts, **audit logging** of auth events.
- **Least privilege** (DB user, IAM roles), **fail closed** (deny by default), **OWASP Top 10** awareness: broken access control (IDOR), cryptographic failures, injection, insecure design, misconfiguration, vulnerable components, auth failures, logging failures, SSRF.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Authorization](#4-authorization) &nbsp;|&nbsp; Next: [Scenarios, Testing & Debugging →](#6-scenarios-testing--debugging)

---

## 6. Scenarios, Testing & Debugging

### Q59. ⭐🔴 Scenario: "Secure a REST API end-to-end with JWT" — what's your design?
1. **Identity:** users stored with **BCrypt** hashes (`DelegatingPasswordEncoder`); or delegate to Keycloak/Okta (preferred in larger systems).
2. **Login endpoint** `/auth/login` (`permitAll`) → `AuthenticationManager.authenticate` → issue **short-lived access JWT** (+ **rotating refresh token**).
3. **Stateless chain:** `STATELESS` sessions, CSRF disabled (header auth), CORS configured, JSON **401/403** handlers.
4. **JWT validation:** resource-server config (`issuer-uri`/JWKS) or custom filter; check `iss`, `aud`, `exp`.
5. **Authorization:** URL rules + `@PreAuthorize` (+ **ownership checks** for IDOR).
6. **Hardening:** HTTPS, rate limiting on login, lockout/backoff, audit log, secrets in Vault, key rotation, token revocation plan (Q31).
7. **Test:** `@WithMockUser`/`jwt()` post-processors; integration test for 401 vs 403 paths.

### Q60. ⭐🟡 Debugging 401 vs 403 — what's your checklist?
**401 (unauthenticated):**
- Token/credentials **missing or malformed** (`Bearer ` prefix/space, wrong header).
- Token **expired**, wrong **issuer/audience/signature/key**, clock skew.
- Your **custom filter isn't in the chain / wrong order**, or `chain.doFilter` missing.
- Endpoint requires auth but you expected `permitAll` (matcher order, Q13).
- **Redirect to `/login`** (HTML) because no custom entry point.
**403 (authenticated but denied):**
- **Role/authority mismatch** (`ROLE_` prefix, `SCOPE_` vs role, claim not mapped — Q10, Q38).
- **CSRF token missing** on POST/PUT/DELETE with session auth (Q51).
- `@PreAuthorize` rule false / ownership check failed.
- **Preflight `OPTIONS` blocked** (CORS not enabled in security, Q52).
**Tool:** `logging.level.org.springframework.security=DEBUG` (or `TRACE`) shows which filter rejected the request and why; `@EnableWebSecurity(debug = true)` for dev only.

### Q61. 🟡 Scenario: "An endpoint I wanted secured is public (or one I wanted public is blocked)."
- **Matcher order** — broad rule above a specific one wins (Q13).
- `requestMatchers("/api/**")` doesn't match `/api` itself; trailing slash/context-path differences; **servlet path** with multiple servlets requires `requestMatchers(PathPatternRequestMatcher…)`/`MvcRequestMatcher`.
- **Multiple `SecurityFilterChain`s**: wrong `@Order`/missing `securityMatcher` (Q12).
- HTTP **method** not specified (rule applies to GET but you call POST).
- `WebSecurityCustomizer.ignoring()` used for a path (bypasses everything) (Q25).
- Controller-level `@PreAuthorize` missing while URL rule is loose (Q44).
**Habit:** write **integration tests** that assert `401/403/200` for each important route.

### Q62. 🟡 Scenario: "It works in Postman but fails in the browser."
Almost always **CORS** (Q52):
- Preflight `OPTIONS` rejected → enable `http.cors(...)` and a `CorsConfigurationSource`.
- Wildcard origin with credentials → use explicit origin.
- Missing `Access-Control-Allow-Headers` for `Authorization`/`Content-Type`.
- Redirect to the login page on an XHR call (session expired) → return **401 JSON** instead of redirect (custom entry point).
- Cookie issues: `SameSite=None; Secure` required for cross-site cookies; HTTP vs HTTPS mismatch.
Postman/curl ignore CORS because it's a **browser** enforcement.

### Q63. ⭐🟡 How do you test secured endpoints?
```java
@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)
class OrderControllerSecurityTest {
    @Autowired MockMvc mvc;

    @Test void anonymous_gets_401() throws Exception {
        mvc.perform(get("/orders")).andExpect(status().isUnauthorized());
    }
    @Test @WithMockUser(roles = "USER") void user_cannot_delete_403() throws Exception {
        mvc.perform(delete("/orders/1").with(csrf())).andExpect(status().isForbidden());
    }
    @Test @WithMockUser(roles = "ADMIN") void admin_can_delete() throws Exception {
        mvc.perform(delete("/orders/1").with(csrf())).andExpect(status().isNoContent());
    }
    @Test void jwt_with_scope() throws Exception {
        mvc.perform(get("/orders").with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_orders.read"))))
           .andExpect(status().isOk());
    }
}
```
Dependency: `spring-security-test`. Tools: `@WithMockUser`, `@WithUserDetails`, `.with(csrf())`, `.with(jwt())`, `.with(httpBasic(...))`. Don't forget **negative tests** (401/403) and **ownership** tests (user A can't read user B's data).

### Q64. 🟡 Migration: what breaks when moving to Spring Security 6 / Boot 3?
- `WebSecurityConfigurerAdapter` **removed** → `SecurityFilterChain` beans; `authenticationManager` from `AuthenticationConfiguration` or `AuthenticationManagerBuilder` bean.
- `authorizeRequests` → `authorizeHttpRequests`; `antMatchers/mvcMatchers/regexMatchers` → `requestMatchers`.
- `@EnableGlobalMethodSecurity` → `@EnableMethodSecurity`.
- `javax.servlet` → **`jakarta.servlet`**.
- **Security context is not saved implicitly** (`requireExplicitSave`) — custom login code must save it (Q22).
- `anyRequest()` must be **last**; `and()` chaining replaced by lambdas.
- `FilterSecurityInterceptor` → `AuthorizationFilter`; `SecurityContextPersistenceFilter` → `SecurityContextHolderFilter`.
- Default `BCrypt`/DelegatingPasswordEncoder behaviours changed (`{noop}` for plain test passwords).

### Q65. 🟡 How do you troubleshoot Spring Security in general?
```properties
logging.level.org.springframework.security=DEBUG        # filters, matchers, access decisions
logging.level.org.springframework.security.web.FilterChainProxy=TRACE
logging.level.org.springframework.web.filter.CommonsRequestLoggingFilter=DEBUG
```
Check: which **`SecurityFilterChain`** matched (log line "Securing GET /…"), filter list order, **authorities in the `Authentication`** (log them in a dev-only endpoint), token claims (jwt.io), clock skew, and that the **right config class is loaded** (component scan). `curl -v` shows `WWW-Authenticate` and redirects.

### Q66. ⭐🟢 Explain Spring Security in 60 seconds (project-style answer).
> "Spring Security protects the app through a **chain of servlet filters** behind a `FilterChainProxy`. I define a **`SecurityFilterChain` bean**: stateless sessions, **JWT validation** via the OAuth2 **resource-server** support (or a custom `OncePerRequestFilter`), CORS configured, CSRF disabled for header-token APIs, JSON 401/403 handlers. Authentication goes through **`AuthenticationManager` → `DaoAuthenticationProvider` → `UserDetailsService` + BCrypt** `PasswordEncoder`, and the result lives in the **`SecurityContext`** (a ThreadLocal).
> For authorization I use **URL rules ordered specific→general with deny-by-default**, plus **`@PreAuthorize`** with permissions and **ownership checks** to prevent IDOR. Tokens are short-lived with refresh-token rotation; I know JWT revocation is the trade-off. In microservices: **OIDC + gateway validation, token relay, client-credentials for service calls, `aud` checks, mTLS where needed**. I test with `@WithMockUser`/`jwt()` and assert 401 vs 403 paths."

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Web Attacks & Protections](#5-web-attacks--protections)

---

## ✅ Last-minute cheat sheet

| Topic | One-liner to remember |
|-------|----------------------|
| AuthN vs AuthZ | Who are you vs what can you do; 401 vs 403 |
| Architecture | `DelegatingFilterProxy` → `FilterChainProxy` → `SecurityFilterChain` filters |
| Current user | `SecurityContextHolder` (ThreadLocal) → `Authentication` |
| Auth flow | Filter → `AuthenticationManager` → `ProviderManager` → `DaoAuthenticationProvider` |
| Boot 3 config | `SecurityFilterChain` bean + lambda DSL (no `WebSecurityConfigurerAdapter`) |
| Role vs authority | `hasRole("X")` = authority `ROLE_X` |
| Matcher order | Specific → general; `anyRequest()` last |
| Passwords | BCrypt/Argon2 via `DelegatingPasswordEncoder`; never plain/MD5 |
| Session vs token | Stateful + CSRF vs stateless + revocation problem |
| JWT | header.payload.signature — signed, **not encrypted** |
| JWT logout | Short TTL + refresh rotation + denylist/versioning |
| OAuth2 vs OIDC | Authorization vs authentication (ID token) |
| Best grant | Auth Code + **PKCE**; Client Credentials for M2M |
| Resource server | `oauth2ResourceServer(jwt)` + `issuer-uri` |
| Method security | `@EnableMethodSecurity` + `@PreAuthorize` (SpEL: `#arg`, `@bean`) |
| IDOR | Ownership check in query / `@PostAuthorize` |
| CSRF | Needed for cookie/session auth; disable for header-token APIs |
| CORS | Browser rule; enable `http.cors()` so preflight passes |
| Async | SecurityContext not propagated → delegating executors |
| Testing | `@WithMockUser`, `jwt()`, `csrf()`, assert 401/403 |

## 🎤 How to answer in an interview (template)
1. **One-line definition.**
2. **Why it exists / analogy** (airport, key card, guard).
3. **Small example** (config/code).
4. **The trap** (ordering, CSRF/CORS, ROLE_ prefix, ThreadLocal, revocation).
5. **What you do in real projects** (deny-by-default, short TTL, ownership checks, tests).

## 📚 References
- [Javarevisited – 25 Spring Security Interview Questions](https://javarevisited.substack.com/p/top-25-spring-security-interview)
- [Medium (neesri) – Spring Security Interview Q&A](https://neesri.medium.com/spring-security-interview-q-a-ffa3a329e9f5)
- [Intervue / InterviewBit / CodingShuttle – Spring Boot interview guides](https://www.codingshuttle.com/blogs/100-spring-boot-interview-questions-with-answers-for-2-to-5-years-experienced-java-developers)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [Spring Security – OAuth2 Resource Server (JWT)](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) · [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [RFC 7636 – PKCE](https://datatracker.ietf.org/doc/html/rfc7636) · [OAuth 2.1 draft](https://oauth.net/2.1/)

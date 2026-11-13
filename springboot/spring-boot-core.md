---
title: Spring Boot Core Interview Questions & Answers
layout: docs
category: spring-boot
tags: [spring-boot, ioc, dependency-injection, auto-configuration, starters, configuration, profiles, interview]
level: junior-to-senior
questions: 64
---

# Spring Boot Core — Interview Questions & Answers

> **64 questions** on Spring Boot fundamentals: IoC/DI & beans, auto-configuration & starters, configuration & profiles, startup lifecycle, and real-world startup errors. Written in plain technical language so each answer makes sense on its own.
> Every answer follows the same pattern: **In one line** → **Explained simply** (analogy) → **Example / code** → **Interview tip / trap / follow-up**.
> Sources consolidated: Intervue, InterviewBit, CodingShuttle (100 Spring Boot Qs), roadmap.sh, CodeBegun, Javarevisited, senior-level Medium/LinkedIn question lists, Spring Boot reference docs, plus real interview scenarios.

**Legend:** 🟢 Easy &nbsp;|&nbsp; 🟡 Medium &nbsp;|&nbsp; 🔴 Hard &nbsp;|&nbsp; ⭐ Must-know (asked very often)

> 📎 **Companion pages:** `spring-boot-transactions.md` · `spring-security.md` · `spring-aop.md` · `spring-boot-rest-api.md` · `spring-boot-microservices-kafka.md` · `spring-boot-testing.md` · `spring-boot-production.md` · `spring-data-jpa.md` · `hibernate.md`

---

## 📑 On this page

| # | Section | Questions |
|---|---------|-----------|
| 1 | [Spring vs Spring Boot — the Basics](#1-spring-vs-spring-boot--the-basics) | Q1 – Q8 |
| 2 | [IoC, Dependency Injection & Beans](#2-ioc-dependency-injection--beans) | Q9 – Q24 |
| 3 | [Auto-Configuration & Starters](#3-auto-configuration--starters) | Q25 – Q36 |
| 4 | [Configuration, Properties & Profiles](#4-configuration-properties--profiles) | Q37 – Q48 |
| 5 | [Startup, Lifecycle & Runtime](#5-startup-lifecycle--runtime) | Q49 – Q56 |
| 6 | [Real-World Errors & Scenarios](#6-real-world-errors--scenarios) | Q57 – Q64 |

**Quick revision — top 14 ⭐:** Q2 (Spring vs Boot) · Q4 (`@SpringBootApplication`) · Q9 (IoC) · Q11 (constructor vs field injection) · Q13 (`@Qualifier`/`@Primary`) · Q17 (bean scopes + prototype trap) · Q18 (bean lifecycle) · Q20 (circular dependencies) · Q25 (how auto-config works) · Q26 (conditionals) · Q37 (property precedence) · Q39 (`@ConfigurationProperties`) · Q41 (profiles) · Q57 (startup errors)

---

## 1. Spring vs Spring Boot — the Basics

### Q1. 🟢 What is Spring Boot and what problem does it solve?
**In one line:** Spring Boot is an **opinionated layer on top of Spring** that gives you a production-ready application with minimal setup.

**Explained simply:** Classic Spring is a huge toolbox — you had to pick tools, wire them, write XML/Java config, install Tomcat, and fix version clashes before writing business code. Spring Boot is the **pre-assembled kit**: pick what you need (web, JPA, security), and it configures sensible defaults.

| Pain in plain Spring | How Spring Boot fixes it |
|----------------------|--------------------------|
| Lots of XML/Java config | **Auto-configuration** |
| Hunting compatible library versions | **Starters + BOM** (managed versions) |
| Deploying WAR into external Tomcat | **Embedded server**, run as `java -jar` |
| No monitoring out of the box | **Actuator** |
| Slow dev feedback | **DevTools** |

### Q2. ⭐🟢 What is the difference between Spring and Spring Boot?
**In one line:** Spring is the **framework** (IoC, MVC, AOP, data…); Spring Boot is a **tool to start and run Spring apps quickly** with defaults.

| Spring Framework | Spring Boot |
|------------------|-------------|
| Needs manual configuration (XML/Java) | Auto-configures based on classpath |
| You choose and align dependency versions | Starters + managed versions |
| Usually deployed as WAR to external server | Embedded Tomcat/Jetty/Undertow, executable JAR |
| No built-in health/metrics | Actuator included |
| More boilerplate | "Convention over configuration" |

**Interview tip:** Boot doesn't *replace* Spring — it **uses** it. Say: *"Spring Boot = Spring + auto-configuration + starters + embedded server + production features."*

### Q3. 🟢 What is "convention over configuration"?
**In one line:** If you follow standard conventions (package layout, naming, defaults), the framework configures itself — you only write config for the **exceptions**.

**Example:** put your `@SpringBootApplication` class in `com.app`, and controllers/services in `com.app.*` → they're found automatically. Put `application.properties` in `src/main/resources` → it's loaded automatically. Add `spring-boot-starter-data-jpa` + a DB driver → a `DataSource` and `EntityManagerFactory` appear without any `@Bean` from you.

### Q4. ⭐🟢 What does `@SpringBootApplication` do?
**In one line:** It's a shortcut for **three annotations**: `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`.

```java
@SpringBootApplication
public class App {
    public static void main(String[] args) { SpringApplication.run(App.class, args); }
}
```
| Included annotation | Role |
|--------------------|------|
| `@Configuration` (via `@SpringBootConfiguration`) | The class can declare `@Bean` methods |
| `@EnableAutoConfiguration` | Turn on auto-configuration (Q25) |
| `@ComponentScan` | Scan **this package and sub-packages** for `@Component`/`@Service`/… |

**Trap:** if the main class is in the **default package** or **above/outside** your other packages, beans aren't scanned → `NoSuchBeanDefinitionException`. Keep the main class at the **root package**.

### Q5. 🟡 `@ComponentScan` vs `@EnableAutoConfiguration` — what's the difference?
**In one line:** `@ComponentScan` **finds your code**; `@EnableAutoConfiguration` **configures framework infrastructure**.

- `@ComponentScan` → registers classes **you wrote** (`@Service`, `@Controller`…).
- `@EnableAutoConfiguration` → registers **library beans** (`DispatcherServlet`, `DataSource`, `ObjectMapper`…) **only when conditions match** (Q26).

### Q6. 🟢 What are the ways to create a Spring Boot project?
1. **Spring Initializr** (start.spring.io, or IDE integration) — most common.
2. **Maven/Gradle manually** — add `spring-boot-starter-parent` (or the BOM) and starters.
3. **Spring Boot CLI** (Groovy scripts; rarely used now).
4. `spring init` via CLI / `curl start.spring.io`.

### Q7. 🟢 How do you run a Spring Boot application? What is a "fat JAR"?
**In one line:** Run the main class, `mvn spring-boot:run`, or build an **executable JAR** and run `java -jar app.jar`.

**Fat (uber) JAR:** one JAR containing your classes (`BOOT-INF/classes`), **all dependency JARs** (`BOOT-INF/lib`), and Spring Boot's **launcher** (`JarLauncher`) that knows how to load nested JARs. No external server or classpath setup needed.
```bash
mvn clean package
java -jar target/app-0.0.1-SNAPSHOT.jar --server.port=9090
```
**Follow-up:** *Why not a normal shaded JAR?* Boot keeps dependencies **intact as nested JARs** (faster build, no class-merging problems) and supports **layered JARs** for efficient Docker images (Q54).

### Q8. 🟢 Which embedded servers does Spring Boot support, and how do you switch?
**In one line:** **Tomcat** (default), **Jetty**, **Undertow** (and Netty for WebFlux).

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
  <exclusions>
    <exclusion>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-tomcat</artifactId>
    </exclusion>
  </exclusions>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```
Tune with `server.port`, `server.tomcat.threads.max`, `server.compression.enabled`, `server.ssl.*`.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; Next: [IoC, DI & Beans →](#2-ioc-dependency-injection--beans)

---

## 2. IoC, Dependency Injection & Beans

### Q9. ⭐🟢 What is IoC and the Spring container?
**In one line:** **Inversion of Control** = instead of *your code* creating and wiring objects (`new`), the **container creates them and hands them to you**.

**Explained simply (analogy — restaurant):** You don't go into the kitchen and cook your own ingredients (`new`). You tell the waiter what you need; the kitchen (container) prepares and serves it. Your class just **declares what it needs**.

```java
// Without IoC – tightly coupled, hard to test
class OrderService { private PaymentClient client = new PaymentClient(); }

// With IoC/DI – the container supplies the dependency
@Service
class OrderService {
    private final PaymentClient client;
    OrderService(PaymentClient client) { this.client = client; }
}
```
**Benefits:** loose coupling, easy testing (swap in mocks), centralised lifecycle/config.

### Q10. 🟢 `BeanFactory` vs `ApplicationContext`?
**In one line:** `BeanFactory` is the **basic** container; `ApplicationContext` is the **full-featured** one you always use.

| `BeanFactory` | `ApplicationContext` |
|---------------|---------------------|
| Basic DI, lazy bean creation | Everything above + **eager singleton creation**, events, i18n (`MessageSource`), resource loading, AOP integration, `Environment`/profiles |
| Rarely used directly | What Spring Boot creates (`AnnotationConfigServletWebServerApplicationContext`) |

### Q11. ⭐🟢 Types of dependency injection — which is best and why?
**In one line:** **Constructor**, **setter**, **field**. Prefer **constructor injection**.

```java
@Service
public class OrderService {
    private final PaymentClient payment;          // final → immutable
    public OrderService(PaymentClient payment) {  // single constructor → no @Autowired needed (Spring 4.3+)
        this.payment = payment;
    }
}
```
| Type | Pros | Cons |
|------|------|------|
| **Constructor** | Immutable (`final`), dependencies **mandatory**, easy unit tests without Spring, **fails fast**, exposes circular dependencies | Many params = design smell (good signal!) |
| **Setter** | Good for **optional** dependencies | Object can be half-initialised |
| **Field (`@Autowired` on field)** | Short | Can't be `final`, **needs reflection/Spring to test**, hides too many dependencies, allows circular deps silently |

**Interview tip:** Say *"constructor injection for required dependencies, setter for optional ones, avoid field injection."* With Lombok: `@RequiredArgsConstructor` on a class with `final` fields.

### Q12. 🟢 What does `@Autowired` do? Is it always required?
**In one line:** It asks Spring to inject a matching bean **by type**.

- On a class with **one constructor**, `@Autowired` is **optional** (Spring 4.3+).
- `@Autowired(required = false)` or `Optional<T>` / `ObjectProvider<T>` → dependency may be missing.
- Injecting `List<PaymentStrategy>` / `Map<String, PaymentStrategy>` gives **all beans of that type** (great for strategy pattern).

### Q13. ⭐🟡 Two beans of the same type — how do you choose? (`@Primary` vs `@Qualifier`)
**In one line:** Without help, Spring throws `NoUniqueBeanDefinitionException`. Resolve with `@Primary` (default choice) or `@Qualifier` (explicit choice).

```java
@Component @Primary class StripePayment implements Payment { }
@Component("paypal") class PaypalPayment implements Payment { }

@Service
class Checkout {
    Checkout(Payment defaultPay,                          // → StripePayment (@Primary)
             @Qualifier("paypal") Payment paypalPay) { }  // → PaypalPayment
}
```
**Rule:** `@Qualifier` **beats** `@Primary`. Also, injecting by **parameter name matching the bean name** works as a fallback (fragile — don't rely on it).

### Q14. 🟢 `@Component`, `@Service`, `@Repository`, `@Controller` — what's the difference?
**In one line:** All are **stereotypes** that register a bean; they differ in **meaning** and a few extra behaviours.

| Annotation | Layer | Extra behaviour |
|-----------|-------|-----------------|
| `@Component` | Generic | None |
| `@Service` | Business logic | None (semantic) |
| `@Repository` | Data access | **Exception translation** (`SQLException` → `DataAccessException`) |
| `@Controller` / `@RestController` | Web | Handler mapping; `@RestController` = `@Controller` + `@ResponseBody` |

### Q15. ⭐🟡 `@Component` vs `@Bean` — when do you use which?
**In one line:** `@Component` marks **your own class** for scanning; `@Bean` is a **factory method** for objects you **can't annotate** (third-party classes) or need custom construction.

```java
@Configuration
public class AppConfig {
    @Bean
    public ObjectMapper objectMapper() {           // third-party class → @Bean
        return new ObjectMapper().findAndRegisterModules();
    }

    @Bean
    @ConditionalOnMissingBean
    public RestClient restClient(RestClient.Builder b) { return b.build(); }
}
```

### Q16. 🔴 What is `@Configuration` full mode vs lite mode (`proxyBeanMethods`)?
**In one line:** With `@Configuration` (default `proxyBeanMethods = true`), Spring creates a **CGLIB subclass** so calling one `@Bean` method from another returns the **same singleton** instead of creating a new object.

```java
@Configuration
class Cfg {
    @Bean A a() { return new A(b()); }   // b() is intercepted → returns the SAME B bean
    @Bean B b() { return new B(); }
}
```
- `@Configuration(proxyBeanMethods = false)` → faster startup, no proxy; **don't call `@Bean` methods directly** — take them as method parameters instead. Spring Boot's own auto-configurations use this.
- `@Component` with `@Bean` methods is **lite mode** (no interception → `b()` would create a new B each time).

### Q17. ⭐🟡 What are the bean scopes? What is the "prototype inside singleton" trap?
**In one line:** `singleton` (default), `prototype`, and web scopes `request`, `session`, `application`, `websocket`.

| Scope | Meaning |
|-------|---------|
| `singleton` | **One** instance per container (default) |
| `prototype` | **New** instance **every time** it's requested |
| `request` | One per HTTP request |
| `session` | One per HTTP session |
| `application` | One per ServletContext |

**Important facts:**
- Singleton ≠ the GoF Singleton — it's **one per Spring container**, not per JVM/classloader.
- **Singletons must be stateless/thread-safe** (shared across all request threads). Never keep per-request data in a field of a singleton service.
- **The trap:** a `prototype` bean injected into a `singleton` is created **once** (at injection time) → effectively a singleton!

**Fixes:**
```java
@Service
class ReportService {
    private final ObjectProvider<ReportBuilder> builders;      // asks the container each time
    ReportService(ObjectProvider<ReportBuilder> b) { this.builders = b; }
    void run() { ReportBuilder fresh = builders.getObject(); }
}
// or @Scope(value = "prototype", proxyMode = ScopedProxyMode.TARGET_CLASS), or @Lookup
```

### Q18. ⭐🟡 Explain the bean lifecycle.
**In one line:** instantiate → inject → initialise callbacks → **ready** → destroy callbacks on shutdown.

```
1. Instantiate (constructor)
2. Populate dependencies (DI)
3. *Aware callbacks (BeanNameAware, ApplicationContextAware…)
4. BeanPostProcessor.postProcessBeforeInitialization
5. @PostConstruct
6. InitializingBean.afterPropertiesSet()
7. Custom init-method (@Bean(initMethod = "..."))
8. BeanPostProcessor.postProcessAfterInitialization   ← AOP proxies (e.g., @Transactional) are created here
─────────── bean is READY ───────────
9. @PreDestroy
10. DisposableBean.destroy()
11. Custom destroy-method
```
```java
@Component
class CacheWarmer {
    @PostConstruct void init()    { /* dependencies are injected here – safe to use */ }
    @PreDestroy   void cleanup()  { /* release resources */ }
}
```
**Traps:**
- Don't use injected fields **in the constructor body of field-injected beans** — they're still `null`; use constructor params or `@PostConstruct`.
- **Prototype beans:** Spring doesn't call destroy callbacks — you manage cleanup.
- Step 8 is where **proxies** are created → why calling `this.method()` bypasses `@Transactional`/`@Async`/`@Cacheable` (see `spring-aop.md`).

### Q19. 🟡 `BeanPostProcessor` vs `BeanFactoryPostProcessor`?
**In one line:** `BeanFactoryPostProcessor` modifies **bean definitions (blueprints)** before beans exist; `BeanPostProcessor` modifies **bean instances** after they're created.

| | `BeanFactoryPostProcessor` | `BeanPostProcessor` |
|---|----------------------------|---------------------|
| When | After definitions loaded, **before** any bean is instantiated | **Around** each bean's initialisation |
| Works on | `BeanDefinition` metadata | Actual bean objects |
| Examples | `PropertySourcesPlaceholderConfigurer` (resolves `${...}`), `ConfigurationClassPostProcessor` (processes `@Configuration`) | `AutowiredAnnotationBeanPostProcessor` (`@Autowired`), `AnnotationAwareAspectJAutoProxyCreator` (AOP proxies), `@Async`/`@Transactional` processors |

### Q20. ⭐🔴 What is a circular dependency and how does Spring Boot treat it?
**In one line:** A needs B and B needs A — neither can be created first.

```java
@Service class A { A(B b) {} }
@Service class B { B(A a) {} }      // → BeanCurrentlyInCreationException
```
- **Constructor injection:** can't be resolved → fails at startup (good — it's a design smell).
- **Field/setter injection:** Spring could resolve it using **early references** (3-level cache), but **Spring Boot 2.6+ prohibits circular references by default** (`spring.main.allow-circular-references=false`).

**Fixes (best → worst):**
1. **Redesign** — extract the shared logic into a third bean C that both use; or use **events** (`ApplicationEventPublisher`) to decouple.
2. Inject one side lazily: `@Lazy B b` (injects a proxy) or `ObjectProvider<B>`.
3. Switch one side to **setter injection**.
4. ❌ Turn on `allow-circular-references=true` (hides the design problem).

### Q21. 🟡 What does `@Lazy` do? What's lazy initialisation?
**In one line:** Create the bean **only when first needed** instead of at startup.

- By default, `ApplicationContext` creates **all singletons eagerly** at startup (so config errors show immediately).
- `@Lazy` on a bean/injection point, or global `spring.main.lazy-initialization=true`.
- **Pros:** faster startup, lower initial memory. **Cons:** errors appear **late (at first use, possibly in production)**, first request is slower. Use `@Lazy(false)` to force eager for specific beans.

### Q22. 🟡 `@Value` vs `@ConfigurationProperties`?
**In one line:** `@Value` injects **single** values; `@ConfigurationProperties` binds a **whole group** into a typed object. Prefer the latter for anything beyond one or two values.

```java
@Value("${app.timeout:30}")        // default 30 if missing
private int timeout;

@ConfigurationProperties(prefix = "app.mail")   // see Q39 for the full pattern
```
| | `@Value` | `@ConfigurationProperties` |
|---|----------|---------------------------|
| Scope | One value | Group/nested structure |
| Type-safe, validated | Limited | ✅ with `@Validated` |
| Relaxed binding (`my-prop`/`myProp`/`MY_PROP`) | ❌ (exact) | ✅ |
| IDE auto-complete metadata | ❌ | ✅ |
| SpEL support | ✅ | ❌ |

**Traps:** `@Value` doesn't work on **static** fields; a missing key without a default causes startup failure.

### Q23. 🟡 How do you inject all implementations of an interface (Strategy pattern)?
```java
public interface DiscountStrategy { String type(); BigDecimal apply(BigDecimal amt); }

@Service
class DiscountService {
    private final Map<String, DiscountStrategy> strategies;     // bean name → bean
    DiscountService(List<DiscountStrategy> list) {              // or Map<String, DiscountStrategy>
        this.strategies = list.stream().collect(Collectors.toMap(DiscountStrategy::type, s -> s));
    }
    BigDecimal discount(String type, BigDecimal amt) { return strategies.get(type).apply(amt); }
}
```
Adding a new strategy = add a new `@Component` — **no change** to `DiscountService` (Open/Closed principle). Control order with `@Order`.

### Q24. 🟡 Are Spring beans thread-safe?
**In one line:** **No — Spring doesn't make them thread-safe.** Singleton beans are **shared** by all threads, so *you* must keep them **stateless** (or immutable/synchronised).

- ✅ Safe: stateless services, immutable config, thread-safe collaborators (`ConcurrentHashMap`, `AtomicLong`).
- ❌ Unsafe: mutable fields like `private List<Order> current = new ArrayList<>();` in a singleton service.
- Per-request state → method parameters/local variables, a `request`-scoped bean, or `ThreadLocal`/`ScopedValue` (clear it!).

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Basics](#1-spring-vs-spring-boot--the-basics) &nbsp;|&nbsp; Next: [Auto-Configuration & Starters →](#3-auto-configuration--starters)

---

## 3. Auto-Configuration & Starters

### Q25. ⭐🟡 How does auto-configuration work internally?
**In one line:** Spring Boot reads a **list of auto-configuration classes** from the classpath and registers each one **only if its `@Conditional` checks pass**.

**Explained simply (analogy — smart home):** When you plug in a new device (add a dependency), the hub (Boot) notices it and configures it with defaults — but if you've already configured it yourself, the hub **steps back**.

**Step by step:**
1. `@EnableAutoConfiguration` (inside `@SpringBootApplication`) imports `AutoConfigurationImportSelector`.
2. It loads candidate class names from
   `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` in each JAR
   *(Boot 2.7+/3.x; older versions used `spring.factories`)*.
3. Each class (e.g., `DataSourceAutoConfiguration`, `WebMvcAutoConfiguration`, `JacksonAutoConfiguration`) carries conditions like `@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty`.
4. Only classes whose conditions pass register their beans.
5. User-defined beans are registered first, so `@ConditionalOnMissingBean` makes auto-config **back off** (Q27).

```java
@AutoConfiguration
@ConditionalOnClass(DataSource.class)                    // JDBC classes present?
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean(DataSource.class)          // you didn't define your own?
    DataSource dataSource(DataSourceProperties p) { return p.initializeDataSourceBuilder().build(); }
}
```
**Interview tip:** The one-liner they want: *"Auto-config = conditional bean definitions loaded from `AutoConfiguration.imports`, activated by classpath + properties + missing beans."*

### Q26. ⭐🟡 What are the common `@Conditional` annotations?
| Annotation | Bean is created only if… |
|-----------|---------------------------|
| `@ConditionalOnClass` / `OnMissingClass` | A class **is / isn't** on the classpath |
| `@ConditionalOnBean` / `@ConditionalOnMissingBean` | A bean **exists / doesn't exist** |
| `@ConditionalOnProperty(name, havingValue, matchIfMissing)` | A property has a value (feature toggles) |
| `@ConditionalOnWebApplication` / `OnNotWebApplication` | Web / non-web app |
| `@ConditionalOnResource` | A file/resource exists |
| `@ConditionalOnExpression` | A SpEL expression is true |
| `@ConditionalOnCloudPlatform` | Running on Kubernetes/Cloud Foundry etc. |
| `@ConditionalOnJava` | Specific Java version |

```java
@Bean
@ConditionalOnProperty(name = "feature.new-checkout", havingValue = "true")
CheckoutV2 checkoutV2() { return new CheckoutV2(); }      // feature flag
```
**Trap:** `@ConditionalOnBean` depends on **ordering** — it only sees beans registered **before** it; use it in auto-configurations (with `@AutoConfiguration(after = ...)`), not in normal component-scanned classes.

### Q27. ⭐🟡 How do you override or disable an auto-configuration?
**In one line:** **Define your own bean** (auto-config backs off) or **exclude** the auto-config class.

```java
// 1) Override: define your own bean – @ConditionalOnMissingBean skips the default
@Bean ObjectMapper objectMapper() { return new ObjectMapper().disable(FAIL_ON_UNKNOWN_PROPERTIES); }

// 2) Exclude
@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class })

// 3) Exclude via property (also works for classes you can't see)
// spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
```
**Use case:** a service with no database but a JPA dependency on the classpath → exclude `DataSourceAutoConfiguration` and `HibernateJpaAutoConfiguration`.

### Q28. 🟡 How do you find out *why* something was (not) auto-configured?
**In one line:** Turn on the **conditions evaluation report**.

- Run with `--debug` (or `debug=true`) → console prints **Positive matches**, **Negative matches** (with reason), **Exclusions**, **Unconditional classes**.
- With Actuator: `GET /actuator/conditions`.
- `/actuator/beans` lists every bean; `/actuator/configprops` shows bound properties.

Typical use: *"Why isn't my `DataSource` created?"* → Negative matches: `@ConditionalOnClass did not find class ...`.

### Q29. 🟢 What is a Spring Boot starter?
**In one line:** A **dependency descriptor** that pulls in a curated set of libraries for a purpose with **compatible versions**.

| Starter | Brings |
|---------|--------|
| `spring-boot-starter-web` | Spring MVC, Jackson, embedded Tomcat, validation basics |
| `spring-boot-starter-data-jpa` | Hibernate, Spring Data JPA, JDBC/HikariCP |
| `spring-boot-starter-security` | Spring Security |
| `spring-boot-starter-actuator` | Production endpoints + Micrometer |
| `spring-boot-starter-test` | JUnit 5, Mockito, AssertJ, Spring Test |
| `spring-boot-starter-validation` | Hibernate Validator (Bean Validation) |

A starter itself contains **no code** — only dependencies (it's a POM). The code lives in `spring-boot-autoconfigure`.

### Q30. 🟡 What is `spring-boot-starter-parent` vs the BOM (`spring-boot-dependencies`)?
**In one line:** Both give you **managed dependency versions**; the parent also configures **plugins and defaults**.

| Starter Parent (as `<parent>`) | BOM import (`dependencyManagement`) |
|--------------------------------|--------------------------------------|
| Managed versions + Java version, UTF-8, resource filtering, `spring-boot-maven-plugin` config, repackage goal | Only managed versions |
| Use when you can inherit from it | Use when your project **already has its own parent POM** (corporate parent) |

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-dependencies</artifactId>
      <version>3.3.5</version>
      <type>pom</type><scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```
Because versions are managed, you normally write **no `<version>`** for Boot-managed libraries. To override one: set the property (e.g., `<jackson-bom.version>`).

### Q31. 🔴 How do you create a custom starter?
**In one line:** Two modules — an **autoconfigure** module (the logic) and a **starter** module (just dependencies) — plus a registration file.

```java
@ConfigurationProperties("hello")
public class HelloProperties { private String greeting = "Hello"; /* getters/setters */ }

@AutoConfiguration
@EnableConfigurationProperties(HelloProperties.class)
@ConditionalOnClass(HelloService.class)
public class HelloAutoConfiguration {
    @Bean @ConditionalOnMissingBean
    HelloService helloService(HelloProperties p) { return new HelloService(p.getGreeting()); }
}
```
Register in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`:
```
com.acme.hello.HelloAutoConfiguration
```
Naming: **`acme-spring-boot-starter`** (third-party) — `spring-boot-starter-*` is reserved for official ones. Add `spring-boot-configuration-processor` for IDE property hints. **Use case:** share a logging/security/Kafka config across many microservices.

### Q32. 🟡 What is the difference between `@Import`, `@ImportResource`, and `@ComponentScan`?
- `@ComponentScan` → discover annotated classes by package scanning.
- `@Import(SomeConfig.class)` → explicitly pull in specific `@Configuration` classes (or `ImportSelector`/`ImportBeanDefinitionRegistrar` for programmatic registration — how `@Enable*` annotations work).
- `@ImportResource("classpath:beans.xml")` → load legacy **XML** bean definitions.

### Q33. 🟡 How do `@Enable*` annotations work (e.g., `@EnableScheduling`, `@EnableAsync`)?
**In one line:** Each is a **meta-annotation with `@Import`** that registers the infrastructure beans for a feature.

`@EnableScheduling` → imports `SchedulingConfiguration` → registers `ScheduledAnnotationBeanPostProcessor`, which finds `@Scheduled` methods. Without the `@Enable…`, the annotation is **silently ignored** — a classic "my scheduled/async method doesn't run" cause.

### Q34. 🟢 What is Spring Boot DevTools?
**In one line:** A **dev-time** module: automatic **restart** on class changes (fast, using two classloaders), **LiveReload**, sensible dev defaults (template caching off), remote debug support.

- Add as `runtime`/`optional` dependency; it's **automatically disabled** in a fully packaged JAR run (`java -jar`).
- Never rely on it in production.

### Q35. 🟡 What changed in Spring Boot 3 compared to 2?
| Area | Boot 2.x | Boot 3.x |
|------|----------|----------|
| Java | 8+ | **17+** (21 recommended) |
| Spring Framework | 5 | **6** |
| Enterprise APIs | `javax.*` | **`jakarta.*`** |
| Auto-config registration | `spring.factories` | **`AutoConfiguration.imports`** |
| Errors | custom JSON | **`ProblemDetail` (RFC 7807/9457)** support |
| Observability | Sleuth + Micrometer | **Micrometer Observation / Tracing** |
| Native | experimental | **GraalVM native image** support (AOT) |
| HTTP clients | `RestTemplate` | `RestClient` (3.2), HTTP interface clients, `RestTemplate` still works |
| Threads | — | **Virtual threads** (`spring.threads.virtual.enabled=true`, Java 21+, Boot 3.2) |
| Security config | `WebSecurityConfigurerAdapter` | `SecurityFilterChain` bean (removed adapter) |

**Interview tip:** Mention the `javax` → `jakarta` rename — it breaks old imports and many third-party libs.

### Q36. 🟡 How would you reduce Spring Boot startup time?
1. **Lazy initialisation** (`spring.main.lazy-initialization=true`) — with the trade-offs in Q21.
2. **Exclude unused auto-configurations**; remove unused starters.
3. Avoid heavy work in `@PostConstruct`/startup runners; move it async.
4. **Class Data Sharing (AppCDS)** / Spring AOT; **GraalVM native image** for ms-startup (long build, reflection limits).
5. **Reduce component scanning** scope; use `proxyBeanMethods = false` in your own configs.
6. Tune JPA (`spring.jpa.hibernate.ddl-auto=none`, skip metadata checks `spring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false`).
7. Measure first: `--debug`, Actuator `startup` endpoint (`BufferingApplicationStartup`), or `-Ddebug` timings.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← IoC, DI & Beans](#2-ioc-dependency-injection--beans) &nbsp;|&nbsp; Next: [Configuration & Profiles →](#4-configuration-properties--profiles)

---

## 4. Configuration, Properties & Profiles

### Q37. ⭐🟡 What is the order of precedence for configuration sources?
**In one line:** The **more specific / closer to runtime** a source is, the higher its priority. Later (higher) sources override earlier ones.

**Practical order (highest → lowest):**
1. **Command-line arguments** (`--server.port=9090`)
2. `SPRING_APPLICATION_JSON` / JVM system properties (`-Dserver.port=…`)
3. **OS environment variables** (`SERVER_PORT=…`)
4. **Profile-specific** files **outside** the JAR → then inside (`application-prod.yml`)
5. **Default** `application.properties/yml` outside the JAR → then inside
6. `@PropertySource` on `@Configuration` classes
7. Default properties (`SpringApplication.setDefaultProperties`)

**Key rules:**
- **Profile-specific beats general** (`application-prod.yml` overrides `application.yml`).
- External config **overrides** packaged config → you can change settings **without rebuilding** the JAR.
- `properties` wins over `yml` if both exist in the same location.

**Scenario:** *"Prod needs a different DB URL but the same JAR."* → set `SPRING_DATASOURCE_URL` as an env var (or in Kubernetes ConfigMap/Secret) — it overrides the packaged value.

### Q38. 🟢 `application.properties` vs `application.yml`?
Both configure the app; **YAML** is hierarchical and less repetitive; `.properties` is flat `key=value`.
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/app
    username: app
server:
  port: 8081
```
**YAML traps:** indentation with **spaces only** (no tabs); `on/off/yes/no` can be parsed as booleans (quote them); `@PropertySource` **cannot load YAML**; multi-document files use `---`.

### Q39. ⭐🟡 How do you use `@ConfigurationProperties` properly?
**In one line:** Bind a **prefix** of properties to a **typed, validated, immutable** class.

```yaml
app:
  mail:
    host: smtp.acme.com
    port: 587
    retry-count: 3
    from: no-reply@acme.com
```
```java
@ConfigurationProperties(prefix = "app.mail")
@Validated
public record MailProperties(
        @NotBlank String host,
        @Min(1) @Max(65535) int port,
        @DefaultValue("3") int retryCount,       // relaxed binding: retry-count ↔ retryCount
        @Email String from) { }

@SpringBootApplication
@ConfigurationPropertiesScan                      // or @EnableConfigurationProperties(MailProperties.class)
public class App { }
```
**Benefits:** type-safety, **fail-fast validation at startup**, nested objects/lists/maps/`Duration`/`DataSize`, relaxed binding, IDE metadata (add `spring-boot-configuration-processor`).
**Trap:** forgetting `@ConfigurationPropertiesScan`/`@EnableConfigurationProperties` (or `@Component`) → class never bound. Records/constructor binding work automatically in Boot 3 when there's a single constructor.

### Q40. 🟢 What is relaxed binding?
Property names can be written in several styles and still match:
`app.mail.retry-count` (**kebab — recommended in files**) = `app.mail.retryCount` = `app.mail.retry_count` = env var **`APP_MAIL_RETRYCOUNT`**.
That's how env vars like `SPRING_DATASOURCE_URL` map to `spring.datasource.url`.

### Q41. ⭐🟢 What are profiles and how do you activate them?
**In one line:** Profiles let you keep **environment-specific** beans and config (dev/test/prod) in one codebase.

```yaml
# application.yml
spring.profiles.active: dev
---
# application-prod.yml  (or a multi-doc section)
spring:
  config.activate.on-profile: prod
  datasource.url: jdbc:postgresql://prod-db/app
```
```java
@Profile("dev")  @Bean DataSource h2()    { ... }
@Profile("!dev") @Bean DataSource pg()    { ... }
```
**Activate by:** `spring.profiles.active=prod` (properties), `--spring.profiles.active=prod` (CLI), `SPRING_PROFILES_ACTIVE=prod` (env), `@ActiveProfiles("test")` (tests).
**Also:** profile **groups** (`spring.profiles.group.prod=prod,metrics`), `spring.profiles.include`, expressions `@Profile("prod & !eu")`.
**Interview tip:** Best practice — keep the **same artifact** across environments; only config changes (12-factor app). Avoid business logic branching on profiles.

### Q42. 🟡 How do you handle secrets (DB passwords, API keys)?
- ❌ Never commit them to Git or bake them into the image/JAR.
- ✅ **Environment variables**, **Kubernetes Secrets**, **HashiCorp Vault** (Spring Cloud Vault), **AWS Secrets Manager / Parameter Store**, Azure Key Vault.
- Use `spring.config.import=optional:configtree:/run/secrets/` to read mounted secret files.
- Don't expose `/actuator/env`/`configprops` unsecured (values are masked by default but still sensitive).
- Rotate secrets; avoid logging them.

### Q43. 🟡 How do you import external configuration? (`spring.config.import`)
```yaml
spring:
  config:
    import:
      - optional:file:./local-overrides.yml
      - optional:configserver:http://config-server:8888
      - optional:configtree:/etc/secrets/
```
`optional:` prevents startup failure when the source is missing. Replaces the old `bootstrap.yml` approach for Config Server (Boot 2.4+).

### Q44. 🟡 What is Spring Cloud Config Server and when would you use it?
**In one line:** A central service that serves **versioned configuration (from Git/Vault)** to many microservices.

- Clients fetch config at startup (`spring.config.import=configserver:...`) by `{application}/{profile}/{label}`.
- Benefits: one place to change config, audit via Git history, per-environment values, encryption.
- **Refresh at runtime:** `@RefreshScope` + `/actuator/refresh` (or Spring Cloud Bus to broadcast).
- In Kubernetes, many teams use **ConfigMaps/Secrets** instead — simpler, no extra service.

### Q45. 🟡 How do you read a property in code? Compare `Environment`, `@Value`, `@ConfigurationProperties`.
```java
@Autowired Environment env;
String url = env.getProperty("app.api.url");            // dynamic lookups
Integer t  = env.getProperty("app.timeout", Integer.class, 30);
```
Use `@ConfigurationProperties` for structured config, `@Value` for a single value, `Environment` for **dynamic/programmatic** lookups and active-profile checks (`env.acceptsProfiles(Profiles.of("prod"))`).

### Q46. 🟢 How do you change the server port? What other server settings are common?
```properties
server.port=8081                  # 0 = random port (useful in tests)
server.servlet.context-path=/api
server.tomcat.threads.max=200
server.shutdown=graceful
server.compression.enabled=true
server.error.include-message=never
```
Override at runtime with `--server.port=9090` or `SERVER_PORT=9090`.

### Q47. 🟡 How do you configure logging?
**In one line:** Boot uses **SLF4J + Logback** by default; configure via properties or `logback-spring.xml`.

```properties
logging.level.root=INFO
logging.level.com.acme=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.file.name=logs/app.log
logging.pattern.console=%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n
```
```java
private static final Logger log = LoggerFactory.getLogger(OrderService.class);   // or Lombok @Slf4j
log.info("Order {} created for user {}", id, userId);          // parameterised – no string concat
```
**Tips:** use **`logback-spring.xml`** (not `logback.xml`) to use Spring profiles in logging config; change levels **at runtime** via `POST /actuator/loggers/{name}`; switch to Log4j2 by excluding `spring-boot-starter-logging`; for production use **structured JSON logs** (Boot 3.4 `logging.structured.format.console=ecs`) and a **correlation/trace id** in the MDC. **Never log secrets or PII.**

### Q48. 🟢 `@PropertySource` — when and what are its limits?
Loads an extra `.properties` file into the `Environment`: `@PropertySource("classpath:extra.properties")`. **Limits:** no YAML support by default; **lower precedence** than most sources; prefer `spring.config.import` in modern Boot.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Auto-Configuration](#3-auto-configuration--starters) &nbsp;|&nbsp; Next: [Startup & Lifecycle →](#5-startup-lifecycle--runtime)

---

## 5. Startup, Lifecycle & Runtime

### Q49. ⭐🟡 What happens when you call `SpringApplication.run()`?
**In one line:** Boot prepares the environment, creates the `ApplicationContext`, runs auto-configuration, starts the embedded server, then runs your startup runners.

**Steps:**
1. Create `SpringApplication`; decide app type (**servlet / reactive / none**) from the classpath.
2. Load **`ApplicationContextInitializer`s** and **`ApplicationListener`s** (from `spring.factories`/imports).
3. Prepare the **`Environment`** — load properties, profiles, command-line args.
4. Print the **banner**.
5. Create the right `ApplicationContext`.
6. **Refresh the context** — component scan, **auto-configuration**, bean creation (singletons eagerly), `BeanPostProcessor`s (proxies).
7. **Start the embedded web server** (`WebServerStartStopLifecycle`).
8. Call **`CommandLineRunner` / `ApplicationRunner`** beans.
9. Publish **`ApplicationReadyEvent`** → app is ready for traffic.

**Interview tip:** If the interviewer asks "where does Tomcat start?" → during context refresh/lifecycle start (step 6–7), not before your beans exist.

### Q50. 🟡 What application events does Spring Boot publish (and how do you listen)?
**Order:** `ApplicationStartingEvent` → `ApplicationEnvironmentPreparedEvent` → `ApplicationContextInitializedEvent` → `ApplicationPreparedEvent` → `ContextRefreshedEvent` → `WebServerInitializedEvent` → `ApplicationStartedEvent` (context refreshed, runners **not yet** called) → **`ApplicationReadyEvent`** (runners done, ready) — or `ApplicationFailedEvent`.
```java
@Component
class Warmup {
    @EventListener(ApplicationReadyEvent.class)
    void onReady() { /* safe: everything is up – e.g. warm caches, log "ready" */ }
}
```
Also: **Kubernetes probes** use `AvailabilityChangeEvent` (liveness/readiness states).

### Q51. 🟢 `CommandLineRunner` vs `ApplicationRunner`?
**In one line:** Both run code **after startup**; they differ in how arguments are passed.

| `CommandLineRunner` | `ApplicationRunner` |
|--------------------|---------------------|
| `run(String... args)` — raw args | `run(ApplicationArguments args)` — parsed (`--name=value`, option names, non-option args) |

```java
@Component @Order(1)
class DataLoader implements ApplicationRunner {
    public void run(ApplicationArguments a) { if (a.containsOption("seed")) seedData(); }
}
```
Use for seeding data, cache warm-up, one-off jobs. **Trap:** an exception here **fails startup**; avoid long blocking work (readiness is delayed). Order multiple runners with `@Order`.

### Q52. ⭐🟡 How do you shut down a Spring Boot app gracefully?
**In one line:** Enable **graceful shutdown** so in-flight requests finish before the server stops.

```properties
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=30s
```
**Flow on SIGTERM (e.g., Kubernetes pod termination):** stop accepting **new** requests → wait for **active** requests (up to the timeout) → close the context (`@PreDestroy`, close pools, stop Kafka consumers) → JVM exits.
**Production checklist:**
- Kubernetes: **readiness probe** goes DOWN first so the load balancer stops routing; set `terminationGracePeriodSeconds` > your timeout; optional `preStop` sleep (~5–10s) for endpoint propagation.
- Close resources in `@PreDestroy`/`SmartLifecycle`; make Kafka/RabbitMQ listeners stop cleanly.
- Programmatic shutdown: `/actuator/shutdown` (disabled by default — **don't expose it**).

### Q53. 🟡 JAR vs WAR — how do you deploy to an external Tomcat?
**In one line:** Prefer an **executable JAR**; use WAR only if an external servlet container is mandated.

```java
@SpringBootApplication
public class App extends SpringBootServletInitializer {
    @Override protected SpringApplicationBuilder configure(SpringApplicationBuilder b) { return b.sources(App.class); }
}
```
Set `<packaging>war</packaging>` and mark `spring-boot-starter-tomcat` as `provided`. **Why JAR wins:** self-contained, identical in every environment, container-friendly, simpler ops.

### Q54. 🟡 How do you containerise a Spring Boot app well?
**Options:**
```bash
# 1) Cloud Native Buildpacks – no Dockerfile
mvn spring-boot:build-image -Dspring-boot.build-image.imageName=acme/orders:1.0

# 2) Layered JAR Dockerfile (better caching)
java -Djarmode=tools -jar app.jar extract --layers --destination extracted    # Boot 3.3+
```
```dockerfile
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY extracted/dependencies/ ./
COPY extracted/spring-boot-loader/ ./
COPY extracted/snapshot-dependencies/ ./
COPY extracted/application/ ./
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "org.springframework.boot.loader.launch.JarLauncher"]
```
**Why layers:** dependencies rarely change → Docker reuses that layer → fast rebuilds/pushes. **Tips:** run as **non-root**, set `MaxRAMPercentage` (JVM is container-aware), expose health endpoints for probes, use a slim JRE image, don't bake secrets.

### Q55. 🟡 What are virtual threads and GraalVM native images in Spring Boot?
**Virtual threads (Java 21, Boot 3.2+):** `spring.threads.virtual.enabled=true` — Tomcat/Jetty and `@Async`/schedulers use lightweight threads, so **blocking I/O code scales** (thread-per-request without 200-thread limits). Watch for **pinning** (`synchronized` blocks around blocking calls in older JDKs), and limit **DB pool size** — it becomes the new bottleneck.
**GraalVM native image:** AOT-compiles to a native binary → **start in milliseconds, tiny memory**; trade-offs: long build, **reflection/proxy/resource hints** needed (Spring AOT generates most), no dynamic class loading, harder debugging. Good for serverless/scale-to-zero.

### Q56. ⭐🟡 How many requests can a Spring Boot (Tomcat) app handle concurrently?
**In one line:** Roughly the size of the **request thread pool** — default **200** (`server.tomcat.threads.max`) — plus queued connections.

**Explained simply:** Each request occupies **one thread** until the response is written (blocking model). 200 slow requests (e.g., waiting on a DB) → request 201 **waits** in the accept queue (`server.tomcat.accept-count`, default 100) → beyond that connections are refused.
**What actually limits you:** DB connection pool (Hikari default **10**) is usually the first bottleneck; downstream latency; CPU.
**Scaling options:** tune thread/pool sizes **together**, return early / **async** processing (`@Async`, messaging), **virtual threads** (Q55), reactive stack (WebFlux) for I/O-heavy workloads, horizontal scaling.
**Trap:** raising Tomcat threads to 2,000 with a pool of 10 DB connections just moves the queue.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Configuration](#4-configuration-properties--profiles) &nbsp;|&nbsp; Next: [Real-World Errors & Scenarios →](#6-real-world-errors--scenarios)

---

## 6. Real-World Errors & Scenarios

### Q57. ⭐🟡 What are the most common Spring Boot startup errors and their fixes?
| Error message | Meaning | Fix |
|---------------|---------|-----|
| `Web server failed to start. Port 8080 was already in use` | Another process uses the port | Change `server.port`, or stop the other process (`lsof -i :8080`) |
| `Failed to configure a DataSource: 'url' attribute is not specified` | A DB driver/JPA starter is on the classpath but no URL set | Add `spring.datasource.url/username/password`, or exclude `DataSourceAutoConfiguration` |
| `NoSuchBeanDefinitionException: No qualifying bean of type X` | Bean missing/not scanned | Add `@Component`/`@Bean`; check package vs main class; `@ComponentScan` |
| `NoUniqueBeanDefinitionException: expected single matching bean but found 2` | Several beans of the same type | `@Primary` or `@Qualifier` (Q13) |
| `UnsatisfiedDependencyException … Error creating bean` | Wrapper — read the **root cause at the bottom** of the stack trace | Fix the nested cause |
| `BeanCurrentlyInCreationException` | Circular dependency | Redesign / `@Lazy` (Q20) |
| `Could not resolve placeholder 'x' in value "${x}"` | Property missing | Define it or give a default `${x:default}` |
| `ClassNotFoundException` / `NoSuchMethodError` | Version conflicts, mixed Boot/library versions | `mvn dependency:tree`; use the BOM; don't override versions blindly |
| `Not a managed type` (JPA) | Entity not scanned | `@EntityScan` |
| `Unable to find a @SpringBootConfiguration` (tests) | Test can't find the main class | Put tests in the same package tree or set `classes=` |
| `javax.* not found` after upgrade | Boot 3 uses `jakarta.*` | Update imports/dependencies |

**Habit:** always scroll to the **last "Caused by:"** — that's the real error.

### Q58. 🟡 Scenario: "My bean isn't found even though I annotated it with `@Service`."
Check in order:
1. **Package location** — is the class under the package of the `@SpringBootApplication` class? (Scan covers only that package and sub-packages.)
2. Is the class **abstract/interface** or missing the stereotype?
3. **`@Profile`/`@Conditional…`** excluded it in this environment?
4. Used `@ComponentScan("x")` somewhere that **replaced** the default scan base?
5. Test slice (`@WebMvcTest`, `@DataJpaTest`) doesn't load services → use `@MockBean`/`@Import`.
6. Typo in `@Qualifier` bean name.

### Q59. 🟡 Scenario: "The same JAR must behave differently in dev, QA and prod. How?"
- Build **once**; promote the **same artifact** (immutability).
- Environment-specific values via **profiles + external config**: env vars, Kubernetes ConfigMap/Secret, Config Server, Vault.
- Override precedence (Q37) lets external config beat packaged defaults.
- Keep **feature differences** behind `@ConditionalOnProperty` toggles, not `if (env == "prod")` in code.

### Q60. 🔴 Scenario: "`@Scheduled` job runs twice in production (2 pods)." How to fix?
**Cause:** each instance runs its own scheduler → duplicate execution.
**Fixes:**
1. **Distributed lock** — **ShedLock** (`@SchedulerLock(name = "report", lockAtMostFor = "10m")`) using the DB/Redis.
2. Run the job in **one dedicated instance/profile** (e.g., a worker deployment) or a Kubernetes **CronJob**.
3. Use a proper job scheduler (**Quartz clustered**, Spring Batch + scheduler, or leader election).
4. Make the job **idempotent** regardless.
Also check: `@EnableScheduling` present; scheduler pool size (`spring.task.scheduling.pool.size` default **1** → one long job blocks others!).

### Q61. 🟡 Scenario: "A property change in `application.yml` has no effect."
- Is a **higher-precedence** source overriding it (env var, CLI, profile file) — check `/actuator/env` (shows which property source wins)?
- Wrong **profile** active?
- Running an **old JAR / stale `target/classes`** (rebuild)?
- YAML **indentation/typo** or key mismatch (`retry-count` vs your field)?
- Bean created **before** the value is available, or you used `@Value` on a non-managed object (created with `new`)?
- Using `@RefreshScope` expectations without Actuator refresh?

### Q62. 🟡 What are the common anti-patterns in Spring Boot projects?
- Field injection everywhere; **stateful singletons**; business logic in controllers.
- **Entities returned from controllers** (lazy-loading + leaking schema).
- Catching exceptions and returning `null`; swallowing exceptions inside `@Transactional`.
- `ddl-auto=update` in production; secrets in properties files in Git.
- Giant `@Configuration` classes; heavy work in `@PostConstruct`.
- `@Autowired` + `new` mix (objects created with `new` aren't managed → no injection/AOP).
- Relying on `@SpringBootTest` for everything (slow tests).

### Q63. 🟡 Scenario: "`@Autowired` field is `null`." Why?
1. The object was created with **`new`** (not by Spring).
2. Class isn't a **Spring bean** (missing stereotype/not scanned).
3. Field is **`static`**.
4. Used in a **constructor of a field-injected bean** (not yet injected) → use constructor injection / `@PostConstruct`.
5. Injected into a class in a **different context** (e.g., servlet filter registered manually, or a test without Spring).
6. In a JPA **entity** (not a bean) → pass dependencies as method params or use `@Configurable` (rare).

### Q64. ⭐🟢 Explain Spring Boot in 60 seconds (project-style answer).
> "Spring Boot is Spring plus auto-configuration, starters, an embedded server and production-ready features. A `@SpringBootApplication` class bootstraps the container: component scan registers my beans, **auto-configuration** adds infrastructure beans conditionally from the classpath — it backs off if I define my own. I use **constructor injection**, keep beans **stateless**, bind settings with typed **`@ConfigurationProperties`**, and use **profiles + external config/env vars** so one JAR runs in every environment.
> I package an executable JAR/container image with **graceful shutdown**, expose **Actuator** health/metrics for Kubernetes probes, and keep logs structured. For diagnosing startup issues I read the root cause and the `--debug` conditions report."

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Startup & Lifecycle](#5-startup-lifecycle--runtime)

---

## ✅ Last-minute cheat sheet

| Topic | One-liner to remember |
|-------|----------------------|
| Spring vs Boot | Framework vs auto-config + starters + embedded server |
| `@SpringBootApplication` | `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan` |
| Auto-config source | `AutoConfiguration.imports` (Boot 3) / `spring.factories` (old) |
| Back-off | `@ConditionalOnMissingBean` → your bean wins |
| Best injection | **Constructor** (final fields, testable) |
| `@Primary` vs `@Qualifier` | Default choice vs explicit choice (Qualifier wins) |
| `@Component` vs `@Bean` | Your class (scan) vs factory method (3rd-party) |
| Singleton scope | One per container; **must be stateless** |
| Prototype in singleton | Created once → use `ObjectProvider` |
| Bean lifecycle | ctor → DI → `@PostConstruct` → ready → `@PreDestroy` |
| Circular dependency | Blocked by default in Boot 2.6+; redesign |
| `BeanFactoryPostProcessor` vs `BeanPostProcessor` | Modify definitions vs modify instances (proxies) |
| Config precedence | CLI > env vars > profile files > default files |
| `@ConfigurationProperties` | Typed, validated, relaxed binding — prefer over `@Value` |
| Profiles | Same JAR, different config; `spring.profiles.active` |
| Graceful shutdown | `server.shutdown=graceful` + readiness probe |
| Concurrency limit | Tomcat 200 threads; Hikari 10 connections (bottleneck) |
| Debug auto-config | `--debug` / `/actuator/conditions` |
| Boot 3 | Java 17+, `jakarta.*`, Observability, AOT/native, virtual threads |

## 🎤 How to answer in an interview (template)
1. **Definition in one line** — what it is.
2. **Why it exists** — the problem it solves (analogy).
3. **Tiny example** — 3–6 lines of code/config.
4. **Trap / trade-off** — scope, proxy, precedence, thread-safety.
5. **What you do in real projects** — the best practice.
*Follow-up pattern:* **cause → symptom → fix**.

## 📚 References
- [Intervue – Spring Boot Interview Questions](https://www.intervue.io/interview-questions/spring-boot-interview-questions/)
- [InterviewBit – Spring Boot Interview Questions](https://www.interviewbit.com/spring-boot-interview-questions/)
- [Coding Shuttle – 100 Spring Boot Interview Questions](https://www.codingshuttle.com/blogs/100-spring-boot-interview-questions-with-answers-for-2-to-5-years-experienced-java-developers)
- [roadmap.sh – Spring Boot Questions](https://roadmap.sh/questions/spring-boot)
- [CodeBegun – Spring Boot Interview Guides](https://www.codebegun.com/interview)
- [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/reference/)
- [Spring Framework Reference – Core Container](https://docs.spring.io/spring-framework/reference/core.html)

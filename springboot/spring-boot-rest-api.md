---
title: Spring Boot REST API Design Interview Questions & Answers
layout: docs
category: spring-boot
tags: [rest, spring-mvc, validation, exception-handling, problem-detail, api-design, versioning, restclient, webflux, interview]
level: junior-to-senior
questions: 62
---

# Spring Boot REST API Design — Interview Questions & Answers

> **62 questions**: REST & Spring MVC fundamentals, validation & global exception handling (`ProblemDetail`), API design (naming, versioning, pagination, idempotency, caching), HTTP clients (`RestClient`/`WebClient`/Feign + resilience), MVC vs WebFlux, performance, and design scenarios.
> Every answer follows the same pattern: **In one line** → **Explained simply** (analogy) → **Example / code** → **Interview tip / trap / follow-up**.
> Sources consolidated: roadmap.sh (60+ Spring Boot questions — read in full), CodingShuttle (100 Spring Boot questions), Intervue/InterviewBit/CodeBegun topic lists, Spring Framework reference docs, REST/HTTP RFCs (9110, 9457), plus real interview scenarios.

**Legend:** 🟢 Easy &nbsp;|&nbsp; 🟡 Medium &nbsp;|&nbsp; 🔴 Hard &nbsp;|&nbsp; ⭐ Must-know (asked very often)

> 📎 **Companion pages:** `spring-boot-core.md` · `spring-security.md` (CORS/CSRF/JWT) · `spring-aop.md` (filters vs interceptors vs AOP) · `spring-boot-transactions.md` · `spring-boot-microservices-kafka.md` · `spring-boot-testing.md` · `spring-data-jpa.md`

---

## 📑 On this page

| # | Section | Questions |
|---|---------|-----------|
| 1 | [REST & Spring MVC Fundamentals](#1-rest--spring-mvc-fundamentals) | Q1 – Q12 |
| 2 | [Validation & Exception Handling](#2-validation--exception-handling) | Q13 – Q24 |
| 3 | [API Design Best Practices](#3-api-design-best-practices) | Q25 – Q40 |
| 4 | [Calling Other Services & Concurrency](#4-calling-other-services--concurrency) | Q41 – Q48 |
| 5 | [Performance, Observability & Testing](#5-performance-observability--testing) | Q49 – Q54 |
| 6 | [Scenarios & Wrap-up](#6-scenarios--wrap-up) | Q55 – Q62 |

**Quick revision — top 14 ⭐:** Q1 (REST constraints) · Q2 (safe/idempotent methods) · Q3 (status codes) · Q5 (DispatcherServlet flow) · Q7 (`ResponseEntity`) · Q10 (PUT vs PATCH vs POST) · Q14 (`@Valid` vs `@Validated`) · Q18–19 (`@RestControllerAdvice` + `ProblemDetail`) · Q26 (versioning) · Q27 (pagination) · Q28 (DTOs) · Q29 (idempotency) · Q41 (HTTP clients) · Q46 (MVC vs WebFlux)

---

## 1. REST & Spring MVC Fundamentals

### Q1. ⭐🟢 What is REST and what are its constraints?
**In one line:** **REST** (Representational State Transfer) is an architectural style where **resources** (nouns) are identified by URLs and manipulated through **standard HTTP methods**, with **stateless** requests.

**Explained simply (analogy — a library catalogue):** Each book (resource) has an address (`/books/42`). You use a few standard verbs — look up (GET), add (POST), replace (PUT), remove (DELETE). The librarian doesn't remember your previous visit — **each request carries everything needed** (stateless).

| Constraint | Meaning |
|-----------|---------|
| **Client–server** | UI and data/storage concerns are separated |
| **Stateless** | Server stores **no client session state** between requests (auth token travels with each call) |
| **Cacheable** | Responses say whether they can be cached (`Cache-Control`, `ETag`) |
| **Uniform interface** | Resource URIs, standard methods, representations (JSON), self-descriptive messages, (HATEOAS) |
| **Layered system** | Gateways, proxies, load balancers can sit in between transparently |
| **Code on demand** *(optional)* | Server can send executable code (rare) |

**Interview tip:** "REST ≠ JSON over HTTP". Many "REST APIs" are really RPC-over-HTTP; real REST adds the uniform interface and (ideally) hypermedia.

### Q2. ⭐🟢 Which HTTP methods are *safe* and which are *idempotent*?
**In one line:** **Safe** = doesn't change server state. **Idempotent** = calling it **N times has the same effect as calling it once**.

| Method | Purpose | Safe | Idempotent | Typical success code |
|--------|---------|:----:|:----------:|----------------------|
| **GET** | Read | ✅ | ✅ | 200 |
| **HEAD** | Headers only | ✅ | ✅ | 200 |
| **OPTIONS** | Capabilities / CORS preflight | ✅ | ✅ | 200/204 |
| **POST** | Create / non-idempotent action | ❌ | ❌ | **201** (+ `Location`) / 200 / 202 |
| **PUT** | **Replace** whole resource (or create at known URI) | ❌ | ✅ | 200 / 204 / 201 |
| **PATCH** | **Partial** update | ❌ | ❌ *(not guaranteed)* | 200 / 204 |
| **DELETE** | Remove | ❌ | ✅ | 204 (or 200) |
**Why it matters:** clients, proxies and retry libraries **automatically retry idempotent calls** after timeouts. A duplicate `POST /payments` is dangerous → use an **idempotency key** (Q29).
**Trap:** DELETE is idempotent even though the **2nd call returns 404** — the *server state* is the same.

### Q3. ⭐🟢 Which HTTP status codes should a REST API use?
| Code | Meaning | Use when |
|------|---------|----------|
| **200 OK** | Success with body | GET/PUT/PATCH |
| **201 Created** | Resource created | POST (+ `Location` header) |
| **202 Accepted** | Accepted, processing **async** | Long-running jobs (Q33) |
| **204 No Content** | Success, no body | DELETE / PUT without body |
| **304 Not Modified** | Use cached copy | Conditional GET (Q34) |
| **400 Bad Request** | Malformed/invalid request | Validation errors, bad JSON |
| **401 Unauthorized** | **Not authenticated** | Missing/invalid token |
| **403 Forbidden** | Authenticated but **not allowed** | Role/ownership failure |
| **404 Not Found** | Resource doesn't exist | Unknown id/URL |
| **405 Method Not Allowed** | Wrong verb on a URL | — |
| **409 Conflict** | State conflict | Duplicate, optimistic-lock failure |
| **412 Precondition Failed** | `If-Match` didn't match | Concurrency control (Q35) |
| **415 Unsupported Media Type** | Bad `Content-Type` | — |
| **422 Unprocessable Content** | Syntactically fine, **semantically invalid** | Business-rule validation (team choice vs 400) |
| **429 Too Many Requests** | Rate limited | + `Retry-After` |
| **500 Internal Server Error** | Unexpected server bug | Never for client mistakes |
| **502/503/504** | Bad gateway / unavailable / gateway timeout | Downstream/overload |
**Rule:** **4xx = the client can fix it; 5xx = server's fault.** Never return 200 with `{"error": …}` for failures.

### Q4. 🟢 `@Controller` vs `@RestController`?
`@RestController` = **`@Controller` + `@ResponseBody`** on every method → return values are written **directly to the response body** (JSON) via `HttpMessageConverter`s. `@Controller` returns **view names** (Thymeleaf/JSP HTML) unless a method has `@ResponseBody`.
```java
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService service;
    public OrderController(OrderService service) { this.service = service; }

    @GetMapping("/{id}")
    public OrderDto get(@PathVariable Long id) { return service.find(id); }
}
```

### Q5. ⭐🟡 How does Spring MVC process a request? (`DispatcherServlet` flow)
**In one line:** **`DispatcherServlet`** is the front controller: it finds the right handler, invokes it, and converts the result into the HTTP response.

```
HTTP request
  → Servlet Filters (security, CORS, logging)
  → DispatcherServlet
      1. HandlerMapping      → finds the controller method for GET /users/1
      2. HandlerInterceptor.preHandle
      3. HandlerAdapter      → resolves arguments (@PathVariable, @RequestBody via HttpMessageConverter,
                                @Valid validation), invokes UserController.getUserById()
      4. Return value handling → HttpMessageConverter writes JSON (content negotiation, Q8)
      5. HandlerInterceptor.postHandle / afterCompletion
      6. On exception → HandlerExceptionResolver → @ExceptionHandler / @RestControllerAdvice
  → Response (through filters)
```
**Interview tip:** Name the components — `HandlerMapping`, `HandlerAdapter`, `HttpMessageConverter`, `HandlerExceptionResolver`, `ViewResolver` (for views only). Filter/interceptor/AOP differences are in `spring-aop.md` Q44.

### Q6. 🟢 How do you map requests and bind parameters? (`@PathVariable`, `@RequestParam`, `@RequestBody`, `@RequestHeader`)
| Annotation | Reads from | Example |
|-----------|------------|---------|
| `@PathVariable` | URL path | `/orders/{id}` → `@PathVariable Long id` |
| `@RequestParam` | Query string / form | `/orders?status=NEW&page=0` → `@RequestParam(defaultValue = "NEW") String status` |
| `@RequestBody` | Request **body** (JSON → object) | `@Valid @RequestBody CreateOrderRequest req` |
| `@RequestHeader` | HTTP header | `@RequestHeader("Idempotency-Key") String key` |
| `@CookieValue` | Cookie | — |
| `@ModelAttribute` | Form/query → object | server-rendered forms |
```java
@GetMapping("/orders")                                        // shortcut for @RequestMapping(method = GET)
public Page<OrderDto> list(@RequestParam(required = false) String status, Pageable pageable) { ... }
```
`@GetMapping/@PostMapping/@PutMapping/@PatchMapping/@DeleteMapping` are shortcuts for `@RequestMapping(method = …)`; use `@RequestMapping` at class level for the base path, and for `consumes/produces/params/headers` conditions.

### Q7. ⭐🟡 Why and when do you use `ResponseEntity`?
**In one line:** It lets you control the **status code, headers and body** of the response explicitly.
```java
@PostMapping
public ResponseEntity<OrderDto> create(@Valid @RequestBody CreateOrderRequest req) {
    OrderDto created = service.create(req);
    URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(created.id()).toUri();
    return ResponseEntity.created(location).body(created);           // 201 + Location header
}

@GetMapping("/{id}")
public ResponseEntity<OrderDto> get(@PathVariable Long id) {
    return service.find(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());   // 200 or 404
}

@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)                               // simple fixed status without ResponseEntity
public void delete(@PathVariable Long id) { service.delete(id); }
```
Use plain return types + `@ResponseStatus` for simple cases; `ResponseEntity` when status/headers vary (ETag, Location, cache headers).

### Q8. 🟡 What is content negotiation and what are `HttpMessageConverter`s?
**In one line:** Spring picks the response format from the client's **`Accept`** header and uses a matching **`HttpMessageConverter`** (Jackson for JSON, Jackson-XML for XML, String, byte[]…) to write the object; the request's **`Content-Type`** picks the converter for reading `@RequestBody`.
```java
@GetMapping(value = "/report", produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE })
@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
```
Errors: **406 Not Acceptable** (can't produce requested type), **415 Unsupported Media Type** (can't read the body type), **400** (malformed JSON → `HttpMessageNotReadableException`).

### Q9. 🟡 How do you customize JSON (Jackson) in Spring Boot?
```properties
spring.jackson.default-property-inclusion=non_null
spring.jackson.serialization.write-dates-as-timestamps=false      # ISO-8601 dates
spring.jackson.deserialization.fail-on-unknown-properties=false   # Boot default
spring.jackson.time-zone=UTC
```
```java
@Bean Jackson2ObjectMapperBuilderCustomizer customizer() {                 // keeps Boot's defaults
    return b -> b.featuresToEnable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS);
}
```
**Annotations:** `@JsonProperty("order_id")`, `@JsonIgnore`, `@JsonInclude(NON_NULL)`, `@JsonFormat(pattern=…)`, `@JsonCreator`; prefer **records** for DTOs. **Don't create your own `new ObjectMapper()`** in code — inject the Boot one so config is consistent. Never expose `password` etc. — use DTOs (Q28).

### Q10. ⭐🟡 PUT vs PATCH vs POST — when to use each?
**In one line:** **POST** creates (server picks id) or triggers actions; **PUT** **replaces the whole** resource (client supplies full representation, **idempotent**); **PATCH** changes **part** of it.
```java
@PostMapping("/orders")              // create → 201 + Location
@PutMapping("/orders/{id}")          // full replace; sending the same body twice = same result
@PatchMapping("/orders/{id}")        // e.g. {"status":"CANCELLED"}
```
**Traps:** PUT with missing fields should **null/default them** (it's a replacement) — many APIs accidentally treat it as PATCH; PATCH semantics (JSON Merge Patch vs JSON Patch) must be defined (Q31); "actions" like cancel/approve: model as **sub-resource or state change** (`POST /orders/{id}/cancellation` or `PATCH` status) instead of verbs in URLs (`/cancelOrder`).

### Q11. 🟡 What are the Richardson Maturity levels and HATEOAS?
| Level | Description |
|-------|-------------|
| 0 | One endpoint, HTTP as a tunnel (RPC/SOAP style) |
| 1 | **Resources** (many URLs) |
| 2 | Resources + **proper HTTP verbs & status codes** ← most "REST APIs" stop here |
| 3 | **HATEOAS** — responses contain **links** to next actions |
```json
{ "id": 7, "status": "NEW",
  "_links": { "self": {"href": "/orders/7"}, "cancel": {"href": "/orders/7/cancellation"}, "payment": {"href": "/orders/7/payment"} } }
```
Spring HATEOAS (`EntityModel`, `PagedModel`, `WebMvcLinkBuilder`) supports it. In practice level 2 + good docs (OpenAPI) is the norm; HATEOAS helps loosely-coupled/discoverable clients.

### Q12. 🟡 How does Spring convert and bind request data (converters, formatters, `@InitBinder`)?
- **`HttpMessageConverter`** for bodies; **`Converter<S,T>` / `Formatter<T>`** for **path/query/form** values (String → `LocalDate`, enum, custom id type).
```java
@GetMapping("/orders")
List<OrderDto> byDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from) { ... }
// enum param: ?status=NEW → OrderStatus.NEW  (invalid value → 400 MethodArgumentTypeMismatchException)
```
- Register custom converters via `WebMvcConfigurer.addFormatters`. `@InitBinder` customises binding per controller (e.g., trim strings, allowed fields — **prevents mass assignment** for `@ModelAttribute`).
- Bind errors surface as `MethodArgumentTypeMismatchException`, `HttpMessageNotReadableException`, `MissingServletRequestParameterException` — all handled centrally (Q18).

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; Next: [Validation & Exception Handling →](#2-validation--exception-handling)

---

## 2. Validation & Exception Handling

### Q13. ⭐🟢 How do you validate request data in Spring Boot?
**In one line:** Add **`spring-boot-starter-validation`**, annotate DTO fields with **Bean Validation** constraints, and put **`@Valid`** on the `@RequestBody`.
```java
public record CreateOrderRequest(
        @NotNull Long customerId,
        @NotEmpty List<@Valid OrderLine> lines,                       // nested validation with @Valid
        @Size(max = 200) String note) { }

public record OrderLine(@NotBlank String sku, @Min(1) @Max(1000) int quantity) { }

@PostMapping
public ResponseEntity<OrderDto> create(@Valid @RequestBody CreateOrderRequest req) { ... }
```
On failure Spring throws **`MethodArgumentNotValidException`** (body) → **400** (handle it centrally, Q18). Validation of the **DTO at the boundary** keeps entities/services clean; also keep **DB constraints** as the final guard.

### Q14. ⭐🟡 `@Valid` vs `@Validated` — what's the difference?
| `@Valid` (Jakarta) | `@Validated` (Spring) |
|--------------------|-----------------------|
| Standard Bean Validation; triggers validation; **cascades into nested objects** | Spring's variant; adds **validation groups** and **class-level method validation** |
| No groups | `@Validated(OnCreate.class)` |
| On parameters/fields | On **class** (enables validating `@RequestParam/@PathVariable` constraints & service method params via AOP proxy) |
```java
public interface OnCreate {}  public interface OnUpdate {}
record UserDto(@Null(groups = OnCreate.class) @NotNull(groups = OnUpdate.class) Long id,
               @NotBlank(groups = {OnCreate.class, OnUpdate.class}) String name) {}

@PostMapping public UserDto create(@Validated(OnCreate.class) @RequestBody UserDto dto) { ... }
```
**Trap:** `@Validated` on a service uses a **proxy** → same self-invocation limitation (`spring-aop.md`).

### Q15. 🟢 Which constraints are most common?
`@NotNull` (not null), `@NotEmpty` (not null/empty collection/string), `@NotBlank` (string with non-whitespace), `@Size(min,max)`, `@Min/@Max`, `@Positive/@PositiveOrZero`, `@DecimalMin`, `@Digits`, `@Email`, `@Pattern(regexp=…)`, `@Past/@Future/@PastOrPresent`, `@AssertTrue`, nested **`@Valid`**, container elements `List<@NotBlank String>`.
**Trap:** `@NotNull` on a `String` accepts `""` — use **`@NotBlank`**; on primitives (`int`) null can't happen (use wrappers to detect "missing").

### Q16. 🟡 How do you write a custom validation constraint?
```java
@Target({FIELD, PARAMETER}) @Retention(RUNTIME) @Constraint(validatedBy = PanValidator.class)
public @interface ValidPan { String message() default "Invalid PAN"; Class<?>[] groups() default {}; Class<? extends Payload>[] payload() default {}; }

public class PanValidator implements ConstraintValidator<ValidPan, String> {
    private static final Pattern PAN = Pattern.compile("[A-Z]{5}[0-9]{4}[A-Z]");
    @Override public boolean isValid(String v, ConstraintValidatorContext c) { return v == null || PAN.matcher(v).matches(); }   // null → let @NotNull decide
}
```
**Cross-field rules** (`endDate > startDate`): class-level constraint or `@AssertTrue` method. Validators can be Spring beans (inject a repository for "unique email") — but remember DB unique constraint is the real guard against races.

### Q17. 🟡 How do you validate `@PathVariable`/`@RequestParam` values?
```java
@RestController @Validated                                          // class-level (Boot 2/3.0–3.1 via AOP)
class UserController {
    @GetMapping("/users/{id}")
    UserDto get(@PathVariable @Positive Long id, @RequestParam @Size(max = 20) String q) { ... }
}
```
- **Spring 6.1+ / Boot 3.2+:** built-in **method validation** on controllers → throws **`HandlerMethodValidationException`** (no `@Validated` needed on the class if constraints are on parameters).
- **Older:** `@Validated` + AOP → **`ConstraintViolationException`** — map it to **400** in your handler (otherwise it becomes **500**).
**Tip:** know which exception your Boot version throws, and handle both during migrations.

### Q18. ⭐🟡 How do you implement global exception handling?
**In one line:** **`@RestControllerAdvice`** + **`@ExceptionHandler`** methods centralise error → HTTP response mapping, so controllers have no try/catch.
```java
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {   // pre-handles Spring MVC exceptions

    @ExceptionHandler(ResourceNotFoundException.class)
    ProblemDetail notFound(ResourceNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Resource not found");
        pd.setProperty("code", "ORDER_NOT_FOUND");
        return pd;
    }

    @ExceptionHandler(BusinessRuleException.class)
    ResponseEntity<ProblemDetail> business(BusinessRuleException ex) {
        return ResponseEntity.unprocessableEntity().body(ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage()));
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders h, HttpStatusCode s, WebRequest r) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(FieldError::getField, fe -> Objects.requireNonNullElse(fe.getDefaultMessage(), "invalid"), (a, b) -> a));
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
        pd.setProperty("errors", fieldErrors);
        return ResponseEntity.badRequest().body(pd);
    }

    @ExceptionHandler(Exception.class)                                   // last resort
    ProblemDetail unexpected(Exception ex) {
        log.error("Unhandled", ex);                                       // log full detail server-side
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error");   // generic to client
    }
}
```
**Rules:** most **specific** handler wins; **log once** at the boundary; never leak stack traces/SQL; map **domain exceptions → HTTP codes** in one place. `@ControllerAdvice` vs `@RestControllerAdvice` = the latter adds `@ResponseBody`.

### Q19. ⭐🟡 What is `ProblemDetail` (RFC 7807 / 9457)?
**In one line:** A **standard JSON error format** (`application/problem+json`) so all APIs report errors the same way.
```json
{
  "type": "https://api.acme.com/problems/out-of-stock",
  "title": "Item out of stock",
  "status": 422,
  "detail": "SKU ABC-1 has 0 units left",
  "instance": "/orders/7",
  "code": "OUT_OF_STOCK"
}
```
- Spring 6 / Boot 3: `ProblemDetail` class + `ErrorResponse`; enable automatic mapping of Spring MVC exceptions with **`spring.mvc.problemdetails.enabled=true`**.
- Add custom fields with `setProperty`. Consistent contract = easier client error handling and docs.

### Q20. 🟡 How do you design an exception hierarchy and error codes?
```java
public abstract class AppException extends RuntimeException {           // unchecked → transaction rolls back
    private final String code; private final HttpStatus status;
    ...
}
class ResourceNotFoundException extends AppException { /* 404 */ }
class ConflictException        extends AppException { /* 409 */ }
class BusinessRuleException    extends AppException { /* 422 */ }
```
**Guidelines:** **unchecked** business exceptions (so `@Transactional` rolls back by default — `spring-boot-transactions.md` Q15); stable **machine-readable `code`s** clients can switch on (not message text); **user-safe messages**; keep **technical** exceptions (SQL, NPE) hidden behind a generic 500 with a **correlation id**.

### Q21. 🟡 `ResponseStatusException` vs `@ResponseStatus` vs `@ExceptionHandler`?
- **`@ResponseStatus(HttpStatus.NOT_FOUND)`** on an exception class → fixed status, simple, no body control.
- **`ResponseStatusException(HttpStatus.NOT_FOUND, "msg")`** → thrown inline; quick, but scatters HTTP concerns into service code.
- **`@ExceptionHandler`** in `@RestControllerAdvice` → **best**: centralised, custom body (`ProblemDetail`), logging.
Keep **services HTTP-agnostic** (throw domain exceptions), map in the advice.

### Q22. 🟡 What happens for unknown URLs and default Boot errors?
- Unmapped path → **404**; Boot 3.2+/Spring 6.1 throws **`NoResourceFoundException`** (handle in advice for JSON). Boot's **`BasicErrorController`** serves `/error` with a default JSON/HTML body.
```properties
server.error.include-message=never          # don't leak messages by default
server.error.include-stacktrace=never
server.error.include-binding-errors=never
```
- Wrong method → 405 (`HttpRequestMethodNotSupportedException`); bad content type → 415; invalid JSON → 400; type mismatch → 400. With `ResponseEntityExceptionHandler`/`problemdetails.enabled` these become consistent **ProblemDetail** responses.

### Q23. 🟡 In what order are exception handlers chosen?
Spring checks **`@ExceptionHandler` methods in the controller first**, then **`@ControllerAdvice` beans** (ordered by `@Order`), picking the **closest exception type match** (most specific class). Then `ResponseStatusExceptionResolver`, then `DefaultHandlerExceptionResolver`. Exceptions thrown in **filters** (before MVC) are **not** handled by `@ControllerAdvice` — handle them in the filter or via `AuthenticationEntryPoint`/`HandlerExceptionResolver` delegation (security example: `spring-security.md` Q23).

### Q24. 🟡 How do you avoid leaking internals and keep errors traceable?
- Generic message for 5xx + **`traceId`/correlation id** in the body/header so support can find the log (`X-Request-Id`, Micrometer trace id).
- Never return **stack traces, SQL, class names, entity ids of other users**; for 403/404 on others' resources prefer **404** (don't confirm existence).
- **Log** full exception once with context; avoid logging request bodies containing PII/secrets.
- **i18n**: `MessageSource` with `Accept-Language` for user-facing messages; keep **codes** stable.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Fundamentals](#1-rest--spring-mvc-fundamentals) &nbsp;|&nbsp; Next: [API Design Best Practices →](#3-api-design-best-practices)

---

## 3. API Design Best Practices

### Q25. ⭐🟢 What are the rules for good REST URL (resource) design?
**In one line:** URLs are **nouns (resources)**, HTTP methods are the **verbs**.

| ✅ Good | ❌ Bad |
|--------|-------|
| `GET /orders` · `GET /orders/42` | `GET /getOrders` · `POST /createOrder` |
| `GET /customers/7/orders` (sub-resource) | `GET /getOrdersByCustomer?id=7` |
| `POST /orders/42/cancellation` (action as sub-resource) | `POST /cancelOrder/42` |
| `GET /orders?status=NEW&sort=createdAt,desc` (filter/sort as query) | `GET /orders/new/sorted` |
| plural nouns, lower-case, hyphens (`/order-items`) | `/Order_Item`, mixed case, verbs |
**More rules:** keep nesting ≤ 2 levels; ids are opaque (UUID/ULID if non-guessable matters); don't expose DB internals; be **consistent** across the API; use query params for **filter/sort/page**, path for **identity**; version the API (Q26).

### Q26. ⭐🟡 What are the API versioning strategies and trade-offs?
| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| **URI path** | `/api/v1/orders` | Simple, visible, cache/gateway friendly | URL changes; "version in resource id" purists object |
| **Header** | `X-API-Version: 2` | Clean URLs | Hidden; harder to test in a browser |
| **Media type** (content negotiation) | `Accept: application/vnd.acme.v2+json` | Most "RESTful" | Complex tooling/docs |
| **Query param** | `/orders?version=2` | Easy | Pollutes cache keys |
```java
@RestController @RequestMapping("/api/v1/orders") class OrderControllerV1 { ... }
@RestController @RequestMapping("/api/v2/orders") class OrderControllerV2 { ... }
// header-based:   @GetMapping(value = "/orders", headers = "X-API-Version=2")
// media-type:     @GetMapping(value = "/orders", produces = "application/vnd.acme.v2+json")
```
**Best practice:** prefer **additive, backward-compatible changes** (new optional fields) so you rarely need a new version; version only for **breaking** changes; support **N-1** with a **deprecation policy** (`Deprecation`/`Sunset` headers, docs, usage metrics). *Newer Spring Framework 7 / Boot 4 adds built-in API-versioning support — check your Spring version.*

### Q27. ⭐🟡 How do you design pagination, sorting and filtering?
```java
@GetMapping
public Page<OrderDto> list(@RequestParam(required = false) OrderStatus status,
                           @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
    return service.search(status, pageable);          // GET /orders?status=NEW&page=0&size=20&sort=createdAt,desc
}
```
| Style | How | Use |
|-------|-----|-----|
| **Offset/page** | `page`, `size` | UI with page numbers; fine for small/medium data |
| **Cursor/keyset** | `?after=<lastId or token>&limit=20` | **Large/feeds**, stable under inserts; no deep `OFFSET` cost |
**Guidelines:** cap `size` (`spring.data.web.pageable.max-page-size=100`), whitelist **sortable fields**, return **metadata** (`totalElements`, `nextCursor`), document defaults.
**Trap (Spring Data 3.3+):** serializing a raw `PageImpl` prints a warning (unstable JSON). Use **`PagedModel`** or `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)`, or return your own `PageResponse<T>` DTO. Query-side details: `spring-data-jpa.md` Q38, Q75.

### Q28. ⭐🟡 Why use DTOs instead of returning entities? How do you map them?
**In one line:** DTOs **decouple your API from your database model** — safer, faster and evolvable.
- Entities leak **internal fields** (passwordHash, version), trigger **lazy loading / N+1 / `LazyInitializationException`** during serialization, cause **infinite recursion** (bidirectional), and let clients **over-post** (mass assignment: `"role":"ADMIN"`).
```java
public record OrderDto(Long id, String status, BigDecimal total, List<OrderLineDto> lines) {}
public record CreateOrderRequest(@NotNull Long customerId, @NotEmpty List<@Valid LineRequest> lines) {}   // separate in/out DTOs

@Mapper(componentModel = "spring")                       // MapStruct generates mapping code at compile-time (fast, type-safe)
public interface OrderMapper { OrderDto toDto(Order o); Order toEntity(CreateOrderRequest r); }
```
Prefer **different DTOs for create/update/read** (id & audit fields are read-only). Use **repository projections** for read-heavy lists (`spring-data-jpa.md` Q40). Avoid reflection-heavy mappers (ModelMapper) on hot paths.

### Q29. ⭐🔴 How do you make `POST` safe to retry? (idempotency keys)
**In one line:** The client sends a unique **`Idempotency-Key`**; the server stores the **first result** and **returns the same response** for repeats.

**Explained simply (analogy):** A restaurant ticket number — if you ring the bell twice for the same ticket, the kitchen cooks **one** meal.
```java
@PostMapping("/payments")
public ResponseEntity<PaymentDto> pay(@RequestHeader("Idempotency-Key") String key, @Valid @RequestBody PayRequest req) {
    return idempotency.execute(key, req, () -> paymentService.charge(req));   // returns stored response on repeat
}
```
**Implementation:** table `idempotency(key PRIMARY KEY, request_hash, status, response_body, created_at)` → `INSERT` the key **first** (unique constraint serialises concurrent duplicates) → process → store the response; if the same key arrives with a **different payload** → **422/409**; **expire** keys (24–48h). Combine with DB transaction so "processed + stored response" commit together.
**Related:** retries by gateways/clients, mobile networks, message redelivery (`spring-boot-transactions.md` Q42).

### Q30. 🟢 How should a create (`POST`) response look?
**`201 Created`** + **`Location: /orders/42`** header + the created representation (or empty body). Return **200** only if you create nothing (an action). For duplicate creation conflicts → **409**.

### Q31. 🟡 How do you implement PATCH properly?
**Two standards:**
- **JSON Merge Patch** (`application/merge-patch+json`): send only changed fields; `null` = remove. Simple.
- **JSON Patch** (`application/json-patch+json`): list of operations `[{"op":"replace","path":"/status","value":"CANCELLED"}]`; precise (arrays, test ops).
```java
@PatchMapping(path = "/{id}", consumes = "application/merge-patch+json")
public OrderDto patch(@PathVariable Long id, @RequestBody JsonNode patch) { return service.applyPatch(id, patch); }
```
**Pitfall:** with a plain DTO you can't tell **"field absent"** from **"field set to null"** — use `JsonNode`/`Optional`-style wrappers or Merge-Patch libraries. Validate the **result**, not just the patch.

### Q32. 🟡 How do you design bulk/batch endpoints?
- `POST /orders/bulk` with an array; limit size (e.g., ≤ 100).
- **All-or-nothing** (one transaction, 400/422 on any error) **vs partial success** (return **207 Multi-Status** or 200 with per-item results `{index, status, error}`).
- Make it **idempotent** (per-item keys), chunk DB work (`spring-data-jpa.md` Q74), and consider **async jobs** (Q33) for large batches.

### Q33. 🟡 How do you expose long-running operations?
**`202 Accepted`** + a **status resource**:
```java
@PostMapping("/reports")
public ResponseEntity<Void> start(@RequestBody ReportRequest r) {
    String jobId = jobs.submit(r);                                                  // async executor / queue
    return ResponseEntity.accepted().location(URI.create("/reports/jobs/" + jobId)).build();
}
@GetMapping("/reports/jobs/{id}")     // → 200 {"status":"RUNNING","progress":40}  or 303 See Other → /reports/123 when done
```
Alternatives: **webhooks/callbacks**, **SSE/WebSocket** push (Q47). Persist job state (don't keep it only in memory — restarts/multiple pods), support **cancel** and **timeouts**.

### Q34. ⭐🟡 How does HTTP caching work for REST APIs (ETag, Cache-Control, conditional requests)?
**In one line:** The server labels a representation with an **`ETag`** (version fingerprint); the client revalidates with **`If-None-Match`** → server replies **`304 Not Modified`** (no body) if unchanged.
```java
@GetMapping("/products/{id}")
public ResponseEntity<ProductDto> get(@PathVariable Long id) {
    ProductDto p = service.find(id);
    return ResponseEntity.ok()
        .eTag("\"" + p.version() + "\"")
        .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
        .body(p);
}
// Or automatic shallow ETag (hashes the body; saves bandwidth, not server work):
@Bean ShallowEtagHeaderFilter etagFilter() { return new ShallowEtagHeaderFilter(); }
```
`Cache-Control: no-store` for sensitive data, `private` for user-specific, `public, max-age` for shared static data; `Vary: Accept-Encoding/Authorization` where responses differ. Great for reference data and read-heavy endpoints.

### Q35. 🟡 How do you prevent lost updates over REST? (`ETag` + `If-Match`)
**Optimistic concurrency at the API level:** `GET` returns `ETag: "5"` (the `@Version`). Client sends `PUT … If-Match: "5"`. If the version changed → **`412 Precondition Failed`** (or **409**). Without `If-Match` you can require it with **`428 Precondition Required`**. Combine with JPA `@Version` (`spring-data-jpa.md` Q83).

### Q36. 🟡 How do you handle file upload and download?
```java
@PostMapping(path = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<FileDto> upload(@RequestPart("file") MultipartFile file) {
    validate(file.getContentType(), file.getSize());                    // type + size whitelist; never trust filename
    return ResponseEntity.status(HttpStatus.CREATED).body(storage.save(file));   // → S3/object storage, not DB blobs
}

@GetMapping("/files/{id}")
public ResponseEntity<Resource> download(@PathVariable String id) {
    Resource r = storage.load(id);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("report.pdf").build().toString())
        .contentType(MediaType.APPLICATION_PDF).body(r);
}
```
```properties
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=12MB
```
**Security:** sanitize filenames (path traversal), scan for malware, check **magic bytes**, store outside web root; use **pre-signed URLs** for large files; stream (`StreamingResponseBody`, Q50) instead of loading into memory.

### Q37. 🟢 How do you document an API (OpenAPI/Swagger)?
Add **`springdoc-openapi-starter-webmvc-ui`** → OpenAPI 3 JSON at `/v3/api-docs`, Swagger UI at `/swagger-ui.html`. Annotate with `@Operation`, `@ApiResponse`, `@Schema`; define error schemas (`ProblemDetail`) and security schemes. **Disable/secure in production** if the API is private; generate client SDKs and **contract tests** from the spec; keep the spec in CI to detect **breaking changes**.

### Q38. 🟡 How do you design flexible search/filter endpoints without an explosion of parameters?
- Use a **filter DTO** bound from query params: `OrderSearchCriteria` (`@ParameterObject` for docs) + **Specifications** (`spring-data-jpa.md` Q42).
- Whitelist sortable/filterable fields; validate ranges; paginate always.
- For complex queries consider `POST /orders/search` with a JSON body (document that it's a safe, cacheable-by-you read), or **GraphQL**/**OData-style** only if needed.
- Index the filtered columns; log slow queries.

### Q39. 🟡 How do you implement rate limiting and return the right signals?
- Enforce at the **API gateway** (Spring Cloud Gateway `RequestRateLimiter` with Redis, Kong, Envoy, cloud WAF) — per IP/user/API key/tenant; token-bucket or sliding window.
- In-app option: **Resilience4j `@RateLimiter`** or **Bucket4j** with Redis for distributed counts.
- Response: **`429 Too Many Requests`** + **`Retry-After`** (and `RateLimit-*` headers). Differentiate **burst** vs **sustained** limits; decide the **fail-open/closed** behaviour when Redis is down (public APIs usually fail-open + alert).

### Q40. 🟡 What is the REST API security checklist?
Authenticate every call (**JWT/OAuth2**), authorize **per resource** (IDOR!), validate input (DTO + Bean Validation), **CORS** explicit origins, **HTTPS only**, rate limit, hide internals in errors, no sensitive data in URLs/logs, security headers, dependency patching, audit logs. Details and code: `spring-security.md`.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Validation & Exception Handling](#2-validation--exception-handling) &nbsp;|&nbsp; Next: [Calling Other Services →](#4-calling-other-services--concurrency)

---

## 4. Calling Other Services & Concurrency

### Q41. ⭐🟡 `RestTemplate` vs `RestClient` vs `WebClient` vs OpenFeign vs HTTP Interface — which to use?
| Client | Style | Notes |
|--------|-------|-------|
| **`RestTemplate`** | Blocking, template methods | **Maintenance mode** — still works, avoid for new code |
| **`RestClient`** *(Spring 6.1 / Boot 3.2)* | Blocking, **fluent API** | **Modern replacement** for RestTemplate in MVC apps |
| **`WebClient`** | **Non-blocking/reactive** (Reactor, Netty) | Use in WebFlux apps or for **parallel non-blocking calls**; works with `.block()` in MVC |
| **OpenFeign** (Spring Cloud) | **Declarative interface** | Popular in microservices; integrates with load balancing/resilience |
| **HTTP Interface** (`@HttpExchange`) | Declarative, backed by RestClient/WebClient | Spring-native alternative to Feign |
```java
// RestClient
OrderDto o = restClient.get().uri("/orders/{id}", id)
    .retrieve()
    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> { throw new NotFoundException(); })
    .body(OrderDto.class);

// HTTP interface
interface InventoryApi {
    @GetExchange("/stock/{sku}") StockDto stock(@PathVariable String sku);
}
InventoryApi api = HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient)).build().createClient(InventoryApi.class);
```
**Rule:** MVC app → **`RestClient`** (or Feign/HTTP interface); reactive stack → **`WebClient`**. Architectural implication: blocking clients need **more threads under load** (or **virtual threads**); `WebClient` has **lower per-request memory** but harder debugging.

### Q42. 🟡 How do you configure a `RestClient` properly (base URL, timeouts, error handling)?
```java
@Bean
RestClient inventoryClient(RestClient.Builder builder) {                    // builder is auto-configured by Boot
    var factory = ClientHttpRequestFactoryBuilder.httpComponents()           // Boot 3.4+: pooled Apache HttpClient
        .build(ClientHttpRequestFactorySettings.defaults()
            .withConnectTimeout(Duration.ofSeconds(1))
            .withReadTimeout(Duration.ofSeconds(3)));
    return builder.baseUrl("https://inventory.internal").requestFactory(factory)
        .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
        .defaultStatusHandler(HttpStatusCode::is5xxServerError, (req, res) -> { throw new DownstreamException(res.getStatusCode()); })
        .build();
}
```
Boot 3.4+ also supports `spring.http.client.connect-timeout` / `read-timeout`. **Never** use infinite defaults: always set **connect + read timeouts** (the default is often "forever").

### Q43. ⭐🔴 How do you make outbound calls resilient? (timeouts, retry, circuit breaker, bulkhead)
**In one line:** Assume downstream services **will** be slow or fail — protect your threads.
```java
@Service
class PricingClient {
    @CircuitBreaker(name = "pricing", fallbackMethod = "fallback")
    @Retry(name = "pricing")
    @TimeLimiter(name = "pricing")            // for async/CompletableFuture
    @Bulkhead(name = "pricing")
    public Price fetch(String sku) { return restClient.get().uri("/price/{sku}", sku).retrieve().body(Price.class); }

    Price fallback(String sku, Throwable t) { return cachedOrDefault(sku); }
}
```
```yaml
resilience4j:
  circuitbreaker.instances.pricing: { slidingWindowSize: 20, failureRateThreshold: 50, waitDurationInOpenState: 10s }
  retry.instances.pricing: { maxAttempts: 3, waitDuration: 200ms, enableExponentialBackoff: true, retryExceptions: [java.io.IOException] }
```
| Pattern | Purpose |
|---------|---------|
| **Timeout** | Never wait forever (frees threads) |
| **Retry + backoff + jitter** | Survive transient errors — **idempotent calls only** |
| **Circuit breaker** | Stop calling a failing service (**CLOSED → OPEN → HALF_OPEN**); fail fast |
| **Bulkhead** | Limit concurrent calls so one slow dependency can't eat all threads |
| **Fallback** | Cached/default/degraded response |
**Trap:** retries + no circuit breaker = **retry storm** amplifying an outage; annotations are **AOP** → self-invocation limits (`spring-aop.md`). More: `spring-boot-microservices-kafka.md`.

### Q44. 🟡 How do HTTP connection pools affect performance?
Creating a TCP/TLS connection per request is expensive; use **pooled** clients (Apache HttpClient 5, Jetty, Reactor Netty): set **max total** and **per-route** connections, **keep-alive**, **idle eviction**, and **pool acquire timeout**. Symptoms of bad config: `Timeout waiting for connection from pool`, latency spikes, `Connection reset`. Size by **expected concurrency × downstream latency**; monitor pool metrics.

### Q45. ⭐🔴 Scenario: an endpoint must call 3 services — how do you do it concurrently?
**Sequential:** total latency = a + b + c. **Concurrent:** ≈ max(a, b, c).
```java
// Option A: CompletableFuture with a bounded executor (platform threads)
CompletableFuture<User> u = CompletableFuture.supplyAsync(() -> userApi.get(id), ioExecutor);
CompletableFuture<List<Order>> o = CompletableFuture.supplyAsync(() -> orderApi.byUser(id), ioExecutor);
CompletableFuture<Profile> p = CompletableFuture.supplyAsync(() -> profileApi.get(id), ioExecutor);
CompletableFuture.allOf(u, o, p).orTimeout(2, TimeUnit.SECONDS).join();
return new Dashboard(u.join(), o.join(), p.join());

// Option B: virtual threads (Java 21) — plain blocking code scales
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {          // (preview API in 21–24; check your JDK)
    var u = scope.fork(() -> userApi.get(id)); var o = scope.fork(() -> orderApi.byUser(id));
    scope.join().throwIfFailed();
    return new Dashboard(u.get(), o.get());
}

// Option C: WebClient + Mono.zip (reactive)
Mono.zip(userClient.get(id), orderClient.byUser(id), profileClient.get(id)).map(t -> new Dashboard(t.getT1(), t.getT2(), t.getT3()));
```
**Rules:** per-call **timeouts** + a **partial-failure policy** (fail all vs degrade the missing part); **bounded** thread pools (never the common ForkJoinPool for I/O); propagate **security/MDC/trace context** to other threads (`spring-security.md` Q50); don't parallelise DB writes inside one transaction (`spring-boot-transactions.md` Q26). Consider **API composition at a gateway/BFF**.

### Q46. ⭐🟡 Spring MVC vs Spring WebFlux — when to choose which?
| | **Spring MVC** | **Spring WebFlux** |
|---|----------------|--------------------|
| Model | **Thread-per-request**, blocking | **Event-loop**, non-blocking, reactive streams |
| Server | Tomcat/Jetty (servlet) | **Netty** (also Tomcat/Undertow) |
| Types | Plain objects | **`Mono<T>`** (0..1) / **`Flux<T>`** (0..N) |
| Data access | JPA/JDBC (blocking) ✅ | Needs **R2DBC/reactive drivers** |
| Debugging | Easy stack traces | Harder (async stacks) |
| Best for | Most CRUD/business APIs | **High-concurrency I/O-bound** gateways, streaming, many slow downstream calls |
**Key rule:** **never block the event loop** in WebFlux (no JDBC, `Thread.sleep`, `.block()` inside a reactive chain) — offload to `Schedulers.boundedElastic()`.
**Modern take (Java 21):** **virtual threads** (`spring.threads.virtual.enabled=true`) give MVC much of WebFlux's scalability with simple blocking code — choose WebFlux only if you need **backpressure/streaming** or a fully reactive stack. Don't mix blocking JPA into WebFlux.

### Q47. 🟡 How do you push data to clients — SSE vs WebSocket?
- **Server-Sent Events (SSE):** one-way server→client over HTTP (`text/event-stream`), auto-reconnect, proxy-friendly → live dashboards, notifications. `SseEmitter` (MVC) or `Flux<ServerSentEvent>` (WebFlux).
- **WebSocket:** **bidirectional**, low latency → chat, games, collaborative editing; use STOMP + broker for scale. Needs sticky sessions or a shared broker across instances.
**Trap:** long-lived connections hold **threads** in MVC (use virtual threads/async) and break **graceful shutdown** unless closed.

### Q48. 🟡 How do `@Async`, `Callable` and `DeferredResult` differ for async endpoints?
- **`@Async`** (service layer): runs a method on a **`TaskExecutor`** thread; needs `@EnableAsync`; return `void`/`CompletableFuture`; proxy rules apply; **no transaction/security/MDC propagation** unless configured.
- **`Callable<T>` / `DeferredResult<T>` / `CompletableFuture<T>`** as controller return types: release the servlet thread while work completes elsewhere (Servlet async), useful for slow operations without blocking container threads.
```java
@Bean TaskExecutor ioExecutor() {
    ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
    ex.setCorePoolSize(8); ex.setMaxPoolSize(32); ex.setQueueCapacity(200);       // bounded! + rejection policy
    ex.setThreadNamePrefix("io-"); ex.setTaskDecorator(new MdcTaskDecorator()); ex.initialize(); return ex;
}
```
**Trap:** default `@Async` executor settings (Boot's applicationTaskExecutor) — **always configure bounds**; unhandled exceptions in `void` async methods are **lost** unless an `AsyncUncaughtExceptionHandler` is set.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← API Design](#3-api-design-best-practices) &nbsp;|&nbsp; Next: [Performance, Observability & Testing →](#5-performance-observability--testing)

---

## 5. Performance, Observability & Testing

### Q49. 🟡 How do you reduce payload size and serialization cost?
- Return **DTOs/projections** with only needed fields; `@JsonInclude(NON_NULL)`; avoid serializing lazy entity graphs.
- **Pagination** everywhere; **field selection** (`?fields=id,name`) if clients need it.
- **Compression:** `server.compression.enabled=true` (+ `mime-types`, `min-response-size=1024`), or let the gateway/ingress compress.
- Avoid huge `Map<String,Object>`/`JsonNode` trees on hot paths; reuse the shared `ObjectMapper`; consider **Protobuf/Avro** for internal high-throughput service calls.

### Q50. 🟡 How do you stream a large export without running out of memory?
```java
@GetMapping("/orders/export")
public ResponseEntity<StreamingResponseBody> export() {
    StreamingResponseBody body = out -> {
        try (var writer = new BufferedWriter(new OutputStreamWriter(out, UTF_8));
             Stream<Order> orders = repo.streamAll()) {              // @Transactional(readOnly = true) around it
            writer.write("id,total\n");
            orders.forEach(o -> { try { writer.write(o.getId() + "," + o.getTotal() + "\n"); } catch (IOException e) { throw new UncheckedIOException(e); } });
        }
    };
    return ResponseEntity.ok().contentType(new MediaType("text", "csv")).body(body);
}
```
Combine with DB streaming (`spring-data-jpa.md` Q30), flush periodically, set timeouts, and consider generating big exports **asynchronously** to object storage and returning a download link (Q33).

### Q51. 🟢 HTTP/2, keep-alive and compression — what should I know?
`server.http2.enabled=true` (needs TLS in most setups) gives multiplexing; **keep-alive** reuses connections (tune `server.tomcat.keep-alive-timeout`, `max-keep-alive-requests`); behind an ingress/ALB these are usually terminated at the edge. Large requests: limit body size (`server.tomcat.max-swallow-size`, `spring.servlet.multipart.*`).

### Q52. 🟡 How do you log requests/responses and correlate them?
- Add a **`OncePerRequestFilter`** that sets **`MDC.put("traceId", …)`** (from `traceparent`/`X-Request-Id` or a new UUID), echoes it in the response header, and clears MDC in `finally`. With Micrometer Tracing the trace id is automatic.
- Built-in: `CommonsRequestLoggingFilter` (`logging.level…=DEBUG`) — **don't log bodies** with secrets/PII; mask `Authorization`, passwords, tokens.
- Log **method, path, status, latency, user id** at INFO; payloads only at DEBUG in non-prod. JSON logs help ELK/Loki.

### Q53. 🟡 What REST metrics and health signals should you expose?
- **Actuator + Micrometer:** `http.server.requests` (count, latency percentiles, by method/uri/status — use **URI templates** not raw ids to avoid cardinality explosion), JVM, Hikari pool, cache, Kafka metrics.
- **SLIs/alerts:** p95/p99 latency, error rate (5xx), saturation (thread/connection pools), **RED** (Rate, Errors, Duration).
- **Health:** `/actuator/health/liveness` and `/readiness` for Kubernetes; custom `HealthIndicator` for critical downstreams (but don't make liveness depend on them). Production details: `spring-boot-production.md`.

### Q54. ⭐🟡 How do you test REST controllers? (`MockMvc`, `WebTestClient`, `TestRestTemplate`)
```java
@WebMvcTest(OrderController.class)                       // loads only the web layer
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;                    // @MockBean in Boot < 3.4

    @Test void returns_404_when_missing() throws Exception {
        given(service.find(99L)).willThrow(new ResourceNotFoundException("order 99"));
        mvc.perform(get("/api/v1/orders/99"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.title").value("Resource not found"));
    }

    @Test void validates_body() throws Exception {
        mvc.perform(post("/api/v1/orders").contentType(APPLICATION_JSON).content("{\"lines\":[]}"))
           .andExpect(status().isBadRequest());
    }
}
```
| Tool | Use |
|------|-----|
| `MockMvc` (+ `@WebMvcTest`) | Fast **slice** test of controller, validation, advice, serialization (no real server) |
| `@SpringBootTest(RANDOM_PORT)` + `TestRestTemplate`/`RestTestClient`/`WebTestClient` | **Full-stack** integration over real HTTP |
| **Contract tests** (Spring Cloud Contract / Pact) | Consumer–provider API compatibility |
Test **error paths** (400/404/409/422/401/403), pagination, and serialization format. More: `spring-boot-testing.md`.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Calling Other Services](#4-calling-other-services--concurrency) &nbsp;|&nbsp; Next: [Scenarios & Wrap-up →](#6-scenarios--wrap-up)

---

## 6. Scenarios & Wrap-up

### Q55. ⭐🔴 Scenario: design a REST API for an Order service end-to-end.
**Resources & endpoints**
| Operation | Request | Response |
|-----------|---------|----------|
| Create | `POST /api/v1/orders` (+ `Idempotency-Key`) | **201** + `Location` + `OrderDto` |
| Get | `GET /api/v1/orders/{id}` | 200 / **404** (+ `ETag`) |
| List | `GET /api/v1/orders?status=NEW&page=0&size=20&sort=createdAt,desc` | 200 + page metadata |
| Cancel (action) | `POST /api/v1/orders/{id}/cancellation` | 200/204; **409** if not cancellable |
| Update address | `PATCH /api/v1/orders/{id}` + `If-Match` | 200; **412** on version mismatch |
| Delete (draft only) | `DELETE /api/v1/orders/{id}` | 204 |
**Design decisions**
- **DTOs** (records) for request/response; **Bean Validation** on input; **MapStruct** mapping.
- **Layers:** controller (HTTP) → service (`@Transactional`, business rules) → repository.
- **Errors:** `ProblemDetail` via `@RestControllerAdvice` (404 not found, 409 conflict, 422 rule violation, 400 validation).
- **Security:** JWT resource server; `@PreAuthorize` ownership check (IDOR); CORS explicit.
- **Concurrency/consistency:** `@Version`, idempotency keys, **outbox** event `OrderCreated` to Kafka (`spring-boot-microservices-kafka.md`).
- **Performance:** pagination, projections, indexes, ETag caching for GET, timeouts + circuit breaker for pricing/inventory calls.
- **Operations:** OpenAPI docs, correlation ids, metrics, health probes, versioned `/v1`.

### Q56. ⭐🟡 Scenario: "A mobile client retried and the customer was charged twice."
**Causes:** timeout → client **retried a non-idempotent `POST`**; or gateway/queue redelivered.
**Fix:** **idempotency keys** (Q29); make downstream (payment provider) calls idempotent too; use a unique business reference (`orderId` + attempt) with a **DB unique constraint**; record outcomes **transactionally**; return the **original response** for duplicates; add **reconciliation** jobs; client uses exponential backoff only with idempotency keys.

### Q57. ⭐🟡 Scenario: 400 vs 404 vs 409 vs 422 vs 403 — how do you choose?
| Situation | Code |
|-----------|------|
| Malformed JSON, missing/invalid fields (Bean Validation) | **400** |
| Well-formed but **business rule** violated (insufficient stock, invalid state transition) | **422** *(or 409/400 per team convention — be consistent)* |
| Duplicate unique value, optimistic-lock/version conflict, resource in wrong state | **409** |
| Resource id doesn't exist | **404** |
| Exists but belongs to someone else | **404** (don't confirm) or **403** |
| Not logged in / bad token | **401** |
| Logged in, lacks permission | **403** |
| Rate limited | **429** |
**Interview tip:** The *consistency* and a **documented error contract** matter more than the exact 400-vs-422 choice.

### Q58. 🟡 Scenario: "An endpoint is slow in production." — triage steps.
1. **Measure:** which endpoint? p95/p99, error rate, **when it started** (deploy? traffic?) — Actuator metrics/APM, trace the request.
2. **Where is the time?** DB (N+1, missing index, big result set) → `spring-data-jpa.md` Q68/Q96; **downstream calls** (no timeout/retry storm) → Q43; **serialization** of huge payloads → Q49; **thread/connection pool exhaustion** (Hikari pending, Tomcat busy threads); **GC pauses**.
3. **Fix the biggest contributor first:** fetch strategy/DTO/projection, indexes, pagination, caching (ETag/Redis), parallelise independent calls (Q45), add timeouts/circuit breakers.
4. **Prevent regressions:** load test, query-count assertions, SLO alerts.

### Q59. 🟡 Scenario: how do you roll out a breaking API change safely?
- Prefer **additive** changes; avoid breaking existing clients.
- If unavoidable → new **version** (`/v2`) side by side; **deprecate** v1 with `Deprecation`/`Sunset` headers + docs + usage metrics per client; migrate clients; remove v1 after the **sunset date**.
- Use **consumer-driven contract tests** to find who breaks; feature flags / **tolerant readers** (ignore unknown fields); document the changelog; for events/messages use schema registry compatibility rules.

### Q60. 🟡 Scenario: "My controller returns an entity and I get `LazyInitializationException`/infinite recursion/huge JSON."
All symptoms of **returning entities**: lazy associations outside the transaction, bidirectional references, over-fetching. Fix: **return DTOs/projections built inside the service transaction** (Q28, Q9); don't rely on Open-Session-In-View (`spring.jpa.open-in-view=false`). Details: `spring-data-jpa.md` Q66, Q71–72.

### Q61. 🟡 What are common REST anti-patterns?
Verbs in URLs; **200 for errors**; leaking entities/stack traces; **no pagination**; ignoring idempotency on `POST`; **chatty APIs** (N calls per screen — add composition/BFF); inconsistent naming/error formats; no timeouts on outbound calls; breaking changes without versioning; **business logic in controllers**; unbounded `@Async`; passing secrets in query strings; returning different shapes for the same resource.

### Q62. ⭐🟢 Explain REST API design in Spring Boot in 60 seconds (project-style answer).
> "I model **resources with nouns**, use HTTP verbs/status codes correctly — **201 + Location** for creates, **204** for deletes, 4xx for client errors — and keep controllers thin: **DTO records in/out, Bean Validation (`@Valid`) at the boundary, business logic in `@Transactional` services**. Errors go through one **`@RestControllerAdvice`** returning **`ProblemDetail`** with stable error codes and a trace id, never stack traces.
> For design I handle **pagination (with caps), filtering via Specifications, versioning (`/v1`, additive changes first), ETag caching and `If-Match` concurrency, and idempotency keys** for payments. Outbound calls use **`RestClient`/Feign with timeouts, retries (idempotent only), circuit breakers and bulkheads**; independent calls run **concurrently with bounded pools or virtual threads**. I secure with **JWT/OAuth2 + ownership checks**, document with **OpenAPI**, observe with **Micrometer metrics + traces**, and test with **`@WebMvcTest`/MockMvc, Testcontainers and contract tests**."

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Performance, Observability & Testing](#5-performance-observability--testing)

---

## ✅ Last-minute cheat sheet

| Topic | One-liner to remember |
|-------|----------------------|
| REST | Resources (nouns) + HTTP verbs + stateless + cacheable |
| Safe / idempotent | GET/HEAD safe; GET/PUT/DELETE idempotent; POST & PATCH not |
| Create | `POST` → **201 + Location** |
| PUT vs PATCH | Full replace (idempotent) / partial change |
| 401 vs 403 | Unauthenticated / forbidden |
| 400 / 422 / 409 | Malformed / business rule / conflict |
| `@Valid` vs `@Validated` | Cascade standard validation / groups + class-level method validation |
| Global errors | `@RestControllerAdvice` + `ProblemDetail` (RFC 9457) |
| DTOs | Never expose entities (lazy, recursion, mass assignment) |
| Pagination | Page/size (cap it) or cursor/keyset for big feeds |
| Versioning | URI `/v1` most common; prefer additive changes |
| Idempotency | `Idempotency-Key` + stored response + unique constraint |
| HTTP caching | `ETag` + `If-None-Match` → 304; `If-Match` → 412 |
| Clients | `RestClient` (MVC) / `WebClient` (reactive) / Feign / HTTP interface |
| Resilience | Timeout + retry(idempotent) + circuit breaker + bulkhead |
| MVC vs WebFlux | Thread-per-request / event loop; virtual threads narrow the gap |
| Slow endpoint | Measure → DB/downstream/serialization/pools → fix biggest first |
| Test | `@WebMvcTest` + MockMvc; integration with Testcontainers |

## 🎤 How to answer in an interview (template)
1. **One-line definition.**
2. **Analogy / why it exists.**
3. **Tiny example** (controller, handler, annotation).
4. **The trap** (idempotency, over-fetching, blocking, 200-for-errors).
5. **What you do in real projects** (DTOs, ProblemDetail, timeouts, tests).

## 📚 References
- [roadmap.sh – Top 60+ Spring Boot Interview Questions](https://roadmap.sh/questions/spring-boot)
- [Coding Shuttle – 100 Spring Boot Interview Questions](https://www.codingshuttle.com/blogs/100-spring-boot-interview-questions-with-answers-for-2-to-5-years-experienced-java-developers)
- [Intervue](https://www.intervue.io/interview-questions/spring-boot-interview-questions/) · [InterviewBit](https://www.interviewbit.com/spring-boot-interview-questions/) — Spring Boot question lists
- [Spring Framework – Web MVC](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
- [RFC 9110 – HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) · [RFC 9457 – Problem Details](https://www.rfc-editor.org/rfc/rfc9457)
- [Resilience4j documentation](https://resilience4j.readme.io/)

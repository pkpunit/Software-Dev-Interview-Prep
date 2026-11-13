---
title: Spring Boot Testing Interview Questions & Answers
layout: docs
category: spring-boot
tags: [testing, junit5, mockito, mockmvc, datajpatest, testcontainers, webmvctest, contract-testing, interview]
level: junior-to-senior
questions: 50
---

# Spring Boot Testing — Interview Questions & Answers

> **50 questions**: the testing pyramid for Spring apps, **unit tests with JUnit 5 + Mockito**, **slice tests** (`@WebMvcTest`, `@DataJpaTest`, `@JsonTest`, `@RestClientTest`), **integration tests with Testcontainers**, async/Kafka/security testing, contract tests, speed & flakiness, and scenarios.
> Every answer follows the same pattern: **In one line** → **Explained simply** (analogy) → **Example / code** → **Interview tip / trap / follow-up**.
> Sources consolidated: roadmap.sh and CodingShuttle (read in full — testing, `@Transactional`, N+1, startup topics), Spring Boot / Spring Framework testing reference docs, Testcontainers & Mockito docs, plus real interview scenarios. Test-related traps from the other pages in this series are cross-referenced.

**Legend:** 🟢 Easy &nbsp;|&nbsp; 🟡 Medium &nbsp;|&nbsp; 🔴 Hard &nbsp;|&nbsp; ⭐ Must-know (asked very often)

> 📎 **Companion pages:** `spring-boot-core.md` · `spring-boot-rest-api.md` (MockMvc basics) · `spring-boot-transactions.md` (test transactions hide bugs) · `spring-security.md` (security tests) · `spring-boot-microservices-kafka.md` (Kafka tests) · `spring-data-jpa.md` · `spring-boot-production.md`

---

## 📑 On this page

| # | Section | Questions |
|---|---------|-----------|
| 1 | [Testing Fundamentals in Spring Boot](#1-testing-fundamentals-in-spring-boot) | Q1 – Q8 |
| 2 | [Unit Testing with JUnit 5 & Mockito](#2-unit-testing-with-junit-5--mockito) | Q9 – Q18 |
| 3 | [Slice Tests](#3-slice-tests) | Q19 – Q30 |
| 4 | [Integration Tests & Testcontainers](#4-integration-tests--testcontainers) | Q31 – Q40 |
| 5 | [Strategy, Speed & Scenarios](#5-strategy-speed--scenarios) | Q41 – Q50 |

**Quick revision — top 12 ⭐:** Q1 (test pyramid) · Q2 (`spring-boot-starter-test`) · Q4 (`@SpringBootTest`) · Q5 (context caching) · Q9 (`@Mock/@InjectMocks`) · Q10 (`@MockBean` vs Mockito mock) · Q19 (`@WebMvcTest`) · Q21 (`@DataJpaTest`) · Q31 (Testcontainers) · Q32 (H2 vs real DB) · Q33 (`@Transactional` tests trap) · Q36 (Awaitility) · Q45 (flaky tests)

---

## 1. Testing Fundamentals in Spring Boot

### Q1. ⭐🟢 What is the testing pyramid, and how does it apply to a Spring Boot app?
**In one line:** **Many fast unit tests**, **fewer slice/integration tests**, **very few end-to-end tests**.

```
            ▲  E2E / system tests   (few, slow, brittle: real deployment, UI/API flows)
           ╱ ╲
          ╱   ╲ Integration tests    (some: @SpringBootTest + Testcontainers, real DB/Kafka)
         ╱     ╲
        ╱───────╲ Slice tests        (focused: @WebMvcTest, @DataJpaTest, @JsonTest)
       ╱         ╲
      ╱───────────╲ Unit tests       (many, milliseconds: plain JUnit + Mockito, no Spring context)
```
| Level | Starts Spring? | Speed | Verifies |
|-------|:--------------:|-------|----------|
| **Unit** | ❌ | ms | One class's logic (service rules, mappers, validators) |
| **Slice** | Partial context | 1–3 s (cached after) | Web layer, JPA layer, JSON mapping **in isolation** |
| **Integration** | Full context (+ containers) | seconds | Layers wired together, real DB/messaging, config |
| **E2E** | Deployed system | slow | Business flows across services |
**Interview tip:** Push logic into **plain classes** (services/domain) so most tests are **fast unit tests**; use Spring tests for **wiring, mapping, queries and HTTP behaviour**.

### Q2. ⭐🟢 What does `spring-boot-starter-test` include?
**JUnit 5 (Jupiter)**, **Mockito**, **AssertJ**, **Hamcrest**, **JSONassert**, **JsonPath**, **Spring Test + Spring Boot Test** (`@SpringBootTest`, slices, `MockMvc`), **XMLUnit**, **Awaitility**.
```xml
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
```
Add separately: **Testcontainers** (`spring-boot-testcontainers`), **spring-security-test**, **WireMock**, **spring-kafka-test**, **Spring Cloud Contract/Pact**, **ArchUnit**.

### Q3. 🟡 Unit test vs slice test vs integration test — how do you decide?
- **Unit:** business rules, calculations, state machines, mappers — mock collaborators.
- **Slice:** *"Does my controller map JSON, validate and return 400/404 correctly?"* (`@WebMvcTest`); *"Does my derived query / `@Query` / mapping work?"* (`@DataJpaTest`); *"Is my JSON format right?"* (`@JsonTest`).
- **Integration:** *"Do layers work together with the real DB/broker, security and config?"* — a few **critical journeys** (create order → persisted → event published).
- **Don't** use `@SpringBootTest` for everything — it's the slowest and hides which layer broke.

### Q4. ⭐🟡 How does `@SpringBootTest` work? What are the `webEnvironment` options?
**In one line:** It boots the **full application context** (like production), optionally with a real web server, so you can test everything wired together.
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
                properties = "app.feature.new-checkout=true")
class OrderApiIT {
    @LocalServerPort int port;
    @Autowired TestRestTemplate rest;                                  // calls the real server over HTTP

    @Test void createsOrder() {
        ResponseEntity<OrderDto> res = rest.postForEntity("/api/v1/orders", new CreateOrderRequest(...), OrderDto.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }
}
```
| `webEnvironment` | Meaning |
|------------------|---------|
| **`MOCK`** (default) | Mock servlet environment (no real server) — use with `MockMvc` (`@AutoConfigureMockMvc`) |
| **`RANDOM_PORT`** | **Real embedded server on a random port** — real HTTP; avoids port clashes |
| `DEFINED_PORT` | Uses `server.port` (risk of conflicts) |
| `NONE` | No web environment (batch/CLI apps) |
**Also:** `classes = …` to limit the config, `@ActiveProfiles`, `@TestPropertySource`, `@Import`/`@TestConfiguration`. **Trap:** with `RANDOM_PORT`, the server runs on **other threads** → a test method's `@Transactional` does **not** wrap the request, and its rollback won't clean data (Q33).

### Q5. ⭐🔴 Why are my Spring tests slow? (context caching)
**In one line:** Spring **caches the `ApplicationContext` between tests** that share the **same configuration**; any difference creates a **new context (slow)**.

**What makes contexts differ (cache key):** config classes, `@ActiveProfiles`, `properties`/`@TestPropertySource`, `@MockitoBean/@MockBean` sets, `@DirtiesContext`, context customizers, web environment.
**Symptoms:** each test class takes seconds; logs show "Started Application" many times.
**Fixes:**
- Use **slice tests** instead of full contexts.
- **Standardise** test configuration: one abstract base class with the common annotations/containers; avoid scattering different `@MockBean` combinations (each unique set = new context).
- Avoid **`@DirtiesContext`** unless truly needed (it throws the cache away).
- Reuse **singleton Testcontainers** (Q34); run tests in **parallel** carefully (shared DB state!).
- Watch the log: `Started ... in x seconds` count per build.

### Q6. 🟢 JUnit 5 vs JUnit 4 — what changed?
| JUnit 4 | JUnit 5 (Jupiter) |
|---------|-------------------|
| `@Test`, `@Before/@After` | `@Test`, **`@BeforeEach/@AfterEach`**, `@BeforeAll/@AfterAll` |
| `@RunWith(SpringRunner.class)` | **`@ExtendWith(SpringExtension.class)`** (already included in `@SpringBootTest` & slices) |
| `@Ignore` | `@Disabled` |
| `@Rule` | Extensions (`@ExtendWith`) |
| Parameterized (clunky) | **`@ParameterizedTest`** (`@CsvSource`, `@MethodSource`, `@ValueSource`) |
| — | `@Nested`, `@DisplayName`, `@Tag`, `assertAll`, `assertThrows`, dynamic tests |
```java
@ParameterizedTest
@CsvSource({"100,10,90", "200,25,150"})
void applyDiscount(BigDecimal price, int percent, BigDecimal expected) {
    assertThat(calc.apply(price, percent)).isEqualByComparingTo(expected);
}
```

### Q7. 🟢 AssertJ vs Hamcrest vs JUnit assertions?
**AssertJ** (fluent, great IDE auto-complete, rich collection/exception/time assertions) is the usual choice:
```java
assertThat(orders).hasSize(2).extracting(Order::status).containsExactly(NEW, PAID);
assertThatThrownBy(() -> service.cancel(99L)).isInstanceOf(ResourceNotFoundException.class).hasMessageContaining("99");
assertThat(price).isEqualByComparingTo("10.00");            // BigDecimal: compare numerically, not by scale
```
Hamcrest matchers are used inside MockMvc (`jsonPath(...)`, `content().string(containsString(...))`); JUnit's `assertEquals` is fine for simple cases. Pick **one style** per codebase.

### Q8. 🟢 How do you structure and name tests?
- **Given–When–Then** (Arrange–Act–Assert); one behaviour per test; test **behaviour not implementation**.
- Names that read like specs: `shouldReturn404WhenOrderMissing()`, or `@DisplayName("cancelling a shipped order is rejected")`.
- Keep tests **independent** (no order dependency, no shared mutable state), **deterministic** (inject `Clock`, no random/time), **fast**; use **test data builders** (Q43) instead of long constructors.
- Test class naming: `*Test` (unit/slice, Surefire), `*IT` (integration, Failsafe) so CI can run them in stages.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; Next: [Unit Testing with JUnit 5 & Mockito →](#2-unit-testing-with-junit-5--mockito)

---

## 2. Unit Testing with JUnit 5 & Mockito

### Q9. ⭐🟢 How do you unit test a service with Mockito (`@Mock`, `@InjectMocks`, `@Spy`)?
```java
@ExtendWith(MockitoExtension.class)                       // no Spring context → milliseconds
class OrderServiceTest {

    @Mock OrderRepository repo;
    @Mock PaymentClient payments;
    @InjectMocks OrderService service;                    // constructed with the mocks (constructor injection first)

    @Test
    void placesOrderAndChargesPayment() {
        given(repo.save(any(Order.class))).willAnswer(inv -> inv.getArgument(0));      // BDDMockito
        given(payments.charge(any())).willReturn(PaymentResult.ok());

        Order result = service.place(new CreateOrderRequest(7L, List.of(line("A", 2))));

        assertThat(result.status()).isEqualTo(OrderStatus.PAID);
        then(payments).should().charge(argThat(p -> p.amount().compareTo(BigDecimal.TEN) > 0));
        then(repo).should().save(any(Order.class));
    }
}
```
| Annotation | Purpose |
|-----------|---------|
| `@Mock` | Fake collaborator (all methods return defaults/null) |
| `@InjectMocks` | Creates the class under test and injects mocks (constructor → setter → field) |
| `@Spy` | **Real** object with selective stubbing (partial mock) |
| `@Captor` | `ArgumentCaptor` to inspect arguments passed to a mock |
**Tip:** constructor injection (`spring-boot-core.md` Q11) makes `@InjectMocks` trivial — or just `new OrderService(repo, payments)` and skip the annotation.

### Q10. ⭐🟡 `@Mock` vs `@MockBean` / `@MockitoBean` — what's the difference?
| `@Mock` (Mockito) | `@MockitoBean` (Spring Framework 6.2 / Boot 3.4+) — formerly **`@MockBean`** |
|-------------------|----------------------------------------------------------------|
| Plain Mockito; **no Spring** | **Replaces/adds a bean in the Spring context** with a mock |
| Fast unit tests | Slice/integration tests (`@WebMvcTest`, `@SpringBootTest`) |
| Inject via `@InjectMocks`/constructor | Injected into the real beans by Spring |
```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;       // @MockBean in Boot < 3.4 (now deprecated)
}
```
**Traps:** every **distinct set of bean overrides creates a new cached context** → slower suite (Q5); `@MockitoSpyBean` replaces `@SpyBean`; don't mock the class under test.

### Q11. 🟡 How do you stub exceptions, void methods and consecutive calls?
```java
given(repo.findById(99L)).willReturn(Optional.empty());
given(client.fetch(any())).willThrow(new TimeoutException("slow"))        // 1st call throws
                          .willReturn(new Price(10));                      // 2nd call returns (retry test)
willThrow(new IllegalStateException()).given(emailSender).send(any());     // void method
willDoNothing().given(auditor).record(any());
```
**Verify interactions:** `then(mock).should(times(2)).method(...)`, `shouldHaveNoInteractions()`, `should(never())`, `InOrder`. **Capture:**
```java
ArgumentCaptor<Audit> captor = ArgumentCaptor.forClass(Audit.class);
then(auditRepo).should().save(captor.capture());
assertThat(captor.getValue().action()).isEqualTo("CANCELLED");
```

### Q12. 🟡 What are Mockito's strict stubs and `UnnecessaryStubbingException`?
With `MockitoExtension`, Mockito runs in **strict mode**: a stub that your code **never used** fails the test (`UnnecessaryStubbingException`) — it catches dead/misleading test setup. Fix by removing the stub or marking it `lenient().when(...)` when it's genuinely shared setup. Also reports **argument mismatch** (`PotentialStubbingProblem`) — your code called the mock with different args than stubbed.

### Q13. 🟡 What should you mock — and what should you not?
✅ **Mock** boundaries you don't own/control: HTTP clients, message producers, payment gateways, time (`Clock`), random, filesystem.
❌ **Don't mock** the class under test, **value objects/DTOs**, simple collections, or things easier to use for real (in-memory fakes). **Avoid over-mocking**: tests that mirror the implementation (verifying every internal call) break on refactor. Prefer **fakes** (e.g., in-memory repository) for complex collaborators and **real DB tests** (Q21/Q31) for persistence logic — mocking JPA proves nothing about queries.

### Q14. 🟡 Can you mock static methods, `final` classes or constructors?
**Yes (Mockito 5 uses the inline mock maker by default):** `mockStatic(UUID.class)`, `mockConstruction(...)`, mock `final` classes. Use **sparingly** — a smell that code depends on hidden globals. **Better design:** inject a `Clock`/`IdGenerator`/wrapper so tests need no static mocking. `mockStatic` is **thread-local** and must be closed (try-with-resources).

### Q15. 🟡 How do you test time-dependent code deterministically?
Inject a **`Clock`**:
```java
@Service class TokenService { private final Clock clock; Instant expiry() { return clock.instant().plusSeconds(900); } }

Clock fixed = Clock.fixed(Instant.parse("2026-01-01T10:00:00Z"), ZoneOffset.UTC);
TokenService svc = new TokenService(fixed);
assertThat(svc.expiry()).isEqualTo(Instant.parse("2026-01-01T10:15:00Z"));
```
Provide a `Clock` bean in production (`Clock.systemUTC()`), replace it in tests. Never use `Thread.sleep` or depend on "now".

### Q16. 🟢 How do you test exceptions and validation rules?
```java
assertThatThrownBy(() -> service.cancel(shippedOrderId))
        .isInstanceOf(BusinessRuleException.class)
        .hasMessage("Shipped orders cannot be cancelled");

// Bean Validation without Spring:
Validator v = Validation.buildDefaultValidatorFactory().getValidator();
Set<ConstraintViolation<CreateOrderRequest>> violations = v.validate(new CreateOrderRequest(null, List.of()));
assertThat(violations).extracting(c -> c.getPropertyPath().toString()).contains("customerId", "lines");
```
Test **boundaries** (min/max/empty/null) with `@ParameterizedTest`.

### Q17. 🟡 How do you test private methods?
**Don't** — test them **through the public API**. If a private method is complex enough to need its own tests, it's a sign to **extract a class** with a public (package-private) method. Avoid reflection hacks (`ReflectionTestUtils` is for setting `@Value` fields/state in rare cases).

### Q18. 🟡 How do you write parameterised and data-driven tests well?
`@ParameterizedTest` with `@CsvSource` (small tables), `@MethodSource` (objects/builders), `@EnumSource`, `@NullAndEmptySource`; give cases readable names (`name = "{0} → {1}"`). Use for **rules with many inputs** (tax, discounts, validation, state-machine transitions). Avoid hiding logic inside the test (loops/ifs) — the test must be simpler than the code under test.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Fundamentals](#1-testing-fundamentals-in-spring-boot) &nbsp;|&nbsp; Next: [Slice Tests →](#3-slice-tests)

---

## 3. Slice Tests

### Q19. ⭐🟡 What is `@WebMvcTest` and what does it load?
**In one line:** A **web-layer slice**: loads only **controllers, `@ControllerAdvice`, filters, converters, `WebMvcConfigurer`** and provides **`MockMvc`** — **not** `@Service`/`@Repository`/`@Component` beans (you mock those).

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;                                      // required: controller dependency

    @Test void getsOrder() throws Exception {
        given(service.find(7L)).willReturn(new OrderDto(7L, "NEW", BigDecimal.TEN, List.of()));
        mvc.perform(get("/api/v1/orders/7").accept(MediaType.APPLICATION_JSON))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.id").value(7))
           .andExpect(jsonPath("$.status").value("NEW"));
    }

    @Test void rejectsInvalidBody() throws Exception {
        mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON).content("""
                { "customerId": null, "lines": [] }"""))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.errors.customerId").exists());
    }
}
```
**What to test here:** routing, **validation**, status codes, JSON (de)serialization, **exception mapping** (`@RestControllerAdvice`), content negotiation, headers (`Location`), security rules. **Common error:** `NoSuchBeanDefinitionException` → you forgot to `@MockitoBean` a dependency (or `@Import` a needed config). Details of MockMvc usage: `spring-boot-rest-api.md` Q54.

### Q20. ⭐🟡 How do you test a secured controller in `@WebMvcTest`?
Security auto-configuration is **active**: default = everything secured + **CSRF on** → unexpected 401/403.
```java
@WebMvcTest(AdminController.class)
@Import(SecurityConfig.class)                      // load YOUR SecurityFilterChain (otherwise Boot's default applies)
class AdminControllerSecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean AdminService service;

    @Test void anonymousGets401() throws Exception { mvc.perform(get("/admin/users")).andExpect(status().isUnauthorized()); }

    @Test @WithMockUser(roles = "USER")
    void userGets403() throws Exception { mvc.perform(delete("/admin/users/1").with(csrf())).andExpect(status().isForbidden()); }

    @Test @WithMockUser(roles = "ADMIN")
    void adminOk() throws Exception { mvc.perform(delete("/admin/users/1").with(csrf())).andExpect(status().isNoContent()); }

    @Test void jwtScope() throws Exception {
        mvc.perform(get("/orders").with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_orders.read")))).andExpect(status().isOk());
    }
}
```
Needs `spring-security-test`. **Remember:** write **negative** tests (401/403) and ownership (IDOR) tests. More: `spring-security.md` Q63.

### Q21. ⭐🟡 What is `@DataJpaTest` and what does it configure?
**In one line:** A **JPA slice** — scans **`@Entity` classes and Spring Data repositories**, configures `EntityManager`/`TestEntityManager`, runs **Flyway/Liquibase**, and **rolls back each test**; by default it **replaces your DataSource with an embedded DB** (H2).
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)    // use the real DB type (Testcontainers) — recommended
@Testcontainers
class OrderRepositoryTest {
    @Container @ServiceConnection static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16");

    @Autowired OrderRepository repo;
    @Autowired TestEntityManager em;

    @Test void findsByStatus() {
        em.persist(new Order("NEW")); em.persist(new Order("PAID"));
        em.flush(); em.clear();                                     // hit the DB; don't read from the L1 cache
        assertThat(repo.findByStatus("NEW")).hasSize(1);
    }
}
```
**Use it for:** derived queries, `@Query`/native queries, **mappings/cascades**, constraints, `Specification`s, pagination, **N+1 query counts**. **Traps:** forgetting `flush()/clear()` (test passes without touching SQL); H2 differences from production (Q32); services aren't loaded (`@Import` them if needed). See `spring-data-jpa.md` Q91.

### Q22. 🟡 How do you assert the number of SQL queries (catch N+1 in tests)?
```properties
spring.jpa.properties.hibernate.generate_statistics=true
```
```java
@Autowired EntityManagerFactory emf;
Statistics stats = emf.unwrap(SessionFactory.class).getStatistics();
stats.clear();
service.listDepartmentsWithEmployees();
assertThat(stats.getPrepareStatementCount()).isLessThanOrEqualTo(2);       // not 101
```
Or use **datasource-proxy / `hypersistence-utils` `SQLStatementCountValidator`**. A **query-count assertion** turns N+1 from a production surprise into a failing test (`spring-data-jpa.md` Q68).

### Q23. 🟡 What does `@JsonTest` do?
Slice for **JSON serialization/deserialization** with the Boot-configured `ObjectMapper`; provides `JacksonTester<T>`:
```java
@JsonTest
class OrderDtoJsonTest {
    @Autowired JacksonTester<OrderDto> json;
    @Test void serializes() throws Exception {
        assertThat(json.write(new OrderDto(7L, "NEW", BigDecimal.TEN, List.of())))
            .hasJsonPathNumberValue("$.id").extractingJsonPathStringValue("$.status").isEqualTo("NEW");
    }
}
```
Use to lock down **API contract format** (dates, naming, nulls, enums) without starting MVC.

### Q24. 🟡 How do you test `RestClient`/`RestTemplate` code? (`@RestClientTest`, `MockRestServiceServer`, WireMock)
```java
@RestClientTest(InventoryClient.class)
class InventoryClientTest {
    @Autowired InventoryClient client;
    @Autowired MockRestServiceServer server;

    @Test void parsesStock() {
        server.expect(requestTo("/stock/ABC")).andRespond(withSuccess("""
               {"sku":"ABC","qty":5}""", MediaType.APPLICATION_JSON));
        assertThat(client.stock("ABC").qty()).isEqualTo(5);
    }
    @Test void mapsServerError() {
        server.expect(requestTo("/stock/ABC")).andRespond(withServerError());
        assertThatThrownBy(() -> client.stock("ABC")).isInstanceOf(DownstreamException.class);
    }
}
```
**WireMock** (real HTTP stub server) is better for **timeouts, retries, circuit-breaker and fault injection** (`aResponse().withFixedDelay(5000)`, `Fault.CONNECTION_RESET_BY_PEER`). Test your **resilience config** against these faults, not just happy paths.

### Q25. 🟡 What other slice annotations exist?
`@WebFluxTest` (+ `WebTestClient`), `@JdbcTest`, `@DataJdbcTest`, `@DataMongoTest`, `@DataRedisTest`, `@DataElasticsearchTest`, `@JooqTest`, `@RestClientTest`, `@JsonTest`, `@WebMvcTest`, `@DataJpaTest`. Each loads only the **auto-configurations for that layer** (via `@AutoConfigure…`), making tests faster and failures easier to localise. Combine with `@Import` for extra beans.

### Q26. 🟡 How do you add or override beans just for a test? (`@TestConfiguration`, `@Import`)
```java
@TestConfiguration
class FixedClockConfig {
    @Bean @Primary Clock clock() { return Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC); }
}

@SpringBootTest @Import(FixedClockConfig.class) class ExpiryIT { ... }
```
`@TestConfiguration` classes are **not** picked up by component scanning of the main app (opt-in via `@Import`, or as a **static nested class** inside the test). Use it for fake clocks, in-memory fakes, test-only controllers, `RestClient` pointing to WireMock.

### Q27. 🟡 How do you set properties/profiles in tests?
- `@SpringBootTest(properties = "app.timeout=1s")`, `@TestPropertySource(properties = {...})`/`locations`.
- `@ActiveProfiles("test")` → loads `application-test.yml`.
- **`@DynamicPropertySource`** for **runtime values** (container URLs/ports):
```java
@DynamicPropertySource
static void props(DynamicPropertyRegistry r) { r.add("spring.datasource.url", pg::getJdbcUrl); r.add("wiremock.url", wm::baseUrl); }
```
Keep a small `src/test/resources/application-test.yml`; avoid copying the whole production config.

### Q28. 🟡 How do you test exception handlers and error responses?
Slice test with a controller that throws, asserting the **ProblemDetail** body:
```java
given(service.find(99L)).willThrow(new ResourceNotFoundException("order 99"));
mvc.perform(get("/api/v1/orders/99"))
   .andExpect(status().isNotFound())
   .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
   .andExpect(jsonPath("$.title").value("Resource not found"))
   .andExpect(jsonPath("$.code").value("ORDER_NOT_FOUND"));
```
Cover **validation (400)**, **conflict (409)**, **business rule (422)**, **unexpected (500 with generic message and no stack trace)**, and **filters** (exceptions in filters bypass `@ControllerAdvice` — test them separately).

### Q29. 🟡 `MockMvc` vs `WebTestClient` vs `TestRestTemplate` — which should I use?
| Tool | Server | Use |
|------|--------|-----|
| **`MockMvc`** | **No real server** (servlet mock) | Fast controller/advice/validation/security tests |
| **`WebTestClient`** | Real server (RANDOM_PORT) **or** bound to controllers; works with MVC & WebFlux | Fluent assertions; reactive apps |
| **`TestRestTemplate`** | Real server | Simple full-stack HTTP checks (no redirects follow by default config tweaks needed) |
Prefer **MockMvc slices** for most controller logic; a **few** real-HTTP tests for the full stack (serialization over the wire, filters, compression, security chain).

### Q30. 🟡 What are common errors when writing slice tests, and how do you fix them?
| Error | Cause → Fix |
|-------|-------------|
| `NoSuchBeanDefinitionException` for a service | Slice doesn't load it → `@MockitoBean` or `@Import` |
| 401/403 in `@WebMvcTest` | Security active → `@WithMockUser`, `.with(csrf())`, `@Import(SecurityConfig.class)` |
| `Unable to find a @SpringBootConfiguration` | Test class not under the main package → move it or set `classes=` |
| Test passes but SQL never ran (`@DataJpaTest`) | No `flush()/clear()` |
| H2 vs production SQL differences | Use Testcontainers (Q32) |
| Different tests → many context startups | Inconsistent `@MockBean`/properties (Q5) |
| `LazyInitializationException` only in prod | Tests share one open persistence context (Q33) |

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Unit Testing](#2-unit-testing-with-junit-5--mockito) &nbsp;|&nbsp; Next: [Integration Tests & Testcontainers →](#4-integration-tests--testcontainers)

---

## 4. Integration Tests & Testcontainers

### Q31. ⭐🟡 What is Testcontainers and how do you use it with Spring Boot?
**In one line:** A library that starts **real services (PostgreSQL, Kafka, Redis, MongoDB…) in Docker containers** for your tests, so you test against the **real thing**.

```java
@SpringBootTest
@Testcontainers
class OrderFlowIT {

    @Container @ServiceConnection                                          // Boot 3.1+: auto-wires the datasource URL/credentials
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Container @ServiceConnection
    static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("apache/kafka:3.8.0"));

    @Autowired OrderService service;

    @Test void persistsAndPublishes() { /* real DB + real broker */ }
}
```
- **`@ServiceConnection`** (Boot 3.1+) replaces most manual `@DynamicPropertySource` wiring; supports JDBC, Kafka, Redis, Mongo, Rabbit, Elasticsearch, etc.
- Requires a **Docker-compatible runtime** in CI (GitHub Actions, GitLab runners with DinD, Testcontainers Cloud).
- Gives **production parity**: dialect, constraints, locking, JSON types, extensions, Kafka semantics.

### Q32. ⭐🟡 H2 (in-memory) vs a real database in tests — which is better?
| H2/embedded | Real DB via Testcontainers |
|-------------|---------------------------|
| ✅ Fast startup, no Docker | ⏳ Container start (seconds; reusable) |
| ❌ **Different SQL dialect/behaviour** (JSON, enums, `ON CONFLICT`, window functions, native queries, locking/isolation, case sensitivity) | ✅ **Same engine as production** |
| ❌ Tests pass, production fails | ✅ Catches real migration/constraint/query issues |
| OK for trivial CRUD | **Recommended for anything non-trivial** |
**Answer pattern:** *"I use Testcontainers with the production DB type, run Flyway migrations in tests, and keep a few fast unit tests for logic."*

### Q33. ⭐🔴 Why can `@Transactional` on a test method hide production bugs?
Spring wraps a `@Transactional` **test** in a transaction that is **rolled back at the end** — so:
- **Commit never happens** → flush/constraint violations at commit, `@TransactionalEventListener(AFTER_COMMIT)` handlers, outbox relays and `afterCommit` hooks **never run**.
- One **persistence context** for the whole test → `LazyInitializationException`, L1-cache staleness and `REQUIRES_NEW` visibility problems are **masked**.
- With `RANDOM_PORT`, requests run on **server threads**, so the test transaction **doesn't apply** at all (and rollback won't clean data).
**Fix:** for commit-sensitive behaviour use **`@Commit`**, run **without** `@Transactional` and **clean data explicitly** (`@Sql`, `TRUNCATE`, per-test containers/DB schema), call **`flush()/clear()`**, or use `TransactionTemplate` inside the test. Full discussion: `spring-boot-transactions.md` Q55.

### Q34. 🟡 How do you keep Testcontainers fast? (singleton containers, reuse)
- **Singleton container pattern:** start containers **once per JVM** in an abstract base class (`static` + `start()`), share across all test classes.
```java
abstract class AbstractIntegrationTest {
    static final PostgreSQLContainer<?> PG = new PostgreSQLContainer<>("postgres:16-alpine").withReuse(true);
    static { PG.start(); }                                                      // Ryuk stops it at JVM exit
    @DynamicPropertySource static void props(DynamicPropertyRegistry r) { r.add("spring.datasource.url", PG::getJdbcUrl); /* … */ }
}
```
- `testcontainers.reuse.enable=true` (in `~/.testcontainers.properties`) keeps containers between local runs (dev only).
- Use **lightweight images** (alpine), preloaded in CI cache; run **migrations once**; **isolate data per test** by truncation or unique ids rather than new containers.
- Share **one Spring context** (consistent config — Q5).

### Q35. 🟡 How do you seed and clean test data?
- **`@Sql("/db/orders.sql")`** (before/after, `executionPhase`), or **Flyway test migrations** (`src/test/resources/db/testdata`).
- **Test data builders / factories** in code (Q43) — typed, refactor-safe.
- **Cleanup:** truncate tables in `@AfterEach` (fast `TRUNCATE … RESTART IDENTITY CASCADE`), or unique data per test (random ids) so tests are **independent and parallel-safe**. Avoid depending on data left by other tests.

### Q36. ⭐🟡 How do you test asynchronous behaviour (`@Async`, events, Kafka consumers)?
**Never `Thread.sleep`** — it's slow and flaky. Use **Awaitility** to poll until the condition holds:
```java
kafkaTemplate.send("orders", "o-1", new OrderEvent("o-1"));
await().atMost(Duration.ofSeconds(10)).pollInterval(Duration.ofMillis(200))
       .untilAsserted(() -> assertThat(paymentRepo.findByOrderId("o-1")).isPresent());
```
- For `@Async`, either **await** the effect, return/join a `CompletableFuture`, or replace the executor with a **synchronous one** in test config (`SyncTaskExecutor`).
- For `@TransactionalEventListener(AFTER_COMMIT)` the test must **commit** (Q33).
- Test **idempotency** by sending the **same message twice** and asserting one effect; test **DLT** by sending a poison payload.

### Q37. 🟡 How do you test scheduled jobs?
Don't wait for the cron. **Call the method directly** (it's just a method) with a fixed `Clock`; test the **cron expression separately** (`CronExpression.parse("0 0 2 * * *").next(…)`); for the **wiring** assert the `@Scheduled` annotation/`ScheduledTaskRegistrar` or use `Awaitility` with `fixedDelay` = small value via test properties (`@SpringBootTest(properties = "jobs.report.delay=100ms")`). Make jobs **idempotent** and test **concurrent execution** guards (ShedLock) separately.

### Q38. 🟡 How do you test external HTTP dependencies end-to-end? (WireMock)
```java
@SpringBootTest
@WireMockTest(httpPort = 8089)                                      // WireMock JUnit 5 extension
class PricingIntegrationTest {
    @Test void fallsBackWhenPricingServiceFails() {
        stubFor(get("/price/ABC").willReturn(serverError().withFixedDelay(500)));
        assertThat(service.priceFor("ABC")).isEqualTo(Price.cachedDefault());       // circuit breaker/fallback verified
        verify(moreThan(0), getRequestedFor(urlEqualTo("/price/ABC")));
    }
}
```
Point the client's base URL to WireMock via properties. Verify **timeouts, retries, circuit-breaker open state, error mapping** — the behaviours mocks can't prove.

### Q39. 🟡 What is `@DirtiesContext` and when should you avoid it?
It tells Spring the test **modified the context** (e.g., changed singleton state or schema) → context is **closed and recreated** (slow, kills the cache). Use rarely: prefer **resetting state** (clear caches, truncate tables, reset mocks via `@MockitoBean` auto-reset, `RefreshScope`) over restarting the whole app. If many tests need it, redesign for **test isolation**.

### Q40. 🟡 How do you test Kafka consumers/producers? (summary)
**Unit:** call listener methods directly; mock `KafkaTemplate`. **Integration:** **Testcontainers Kafka** (`@ServiceConnection`) or `@EmbeddedKafka`; produce → **Awaitility** → assert DB/state; test **retries/DLT**, **poison pills**, **idempotent duplicate handling**, **ordering by key**. Full guidance: `spring-boot-microservices-kafka.md` Q53.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Slice Tests](#3-slice-tests) &nbsp;|&nbsp; Next: [Strategy, Speed & Scenarios →](#5-strategy-speed--scenarios)

---

## 5. Strategy, Speed & Scenarios

### Q41. ⭐🔴 What is contract testing? Spring Cloud Contract vs Pact?
**In one line:** Verifies that **provider and consumer agree on the API/event shape**, catching **breaking changes before deployment** without running every service together.

**Explained simply (analogy — a written agreement):** Instead of both parties meeting every time to check, each side tests against the **signed contract** independently.
| | **Spring Cloud Contract** | **Pact** |
|---|---------------------------|----------|
| Direction | **Provider-driven** (provider writes contracts; generates tests + **stubs** for consumers) | **Consumer-driven** (consumers record expectations; provider verifies) |
| Format | Groovy/YAML/Kotlin DSL | JSON pact files + **Pact Broker** |
| Languages | JVM-centric (Spring-friendly) | Polyglot |
| Messaging | ✅ (Kafka/Rabbit) | ✅ |
**Flow (Pact):** consumer test generates a pact → published to broker → provider CI **verifies** it → `can-i-deploy` gate. **Why it matters:** replaces fragile **end-to-end environments**; supports independent deployments in microservices (`spring-boot-microservices-kafka.md` Q20). Include **event schema** compatibility checks (Schema Registry) for async messages.

### Q42. 🟡 How do you test proxy-based features (`@Transactional`, `@Cacheable`, `@Async`, method security)?
These need the **Spring proxies**, so a plain unit test (`new Service()`) **won't exercise them**. Use a **context** (`@SpringBootTest`/focused `@SpringJUnitConfig`) and call the bean **through the container**:
```java
@SpringBootTest(classes = {ProductService.class, CacheConfig.class})
class ProductCacheTest {
    @Autowired ProductService service;
    @MockitoBean ProductRepository repo;

    @Test void cachesResult() {
        given(repo.findById(1L)).willReturn(Optional.of(product));
        service.get(1L); service.get(1L);
        then(repo).should(times(1)).findById(1L);                          // second call served from cache
    }
}
```
Also test the **negative**: **self-invocation is not advised** (`spring-aop.md` Q31), rollback on runtime vs checked exception (`spring-boot-transactions.md` Q15), `@PreAuthorize` denial (`@WithMockUser`). Verify transactions with **real DB** + `TransactionSynchronizationManager.isActualTransactionActive()` or by asserting rollback effects.

### Q43. 🟡 What are test data builders / Object Mother and why use them?
Reusable factories that create **valid default objects** you tweak per test — keeps tests short and resilient to constructor changes.
```java
public class OrderBuilder {
    private Long customerId = 1L; private OrderStatus status = NEW; private List<Line> lines = List.of(Line.of("SKU1", 1));
    public static OrderBuilder anOrder() { return new OrderBuilder(); }
    public OrderBuilder shipped() { this.status = SHIPPED; return this; }
    public OrderBuilder withLines(Line... l) { this.lines = List.of(l); return this; }
    public Order build() { return new Order(customerId, status, lines); }
}
Order shipped = anOrder().shipped().build();           // reads like the test's intent
```
Avoid giant shared fixtures and JSON blobs duplicated across tests; use **unique values** (UUIDs) to prevent collisions in shared DBs.

### Q44. 🟡 What are architecture tests (ArchUnit) and Spring Modulith tests?
**ArchUnit** unit-tests **architecture rules**:
```java
@ArchTest static final ArchRule controllers_do_not_access_repositories =
    noClasses().that().resideInAPackage("..controller..").should().dependOnClassesThat().resideInAPackage("..repository..");
@ArchTest static final ArchRule no_field_injection = noFields().should().beAnnotatedWith(Autowired.class);
```
**Spring Modulith** verifies module boundaries (`ApplicationModules.of(App.class).verify()`) and supports **module-level integration tests** and event publication tests. Great for keeping a **modular monolith** from rotting, and for enforcing layering/package rules in CI.

### Q45. ⭐🔴 What causes flaky tests and how do you fix them?
| Cause | Fix |
|-------|-----|
| `Thread.sleep`, timing/races with async | **Awaitility**; synchronise on events/futures (Q36) |
| Shared state: static fields, DB data, caches, singletons | Isolate/clean per test; unique data; reset caches |
| **Test order dependence** | Make tests independent; `@TestMethodOrder` is a smell |
| Time/date/random/locale/time zone | Inject `Clock`, seed randoms, set explicit zone/locale |
| Real external services/network | **WireMock/Testcontainers**; no calls to the internet |
| Port conflicts | `RANDOM_PORT`, container-assigned ports |
| Parallel execution with shared DB | Per-test schema/unique ids or serialize |
| Resource limits in CI (slow containers, CPU) | Generous but bounded timeouts; health-wait strategies on containers |
| Hash ordering/`HashMap`/`Set` assumptions | Assert order-insensitively (`containsExactlyInAnyOrder`) |
| Leaked threads/context from `@DirtiesContext` misuse | Fix lifecycle; close resources |
**Process:** **quarantine** flakies with a tag, track them, fix root causes — never "retry until green" as a policy.

### Q46. ⭐🟡 How do you speed up a slow Spring Boot test suite?
1. **Push logic to unit tests** (no Spring) — the biggest win (Q1).
2. Use **slice tests** instead of `@SpringBootTest` where possible.
3. **Maximise context caching** — consistent annotations/properties/mocks; a shared abstract base (Q5); avoid `@DirtiesContext`.
4. **Singleton Testcontainers** (+ reuse locally, preloaded images in CI) (Q34).
5. **Parallel test execution** (JUnit `junit.jupiter.execution.parallel.enabled`) with isolated data; split suites across CI shards.
6. **Lazy initialization** in tests (`spring.main.lazy-initialization=true`) when safe; disable unneeded auto-config (`spring.autoconfigure.exclude` in test profile).
7. Faster dependencies: **Hikari small pool**, `hibernate.ddl-auto=none` with Flyway migrations **once**, skip heavy startup hooks via profiles.
8. Measure: build scans (Gradle), Surefire reports, count "Started … in" lines.

### Q47. 🟡 Is 100% code coverage the goal? What are JaCoCo and mutation testing?
**Coverage ≠ quality.** **JaCoCo** reports **which lines/branches ran**, not whether assertions are meaningful. Aim for **high coverage on business logic and risky code** with **meaningful assertions**; don't chase numbers on getters/config. **Mutation testing (PIT)** changes your code (flips conditions, removes calls) and checks if tests **fail** — a stronger signal that tests really verify behaviour. Set **coverage gates** in CI sensibly (e.g., ≥ 80% on new code) and review **branch** coverage for complex logic.

### Q48. ⭐🟡 Scenario: "You add a new `POST /orders` endpoint — what tests do you write?"
| Level | Tests |
|-------|-------|
| **Unit (service)** | Happy path computes totals/status; each **business rule** (out of stock, invalid state); repository/clients **interactions** (Mockito); **idempotency key** reuse; exceptions & rollback intent |
| **Slice (`@WebMvcTest`)** | **201 + `Location`**; **400** validation errors per field; **409/422** mapping via advice; **401/403** (security); JSON shape (ProblemDetail); content-type 415; size limits |
| **Slice (`@DataJpaTest`)** | Mapping/cascade, unique constraints, repository queries, N+1/**query count** |
| **Integration (Testcontainers)** | **Real DB + migrations**: order saved, outbox row written in the **same transaction**, event published; **duplicate request** → one order; concurrency (optimistic lock) |
| **Contract** | Request/response contract with consumers; event schema compatibility |
| **Non-functional** | Basic load/latency check, timeouts/circuit breaker with WireMock faults |

### Q49. 🟡 Scenario: "Tests pass locally but fail in CI." — what do you check?
- **Environment:** Docker unavailable/limited for Testcontainers; different JDK/timezone/locale/OS (case-sensitive filenames, line endings); fewer CPUs → timing sensitivity.
- **Ordering/parallelism:** CI runs tests in a different order or in parallel → shared state exposes bugs.
- **Stale/untracked files**, generated sources, missing env vars/secrets, **ports** in use.
- **Dependence on current date/time** or network access; **flaky async** tests (use Awaitility with generous timeouts).
- **Resource exhaustion** (memory, connections, `@DirtiesContext` leaks).
- Reproduce with the same command (`mvn -B verify`), same container images, and CI-like constraints; upload **test reports/logs** as artifacts.

### Q50. ⭐🟢 Explain your Spring Boot testing strategy in 60 seconds (project-style answer).
> "I follow the **test pyramid**: lots of fast **unit tests** with JUnit 5, Mockito and AssertJ for business logic; **slice tests** — `@WebMvcTest` for validation, status codes, `ProblemDetail` and security (`@WithMockUser`/`jwt()`), `@DataJpaTest` for queries and mappings; and a smaller set of **integration tests with Testcontainers** using the same database and Kafka as production, with Flyway migrations and `@ServiceConnection`.
> I avoid H2 for non-trivial persistence, remember that **`@Transactional` tests roll back and hide commit-time bugs**, and use **Awaitility** instead of sleeps for async/Kafka. I add **query-count assertions** to catch N+1, **WireMock** to test timeouts and circuit breakers, **contract tests** for service boundaries and **idempotency/duplicate** tests for consumers. I keep suites fast with context caching, singleton containers and slice tests, treat flaky tests as bugs, and use JaCoCo plus mutation testing as signals — not goals."

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Integration Tests & Testcontainers](#4-integration-tests--testcontainers)

---

## ✅ Last-minute cheat sheet

| Topic | One-liner to remember |
|-------|----------------------|
| Pyramid | Many unit → some slice/integration → few E2E |
| `spring-boot-starter-test` | JUnit 5, Mockito, AssertJ, Hamcrest, JsonPath, Spring Test, Awaitility |
| `@SpringBootTest` | Full context; `RANDOM_PORT` for real HTTP |
| Context caching | Same config ⇒ reused; different mocks/properties ⇒ new context (slow) |
| `@Mock` vs `@MockitoBean` | Plain Mockito (no Spring) vs bean override in the Spring context |
| `@WebMvcTest` | Web slice + MockMvc; mock services; security/CSRF apply |
| `@DataJpaTest` | JPA slice, rolls back, `flush()/clear()`, use real DB via Testcontainers |
| Testcontainers | Real DB/Kafka in Docker; `@ServiceConnection`; singleton for speed |
| H2 vs real DB | H2 hides dialect/locking/JSON issues |
| `@Transactional` test | Rolls back → hides commit/lazy/async bugs |
| Async tests | Awaitility, never `Thread.sleep` |
| External HTTP | WireMock: delays, faults, retries, circuit breaker |
| Contract tests | Pact (consumer-driven) / Spring Cloud Contract (provider-driven) |
| Flaky tests | Time, shared state, async, order, network — fix root cause |
| Speed | Unit + slices + cached contexts + singleton containers |
| Coverage | Signal, not goal; add mutation testing |

## 🎤 How to answer in an interview (template)
1. **One-line definition** (what the annotation/tool does).
2. **Why/when** (analogy: slice = testing one room instead of the whole house).
3. **Tiny example.**
4. **The trap** (context caching, rollback masking, H2 differences, sleeps).
5. **What you do in real projects** (pyramid, Testcontainers, query counts, contracts).

## 📚 References
- [roadmap.sh – Spring Boot Interview Questions](https://roadmap.sh/questions/spring-boot) · [Coding Shuttle – 100 Spring Boot Questions](https://www.codingshuttle.com/blogs/100-spring-boot-interview-questions-with-answers-for-2-to-5-years-experienced-java-developers)
- [Spring Boot – Testing](https://docs.spring.io/spring-boot/reference/testing/index.html)
- [Spring Framework – Testing](https://docs.spring.io/spring-framework/reference/testing.html)
- [Testcontainers for Java](https://java.testcontainers.org/) · [Mockito](https://site.mockito.org/) · [AssertJ](https://assertj.github.io/doc/) · [Awaitility](http://www.awaitility.org/)
- [WireMock](https://wiremock.org/) · [Pact](https://docs.pact.io/) · [Spring Cloud Contract](https://spring.io/projects/spring-cloud-contract) · [ArchUnit](https://www.archunit.org/)

---
title: Spring AOP Interview Questions & Answers
layout: docs
category: spring-boot
tags: [spring-aop, aspectj, proxy, cglib, pointcut, advice, transactional, interview]
level: junior-to-senior
questions: 52
---

# Spring AOP — Interview Questions & Answers

> **52 questions**: AOP concepts and terminology, pointcut expressions, the five advice types, **proxy internals (JDK vs CGLIB)**, the **self-invocation trap**, advice/aspect ordering, real-world aspects (logging, audit, rate limit, retry), "why isn't my aspect firing?" and AOP vs filters/interceptors.
> Every answer follows the same pattern: **In one line** → **Explained simply** (analogy) → **Example / code** → **Interview tip / trap / follow-up**.
> Sources consolidated: CodeBegun (Spring AOP, read in full), Javarevisited (Spring AOP questions), Medium (Mehar Chand — AOP questions), Spring Framework reference docs, plus real interview scenarios.
> *(The Medium and Javarevisited pages could not be opened automatically — they are covered from the standard AOP question set plus the CodeBegun page, which was read fully.)*

**Legend:** 🟢 Easy &nbsp;|&nbsp; 🟡 Medium &nbsp;|&nbsp; 🔴 Hard &nbsp;|&nbsp; ⭐ Must-know (asked very often)

> 📎 **Why AOP matters for the whole Spring stack:** `@Transactional`, `@Cacheable`, `@Async`, `@PreAuthorize`, `@Retryable` and `@Validated` are all **AOP proxies**. Understanding this page explains the traps on `spring-boot-transactions.md` and `spring-security.md`.
> **Companion pages:** `spring-boot-core.md` · `spring-boot-transactions.md` · `spring-security.md` · `spring-boot-testing.md`

---

## 📑 On this page

| # | Section | Questions |
|---|---------|-----------|
| 1 | [AOP Fundamentals](#1-aop-fundamentals) | Q1 – Q10 |
| 2 | [Pointcut Expressions](#2-pointcut-expressions) | Q11 – Q18 |
| 3 | [Advice in Depth & Ordering](#3-advice-in-depth--ordering) | Q19 – Q28 |
| 4 | [Proxies & Internals](#4-proxies--internals) | Q29 – Q38 |
| 5 | [Real-World Aspects & Scenarios](#5-real-world-aspects--scenarios) | Q39 – Q52 |

**Quick revision — top 12 ⭐:** Q1 (what is AOP) · Q2 (terminology) · Q3 (Spring AOP vs AspectJ) · Q5 (advice types) · Q11 (`execution` syntax) · Q19 (`@Around` timing aspect) · Q23 (advice order) · Q29–30 (proxy, JDK vs CGLIB) · Q31 (self-invocation) · Q36 (annotations built on AOP) · Q44 (AOP vs Filter vs Interceptor) · Q45 (aspect not firing checklist)

---

## 1. AOP Fundamentals

### Q1. ⭐🟢 What is AOP and what problem does it solve?
**In one line:** **Aspect-Oriented Programming** separates **cross-cutting concerns** (logging, security, transactions, caching, metrics) from business logic, so you write each concern **once** and apply it **declaratively** to many methods.

**Explained simply (analogy — airport security):** Every passenger (method) must pass the **same security check**. You don't ask each airline (class) to build its own scanner — you put **one checkpoint** at the entrance and apply it to everyone. The airline just focuses on flying (business logic).

**Without AOP (repeated everywhere):**
```java
public Order placeOrder(Order o) {
    log.info("placeOrder start");
    long t = System.nanoTime();
    try {
        checkPermission();
        tx.begin();
        Order saved = repo.save(o);
        tx.commit();
        return saved;
    } catch (Exception e) { tx.rollback(); log.error("fail", e); throw e; }
    finally { log.info("took {} ms", (System.nanoTime() - t) / 1_000_000); }
}
```
**With AOP:** the method contains **only** `return repo.save(o);` — logging, timing, security and the transaction are applied from outside.
**Benefits:** less duplication, one place to change a concern, cleaner business code, consistent behaviour. **Cost:** "magic" (hidden behaviour), proxy limitations (Q31), debugging stack traces get longer.

### Q2. ⭐🟢 Explain the core AOP terminology.
**In one line:** **Aspect** (the module) contains **advice** (what to do) that applies at **join points** (where) selected by a **pointcut** (filter), connected to the target via **weaving**.

| Term | Meaning | Example |
|------|---------|---------|
| **Aspect** | A class bundling a cross-cutting concern | `LoggingAspect` (`@Aspect`) |
| **Join point** | A **point in execution** where advice *could* apply. In **Spring AOP it is always a method execution** | `OrderService.placeOrder()` call |
| **Pointcut** | An **expression that selects** join points | `execution(* com.app.service.*.*(..))` |
| **Advice** | The **action** taken at a selected join point | `@Before`, `@Around` method body |
| **Target object** | The real bean being advised | the actual `OrderService` |
| **Proxy** | The object Spring creates that **wraps the target** and runs advice | CGLIB subclass of `OrderService` |
| **Weaving** | Linking aspects with targets. Spring does it at **runtime via proxies**; AspectJ can weave at compile/load time | — |
| **Advisor** | Spring's pairing of one pointcut + one advice | `@Transactional` = `TransactionInterceptor` + pointcut |
| **Introduction** | Adding new interfaces/methods to a target (`@DeclareParents`) | rarely used |

**Interview tip (very common slip):** **Join point ≠ pointcut.** *Join point = a candidate location* (every method is one). *Pointcut = a filter that selects some of them.* The **aspect contains both** the pointcut and the advice.

### Q3. ⭐🟡 Spring AOP vs AspectJ — what's the difference?
**In one line:** **Spring AOP** = simple, **runtime, proxy-based**, only **method execution on Spring beans**. **AspectJ** = full-featured AOP with **bytecode weaving** that can advise almost anything.

| | Spring AOP | AspectJ |
|---|-----------|---------|
| Weaving | **Runtime** (proxies) | **Compile-time / post-compile / load-time** (bytecode) |
| Join points | **Method execution only** | Method call/execution, **constructors, field get/set**, static init, exception handlers… |
| Targets | **Spring-managed beans only** | **Any Java object**, even non-Spring |
| `final`/`private`/`static` methods | ❌ Not advised | ✅ Can be advised |
| Self-invocation | ❌ Not advised (Q31) | ✅ Works (woven into class) |
| Setup | Easy (`spring-boot-starter-aop`) | Needs weaver/agent (`aspectj-maven-plugin`, `-javaagent`) |
| Performance | Slight proxy overhead per call | Faster at runtime (no proxy) |
**Key point:** Spring **reuses AspectJ's annotations (`@Aspect`, `@Before`…) and pointcut language**, but its **default engine is proxy-based** — sharing the syntax does **not** give AspectJ's power.
**Choose AspectJ** when you must advise constructors/fields/final/non-Spring objects or need self-invocation to work; otherwise Spring AOP is enough.

### Q4. 🟡 What are the types of weaving?
- **Compile-time weaving (CTW):** AspectJ compiler (`ajc`) weaves during build.
- **Post-compile (binary) weaving:** weave existing `.class`/JARs.
- **Load-time weaving (LTW):** weaver agent modifies classes as the JVM loads them (`-javaagent:aspectjweaver.jar`, `@EnableLoadTimeWeaving`, `aop.xml`).
- **Runtime weaving (proxy-based):** what **Spring AOP** does — creates proxy objects when beans are created.

### Q5. ⭐🟢 What are the types of advice in Spring AOP?
**In one line:** Five — `@Before`, `@AfterReturning`, `@AfterThrowing`, `@After`, and the most powerful, `@Around`.

| Advice | Runs | Can read | Can stop the method? |
|--------|------|----------|----------------------|
| **`@Before`** | **Before** the method | arguments (`JoinPoint`) | ❌ (only by throwing an exception) |
| **`@AfterReturning`** | After a **successful** return | return value (`returning = "result"`) | ❌ |
| **`@AfterThrowing`** | After the method **throws** | the exception (`throwing = "ex"`) | ❌ (exception still propagates) |
| **`@After`** (finally) | After **either** outcome | — | ❌ |
| **`@Around`** | **Wraps** the whole call | args, result, exception | ✅ (don't call `proceed()`), can **change args/result** |

```java
@Aspect
@Component
public class AuditAspect {

    @Before("execution(* com.app.service.*.*(..))")
    public void before(JoinPoint jp) { /* before every service method */ }

    @AfterReturning(pointcut = "execution(* com.app.service.*.*(..))", returning = "result")
    public void afterReturning(Object result) { /* inspect return value */ }

    @AfterThrowing(pointcut = "execution(* com.app.service.*.*(..))", throwing = "ex")
    public void afterThrowing(Exception ex) { /* log failures */ }
}
```
**Interview tip:** *"Which advice can prevent the method from running?"* → only **`@Around`** (by not calling `proceed()`). `@Before` cannot stop it unless it throws.

### Q6. 🟢 How do you enable and declare an aspect in Spring Boot?
**In one line:** Add **`spring-boot-starter-aop`**, annotate the class with **`@Aspect` + `@Component`**.

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```
```java
@Aspect
@Component                    // ← @Aspect alone does NOT register a bean
public class LoggingAspect { ... }
```
- Boot's `AopAutoConfiguration` turns on **`@EnableAspectJAutoProxy`** (CGLIB by default) — no manual enabling needed in Boot. In **plain Spring**, add `@EnableAspectJAutoProxy` to a `@Configuration`.
- **Most common bug:** forgetting `@Component` (or the starter) → the aspect **silently never fires** (Q45).

### Q7. 🟢 What problems/use-cases is AOP typically used for?
Logging & tracing, **performance timing**, **transactions** (`@Transactional`), **security checks** (`@PreAuthorize`), **caching** (`@Cacheable`), **retry/circuit breaking** (`@Retryable`, Resilience4j), **auditing**, **input validation**, **exception translation/handling**, **rate limiting**, **feature flags**, **metrics** (`@Timed`), **idempotency**. *(Spring's own: transactions, cache, async, security, validation.)*

### Q8. 🟡 When should you NOT use AOP?
- **Business rules** that must be visible/explicit (hidden behaviour confuses maintainers) — e.g., "apply discount" belongs in code, not an aspect.
- When a **simple decorator/utility method** is clearer for 1–2 places.
- Concerns needing **method-local state** or fine control mid-method.
- When the target isn't a **Spring bean** / method is `private`/`final`/self-called (Spring AOP can't reach it).
- Don't stack **many aspects** with unclear ordering — debugging becomes painful.
**Rule of thumb:** AOP for **technical, orthogonal** concerns; plain code for **domain logic**.

### Q9. 🟡 What is an "introduction" (`@DeclareParents`)?
Adds **new interface implementations/behaviour to existing beans** transparently. Example: make every `@Service` also implement `Auditable` with a default implementation, then cast the proxy to it. Rare in practice; interviewers ask it to test breadth. Mention it exists, and that it's implemented through the **proxy** adding the interface.

### Q10. 🟢 Which Spring features are built on AOP?
**`@Transactional`**, **`@Cacheable/@CachePut/@CacheEvict`**, **`@Async`**, **`@PreAuthorize/@PostAuthorize/@Secured`**, **`@Validated`** (method validation), **`@Retryable`** (Spring Retry), **`@Timed/@Observed`** (Micrometer), Resilience4j annotations (`@CircuitBreaker`, `@RateLimiter`, `@Retry`), `@Scheduled` (no—uses a post-processor, not a proxy), Spring Data repositories (**proxy** of the interface). All **share the proxy limitations** (self-invocation, visibility, final) — see Q31 & Q36.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; Next: [Pointcut Expressions →](#2-pointcut-expressions)

---

## 2. Pointcut Expressions

### Q11. ⭐🟡 Explain the `execution` pointcut syntax.
**In one line:** `execution( modifiers? return-type declaring-type? method-name(params) throws? )` — `*` matches one segment, `..` matches any number of segments/params.

```
execution(public * com.app.service.*.*(..))
          │       │ │               │ │  └─ any arguments
          │       │ │               │ └─ any method name
          │       │ │               └─ any class in the package
          │       │ └─ package com.app.service (not sub-packages)
          │       └─ any return type
          └─ public methods
```
| Expression | Matches |
|-----------|---------|
| `execution(* com.app.service.*.*(..))` | **All methods** of classes directly in `com.app.service` |
| `execution(* com.app.service..*.*(..))` | …including **sub-packages** (`..`) |
| `execution(* com.app.service.OrderService.*(..))` | All methods of one class |
| `execution(* save*(..))` | Any method whose name starts with `save` |
| `execution(* *(Long))` | Any method with a single `Long` parameter |
| `execution(* *(..)) throws IOException` | Methods declaring `IOException` |
| `execution(String com.app..*Service.get*(..))` | Returns `String`, class name ends with `Service`, name starts with `get` |

### Q12. 🟡 What other pointcut designators exist? (`within`, `this`, `target`, `args`, `@annotation`, `bean`…)
| Designator | Selects |
|-----------|---------|
| `within(com.app.service..*)` | Join points **inside** the given types/packages |
| `this(Type)` | Proxy object is instance of `Type` |
| `target(Type)` | **Target** object is instance of `Type` |
| `args(Long, ..)` | Arguments are of given types (also binds them to advice params) |
| **`@annotation(MyAnno)`** | Method **annotated** with `MyAnno` ✅ most useful |
| `@within(MyAnno)` | Methods of classes **annotated** with `MyAnno` |
| `@target(MyAnno)` | Target class has annotation (runtime) |
| `@args(MyAnno)` | Argument types annotated with `MyAnno` |
| `bean(*Service)` / `bean(orderService)` | By **Spring bean name** (Spring-specific) |
**Difference:** `this` matches the **proxy** type, `target` matches the **real object** type (matters with JDK vs CGLIB).

### Q13. 🟢 How do you combine pointcuts?
With `&&`, `||`, `!`:
```java
@Pointcut("within(com.app.service..*)")            void inService() {}
@Pointcut("execution(* *..*Repository.*(..))")     void anyRepo() {}

@Before("inService() && !anyRepo()")               // service methods, but not repository calls
public void log(JoinPoint jp) { ... }
```
Named `@Pointcut` methods make expressions **reusable and readable**; they can be shared across aspects (`@Before("com.app.aop.Pointcuts.inService()")`).

### Q14. ⭐🟡 How do you apply an aspect through a **custom annotation**?
**In one line:** Define an annotation, then target it with `@annotation(...)` — the cleanest, most explicit way to opt in.

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Loggable { String value() default ""; boolean logArgs() default true; }

@Aspect @Component
public class LoggableAspect {
    private static final Logger log = LoggerFactory.getLogger(LoggableAspect.class);

    @Around("@annotation(loggable)")                          // binds the annotation instance
    public Object log(ProceedingJoinPoint pjp, Loggable loggable) throws Throwable {
        String method = pjp.getSignature().toShortString();
        if (loggable.logArgs()) log.info("→ {} args={}", method, Arrays.toString(pjp.getArgs()));
        long start = System.nanoTime();
        try { return pjp.proceed(); }
        finally { log.info("← {} {} ms", method, (System.nanoTime() - start) / 1_000_000); }
    }
}

@Service
class PaymentService {
    @Loggable("charge card")
    public Receipt charge(Payment p) { ... }
}
```
**Interview tip:** `Retention = RUNTIME` is required, otherwise the annotation isn't visible to the proxy. The annotation **parameter name** in advice (`loggable`) must match the name in `@annotation(loggable)`.

### Q15. 🟡 Pointcut for "all `@RestController` methods" or "all methods in classes annotated with `@Service`"?
```java
@Pointcut("within(@org.springframework.web.bind.annotation.RestController *)")
void restControllers() {}

@Pointcut("@within(org.springframework.stereotype.Service)")
void serviceBeans() {}

@Pointcut("execution(public * *(..)) && @within(org.springframework.stereotype.Service)")
void publicServiceMethods() {}
```
Use **fully-qualified** annotation names in expressions (or import and reference as class literals via the designator forms).

### Q16. 🟡 How do you access method arguments, target, and signature inside advice?
```java
@Before("execution(* com.app.service.*.*(..))")
public void before(JoinPoint jp) {
    Object[] args       = jp.getArgs();                         // runtime arguments
    String   method     = jp.getSignature().getName();          // "placeOrder"
    String   shortSig   = jp.getSignature().toShortString();    // "OrderService.placeOrder(..)"
    Object   target     = jp.getTarget();                       // real bean
    Object   proxy      = jp.getThis();                         // proxy
    MethodSignature sig = (MethodSignature) jp.getSignature();
    Method   m          = sig.getMethod();                      // reflect: read annotations on the method
    Class<?> returnType = sig.getReturnType();
}
// Bind arguments directly:
@Before("execution(* com.app.service.OrderService.place(..)) && args(order, ..)")
public void check(Order order) { ... }
```
`ProceedingJoinPoint` (used in `@Around`) extends `JoinPoint` and adds `proceed()` / `proceed(Object[] newArgs)`.

### Q17. 🟡 What are common pointcut mistakes?
1. **Over-broad:** `execution(* *(..))` or `within(com.app..*)` also matches **framework/aspect classes** → slow startup, recursion, unexpected proxies. Scope tightly.
2. **`*` vs `..` confusion:** `com.app.service.*` = only **that package**, `com.app.service..*` = includes **sub-packages**.
3. **Wrong annotation FQN** or non-`RUNTIME` retention → never matches.
4. Expecting to match **`private`/`final`/self-called** methods (Spring AOP can't).
5. Targeting **interfaces vs classes**: with JDK proxies only **interface methods** are intercepted.
6. Syntax typos fail at **startup** (`IllegalArgumentException: error at ::0 formal unbound in pointcut`) — read the message.

### Q18. 🟡 How are pointcuts evaluated, and what do they cost?
Pointcuts are **matched at startup** (per bean/method, to decide whether to create a proxy) and re-checked **cheaply at runtime** for dynamic designators (`args`, `@annotation` binding). Static ones (`execution`, `within`) cost nothing per call. Broad pointcuts increase **startup time** and the number of proxied beans. Put the **cheapest, most selective** predicate first conceptually (`within(...) && @annotation(...)`).

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Fundamentals](#1-aop-fundamentals) &nbsp;|&nbsp; Next: [Advice in Depth & Ordering →](#3-advice-in-depth--ordering)

---

## 3. Advice in Depth & Ordering

### Q19. ⭐🟡 Write an `@Around` advice that measures execution time. What are its rules?
**In one line:** `@Around` receives a **`ProceedingJoinPoint`**; you call **`proceed()`** to run the real method and **return its result**.

```java
@Aspect
@Component
public class TimingAspect {
    private static final Logger log = LoggerFactory.getLogger(TimingAspect.class);

    @Around("execution(* com.app.service.*.*(..))")
    public Object time(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();                                   // 1) run the target (or next advice)
        } finally {
            long ms = (System.nanoTime() - start) / 1_000_000;      // 2) runs on success AND failure
            log.info("{} took {} ms", pjp.getSignature().toShortString(), ms);
        }
    }
}
```
**Rules of `@Around`:**
1. First parameter **must** be `ProceedingJoinPoint`.
2. Return type should be **`Object`** (return what `proceed()` returned, or the caller gets `null`/wrong type).
3. Declare **`throws Throwable`** and **let exceptions propagate** unless you intentionally handle them.
4. **If you never call `proceed()`, the target never runs** (useful for caching/blocking).
5. Code **before** `proceed()` = "before" logic; **after** = "after" logic; `try/finally` = "after either".

### Q20. 🟡 What are the common mistakes in `@Around` advice?
| Mistake | Effect |
|---------|--------|
| Forgetting `return pjp.proceed()` (calling but not returning) | Caller receives **`null`** → NPE |
| Swallowing exceptions (`catch (Throwable t) { log }`) | Caller thinks it **succeeded**; **breaks `@Transactional` rollback** (rollback relies on the exception propagating) |
| Return type `void` on a method that returns a value | `AopInvocationException: Null return value from advice does not match primitive return type` |
| Catching `Throwable` and wrapping everything in `RuntimeException` | Hides checked exceptions callers expect |
| Calling `proceed()` twice by accident | Method executes **twice** (double inserts!) |
| Heavy work/blocking I/O in advice on hot paths | Latency everywhere |
**Interview tip:** *"An aspect that catches and swallows exceptions silently disables transaction rollback"* — a great senior-level remark.

### Q21. 🟡 `@AfterReturning` vs `@AfterThrowing` vs `@Around` with try/catch — when to use which?
- **`@AfterReturning`** — react to **success**, read the result (`returning = "result"`). It **cannot replace** the returned reference (but can mutate a mutable object).
- **`@AfterThrowing`** — react to **failure** (alerting, metrics); the **exception still propagates**; you **cannot swallow** it.
- **`@Around`** — only advice that can **transform** the result, **suppress/translate** exceptions, **retry**, or **skip** the call.
```java
@AfterReturning(pointcut = "execution(* com.app.service.OrderService.place(..))", returning = "order")
public void audit(Order order) { auditRepo.save(new Audit("PLACED", order.getId())); }

@AfterThrowing(pointcut = "within(com.app.service..*)", throwing = "ex")
public void alert(JoinPoint jp, RuntimeException ex) { alerts.send(jp.getSignature() + " failed: " + ex.getMessage()); }
```
Use the **simplest advice that fits** — it's more readable and harder to misuse than `@Around`.

### Q22. 🟢 What is `@After` and how is it different from `@AfterReturning`?
`@After` runs like a **`finally`** — after **both** success and exception (no access to result/exception). `@AfterReturning` runs **only on success**. Use `@After` for cleanup (releasing a ThreadLocal, clearing MDC).

### Q23. ⭐🟡 In what order do advices of the same aspect run?
**In one line (Spring 5.2.7+ / Boot 2.3+):** `@Around`(before part) → `@Before` → **target method** → `@AfterReturning` **or** `@AfterThrowing` → `@After` → `@Around`(after part).

```
Around ─► (pre)
  Before
    TARGET METHOD
  AfterReturning  |  AfterThrowing
  After   (finally)
Around ◄─ (post)
```
**Entry precedence** (highest first): `Around`, `Before`, `After`, `AfterReturning`, `AfterThrowing`; on the way **out** the order is reversed. **Trap:** in older Spring versions `@After` could run *before* `@AfterReturning`; don't rely on cross-advice ordering inside one aspect for correctness — use `@Around` if order matters.

### Q24. ⭐🟡 How do you control the order of **multiple aspects**?
**In one line:** `@Order(n)` (or implement `Ordered`) — **lower number = higher precedence = runs first on the way in, last on the way out** (onion model).

```java
@Aspect @Component @Order(1) class SecurityAspect { /* @Around … */ }
@Aspect @Component @Order(2) class LoggingAspect  { /* @Around … */ }
@Aspect @Component @Order(3) class TimingAspect   { /* @Around … */ }
```
```
Security-in → Logging-in → Timing-in → TARGET → Timing-out → Logging-out → Security-out
```
**Notes:**
- `@Order` applies at **aspect level** (class), **not on individual advice methods** across different aspects.
- Without `@Order`, the order is **undefined**.
- Spring's own interceptors have orders too: `@EnableTransactionManagement(order=…)`, `@EnableCaching(order=…)`, `@EnableAsync(order=…)` — default **`LOWEST_PRECEDENCE`** (innermost). Example effect: your `@Order(1)` aspect runs **before** the transaction opens (good for security checks: denied calls never touch the DB); an `@Order(Ordered.LOWEST_PRECEDENCE)` aspect may run **inside** the transaction.

### Q25. 🟡 Can advice change the arguments or the return value?
Yes — **only with `@Around`**:
```java
@Around("execution(* com.app.service.UserService.create(..)) && args(dto)")
public Object normalize(ProceedingJoinPoint pjp, UserDto dto) throws Throwable {
    dto.setEmail(dto.getEmail().trim().toLowerCase());          // mutate argument
    Object result = pjp.proceed(new Object[] { dto });          // or pass a new args array
    return result instanceof User u ? mask(u) : result;         // replace return value
}
```
`@Before` can mutate **mutable** argument objects but can't replace them; `@AfterReturning` can't replace the return reference. **Use sparingly** — hidden argument changes are surprising.

### Q26. 🟡 How do exceptions behave inside aspects?
- Exception thrown **by advice** (e.g., `@Before`) → target **doesn't run**; the exception propagates to the caller (useful for validation/security).
- `@AfterThrowing` observes but **can't swallow**; `@Around` can **catch, translate, or retry**.
- **Checked exceptions** thrown by advice that the target method doesn't declare → `UndeclaredThrowableException` (wrapping). Throw runtime exceptions from advice.
- Exceptions inside aspects appear in the stack trace with **proxy frames** (`CglibAopProxy$DynamicAdvisedInterceptor`, `ReflectiveMethodInvocation.proceed`) — read **below** them for your code.

### Q27. 🟡 Are aspects thread-safe? Can they hold state?
**Aspects are singleton beans** by default (shared across all threads) → they must be **stateless / thread-safe**.
```java
// ❌ BAD – shared field, race conditions between concurrent requests
private long start;
@Before("…") void b() { start = System.nanoTime(); }
@After("…")  void a() { log(System.nanoTime() - start); }

// ✅ GOOD – use @Around with local variables
@Around("…") Object t(ProceedingJoinPoint p) throws Throwable { long s = System.nanoTime(); try { return p.proceed(); } finally { log(System.nanoTime() - s); } }
```
Need per-request state? Use **local variables in `@Around`**, a `ThreadLocal` (always clear it in `finally`), or `RequestContextHolder`. (`@Aspect("perthis(...)")` instantiation models exist but are rare.)

### Q28. 🟡 How do you share data between `@Before` and `@After` advice?
**You can't directly** (separate method calls, shared singleton aspect). Options: **(1) use a single `@Around`** (cleanest); (2) `ThreadLocal` set in `@Before` and cleared in `@After`; (3) request attributes/MDC. Prefer `@Around`.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Pointcut Expressions](#2-pointcut-expressions) &nbsp;|&nbsp; Next: [Proxies & Internals →](#4-proxies--internals)

---

## 4. Proxies & Internals

### Q29. ⭐🟡 How does proxy-based AOP work internally?
**In one line:** At startup a **`BeanPostProcessor`** wraps beans that match any pointcut in a **proxy**; callers get the proxy, which runs the advice chain and then delegates to the real bean.

**Explained simply (analogy — a receptionist):** You never speak to the CEO directly; you speak to the **receptionist (proxy)** who logs your visit, checks your ID (advice), then forwards you to the CEO (target) and notes how long you stayed.

**Steps:**
1. `@EnableAspectJAutoProxy` (Boot auto-config) registers **`AnnotationAwareAspectJAutoProxyCreator`** (a `BeanPostProcessor`).
2. It finds all `@Aspect` beans and builds **advisors** (pointcut + advice).
3. For each bean created, **after initialisation** (`postProcessAfterInitialization`) it checks: *does any advisor's pointcut match this bean's class/methods?*
4. **Yes →** replace the bean in the container with a **proxy** (JDK or CGLIB). **No →** keep the raw bean.
5. On a call: proxy builds a **chain of interceptors** (`ReflectiveMethodInvocation`), runs each (`@Around`, `@Before`…), finally invokes the target method via reflection.
```
caller ──► [ Proxy ] ─► Interceptor 1 (security) ─► Interceptor 2 (tx) ─► … ─► Target.method()
```
**Consequences:** only calls that **go through the proxy** are advised (Q31); the proxy is created **after** `@PostConstruct` (Q37).

### Q30. ⭐🟡 JDK dynamic proxy vs CGLIB proxy — differences?
| | **JDK dynamic proxy** | **CGLIB** |
|---|-----------------------|-----------|
| Mechanism | `java.lang.reflect.Proxy` implements the bean's **interfaces** | **Subclass** of the target class generated at runtime (bytecode) |
| Needs interface? | **Yes** | No |
| Proxied methods | Only **interface** methods | All **non-final, non-private** methods |
| Inject by concrete class? | ❌ (proxy is **not** an instance of the class) | ✅ |
| `final` class/methods | n/a | ❌ can't be overridden |
| Library | JDK | Repackaged in Spring core (`spring-core`), uses Objenesis (no constructor call) |
**Spring Boot default:** `spring.aop.proxy-target-class=true` → **CGLIB always**, even if interfaces exist (avoids "can't inject by class" surprises). Plain Spring (non-Boot) defaults to JDK proxy when an interface exists.
**Interview tip:** class name `OrderService$$SpringCGLIB$$0` (Spring 6; `$$EnhancerBySpringCGLIB$$` in older) tells you it's a CGLIB proxy.

### Q31. ⭐🟡 Why does self-invocation bypass the aspect? (the #1 AOP trap)
**In one line:** The advice lives on the **proxy**; a call like **`this.other()`** goes **straight to the target object**, never touching the proxy → **no advice runs**.

**Explained simply:** The receptionist only handles visitors **coming through the front door**. Once inside, if one employee walks to a colleague's desk (`this.method()`), the receptionist never sees it.

```java
@Service
public class ReportService {

    @Transactional
    public void generate() {
        save();                 // ❌ self-call → @Transactional/@Cacheable/@Async/@PreAuthorize on save() IGNORED
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void save() { ... }
}
```
**Affects:** `@Transactional`, `@Cacheable`, `@Async`, `@Retryable`, `@PreAuthorize`, **and your own aspects**.
**Interview tip:** *"Why does `@Transactional` on a public method called from a controller work?"* → because that call comes **from outside the bean, through the proxy**. Self-invocation only breaks calls that **originate inside the same object**.

### Q32. ⭐🟡 How do you fix self-invocation? Compare the options.
| Fix | How | Verdict |
|-----|-----|---------|
| **1. Move the method to another bean** and inject it | Call crosses a proxy boundary | ✅ **Cleanest, recommended** |
| 2. Inject **self** | `@Autowired @Lazy ReportService self; … self.save();` | Works; a bit hacky |
| 3. `AopContext.currentProxy()` | `@EnableAspectJAutoProxy(exposeProxy = true)`; `((ReportService) AopContext.currentProxy()).save()` | Works; **couples code to Spring AOP** |
| 4. **AspectJ weaving** (CTW/LTW) | `@EnableTransactionManagement(mode = AdviceMode.ASPECTJ)` + weaver | Fixes all (incl. private/final); heavier build |
| 5. Programmatic `TransactionTemplate` (for tx) | Explicit API | ✅ good for transactions |

### Q33. 🟡 What are the limitations of CGLIB proxies? (`final`, `private`, constructors)
- **`final` class** → can't be subclassed → **startup error** (`Cannot subclass final class`) when a proxy is needed.
- **`final` method** → can't be overridden → **not advised**, *and worse*: calling it on the proxy executes on the **proxy instance whose fields are `null`** (since CGLIB/Objenesis doesn't run your constructor) → surprising **`NullPointerException`**.
- **`private`/`static`** methods → not intercepted.
- **Constructor** isn't invoked on the proxy (Objenesis) — don't rely on constructor logic for the proxy's state.
- **Kotlin:** classes are `final` by default → use the **`kotlin-spring` (all-open)** plugin.
**Rule:** keep advised beans **non-final with public/protected non-final methods**; keep state in the **target**, not assumed on the proxy.

### Q34. 🟡 "BeanNotOfRequiredTypeException … but was actually of type com.sun.proxy.$Proxy…" — what is it?
You injected a bean **by its concrete class**, but Spring created a **JDK proxy** that implements only the **interface** → the proxy isn't an instance of the class. **Fixes:** inject by **interface**, or force CGLIB (`spring.aop.proxy-target-class=true`, Boot default, or `@EnableAspectJAutoProxy(proxyTargetClass = true)`).

### Q35. 🟢 How can I tell if a bean is a proxy / get the real target?
```java
AopUtils.isAopProxy(bean);          // any proxy
AopUtils.isCglibProxy(bean);        // CGLIB
AopUtils.isJdkDynamicProxy(bean);
Class<?> real = AopProxyUtils.ultimateTargetClass(bean);       // real class
Object target = ((Advised) bean).getTargetSource().getTarget(); // the target instance
bean.getClass().getName();           // "...$$SpringCGLIB$$0" ⇒ CGLIB proxy
```
Also: **Actuator `/beans`**, debugger frames (`CglibAopProxy`, `ReflectiveMethodInvocation`). Use `ultimateTargetClass` when reading annotations (e.g., custom framework code) so you don't read them off the proxy class.

### Q36. ⭐🟡 Which Spring annotations are implemented via AOP, and how do they interact? (ordering)
| Annotation | Interceptor | Enabled by |
|-----------|-------------|------------|
| `@Transactional` | `TransactionInterceptor` | `@EnableTransactionManagement` (auto in Boot) |
| `@Cacheable`/`@CacheEvict` | `CacheInterceptor` | `@EnableCaching` |
| `@Async` | `AsyncExecutionInterceptor` | `@EnableAsync` |
| `@PreAuthorize`/`@PostAuthorize` | `AuthorizationManager…MethodInterceptor` | `@EnableMethodSecurity` |
| `@Retryable` | `RetryOperationsInterceptor` | `@EnableRetry` |
| `@Validated` (method validation) | `MethodValidationInterceptor` | auto with validation starter |
**All share the same limitations** — self-invocation, visibility, final, must be a Spring bean.
**Ordering matters:**
- **Retry should wrap the transaction** (each attempt = new transaction) → give retry **higher precedence** (lower order number).
- **Security before transaction** — deny early without opening a DB transaction.
- **`@Cacheable` vs `@Transactional`:** cache outside the transaction when you don't want to cache uncommitted data; check each `@EnableX(order)`.
- `@Async` + `@Transactional`: the async method runs in **another thread** → needs its **own** transaction (see `spring-boot-transactions.md` Q26).

### Q37. 🟡 Why aren't proxies applied in `@PostConstruct`/constructors? What about circular references?
- The proxy is created in **`postProcessAfterInitialization`** — **after** `@PostConstruct`/`afterPropertiesSet`. So inside `@PostConstruct`, `this` is the **raw bean** → `@Transactional`/`@Async` calls there **aren't advised**.
- Other beans receive the **proxy**, but the bean itself never sees its own proxy (that's the self-invocation root cause).
- **Circular references** with proxies: Spring uses an **early proxy reference** (`getEarlyBeanReference`) — one more reason Boot disables circular references by default (see `spring-boot-core.md` Q20).
- Run startup logic after the context is ready (`ApplicationReadyEvent`, `CommandLineRunner`) and call **other beans** to get advice.

### Q38. 🟡 What is the performance cost of AOP? How do you debug it?
- **Per call:** proxy dispatch + reflection ≈ **microseconds** — negligible vs I/O, but **avoid advising tight inner loops**.
- **Startup:** broad pointcuts force Spring to check/proxy many beans → slower startup (Q17–18).
- **Memory:** extra proxy classes.
- **Debugging:** stack traces get long (proxy frames); step through `ReflectiveMethodInvocation.proceed`; enable `logging.level.org.springframework.aop=DEBUG`; check which beans are proxied (`/actuator/beans`, `AopUtils`). AspectJ weaving removes proxy overhead but adds build complexity.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Advice in Depth](#3-advice-in-depth--ordering) &nbsp;|&nbsp; Next: [Real-World Aspects & Scenarios →](#5-real-world-aspects--scenarios)

---

## 5. Real-World Aspects & Scenarios

### Q39. ⭐🟡 Scenario: build a reusable logging/timing aspect with a custom annotation. What should it include?
Combine Q14 + Q19 and add production concerns:
```java
@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.METHOD)
public @interface Timed2 { String value() default ""; long warnAboveMs() default 500; }

@Aspect @Component @Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class TimedAspect {
    private static final Logger log = LoggerFactory.getLogger(TimedAspect.class);

    @Around("@annotation(t)")
    public Object around(ProceedingJoinPoint pjp, Timed2 t) throws Throwable {
        long start = System.nanoTime();
        String name = t.value().isBlank() ? pjp.getSignature().toShortString() : t.value();
        try {
            Object result = pjp.proceed();
            return result;
        } catch (Throwable ex) {
            log.warn("{} failed: {}", name, ex.toString());       // log, then RETHROW
            throw ex;
        } finally {
            long ms = (System.nanoTime() - start) / 1_000_000;
            if (ms > t.warnAboveMs()) log.warn("{} SLOW {} ms", name, ms); else log.debug("{} {} ms", name, ms);
        }
    }
}
```
**Good practice:** **log method name + duration + outcome**, **not full arguments** (PII — Q48), rethrow exceptions, emit **metrics** (Micrometer `Timer`) instead of only logs, use a **correlation id** (Q43).

### Q40. 🟡 Scenario: implement an audit trail ("who did what") with AOP.
```java
@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.METHOD)
public @interface Audited { String action(); }

@Aspect @Component
public class AuditAspect {
    private final AuditService audit;
    @AfterReturning(pointcut = "@annotation(a)", returning = "result")
    public void onSuccess(JoinPoint jp, Audited a, Object result) {
        String user = Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                              .map(Authentication::getName).orElse("system");
        audit.record(user, a.action(), jp.getSignature().toShortString(), "SUCCESS");
    }
    @AfterThrowing(pointcut = "@annotation(a)", throwing = "ex")
    public void onFailure(JoinPoint jp, Audited a, Exception ex) {
        audit.record(currentUser(), a.action(), jp.getSignature().toShortString(), "FAILED: " + ex.getClass().getSimpleName());
    }
}
```
**Design points:** write the audit in a **separate transaction** (`REQUIRES_NEW` — so a rolled-back business transaction still leaves an audit trail), or publish an **event** asynchronously; record **who/what/when/outcome**, **never sensitive payloads**; keep audit failures from breaking business calls (catch inside the audit service).

### Q41. 🟡 Scenario: add rate limiting / idempotency / feature flags via annotation.
```java
@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.METHOD)
public @interface RateLimited { int permitsPerMinute() default 60; }

@Aspect @Component
public class RateLimitAspect {
    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();   // Bucket4j, per user/key

    @Around("@annotation(rl)")
    public Object limit(ProceedingJoinPoint pjp, RateLimited rl) throws Throwable {
        String key = currentUser() + ":" + pjp.getSignature().toShortString();
        Bucket b = buckets.computeIfAbsent(key, k -> newBucket(rl.permitsPerMinute()));
        if (!b.tryConsume(1)) throw new TooManyRequestsException();        // maps to HTTP 429
        return pjp.proceed();
    }
}
```
**Same pattern for:** `@Idempotent` (check/store `Idempotency-Key` before `proceed()`), `@FeatureFlag("new-checkout")` (skip/redirect when off), `@RequiresTenant`. **Caveat:** for **distributed** limits use Redis/gateway-level limiting; in-memory buckets are per-instance. Libraries like **Resilience4j** already provide `@RateLimiter`, `@Retry`, `@CircuitBreaker` (also AOP).

### Q42. 🟡 Should I write my own retry aspect? How does Spring Retry/Resilience4j fit in?
Prefer **Spring Retry (`@Retryable`)** or **Resilience4j** — they handle backoff, jitter, recoverers, metrics. A minimal homemade version shows the idea:
```java
@Around("@annotation(retry)")
public Object retry(ProceedingJoinPoint pjp, Retry retry) throws Throwable {
    int attempts = 0;
    while (true) {
        try { return pjp.proceed(); }                                  // calling proceed() repeatedly re-invokes the target
        catch (TransientException ex) {
            if (++attempts >= retry.max()) throw ex;
            Thread.sleep(retry.backoffMs() * attempts);
        }
    }
}
```
**Traps:** retry **only idempotent** operations and **transient** errors; the retry advice must be **outside** `@Transactional` so each attempt gets a **fresh transaction** (Q36); never retry inside a long blocking section on a request thread without limits.

### Q43. 🟡 How do you add a correlation/trace id to all logs using AOP, and what about Micrometer?
- **Web layer:** do it in a **Servlet Filter** (set `MDC.put("traceId", …)` at request start, `MDC.clear()` in `finally`) — earlier than AOP and covers everything (Q44).
- **Non-web entry points** (Kafka listeners, schedulers): an aspect around `@KafkaListener`/`@Scheduled` methods can set/clear the MDC.
- **Observability:** Spring Boot 3 / Micrometer provides **`@Observed`** and **`@Timed`** aspects (`ObservedAspect`, `TimedAspect` beans) producing metrics + traces — prefer these over hand-written timing in modern apps.
**Trap:** MDC is a **ThreadLocal** → doesn't propagate to `@Async` threads unless you wrap the executor with a `TaskDecorator`.

### Q44. ⭐🟡 AOP vs Servlet Filter vs HandlerInterceptor vs `@ControllerAdvice` — when to use which?
| Tool | Level | Knows about | Best for |
|------|-------|-------------|----------|
| **Servlet `Filter`** | **Servlet container**, before Spring MVC | Raw `HttpServletRequest/Response` | Security, CORS, request logging, MDC/trace ids, compression, rate limiting at the edge |
| **`HandlerInterceptor`** | **Spring MVC** (around controller handler) | The **handler method**, model/view | Cross-cutting web logic needing handler info: auth checks, locale, timing per controller method |
| **AOP aspect** | **Any Spring bean method** (service, repository, controller) | Java method, args, return value | Transactions, caching, audit, retry, method-level security, metrics — **non-web layers too** |
| **`@ControllerAdvice`** | Spring MVC | Exceptions from controllers, binding | **Global exception handling**, `@InitBinder`, shared model attributes |
**Order of execution for a web call:** `Filter` → `DispatcherServlet` → `HandlerInterceptor.preHandle` → **AOP on controller/service methods** → controller → `postHandle` → `afterCompletion` → Filter (exit). Exceptions thrown from controllers are caught by `@ControllerAdvice`.
**Rule of thumb:** need it for **HTTP only** and **before Spring** → Filter; need **handler info** → Interceptor; need it for **any Java method** → AOP; **exception → response** → `@ControllerAdvice`.

### Q45. ⭐🟡 "My aspect isn't firing" — what's your checklist?
1. **`spring-boot-starter-aop` / `@EnableAspectJAutoProxy` present?** (Boot 3 needs the AOP starter.)
2. **Aspect is a bean?** `@Aspect` **+ `@Component`** (or `@Bean`), and it's **component-scanned**.
3. **Target is a Spring bean?** Objects created with `new` aren't proxied.
4. **Self-invocation?** (Q31) — call crosses the proxy?
5. **Method visibility/modifiers:** `public`, non-`final`, non-`static`; class non-`final`.
6. **Pointcut matches?** Package typo, `*` vs `..`, wrong annotation FQN, annotation `Retention` not `RUNTIME`. Test with a simpler pointcut (`within(com.app..*)`), then narrow.
7. **JDK proxy + class-level pointcut** — only interface methods are intercepted.
8. **Called during startup/`@PostConstruct`** → raw bean (Q37).
9. **Other advice ordering** swallowing the call (a higher-precedence `@Around` that never calls `proceed()` or swallows exceptions).
10. Enable `logging.level.org.springframework.aop=DEBUG` and **print `AopUtils.isAopProxy(bean)`** to confirm the bean is proxied.

### Q46. 🔴 Scenario: aspects and `@Transactional`/`@Cacheable`/`@Retryable` all on one method — who runs first?
Interceptors form a **chain ordered by precedence**. Decide deliberately:
```
[Retry]  →  [Security]  →  [Cache]  →  [Transaction]  →  [Your custom aspect (innermost)]  →  method
   outermost                                                                                     innermost
```
- **Retry outermost** → each attempt is a **fresh transaction**.
- **Security early** → no DB work for denied calls.
- **Cache outside the transaction** → cache hit avoids opening a transaction; but don't cache data that may be rolled back.
- A custom aspect with **`Ordered.LOWEST_PRECEDENCE`** runs **inside** the transaction (its exceptions trigger rollback); with **`HIGHEST_PRECEDENCE`** it runs **outside** (a swallowed exception there would hide the failure from the tx).
Set `@Order` on aspects and `order` on `@EnableTransactionManagement/@EnableCaching/@EnableRetry/@EnableAsync` explicitly, then **verify with a test/log** — don't assume.

### Q47. 🟡 What is the "advice advising itself / infinite recursion" and the "aspect advises framework beans" problem?
- A broad pointcut like `execution(* com.app..*.*(..))` can match the **aspect class itself** or helper beans it calls → **recursion** (`StackOverflowError`) or double logging. **Fix:** exclude (`!within(com.app.aop..*)`) or call collaborators that aren't advised.
- Pointcuts like `execution(* *(..))` or `bean(*)` can proxy **Spring infrastructure beans** → startup errors like *"is not eligible for getting processed by all BeanPostProcessors"* or weird behaviour. **Always scope to your packages/annotations.**
- `@Around` on **repositories** called heavily → big overhead; scope to services or specific annotations.

### Q48. 🟡 What should you never log from an aspect?
**Passwords, tokens, card numbers, personal data, full request bodies**, or huge payloads. `Arrays.toString(pjp.getArgs())` happily prints a `LoginRequest(password=…)`.
**Do:** log **method, duration, outcome, ids**; use `@Loggable(logArgs = false)`; **mask** sensitive fields (custom `toString()`/`@JsonIgnore`/masking utility); sample high-volume logs; keep **log level** appropriate (DEBUG for args).

### Q49. 🟡 How do you test an aspect?
**Unit test (no Spring context):**
```java
OrderService target = new OrderService();
AspectJProxyFactory factory = new AspectJProxyFactory(target);
factory.addAspect(new TimingAspect());
OrderService proxy = factory.getProxy();                // advised proxy
proxy.place(order);                                      // advice runs; assert side effects (logs/metrics/mocks)
```
**Integration test:** `@SpringBootTest(classes = {TimingAspect.class, TestService.class, AopAutoConfiguration.class})` or `@Import`, call the bean through the context, assert behaviour (and **test that self-invocation is NOT advised** if documented). Include tests for **exception paths** and **ordering** (e.g., aspect order with `@Transactional`). See `spring-boot-testing.md`.

### Q50. 🟡 What are the AOP anti-patterns?
- **Business logic in aspects** (discounts, validations that belong in the domain) → invisible rules.
- **Swallowing exceptions** in `@Around` (breaks rollback/error handling).
- **Hidden mutations** of arguments/return values.
- **Stateful aspects** (race conditions).
- **Over-broad pointcuts** (performance, recursion).
- **Aspects with side effects on the critical path** (synchronous remote calls in logging/audit advice).
- **Relying on self-invocation** being advised.
- **Too many aspects with unclear `@Order`.**
Use AOP for **technical, orthogonal concerns**; keep domain logic explicit.

### Q51. 🟢 How does Spring AOP relate to the Proxy/Decorator design pattern? Show a manual dynamic proxy.
Spring AOP **is** the **Proxy pattern** applied automatically: a stand-in object controlling access to the real one. A hand-made JDK proxy shows the mechanism:
```java
interface PaymentService { void pay(int amount); }

PaymentService real = amount -> System.out.println("paid " + amount);

PaymentService proxy = (PaymentService) Proxy.newProxyInstance(
    PaymentService.class.getClassLoader(),
    new Class<?>[] { PaymentService.class },
    (p, method, args) -> {
        System.out.println("before " + method.getName());       // "advice"
        Object result = method.invoke(real, args);               // call the target
        System.out.println("after " + method.getName());
        return result;
    });
proxy.pay(100);
```
**Decorator** = wrapping **explicitly in code** to add behaviour; **Spring AOP** = the container wraps beans **declaratively via pointcuts**. Also see `ProxyFactory` (Spring's programmatic API used under the hood).

### Q52. ⭐🟢 Explain Spring AOP in 60 seconds (project-style answer).
> "AOP separates cross-cutting concerns — logging, security, transactions, caching, metrics — from business logic. An **aspect** holds **advice** (`@Before`, `@AfterReturning`, `@AfterThrowing`, `@After`, `@Around`) and a **pointcut** that selects **join points**, which in Spring AOP are always **method executions on Spring beans**. Spring implements it with **runtime proxies** created by a `BeanPostProcessor` — **CGLIB by default in Boot** (JDK proxy if you force interfaces).
> The key consequence is that only calls **through the proxy** are advised: **self-invocation, private/final methods and non-bean objects are not**. That's why `@Transactional`, `@Cacheable`, `@Async` and `@PreAuthorize` — all AOP-based — sometimes 'do nothing'. I fix it by moving the method to another bean or using `TransactionTemplate`; AspectJ weaving is the heavy alternative.
> In practice I write tightly-scoped pointcuts, use custom annotations for opt-in behaviour, keep aspects stateless, never swallow exceptions, control ordering with `@Order`, and don't hide business rules in aspects."

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Proxies & Internals](#4-proxies--internals)

---

## ✅ Last-minute cheat sheet

| Topic | One-liner to remember |
|-------|----------------------|
| AOP | Separate cross-cutting concerns from business code |
| Terms | Aspect = module · Advice = action · Pointcut = selector · Join point = location (method execution) · Weaving = linking |
| Spring AOP vs AspectJ | Runtime proxy, methods on beans only / bytecode weaving, anything |
| Advice types | `@Before`, `@AfterReturning`, `@AfterThrowing`, `@After`, `@Around` |
| Only `@Around` can… | Skip the method, change args/return, swallow/translate exceptions |
| `execution` syntax | `execution(* pkg.*.*(..))` — `*` one segment, `..` many |
| Custom annotation | `@annotation(x)` + `Retention.RUNTIME` |
| Advice order (one aspect) | Around-pre → Before → method → AfterReturning/Throwing → After → Around-post |
| Aspect order | `@Order(n)` low = outermost |
| Proxy types | JDK (interface) vs CGLIB (subclass); **Boot default = CGLIB** |
| Self-invocation | `this.m()` bypasses proxy → no advice |
| Fix self-invocation | Move to another bean / `TransactionTemplate` / AspectJ |
| CGLIB limits | No `final` class/method, `private`, `static` |
| Built on AOP | `@Transactional`, `@Cacheable`, `@Async`, `@PreAuthorize`, `@Retryable`, `@Validated` |
| Aspect not firing | Starter? `@Component`? bean? self-call? public/non-final? pointcut? |
| Aspects are singletons | Keep them **stateless**; use `@Around` locals |
| Filter vs Interceptor vs AOP | Servlet-level / MVC handler-level / any bean method |
| Don't | Swallow exceptions, log secrets, put business rules in aspects |

## 🎤 How to answer in an interview (template)
1. **One-line definition.**
2. **Analogy** (receptionist / airport security).
3. **Tiny example** (`@Around` timing or custom annotation).
4. **The trap** (self-invocation, proxy limits, ordering, swallowed exceptions).
5. **What you do in real projects** (tight pointcuts, custom annotations, `@Order`, tests).

## 📚 References
- [CodeBegun – Spring AOP Interview Questions](https://www.codebegun.com/interview/spring-boot/spring-aop)
- [Javarevisited – Spring AOP Interview Questions & Answers](https://javarevisited.blogspot.com/2021/03/spring-aop-interview-questions-answers.html)
- [Medium (Mehar Chand) – Interview Questions on Spring AOP](https://medium.com/@mehar.chand.cloud/interview-questions-on-spring-aspect-oriented-programming-aop-6b18f29cace8)
- [Spring Framework Reference – Aspect Oriented Programming](https://docs.spring.io/spring-framework/reference/core/aop.html)
- [Spring Framework Reference – Proxying Mechanisms](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)
- [AspectJ Programming Guide](https://eclipse.dev/aspectj/doc/released/progguide/index.html)

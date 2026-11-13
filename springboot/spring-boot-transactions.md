---
title: Spring Boot Transactions Interview Questions & Answers
layout: docs
category: spring-boot
tags: [spring-boot, transactional, propagation, isolation, rollback, saga, outbox, distributed-transactions, interview]
level: junior-to-senior
questions: 58
---

# Spring Boot Transactions — Interview Questions & Answers

> **58 questions** covering `@Transactional` from basics to the **traps that fail real interviews**: propagation, isolation, rollback rules, proxy pitfalls, transactions with events/Kafka, distributed transactions (Saga/Outbox), and production scenarios.
> Every answer follows the same pattern: **In one line** → **Explained simply** (analogy) → **Example / code** → **Interview tip / trap / follow-up**.
> Sources consolidated: JavaInUse (Spring transaction), Medium *"Spring @Transactional — 25 traps"*, CodingShuttle, Intervue, InterviewBit, Javarevisited, Spring Framework reference docs, microservices-patterns literature, plus real interview scenarios.

**Legend:** 🟢 Easy &nbsp;|&nbsp; 🟡 Medium &nbsp;|&nbsp; 🔴 Hard &nbsp;|&nbsp; ⭐ Must-know (asked very often)

> 📎 **Companion pages:** `spring-boot-core.md` · `spring-aop.md` (proxies — the root of most `@Transactional` traps) · `spring-data-jpa.md` · `hibernate.md` · `spring-boot-microservices-kafka.md`

---

## 📑 On this page

| # | Section | Questions |
|---|---------|-----------|
| 1 | [Transaction Fundamentals](#1-transaction-fundamentals) | Q1 – Q8 |
| 2 | [`@Transactional` Attributes](#2-transactional-attributes) | Q9 – Q20 |
| 3 | [Traps & Pitfalls](#3-traps--pitfalls) | Q21 – Q36 |
| 4 | [Programmatic Transactions, Events & Messaging](#4-programmatic-transactions-events--messaging) | Q37 – Q44 |
| 5 | [Distributed Transactions, Saga & Outbox](#5-distributed-transactions-saga--outbox) | Q45 – Q51 |
| 6 | [Scenarios, Testing & Debugging](#6-scenarios-testing--debugging) | Q52 – Q58 |

**Quick revision — top 14 ⭐:** Q3 (how `@Transactional` works) · Q10 (REQUIRED vs REQUIRES_NEW) · Q15 (rollback rules) · Q21 (self-invocation) · Q23 (swallowed exception) · Q24 (checked exceptions) · Q25 (`UnexpectedRollbackException`) · Q37 (`TransactionTemplate`) · Q38 (`@TransactionalEventListener`) · Q40–41 (dual write + Outbox) · Q45 & Q47 (distributed tx + Saga) · Q52 (money transfer) · Q55 (tests hide bugs) · Q57 (checklist: "it's not working")

---

## 1. Transaction Fundamentals

### Q1. 🟢 What is a transaction and what are the ACID properties?
**In one line:** A transaction is a group of operations that must **all succeed or all fail** as one unit.

**Explained simply (analogy — bank transfer):** Moving ₹1,000 from A to B = *debit A* + *credit B*. If the debit succeeds but the credit fails, money vanishes. A transaction guarantees "both or neither".

| Letter | Property | Meaning |
|--------|----------|---------|
| **A** | Atomicity | All steps happen or none do (rollback on failure) |
| **C** | Consistency | DB moves from one valid state to another (constraints hold) |
| **I** | Isolation | Concurrent transactions don't see each other's half-done work |
| **D** | Durability | Once committed, data survives crashes |

### Q2. 🟢 Declarative vs programmatic transaction management?
**In one line:** **Declarative** = annotate (`@Transactional`) and Spring handles begin/commit/rollback; **programmatic** = you call the API in code (`TransactionTemplate`).

| Declarative (`@Transactional`) | Programmatic (`TransactionTemplate` / `PlatformTransactionManager`) |
|--------------------------------|---------------------------------------------------------------------|
| Clean, no boilerplate | Explicit, fine-grained control |
| Works through **proxies** (has traps — Section 3) | No proxy limitations (works inside the same class) |
| Best for 90% of cases | Best for narrow scopes, loops with per-item commits, dynamic propagation |

### Q3. ⭐🟡 How does `@Transactional` work internally?
**In one line:** Spring wraps your bean in a **proxy**; the proxy's **`TransactionInterceptor`** starts a transaction before your method and commits or rolls back after it.

**Explained simply (analogy — a security guard at the door):** Callers never talk to your real bean directly; they talk to the **proxy (guard)**. The guard opens a transaction, lets the call through, and on the way out commits (or rolls back if a runtime exception came out).

```
caller ──► [Proxy] ──► TransactionInterceptor
                           1. get TransactionManager
                           2. begin tx  (get a DB connection, setAutoCommit(false), bind to THREAD)
                           3. invoke your real method
                           4. no exception → commit | RuntimeException/Error → rollback
                           5. release connection, unbind thread
```
**Key facts:**
- Proxy is created in a **`BeanPostProcessor`** step (see `spring-boot-core.md` Q18) → a JDK proxy (interface) or **CGLIB** subclass (Boot default `spring.aop.proxy-target-class=true`).
- The connection/`EntityManager` is **bound to the current thread** (`ThreadLocal` via `TransactionSynchronizationManager`) so every repository/`JdbcTemplate` call in that thread joins the same transaction.
- Boot auto-enables it (`@EnableTransactionManagement` is auto-configured).

**Interview tip:** Almost every trap in Section 3 is a consequence of **"it's a proxy"** or **"it's thread-bound"**. Say that sentence out loud.

### Q4. 🟡 Which `TransactionManager` does Spring Boot use?
**In one line:** It auto-configures one that matches your stack.

| Stack on classpath | Auto-configured manager |
|--------------------|-------------------------|
| Spring Data JPA / Hibernate | **`JpaTransactionManager`** (also handles plain JDBC on the same `DataSource`) |
| Plain JDBC / `JdbcTemplate` only | `DataSourceTransactionManager` |
| JMS | `JmsTransactionManager` |
| Kafka | `KafkaTransactionManager` (when transaction-id-prefix is set) |
| JTA/XA (Atomikos/Narayana) | `JtaTransactionManager` |

**Multiple datasources →** you define one manager per `DataSource`/`EntityManagerFactory` and pick it with `@Transactional("ordersTm")` (see `spring-data-jpa.md` Q17).

### Q5. 🟢 Spring `@Transactional` vs JPA `EntityTransaction` vs JDBC `commit()`?
- **JDBC:** `connection.setAutoCommit(false)` … `commit()`/`rollback()` — manual.
- **JPA:** `em.getTransaction().begin()/commit()` — manual, resource-local.
- **Spring:** one **abstraction** (`PlatformTransactionManager`) over both, so the **same code and annotations** work for JDBC, JPA, JMS, JTA. Prefer Spring's; never mix manual `commit()` inside a Spring-managed transaction.

### Q6. 🟡 Where should `@Transactional` be placed — controller, service or repository?
**In one line:** On the **service layer** — the place that represents a **business unit of work**.

- ✅ **Service:** one business operation = one transaction (calls several repositories atomically).
- ❌ **Controller:** transaction would include request parsing/serialization/validation and hold a DB connection longer; mixes web with data concerns.
- ❌ **Repository only:** each call is its own tiny transaction → multi-step operations aren't atomic.
- Spring Data repository **CRUD methods are already transactional** (`SimpleJpaRepository`), but **your declared query methods are not** (and `@Modifying` needs one).

**Class vs method:** class-level applies to **all public methods**; a **method-level annotation overrides** the class-level one (e.g., class default `readOnly = true`, write methods override with plain `@Transactional`).

### Q7. 🟡 How does Spring know which connection to use in a transaction?
**In one line:** It binds the **connection (or `EntityManager`) to the current thread** in `TransactionSynchronizationManager`; `JdbcTemplate` / JPA look it up from there.

**Consequences:**
- Everything in the **same thread** shares the transaction ✅
- **A new thread** (`@Async`, `CompletableFuture`, parallel streams, executor) has **no transaction** ❌ (Q26)
- Only calls that go through Spring-managed resources (same `DataSource`) join it.

### Q8. 🟡 What is the relationship between a transaction and the JPA persistence context?
**In one line:** In Spring, the persistence context (the `EntityManager`'s workspace) **lives as long as the transaction**.

- Transaction begins → `EntityManager` created and bound.
- Inside: entities are **managed**, dirty checking works, lazy loading works.
- **Commit** → Hibernate **flushes** pending SQL, then commits; context closes → entities become **detached**.
- This is why `LazyInitializationException` appears when you touch lazy fields **after** the service method returns (see `spring-data-jpa.md` Q71). Multiple repository calls in **one** transaction share **one** persistence context; without `@Transactional` each repository call gets its own.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; Next: [`@Transactional` Attributes →](#2-transactional-attributes)

---

## 2. `@Transactional` Attributes

### Q9. ⭐🟡 What are the transaction propagation types?
**In one line:** Propagation defines **what happens when a transactional method is called while a transaction already exists** (or doesn't).

| Propagation | If a transaction **exists** | If **none** exists |
|-------------|----------------------------|--------------------|
| **`REQUIRED`** (default) | **Join** it | Create a new one |
| **`REQUIRES_NEW`** | **Suspend** it, start a **new independent** one | Create a new one |
| **`SUPPORTS`** | Join it | Run **without** a transaction |
| **`NOT_SUPPORTED`** | **Suspend** it, run without | Run without |
| **`MANDATORY`** | Join it | **Throw exception** |
| **`NEVER`** | **Throw exception** | Run without |
| **`NESTED`** | Run inside a **savepoint** of it | Create a new one (like REQUIRED) |

### Q10. ⭐🟡 `REQUIRED` vs `REQUIRES_NEW` — explain with an example.
**In one line:** `REQUIRED` **shares** the caller's transaction (all-or-nothing together); `REQUIRES_NEW` runs in its **own** transaction that commits/rolls back **independently**.

**Explained simply (analogy):** `REQUIRED` = joining the same shopping cart. `REQUIRES_NEW` = a separate receipt: even if your main purchase is cancelled, the other receipt stays.

```java
@Service
class OrderService {
    private final AuditService audit;
    @Transactional                                   // REQUIRED
    public void placeOrder(Order o) {
        orderRepo.save(o);
        audit.log("order placed " + o.getId());      // different bean → goes through proxy
        throw new IllegalStateException("payment failed");   // outer rolls back
    }
}

@Service
class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String msg) { auditRepo.save(new Audit(msg)); }   // COMMITTED independently
}
```
**Result:** the order is rolled back, **the audit row stays** — exactly what audit/logging/failure-tracking needs.

**Traps / follow-ups:**
- `REQUIRES_NEW` uses a **second DB connection** while the first is suspended → with a small pool (Hikari default 10) and many concurrent requests you can get **pool exhaustion/deadlock** (Q30).
- The new transaction **can't see uncommitted changes** of the outer one (separate persistence context & isolation).
- Call must go **through the proxy** (another bean) — self-invocation ignores it (Q21).

### Q11. 🟡 `NESTED` vs `REQUIRES_NEW`?
**In one line:** `NESTED` = a **savepoint inside the same transaction** (rolling back the inner part leaves the outer alive); `REQUIRES_NEW` = a **completely separate** transaction.

| | `NESTED` | `REQUIRES_NEW` |
|---|----------|----------------|
| Connection | **Same** connection | **New** connection |
| Inner rollback | Rolls back to savepoint; outer can continue | Inner rolls back alone; outer unaffected |
| Outer rollback | **Also undoes** the inner (it's part of it) | Inner already committed → **stays** |
| Support | JDBC savepoints (`DataSourceTransactionManager`; limited with JPA) | All managers |

**Use `NESTED`** for "try an optional step, fall back if it fails" inside one atomic unit. **Use `REQUIRES_NEW`** when the inner work must survive the outer failing (audit).

### Q12. 🟡 When would you use `MANDATORY`, `SUPPORTS`, `NOT_SUPPORTED`, `NEVER`?
- **`MANDATORY`** — a method that must **never run alone** (e.g., `applyDiscountToOrder` expects the caller's transaction) — fail fast if misused.
- **`SUPPORTS`** — read helpers that work with or without a transaction.
- **`NOT_SUPPORTED`** — long non-transactional work (report generation, calling a slow API) invoked from a transactional context — **release the connection** during it.
- **`NEVER`** — guard against accidental transactional calls (rare).

### Q13. 🟡 What are the isolation levels and the problems they prevent?
**In one line:** Isolation controls **how much concurrent transactions can see of each other's changes**.

| Problem | Meaning |
|---------|---------|
| **Dirty read** | Reading another transaction's **uncommitted** data |
| **Non-repeatable read** | Same row read twice → **different value** (someone committed between) |
| **Phantom read** | Same query twice → **different set of rows** (rows inserted/deleted) |
| **Lost update** | Two transactions overwrite each other's change |

| Level | Dirty | Non-repeatable | Phantom |
|-------|:-----:|:--------------:|:-------:|
| `READ_UNCOMMITTED` | ✅ possible | ✅ | ✅ |
| `READ_COMMITTED` | ❌ | ✅ | ✅ |
| `REPEATABLE_READ` | ❌ | ❌ | ✅ (InnoDB largely prevents via gap locks) |
| `SERIALIZABLE` | ❌ | ❌ | ❌ |

`@Transactional(isolation = Isolation.REPEATABLE_READ)`. `DEFAULT` = the **database's** default.

### Q14. 🟡 Which isolation level should I use? What are DB defaults?
- **Defaults:** PostgreSQL, Oracle, SQL Server → `READ_COMMITTED`; MySQL InnoDB → `REPEATABLE_READ`.
- **Rule of thumb:** stay with the **default** and solve conflicts with **locking** (`@Version` / `SELECT … FOR UPDATE`, see Q52–53) — higher isolation = more locking/serialization failures and lower throughput.
- Use `SERIALIZABLE`/`REPEATABLE_READ` only for narrow, critical operations and be ready to **retry** on serialization failures.
- Isolation applies **when a new transaction starts**; if you **join** an existing one (`REQUIRED`), the inner `isolation` setting is ignored (unless `validateExistingTransaction` is on).

### Q15. ⭐🟡 When does a transaction roll back? What about checked exceptions?
**In one line:** By default **only on `RuntimeException` and `Error`**. **Checked exceptions do NOT roll back** — they **commit**.

```java
@Transactional                       // default
public void a() throws IOException { save(); throw new IOException(); }   // ⚠️ COMMITS!

@Transactional(rollbackFor = Exception.class)      // roll back on checked too
public void b() throws IOException { save(); throw new IOException(); }   // rolls back

@Transactional(noRollbackFor = DuplicateEmailException.class)             // exception but still commit
```
**Why this default?** Historical EJB convention: checked = "recoverable business condition", unchecked = "system failure".
**Best practice:** make business exceptions **unchecked** (extend `RuntimeException`), or set `rollbackFor = Exception.class` as a team standard.

### Q16. 🟡 What does `readOnly = true` really do?
**In one line:** It's an **optimisation hint** — not a security guard.

- Hibernate sets **flush mode to MANUAL** → **no dirty checking / no automatic flush** → less CPU and memory.
- Spring calls `connection.setReadOnly(true)` → some drivers/DBs optimise or route to a **read replica**; **PostgreSQL/MySQL may reject writes** in a read-only transaction, others silently accept — don't rely on it.
- Best for query methods; a common pattern: class-level `@Transactional(readOnly = true)`, override on write methods.
**Trap:** writes inside a `readOnly` transaction are often **silently not persisted** (flush mode MANUAL) → "my update didn't save" (see `spring-data-jpa.md` Q95).

### Q17. 🟢 What is `timeout`?
`@Transactional(timeout = 5)` → seconds; if the transaction runs longer, it's marked for rollback and throws `TransactionTimedOutException` at the **next DB operation**. Protects against runaway queries/lock holding. It's enforced **at statement execution points**, not by killing arbitrary Java code.

### Q18. 🟡 How do you choose which transaction manager to use?
```java
@Transactional("ordersTm")                     // or transactionManager = "ordersTm"
public void placeOrder() { ... }
```
Needed with **multiple datasources**; mark one manager `@Primary` for the default. Mixing a manager with the **wrong** datasource = "my transaction doesn't roll back" bugs.

### Q19. 🟡 Class-level vs method-level `@Transactional`; what about inheritance and interfaces?
- Method-level **overrides** class-level for that method.
- Annotating the **class** (or concrete method) is recommended; annotating **interface** methods works only with interface-based (JDK) proxies — inconsistent with CGLIB → **annotate concrete classes**.
- Only **public** methods are intercepted by default (Q22).
- Annotations on a **superclass** method are inherited by subclass beans (class-level `@Transactional` is *not* always inherited — prefer annotating each concrete service).

### Q20. 🟡 JDK dynamic proxy vs CGLIB for transactions — does it matter?
**In one line:** Boot defaults to **CGLIB** (`spring.aop.proxy-target-class=true`), which subclasses your class.

| JDK proxy | CGLIB proxy |
|-----------|-------------|
| Needs an **interface**; proxy implements it | Subclass of your **class** |
| Can only be injected by **interface type** | Can be injected by class type |
| — | Class/methods can't be **`final`** (can't override) → transactions silently skipped (Q36) |

See `spring-aop.md` for details.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Fundamentals](#1-transaction-fundamentals) &nbsp;|&nbsp; Next: [Traps & Pitfalls →](#3-traps--pitfalls)

---

## 3. Traps & Pitfalls

### Q21. ⭐🟡 Why does `@Transactional` not work when I call a method in the same class? (self-invocation)
**In one line:** The annotation works through the **proxy**; `this.method()` calls the **real object directly**, skipping the proxy → no transaction logic.

**Explained simply (analogy):** The security guard (proxy) only checks people entering through the **front door**. If someone is already inside the building and walks from room to room (`this.method()`), the guard never sees them.

```java
@Service
public class OrderService {

    public void placeOrder(Order o) {
        this.saveAudit(o);                 // ❌ internal call: bypasses proxy → REQUIRES_NEW ignored
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveAudit(Order o) { ... }
}
```
**Fixes (best → worst):**
1. **Move the method to another bean** and inject it ✅ (cleanest).
2. Use **`TransactionTemplate`** inside the method (Q37).
3. Inject the **proxy of itself** (`@Lazy @Autowired OrderService self;` then `self.saveAudit()`) — works but smells.
4. AspectJ **compile/load-time weaving** (`mode = AdviceMode.ASPECTJ`) — heavier setup.
Same trap applies to `@Async`, `@Cacheable`, `@Retryable`, `@PreAuthorize`.

### Q22. 🟡 Why is `@Transactional` ignored on `private`/`protected`/`final`/`static` methods?
- **Proxies intercept public methods** called from outside (default `AnnotationTransactionAttributeSource` allows only public in proxy mode).
- **`private`/`static`** → can't be overridden/intercepted.
- **`final`** methods/classes → CGLIB can't override → the proxy can't wrap them.
- **Symptom:** no error — it just **silently runs without a transaction**. Verify with `TransactionSynchronizationManager.isActualTransactionActive()` (Q56).

### Q23. ⭐🟡 Why is my transaction *committed* even though an exception happened? (swallowed exception)
**In one line:** If you **catch** the exception inside the method, Spring never sees it → it **commits**.

```java
@Transactional
public void process(List<Order> orders) {
    for (Order o : orders) {
        try {
            orderRepo.save(o);
            paymentService.charge(o);          // throws RuntimeException
        } catch (Exception e) {
            log.error("failed", e);            // ❌ swallowed → outer method completes → COMMIT
        }
    }
}
```
**Fix options:** rethrow; or `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()`; or design **per-item transactions** (Q31). Also see Q25: if the failing code was in an inner `REQUIRED` transaction, the catch leads to `UnexpectedRollbackException`.

### Q24. ⭐🟡 Checked exception thrown — transaction committed. Why and how to fix?
Covered by the default rule (Q15): only **unchecked** exceptions roll back.
**Scenario:** `@Transactional void upload() throws IOException { saveMetadata(); throw new IOException(); }` → metadata saved, file failed → inconsistent.
**Fix:** `@Transactional(rollbackFor = IOException.class)` or `Exception.class`, or wrap in a runtime exception.

### Q25. ⭐🔴 What is `UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only`?
**In one line:** An **inner** method that **joined** the outer transaction (`REQUIRED`) threw an exception → it **marked the shared transaction rollback-only**. The outer code **caught** the exception and tried to **commit** → Spring refuses and throws this.

**Explained simply:** Two people share **one** exam paper (same transaction). One writes a mistake and "voids" the paper (rollback-only). The other thinks "I'll just hand in the paper anyway" → the invigilator says "the paper was already voided".

```java
@Transactional
public void outer() {
    try {
        inner.save();                // @Transactional (REQUIRED), throws RuntimeException
    } catch (RuntimeException e) {
        // ignoring it...
    }
    otherRepo.save(x);               // outer "continues"
}                                    // commit → UnexpectedRollbackException 💥
```
**Fixes:**
- Let the exception **propagate** (don't catch), or
- Make the inner call **`REQUIRES_NEW`** (own transaction → its failure doesn't poison the outer), or
- Use **`NESTED`** (rollback to savepoint), or
- Remove `@Transactional` from the inner method if it doesn't need its own boundary.
**Interview tip:** This is the classic "try/catch around a transactional call" trap.

### Q26. 🔴 Why is there no transaction inside `@Async`, `CompletableFuture` or parallel streams?
**In one line:** The transaction is **bound to the calling thread** (`ThreadLocal`); another thread doesn't inherit it.

```java
@Transactional
public void run() {
    list.parallelStream().forEach(repo::save);      // ❌ each task on another thread: NO outer transaction
    CompletableFuture.runAsync(() -> repo.save(x)); // ❌ same
}
```
**Consequences:** work done in other threads runs in **its own (or no) transaction**, can't be rolled back with the caller, and **can't see uncommitted data**.
**Fix:** give the async method its **own** `@Transactional` (on a different bean), or avoid parallelising DB writes; if the async work depends on committed data, trigger it **after commit** (`@TransactionalEventListener`, Q38).

### Q27. 🟡 Can I use `@Transactional` in `@PostConstruct` or at startup?
**No (not reliably).** At `@PostConstruct` time the **proxy isn't fully created yet** (proxies are made after initialisation callbacks), so the annotation isn't applied. Use `ApplicationReadyEvent`/`CommandLineRunner` and call a transactional method on **another bean**, or use `TransactionTemplate`.

### Q28. 🟡 Why do I get `LazyInitializationException` after my transactional method returns?
The persistence context closed with the transaction → lazy associations can't load (Q8). Fix: fetch needed data **inside** (fetch join / `@EntityGraph`) or return a **DTO**; avoid relying on Open-Session-In-View (`spring.jpa.open-in-view=false`). Details: `spring-data-jpa.md` Q71–72.

### Q29. 🟡 What happens if I write inside a `readOnly = true` transaction?
See Q16 — depending on the DB, the write is **rejected** (error) or **silently skipped** (Hibernate `FlushMode.MANUAL`). Calling a **write** service method from a **read-only** transaction with `REQUIRED` just **joins** it → the write may not flush. Fix: give the write method **`REQUIRES_NEW`** or restructure so reads and writes aren't mixed under a read-only boundary.

### Q30. 🔴 How can `REQUIRES_NEW` cause connection-pool exhaustion or deadlock?
**In one line:** Each outer transaction **holds connection #1** while the inner `REQUIRES_NEW` **waits for connection #2** from the same pool.

**Scenario:** pool size 10; 10 concurrent requests each hold 1 connection and each call a `REQUIRES_NEW` method → all 10 need an 11th connection → everyone waits until the **Hikari timeout** → `Connection is not available, request timed out`. It's a **resource deadlock**.
**Fixes:** make the inner call **after** the outer transaction ends (events/outbox, Q38), size pool for **2× concurrency** where unavoidable, avoid nested `REQUIRES_NEW` in hot paths, set short `connection-timeout`, monitor Hikari metrics.

### Q31. ⭐🟡 Batch processing: one big transaction or a transaction per item?
**In one line:** For large batches use **chunked / per-item transactions** — one big transaction is slow, holds locks, and **one failure rolls back everything**.

```java
@Service
public class BatchService {
    private final ItemProcessor processor;               // separate bean so the proxy applies
    public void importAll(List<Item> items) {
        for (Item item : items) {
            try { processor.processOne(item); }           // each call: own REQUIRES_NEW (or REQUIRED w/o outer tx)
            catch (Exception e) { failures.add(item, e); }// failure isolated to one item
        }
    }
}
@Service
class ItemProcessor {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    void processOne(Item i) { ... }
}
```
Or process in **chunks** (e.g., 500 items per `TransactionTemplate`), flush/clear the persistence context between chunks, and make processing **idempotent** so you can re-run. **Spring Batch** provides chunk-oriented transactions, skip/retry, restartability out of the box.

### Q32. 🟡 Why should transactions be short? What about remote calls inside a transaction?
- A transaction **holds a DB connection** (and row locks) for its whole duration → long transactions **exhaust the pool**, increase **lock contention/deadlocks**, and bloat undo logs.
- **Never call remote HTTP APIs, send emails, or publish messages inside** a transaction: they're **slow**, can't be rolled back, and a later rollback leaves the outside world inconsistent (email sent but order rolled back!).
- **Pattern:** do DB work in the transaction → trigger side effects **after commit** (`@TransactionalEventListener`, Q38) or via the **outbox** (Q41).

### Q33. 🟡 Can I mix `JdbcTemplate` and JPA in one transaction?
**Yes, if both use the same `DataSource`** and the manager is `JpaTransactionManager` — they share the same connection. **Trap:** Hibernate **delays SQL until flush**, so a `JdbcTemplate` query right after `repo.save()` may **not see** the new row. Call `entityManager.flush()` first (or use `saveAndFlush`). Also, after a JDBC update, Hibernate's persistence context may hold **stale entities** → `clear()`/`refresh()`.

### Q34. 🟡 Should controllers be `@Transactional`?
**No.** The transaction would stay open during JSON binding, validation, serialization and view rendering → longer DB connection hold, lazy-loading "magic", harder reasoning about boundaries. Put the boundary in the **service method** that performs the use case.

### Q35. 🟡 I catch `DataIntegrityViolationException` but it doesn't work — why?
**Two reasons:**
1. **Flush timing** — the constraint violation occurs at **flush/commit**, which may be **after** your `try/catch` block (e.g., at the end of the transactional method, outside your catch). Use `saveAndFlush()` inside the `try`.
2. **Rollback-only** — even if caught, the transaction (and the Hibernate session) is usually **already marked rollback-only/unusable** → further DB work fails. Handle it **outside** the transactional boundary or run the risky write in `REQUIRES_NEW`.
(See "upsert under concurrency" in `spring-data-jpa.md` Q98.)

### Q36. 🟡 Why does `@Transactional` silently do nothing on a `final` class (or Kotlin class)?
CGLIB creates a **subclass**; `final` classes/methods can't be subclassed/overridden → no proxy interception. In Kotlin, classes are `final` by default → use the **`kotlin-spring` (all-open)** plugin. Symptom: no error, no transaction. Also true when the bean is created with **`new`** (not a Spring bean) → no proxy at all.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Attributes](#2-transactional-attributes) &nbsp;|&nbsp; Next: [Programmatic, Events & Messaging →](#4-programmatic-transactions-events--messaging)

---

## 4. Programmatic Transactions, Events & Messaging

### Q37. ⭐🟡 What is `TransactionTemplate` and when do you use it?
**In one line:** A helper for **programmatic** transactions — a transaction around a **lambda**.

```java
@Service
public class ReportService {
    private final TransactionTemplate tx;
    public ReportService(PlatformTransactionManager tm) {
        this.tx = new TransactionTemplate(tm);
        this.tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public void run() {
        callRemoteApi();                                       // outside any transaction ✅

        Report r = tx.execute(status -> {                       // transaction starts here
            Report saved = repo.save(build());
            if (invalid(saved)) status.setRollbackOnly();       // programmatic rollback
            return saved;
        });                                                     // commit/rollback here
        notify(r);                                              // after commit ✅
    }
}
```
**Use when:** you need a **narrow transaction scope** inside a bigger method, **per-item** transactions in a loop, **self-invocation** without refactoring, dynamic propagation/isolation, or to keep remote calls **outside** the transaction. Also `executeWithoutResult(...)` (Spring 5.2+).

### Q38. ⭐🟡 What is `@TransactionalEventListener`? Why use it?
**In one line:** A listener that runs **only after the transaction reaches a given phase** — typically **after commit** — so side effects fire only if the data is really saved.

```java
// 1) Publish inside the transaction
@Service
class OrderService {
    private final ApplicationEventPublisher events;
    @Transactional
    public void place(Order o) {
        orderRepo.save(o);
        events.publishEvent(new OrderPlaced(o.getId()));     // not delivered yet
    }
}

// 2) Handle after commit
@Component
class OrderNotifier {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderPlaced(OrderPlaced e) { emailService.sendConfirmation(e.orderId()); }
}
```
| Phase | Runs |
|-------|------|
| `BEFORE_COMMIT` | Just before commit (still in tx) |
| `AFTER_COMMIT` (default) | After successful commit |
| `AFTER_ROLLBACK` | After rollback |
| `AFTER_COMPLETION` | After either |

**Traps:**
- If **no transaction is active**, the event is **dropped** unless `fallbackExecution = true`.
- In `AFTER_COMMIT`, the original transaction is **finished** — to write to the DB again, the listener needs `@Transactional(propagation = REQUIRES_NEW)`; exceptions in the listener **don't roll back** the original commit.
- It is **in-memory & non-durable**: if the JVM crashes after commit but before the handler runs, the event is **lost** → for guaranteed delivery use the **Outbox** (Q41).

### Q39. 🟡 How do you run code right after commit without events?
```java
TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
    @Override public void afterCommit() { kafka.send("orders", payload); }
});
```
Works only if a transaction is active (check `isSynchronizationActive()`). Same non-durability caveat as Q38.

### Q40. ⭐🔴 What is the dual-write problem?
**In one line:** Writing to **two systems** (DB + Kafka/another service) in one operation can't be atomic — one can succeed while the other fails.

```java
@Transactional
public void place(Order o) {
    orderRepo.save(o);                     // 1) DB write
    kafka.send("order-created", o);        // 2) message write
}
```
| Failure | Result |
|---------|--------|
| Kafka send fails/crashes **after** DB commit | Order exists, **no event** → downstream never knows |
| Event sent, then **DB rolls back** | Event for an order that **doesn't exist** |
| Send inside the tx but commit fails | Phantom event |

There is **no 2-phase commit** between a relational DB and Kafka in practice. **Solution:** the **Transactional Outbox** pattern (Q41).

### Q41. ⭐🔴 Explain the Transactional Outbox pattern and how to implement it.
**In one line:** Write the **business data and an "outbox" event row in the same DB transaction**; a **separate relay** publishes outbox rows to the broker.

```
┌──────────────── one local DB transaction ────────────────┐
│ INSERT order …          INSERT outbox(event_id, topic,   │
│                                payload, created_at, sent) │
└───────────────────────────────────────────────────────────┘
                 │ relay (poller or CDC) reads unsent rows
                 ▼
             Kafka topic  ─►  consumers (must be IDEMPOTENT)
```
```java
@Transactional
public void place(Order o) {
    orderRepo.save(o);
    outboxRepo.save(new OutboxEvent(UUID.randomUUID(), "order-created", toJson(o)));   // same tx ✅
}

@Scheduled(fixedDelay = 1000)                       // polling publisher (simple)
@Transactional
public void relay() {
    outboxRepo.findTop100BySentFalseOrderByCreatedAt().forEach(e -> {
        kafka.send(e.getTopic(), e.getId().toString(), e.getPayload()).join();
        e.markSent();
    });
}
```
**Relay options:** **polling publisher** (simple; use `FOR UPDATE SKIP LOCKED` for multiple instances) or **CDC with Debezium** reading the DB log (low latency, no polling).
**Guarantees:** **at-least-once** delivery → duplicates possible → consumers must be **idempotent** (Q42). Clean up old rows.

### Q42. 🟡 What is idempotency and how do you make consumers idempotent?
**In one line:** Processing the same message **twice** gives the **same result as once**.

**Techniques:**
- Store processed **event/message ids** in a table with a **unique constraint** (`INSERT` first; duplicate → skip).
- Use **natural idempotency**: `UPSERT`, "set status = PAID" (not "add 100").
- For HTTP APIs: **`Idempotency-Key`** header with a stored result.
```java
@Transactional
public void handle(PaymentEvent e) {
    if (!processed.tryInsert(e.eventId())) return;     // unique key violation → already handled
    ledger.apply(e);                                    // same tx → either both or neither
}
```

### Q43. 🔴 How do Kafka transactions relate to `@Transactional`?
- Kafka supports **producer transactions** (atomic writes across topics/partitions + consumed offsets = **exactly-once within Kafka**): set `spring.kafka.producer.transaction-id-prefix=tx-` → Spring Boot configures a `KafkaTransactionManager`.
- It **does not** make DB + Kafka atomic. Spring can synchronise "best effort" (commit DB, then Kafka) but the **window of inconsistency remains** → use the **Outbox** (Q41) for DB↔Kafka, and Kafka transactions for **Kafka→process→Kafka** pipelines.
- Details: `spring-boot-microservices-kafka.md`.

### Q44. 🔴 What is the order problem between `@Retryable` and `@Transactional`?
**In one line:** A retry must start a **new transaction each attempt**; if the retry advice is **inside** the transaction, the retries run in the **same (possibly poisoned/rollback-only)** transaction.

**Right design:** the **retry wraps the transactional call** — put `@Retryable` on a **caller bean** that invokes a separate `@Transactional` bean, **or** give the retry advisor **higher precedence** than the transaction advisor (`@EnableRetry(order = Ordered.HIGHEST_PRECEDENCE)`; lower number = outer) so every attempt starts a fresh transaction.
Retry only on **transient** errors (deadlock, optimistic lock, serialization failure) with backoff; never retry non-idempotent side effects blindly.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Traps](#3-traps--pitfalls) &nbsp;|&nbsp; Next: [Distributed Transactions →](#5-distributed-transactions-saga--outbox)

---

## 5. Distributed Transactions, Saga & Outbox

### Q45. ⭐🟡 Why are distributed transactions hard in microservices?
**In one line:** Each service owns **its own database**, so one business action spans **several local transactions** — there's **no single `commit`** that covers them all.

**Example — place an order:** Order Service (DB-1) → Payment Service (DB-2) → Inventory Service (DB-3). If payment succeeds but inventory fails, `@Transactional` in one service **cannot** roll back the others.
**Options:** (a) **2-phase commit/XA** — strong consistency, but slow, blocking, poorly supported (Q46). (b) **Saga** — a chain of local transactions with **compensations** (Q47). (c) Redesign boundaries so the operation lives in **one service/DB**.
**Interview tip:** The mature answer: *"We accept **eventual consistency**, use **Saga + Outbox + idempotent consumers**."*

### Q46. 🟡 What are 2PC / XA / JTA and why are they usually avoided?
**2-Phase Commit:** a coordinator asks all resources to **prepare** (vote), then tells all to **commit** or **rollback**. In Java: **JTA** with an **XA** transaction manager (Atomikos, Narayana, Bitronix) and XA-capable resources.
**Why avoided in microservices:** locks held across services during the protocol (**latency, low throughput**), coordinator is a **single point of failure**, **not supported** by Kafka/REST/most NoSQL, tight temporal coupling, poor cloud-native fit.
**Still OK for:** two databases/queues inside **one** monolith where strong atomicity is mandatory and XA is supported.

### Q47. ⭐🔴 What is the Saga pattern? Choreography vs orchestration?
**In one line:** A **saga** is a sequence of **local transactions**; if one step fails, **compensating transactions** undo the previous steps.

**Choreography (events, no central brain):**
```
OrderService ─OrderCreated─► PaymentService ─PaymentCompleted─► InventoryService ─StockReserved─► OrderService (CONFIRMED)
                                   │ PaymentFailed ─────────────────────────────────────────────► OrderService (CANCELLED)
                                                                   InventoryService ─StockFailed─► PaymentService (REFUND) ─► OrderService (CANCELLED)
```
**Orchestration (a coordinator tells each service what to do):**
```
OrderSagaOrchestrator: create order → command Payment → command Inventory → on failure: compensate in reverse order
```
| | Choreography | Orchestration |
|---|--------------|---------------|
| Coupling | Services react to events (loose) | Services take commands from orchestrator |
| Visibility | Hard to see the whole flow | **Central, explicit** flow/state |
| Complexity | Grows fast with more steps (event spaghetti) | Orchestrator is an extra component |
| Good for | Few steps, simple flows | Many steps, complex rules, timeouts |
**Tools:** Spring Events/Kafka, **Axon**, **Temporal**, **Camunda/Zeebe**, Eventuate Tram, Spring State Machine.

### Q48. 🟡 What is a compensating transaction? Give an example and its rules.
**In one line:** A **business-level undo** (not a DB rollback) for a step that already committed.

| Action (committed) | Compensation |
|--------------------|--------------|
| Create order (PENDING) | Mark order **CANCELLED** |
| Charge card | **Refund** |
| Reserve stock | **Release** stock |
| Send email | Can't unsend → send "order cancelled" email |
**Rules:** compensations must be **idempotent** and **retryable** (they may run more than once), must be designed **up front**, some steps are **non-compensatable** (emails) → put them **last** (pivot/"point of no return" design); use **semantic locks** (status `PENDING`) to avoid dirty reads of half-finished data.

### Q49. 🟡 What is eventual consistency, and how do you handle failures and duplicates?
**In one line:** Different services may **temporarily disagree**, but **converge** to a consistent state.
**Practices:** **idempotent** handlers (Q42) · **retries with backoff** + **dead-letter topics** for poison messages · **timeouts** and saga state (`PENDING → CONFIRMED/CANCELLED`) · **ordering** via Kafka partition keys (e.g., `orderId`) · **monitoring** stuck sagas · UX that shows "processing" instead of pretending instant success.

### Q50. 🟡 One service writing to two databases — how do you handle transactions?
- Prefer **one database per service** (re-think boundaries) or **one primary write + async event for the second** (outbox).
- With two `DataSource`s you need two transaction managers; a single `@Transactional` binds **one**. **`ChainedTransactionManager`** gave "best-effort 1PC" (commit in reverse order) but is **deprecated/removed in newer Spring Data** and still can't guarantee atomicity.
- If strict atomicity is truly required → **XA/JTA** (Atomikos/Narayana) and XA-capable drivers — accept the cost.
- Otherwise: write to DB-1 transactionally, then **outbox → consumer updates DB-2** idempotently.

### Q51. 🔴 What are TCC, CDC and event sourcing — how do they relate?
- **TCC (Try-Confirm/Cancel):** each service exposes *try* (reserve), *confirm*, *cancel* — like a saga with explicit reservations; more work but better isolation.
- **CDC (Change Data Capture, e.g., Debezium):** streams DB log changes to Kafka — a reliable **outbox relay** without polling, also for data sync.
- **Event sourcing + CQRS:** state is the **sequence of events**; naturally publishes events and fits sagas, but adds significant complexity (replay, versioning, read models) — use only when the domain benefits.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Programmatic, Events & Messaging](#4-programmatic-transactions-events--messaging) &nbsp;|&nbsp; Next: [Scenarios, Testing & Debugging →](#6-scenarios-testing--debugging)

---

## 6. Scenarios, Testing & Debugging

### Q52. ⭐🔴 Scenario: money transfer — two concurrent transfers touch the same account. How do you keep it correct?
```java
@Service
public class TransferService {

    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amt) {
        // lock in a CONSISTENT order (lowest id first) to avoid deadlocks
        Long first = Math.min(fromId, toId), second = Math.max(fromId, toId);
        Account a1 = accountRepo.findForUpdate(first);      // @Lock(PESSIMISTIC_WRITE) → SELECT … FOR UPDATE
        Account a2 = accountRepo.findForUpdate(second);
        Account from = a1.getId().equals(fromId) ? a1 : a2;
        Account to   = from == a1 ? a2 : a1;

        if (from.getBalance().compareTo(amt) < 0) throw new InsufficientFundsException();  // unchecked → rollback
        from.debit(amt);
        to.credit(amt);                                      // dirty checking → 2 UPDATEs, one commit
    }
}
```
**Why this works:** one transaction = atomic debit+credit; **row locks** serialise concurrent updates (no lost update); **ordered locking** prevents deadlocks; an **unchecked** exception triggers rollback.
**Alternative for low contention:** **optimistic locking** (`@Version`) + **retry** on `ObjectOptimisticLockingFailureException`.
**Follow-ups:** idempotency key to avoid double-submit; ledger table (append-only entries) instead of mutating balances; **don't call external payment APIs inside the transaction**.

### Q53. ⭐🔴 Scenario: two users buy the last item simultaneously (overselling / double booking). How do you prevent it?
**Options (pick based on contention):**
1. **Atomic conditional update** (often best & simplest):
```java
@Modifying
@Query("update Stock s set s.qty = s.qty - :n where s.sku = :sku and s.qty >= :n")
int reserve(@Param("sku") String sku, @Param("n") int n);     // returns 0 if not enough stock
// if (reserve(..) == 0) throw new OutOfStockException();
```
2. **Pessimistic lock** (`SELECT … FOR UPDATE`) then check-and-decrement — fine for hot rows, but throughput drops.
3. **Optimistic lock** (`@Version`) + retry — good for low contention.
4. **Unique constraint** for single-owner resources (seat, username): `INSERT` and catch the violation.
5. Very hot items → **queue/serialise** requests (Kafka partition per sku, Redis atomic `DECR`).
**Wrong answer:** `if (stock > 0) stock--` with no lock/constraint — classic **check-then-act race**.

### Q54. 🟡 How do you handle deadlocks and serialization failures?
**Causes:** two transactions lock rows in **different orders**; long transactions; missing indexes (locks wide ranges).
**Mitigation:** consistent **lock ordering**; **short** transactions; proper indexes; **retry** on `CannotAcquireLockException` / `DeadlockLoserDataAccessException` / `PessimisticLockingFailureException` / `CannotSerializeTransactionException` with backoff (retry **outside** the transaction, Q44); set lock/statement **timeouts**.

### Q55. ⭐🔴 Why can `@Transactional` on test methods hide production bugs?
**In one line:** Spring test transactions **roll back at the end of each test** — so the **commit never happens**.

**What it hides:**
- **Flush/constraint errors that occur at commit** (the test never flushes) → add `em.flush()`.
- **`@TransactionalEventListener(AFTER_COMMIT)`** and `afterCommit` hooks **never fire**.
- **`LazyInitializationException`** (everything stays in one open persistence context).
- `REQUIRES_NEW` visibility differences, isolation/locking behaviour, outbox relay logic.
- With `@SpringBootTest(webEnvironment = RANDOM_PORT)` the server runs in **another thread**, so the test's transaction does **not** wrap the request at all (and the rollback doesn't clean data).
**Good practice:** for commit-sensitive behaviour use **`@Commit`**, `TransactionTemplate` in the test, or **no** `@Transactional` + clean data explicitly; use **Testcontainers** (real DB); assert behaviour **after** commit. See `spring-boot-testing.md`.

### Q56. 🟡 How do you debug "is my code in a transaction?"
```properties
logging.level.org.springframework.transaction.interceptor=TRACE     # begin/commit/rollback + method names
logging.level.org.springframework.orm.jpa.JpaTransactionManager=DEBUG
logging.level.org.hibernate.SQL=DEBUG
```
```java
log.info("tx active={}, name={}",
    TransactionSynchronizationManager.isActualTransactionActive(),
    TransactionSynchronizationManager.getCurrentTransactionName());   // e.g. com.app.OrderService.place
```
Also watch Hikari metrics (active/pending connections) to spot long/leaked transactions.

### Q57. ⭐🟡 "My `@Transactional` isn't working" — what's your checklist?
1. **Self-invocation?** (Q21) → move to another bean / `TransactionTemplate`.
2. Method **public**, class/method **not final**, bean created by **Spring** (not `new`)? (Q22, Q36)
3. **Exception swallowed** by try/catch? (Q23) **Checked exception**? (Q24) → `rollbackFor`.
4. **Rollback-only** inner failure? (Q25).
5. Wrong **propagation** (`REQUIRED` joined an outer read-only transaction?) (Q29).
6. Wrong **transaction manager/datasource** in multi-DB setup? (Q18)
7. Running on **another thread** (`@Async`, streams)? (Q26)
8. Using `@Transactional` from **`javax`/`jakarta` vs Spring**: correct import `org.springframework.transaction.annotation.Transactional` (the Jakarta one works but has fewer attributes).
9. **Proxy not applied** (annotation on interface with CGLIB, `@PostConstruct`, startup code)? (Q19, Q27)
10. Not actually a **DB problem** — Hibernate **delays SQL** until flush; the data isn't visible to a `JdbcTemplate`/other session until commit/flush (Q33).
Turn on transaction TRACE logging (Q56) — it shows immediately whether a transaction started.

### Q58. ⭐🟢 Explain Spring transactions in 60 seconds (project-style answer).
> "I put `@Transactional` on **service-layer** methods, one transaction per business use case. It works through a **proxy** that binds a connection and persistence context to the **thread**, commits on success and **rolls back on runtime exceptions** — I use `rollbackFor` when business exceptions are checked. I'm careful about proxy traps: **self-invocation**, private/final methods, swallowed exceptions and `UnexpectedRollbackException`.
> I use `REQUIRED` by default and `REQUIRES_NEW` only for things that must survive a rollback, like audit. I keep transactions **short**, no remote calls inside, and `readOnly = true` for reads. For concurrency I use `@Version` optimistic locking with retries, or pessimistic locks for hot rows with ordered locking.
> Across services I don't use 2PC — I use **Saga with the Transactional Outbox**, idempotent consumers, and `@TransactionalEventListener` for after-commit side effects. In tests I remember that test transactions roll back and can hide commit-time bugs."

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Distributed Transactions](#5-distributed-transactions-saga--outbox)

---

## ✅ Last-minute cheat sheet

| Topic | One-liner to remember |
|-------|----------------------|
| How it works | **Proxy** + `TransactionInterceptor` + **thread-bound** connection |
| Where to put it | **Service layer**, public methods, concrete classes |
| Default rollback | `RuntimeException` + `Error` only; **checked → commit** |
| `rollbackFor = Exception.class` | Roll back on checked exceptions too |
| `REQUIRED` | Join existing or create (default) |
| `REQUIRES_NEW` | Suspend & start independent tx (2nd connection!) |
| `NESTED` | Savepoint in the same tx |
| Isolation default | DB default (Postgres/Oracle: READ_COMMITTED; MySQL: REPEATABLE_READ) |
| `readOnly` | Hint: no dirty checking, MANUAL flush; not a guard |
| Self-invocation | `this.m()` bypasses proxy → no tx / no propagation |
| Swallowed exception | Caught inside → **commit** |
| `UnexpectedRollbackException` | Inner REQUIRED failed + outer caught → rollback-only |
| New thread | **No** transaction (ThreadLocal) |
| `TransactionTemplate` | Programmatic, narrow scope, avoids proxy limits |
| `@TransactionalEventListener` | After-commit side effects (non-durable) |
| Dual-write problem | DB + Kafka can't be atomic → **Outbox** |
| Distributed tx | Avoid 2PC → **Saga + compensation + idempotency** |
| Oversell / lost update | Atomic update / `FOR UPDATE` / `@Version` + retry |
| Tests | `@Transactional` tests roll back → hide commit-time bugs |

## 🎤 How to answer in an interview (template)
1. **One-line definition.**
2. **Why it exists / analogy.**
3. **Tiny code example** (service + annotation).
4. **The trap** (proxy, thread, exception type, flush timing).
5. **What you do in real projects** (service layer, short tx, outbox, tests with real DB).

## 📚 References
- [JavaInUse – Spring Transaction Interview Questions](https://www.javainuse.com/spring/transaction-interview)
- [Medium (CodeToDeploy) – Spring @Transactional Interview Questions: 25 Traps](https://medium.com/codetodeploy/spring-transactional-interview-questions-25-traps-every-java-developer-should-know-92b1903f0526)
- [Spring Framework Reference – Transaction Management](https://docs.spring.io/spring-framework/reference/data-access/transaction.html)
- [Microservices.io – Saga & Transactional Outbox patterns](https://microservices.io/patterns/data/saga.html)
- [Debezium – Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html)
- [Vlad Mihalcea – Transactions & isolation](https://vladmihalcea.com/tutorials/hibernate/)

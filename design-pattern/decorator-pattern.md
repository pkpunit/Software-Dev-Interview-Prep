---
layout: docs
title: Decorator Design Pattern in Java
---

# Decorator Pattern

**Category:** Structural (it is about *how objects are put together*)

---

## 1. In One Line (plain English)

> **Wrap** an object inside another object that looks exactly the same from outside, but adds extra behavior before or after. You can stack wrappers like layers, in any combination, **without changing the original class or creating dozens of subclasses**.

**30-second interview answer:** "Decorator adds responsibilities to an object dynamically by wrapping it. The wrapper implements the same interface and delegates to the wrapped object, adding behavior around the call. It's an alternative to subclassing and avoids class explosion. `BufferedInputStream(new FileInputStream(...))` is the classic Java example."

---

## 2. The Real-Life Story

**Ordering coffee.**

You start with a plain **coffee** (cost 50). Now add:
- **milk** (+10)
- **sugar** (+5)
- **whipped cream** (+20)

It is still a coffee. But each add-on **wraps** the previous order and changes the final description and price.

```
WhippedCream( Sugar( Milk( Coffee ) ) )
cost = 20 + 5 + 10 + 50 = 85
```

If you made a **subclass** for each combo: `CoffeeWithMilk`, `CoffeeWithMilkAndSugar`, `CoffeeWithSugarAndCream`... with 4 add-ons that's **16 classes**; with 10 add-ons, **1024**. Decorators need **10 small classes** and you mix them as you like.

Another picture: **clothes**. You're still you (same interface), but T-shirt + sweater + raincoat each add a capability. Add or remove layers freely.

---

## 3. The Problem (what hurts without it)

You have a `UserRepository` that reads from a database. Now you want: logging, caching, and retry. Different places need different combos.

**Approach 1: subclass each combo**
```java
class LoggedUserRepository extends DbUserRepository { ... }
class CachedUserRepository extends DbUserRepository { ... }
class LoggedCachedUserRepository extends DbUserRepository { ... }   // copy-paste of the above two
class CachedRetryUserRepository extends DbUserRepository { ... }
// ... explosion
```

**Approach 2: put everything in one class**
```java
class DbUserRepository {
    User find(long id) {
        log.info(...);               // logging mixed in
        if (cache.has(id)) ...       // caching mixed in
        for (retry...) { ... }       // retry mixed in
        // actual DB code is lost in the middle
    }
}
```
Messy, can't turn features off, violates Single Responsibility.

---

## 4. The Solution (step by step)

**Step 1.** Have a common **interface** (`UserRepository`).

**Step 2.** The real worker implements it (`DbUserRepository`).

**Step 3.** Each extra feature is a **decorator class** that:
- implements the same interface,
- holds another `UserRepository` inside (the one it wraps),
- calls the inner one, and adds its own behavior around it.

**Step 4.** Stack them when creating the object.

```
Client ──▶ [Logging] ──▶ [Caching] ──▶ [DbUserRepository]
              │              │               │
         adds timing    adds cache       real work
```
The client sees only a `UserRepository` and has no idea how many layers are inside.

---

## 5. Full Working Code

```java
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

// Step 1: common interface
interface UserRepository {
    String findNameById(long id);
}

// Step 2: the real worker
class DbUserRepository implements UserRepository {
    public String findNameById(long id) {
        System.out.println("  -> DB hit for id " + id);
        return "user-" + id;
    }
}

// Step 3a: decorator that adds LOGGING
class LoggingUserRepository implements UserRepository {
    private final UserRepository delegate;                    // the wrapped object

    LoggingUserRepository(UserRepository delegate) { this.delegate = delegate; }

    public String findNameById(long id) {
        long start = System.nanoTime();
        try {
            return delegate.findNameById(id);                 // pass the call down
        } finally {
            long micros = (System.nanoTime() - start) / 1_000;
            System.out.println("findNameById(" + id + ") took " + micros + " us");
        }
    }
}

// Step 3b: decorator that adds CACHING
class CachingUserRepository implements UserRepository {
    private final UserRepository delegate;
    private final Map<Long, String> cache = new ConcurrentHashMap<>();

    CachingUserRepository(UserRepository delegate) { this.delegate = delegate; }

    public String findNameById(long id) {
        return cache.computeIfAbsent(id, delegate::findNameById);   // call DB only on a miss
    }
}

public class Main {
    public static void main(String[] args) {
        // Step 4: stack. Read inside-out: DB, then cache around it, then logging around that
        UserRepository repo =
                new LoggingUserRepository(
                    new CachingUserRepository(
                        new DbUserRepository()));

        repo.findNameById(1);   //   -> DB hit for id 1       (first time: goes to DB)
        repo.findNameById(1);   //   (no DB line)             (second time: served from cache)
    }
}
```

**Order matters:**
- `Logging(Caching(Db))` logs **every call**, including cache hits.
- `Caching(Logging(Db))` logs **only real DB calls** (the logging sits behind the cache).

Choose the order on purpose.

---

## 6. The Classic JDK Example: I/O Streams

```java
InputStream in = new BufferedInputStream(          // adds buffering
                    new GZIPInputStream(            // adds un-zipping
                        new FileInputStream("data.gz")));   // the real file reader
```
Each wrapper **is an `InputStream`** and **has an `InputStream`**. That's the whole pattern. Want encryption too? Wrap another layer. No new subclass needed.

Other JDK ones: `Collections.unmodifiableList(list)`, `Collections.synchronizedList(list)`, `HttpServletRequestWrapper`.

---

## 7. Decorator in Spring (you already use it)

- **`@Transactional`, `@Cacheable`, `@Retryable`, `@Async`**: Spring wraps your bean in a proxy that adds transactions/caching/retry around your method. It's built with proxies, which behave like decorators added automatically.
- **Spring Security filter chain**: each filter wraps the request handling.
- **`BeanPostProcessor`**: lets Spring replace your bean with a wrapped version.

Interview line: "Spring AOP is decorator-style behavior applied automatically through dynamic proxies, so I don't write wrapper classes by hand."

---

## 8. When to Use / When NOT to Use

**Use it when:**
- You want to **add features to individual objects** at runtime (not to the whole class).
- Features are **optional and combinable** (logging, caching, metrics, retry, compression, encryption).
- Subclassing would create too many classes or isn't possible (`final` class, third-party class with an interface).

**Do NOT use it when:**
- The interface is huge (every decorator must forward every method).
- You always need the same fixed set of features. Just put them in the class.
- You need to change the **interface** itself. That's Adapter.
- Order-dependent layers would be confusing for the team. Consider AOP or a pipeline/middleware instead.

---

## 9. Anti-Patterns (mistakes people make)

### Mistake 1: Subclass explosion
`LoggedCachedRetryRepo`... **Fix:** one small decorator per feature, stacked.

### Mistake 2: Decorator doesn't implement the same interface
Then clients can't treat it like the original, and you can't stack it. **Fix:** same interface, always.

### Mistake 3: Changing the meaning of the method
```java
public String findNameById(long id) {
    try { return delegate.findNameById(id); }
    catch (Exception e) { return null; }     // BAD: swallowing errors changes the contract
}
```
Callers expect the same behavior as the original plus an extra. **Fix:** keep the contract (Liskov Substitution). Log and re-throw.

### Mistake 4: Fat interface
20 methods = 20 pass-through methods per decorator. **Fix:** keep interfaces small, or use a base `Decorator` class that forwards by default.

### Mistake 5: Hidden order dependence
Retry outside a timeout vs inside it behaves differently. **Fix:** document order and keep wiring in **one place** (configuration).

### Mistake 6: `instanceof` checks on the wrapped type
```java
if (repo instanceof DbUserRepository) ...   // BAD: fails as soon as it's wrapped
```
**Fix:** depend only on the interface.

### Mistake 7: Stateful decorators shared across threads without care
The cache in section 5 uses `ConcurrentHashMap` on purpose. **Fix:** make decorators thread-safe if they are shared.

### Mistake 8: Very deep stacks
Ten layers produce monster stack traces. **Fix:** group related behavior, or use AOP/middleware chains.

---

## 10. Decorator vs Similar Patterns (favourite interview topic)

| Compare | Difference in simple words |
|---|---|
| **Decorator vs Proxy** | Both wrap an object with the same interface. **Decorator adds new behavior** and the client builds the stack. **Proxy controls access** (lazy loading, security, remote call, caching) and often creates/hides the real object itself. |
| **Decorator vs Adapter** | Adapter **changes** the interface to fit another. Decorator **keeps** the interface and adds behavior. |
| **Decorator vs Inheritance** | Inheritance: fixed at compile time, applies to the whole class. Decorator: chosen at runtime, applies per object. |
| **Decorator vs Strategy** | Strategy swaps the **core algorithm** (the guts). Decorator wraps with **extra layers** (the skin). |
| **Decorator vs Chain of Responsibility** | Decorators all run (each wraps and delegates). In a chain, a handler may **stop** the request. |

Memory trick: **Proxy = guard at the door. Decorator = extra gear on the same person. Adapter = travel plug.**

---

## 11. Interview Questions & Easy Answers

**Q1. Why prefer Decorator over inheritance?**
It avoids class explosion, can be applied at runtime per object, and follows the Open/Closed Principle. Inheritance is fixed at compile time and tied to one class.

**Q2. Give a JDK example.**
`new BufferedReader(new InputStreamReader(new FileInputStream(f)))`. Each layer adds something (bytes to chars, buffering).

**Q3. Difference between Decorator and Proxy?**
Same structure, different intent. Decorator adds responsibilities; Proxy controls access.

**Q4. How is Spring AOP related?**
It wraps beans in dynamic proxies that add behavior (transactions, caching) around method calls. It acts like automatic decorators.

**Q5. Does order of decorators matter?**
Yes. Example: cache-then-log vs log-then-cache gives different logs. Retry outside/inside a timeout behaves differently.

**Q6. Give a project example.**
"We wrapped our payment-gateway client with `MetricsDecorator`, `RetryDecorator` and `CircuitBreakerDecorator`. Each was independently testable, and we toggled them per environment through config."

---

## 12. Cheat Sheet

- **Problem:** need to add optional features without subclass explosion.
- **Idea:** wrapper with the same interface + a reference to the wrapped object.
- **Win:** mix features at runtime; each class has one job.
- **Watch out:** order of layers, keep the contract, keep interface small.
- **Remember:** coffee with milk, sugar, cream. Or I/O streams.

---
layout: docs
title: Singleton Design Pattern in Java
---

# Singleton Design Pattern (Java)

## 1. What?

**Singleton** ensures a class has **exactly one instance** in the JVM and provides a **global access point** to it.

> Think: the President of a country, one printer spooler, one app-wide config.

```
Client A ──┐
Client B ──┼──► Singleton.getInstance() ──► [ the ONE instance ]
Client C ──┘
```

## 2. Why?

Use it when **one shared object** must coordinate things:

- Configuration / properties holder
- Logger
- Connection pool / thread pool
- Cache
- Registry (service locator, metrics)

Benefits: controlled access, saves memory/creation cost, consistent shared state.

## 3. How? (the recipe)

1. `private` constructor, so nobody can call `new`.
2. `private static` field holding the single instance.
3. `public static` method returning that instance.

---

## 4. Implementations

### 4.1 Eager Initialization

```java
public class EagerSingleton {
    private static final EagerSingleton INSTANCE = new EagerSingleton();

    private EagerSingleton() {}

    public static EagerSingleton getInstance() {
        return INSTANCE;
    }
}
```

| Pros | Cons |
|---|---|
| Simple, thread-safe (class loading guarantees it) | Created even if never used |
| No synchronization cost | No exception handling in constructor |

### 4.2 Static Block Initialization

```java
public class StaticBlockSingleton {
    private static final StaticBlockSingleton INSTANCE;

    static {
        try {
            INSTANCE = new StaticBlockSingleton();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create singleton", e);
        }
    }

    private StaticBlockSingleton() {}

    public static StaticBlockSingleton getInstance() {
        return INSTANCE;
    }
}
```

| Pros | Cons |
|---|---|
| Same as eager, plus exception handling | Still not lazy |

### 4.3 Lazy Initialization (NOT thread-safe)

```java
public class LazySingleton {
    private static LazySingleton instance;

    private LazySingleton() {}

    public static LazySingleton getInstance() {
        if (instance == null) {          // two threads can both pass this check
            instance = new LazySingleton();
        }
        return instance;
    }
}
```

| Pros | Cons |
|---|---|
| Created only when needed | **Not thread-safe**: may create multiple instances |

> Use only in single-threaded code. Avoid in real apps.

### 4.4 Synchronized Method

```java
public class SynchronizedSingleton {
    private static SynchronizedSingleton instance;

    private SynchronizedSingleton() {}

    public static synchronized SynchronizedSingleton getInstance() {
        if (instance == null) {
            instance = new SynchronizedSingleton();
        }
        return instance;
    }
}
```

| Pros | Cons |
|---|---|
| Lazy and thread-safe | Lock on **every** call, which is slow under high contention |

### 4.5 Double-Checked Locking (DCL)

```java
public class DclSingleton {
    private static volatile DclSingleton instance;   // volatile is MANDATORY

    private DclSingleton() {}

    public static DclSingleton getInstance() {
        if (instance == null) {                      // 1st check (no lock)
            synchronized (DclSingleton.class) {
                if (instance == null) {              // 2nd check (with lock)
                    instance = new DclSingleton();
                }
            }
        }
        return instance;
    }
}
```

| Pros | Cons |
|---|---|
| Lazy, thread-safe, locks only on first creation | More verbose |
| | Without `volatile` it is **broken** (instruction reordering can expose a half-built object) |

### 4.6 Bill Pugh / Static Holder (Recommended)

```java
public class HolderSingleton {

    private HolderSingleton() {}

    private static class Holder {
        private static final HolderSingleton INSTANCE = new HolderSingleton();
    }

    public static HolderSingleton getInstance() {
        return Holder.INSTANCE;      // Holder loads only on first call
    }
}
```

| Pros | Cons |
|---|---|
| Lazy, thread-safe, no `synchronized`, no `volatile` | Can still be broken by reflection / serialization |
| Relies on JVM class-loading guarantees; clean and fast | |

### 4.7 Enum Singleton (Best: Joshua Bloch's pick)

```java
public enum EnumSingleton {
    INSTANCE;

    private int counter;

    public int next() {
        return ++counter;
    }
}

// Usage
// EnumSingleton.INSTANCE.next();
```

| Pros | Cons |
|---|---|
| Thread-safe, serialization-safe, **reflection-safe** | Cannot extend another class (enums can implement interfaces) |
| Shortest code | Loaded with the enum class, not on a separate lazy trigger |

---

## 5. Comparison

| Approach | Lazy | Thread-safe | Reflection-safe | Serialization-safe | Verdict |
|---|:-:|:-:|:-:|:-:|---|
| Eager | No | Yes | No | No* | Fine for cheap objects |
| Static block | No | Yes | No | No* | Eager + try/catch |
| Lazy | Yes | **No** | No | No* | Avoid |
| Synchronized method | Yes | Yes | No | No* | Works, slow |
| Double-checked locking | Yes | Yes | No | No* | Good, needs `volatile` |
| Bill Pugh holder | Yes | Yes | No | No* | **Best for lazy** |
| Enum | No** | Yes | **Yes** | **Yes** | **Best overall** |

\* Add `readResolve()` to fix serialization.
\** Effectively loaded on first access of the enum class.

---

## 6. How Singletons Get Broken (and Fixes)

### Reflection

```java
Constructor<HolderSingleton> c = HolderSingleton.class.getDeclaredConstructor();
c.setAccessible(true);
HolderSingleton broken = c.newInstance();   // a second instance!
```

**Fix:** throw from the constructor if an instance already exists, or use an **enum**.

```java
private HolderSingleton() {
    if (Holder.INSTANCE != null) {
        throw new IllegalStateException("Already initialized");
    }
}
```

### Serialization

Deserializing creates a new object. **Fix:**

```java
public class SerializableSingleton implements java.io.Serializable {
    private static final SerializableSingleton INSTANCE = new SerializableSingleton();
    private SerializableSingleton() {}
    public static SerializableSingleton getInstance() { return INSTANCE; }

    protected Object readResolve() {
        return INSTANCE;
    }
}
```

### Cloning

**Fix:** don't implement `Cloneable`, or override `clone()` to throw `CloneNotSupportedException`.

### Multiple ClassLoaders

One instance **per ClassLoader**, not per JVM (relevant in app servers). No simple fix; be aware of it.

---

## 7. Quick Demo

```java
public class Main {
    public static void main(String[] args) {
        HolderSingleton a = HolderSingleton.getInstance();
        HolderSingleton b = HolderSingleton.getInstance();

        System.out.println(a == b);   // true: same object

        // Enum version
        System.out.println(EnumSingleton.INSTANCE.next()); // 1
        System.out.println(EnumSingleton.INSTANCE.next()); // 2
    }
}
```

---

## 8. Real-World Example: App Config

```java
public final class AppConfig {

    private final String env;
    private final int maxRetries;

    private AppConfig() {
        this.env = System.getProperty("app.env", "dev");
        this.maxRetries = Integer.getInteger("app.retries", 3);
    }

    private static class Holder {
        private static final AppConfig INSTANCE = new AppConfig();
    }

    public static AppConfig getInstance() {
        return Holder.INSTANCE;
    }

    public String getEnv()      { return env; }
    public int getMaxRetries()  { return maxRetries; }
}

// Usage
// int retries = AppConfig.getInstance().getMaxRetries();
```

---

## 9. Disadvantages of the Pattern Itself

- **Global state**: hidden dependencies, harder to reason about.
- **Hard to unit test**: can't easily mock or reset; tests leak state into each other.
- **Violates Single Responsibility**: class manages its own lifecycle plus its business logic.
- **Tight coupling**: callers depend on the concrete class.
- **Concurrency risk**: shared mutable state needs careful synchronization.

## 10. Modern Alternative: Dependency Injection

In Spring Boot, beans are **singleton-scoped by default**. The container manages one instance and injects it, so you get the benefit without the drawbacks.

```java
@Service   // singleton scope by default
public class PaymentService { }

@RestController
public class PaymentController {
    private final PaymentService service;

    public PaymentController(PaymentService service) {   // injected, mockable
        this.service = service;
    }
}
```

> Note: Spring's singleton is **one per ApplicationContext**, not a classic GoF singleton.

---

## 11. Interview Cheat Sheet

| Question | Short Answer |
|---|---|
| Best way to write a singleton? | Enum, or Bill Pugh holder if you need lazy loading |
| Why `volatile` in DCL? | Prevents reordering so no thread sees a partially constructed object |
| How to break a singleton? | Reflection, serialization, cloning, multiple classloaders |
| Is Spring `@Component` a singleton? | Yes by default, but one per container |
| Why is singleton an anti-pattern to some? | Global state and poor testability |

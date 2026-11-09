---
layout: docs
title: Strategy Design Pattern in Java
---

# Strategy Pattern

**Category:** Behavioral (it is about *how objects behave and talk to each other*)

---

## 1. In One Line (plain English)

> You have **many ways to do the same job**. Put each way in its own small class, and let the caller **pick one** at runtime, instead of writing a giant `if / else`.

**30-second interview answer:** "Strategy lets me swap an algorithm without touching the code that uses it. I put each algorithm behind an interface, and the main class just calls the interface. This removes big if-else blocks and makes adding a new variant a one-class change."

---

## 2. The Real-Life Story

Think of **Google Maps**. You type a destination. Now it asks: *Car? Bike? Walk? Train?*

- The goal is the same: **reach the destination**.
- The way of doing it is different: each mode calculates the route differently.
- Google Maps itself does not change. Only the *route-calculation method* changes.

That is Strategy:

| Maps world | Code world |
|---|---|
| Google Maps app | **Context** (the class that needs the job done) |
| "Calculate route" | **Strategy interface** |
| Car / Bike / Walk | **Concrete strategies** (different implementations) |
| You tapping the bike icon | Passing a strategy to the context |

---

## 3. The Problem (what hurts without it)

You run an e-commerce checkout. Discounts depend on customer type:

```java
class CheckoutService {
    double finalPrice(double amount, String customerType) {
        if (customerType.equals("REGULAR")) {
            return amount;
        } else if (customerType.equals("PREMIUM")) {
            return amount * 0.90;
        } else if (customerType.equals("EMPLOYEE")) {
            return amount * 0.70;
        } else if (customerType.equals("FESTIVAL")) {
            return amount * 0.80;
        }
        throw new IllegalArgumentException("Unknown type: " + customerType);
    }
}
```

What is wrong here?

1. **Every new discount = edit this same method.** Risk of breaking the old ones.
2. The method keeps growing; testing one rule means going through the whole ladder.
3. Two developers adding two discounts = merge conflicts in one file.
4. Typos like `"PREMUIM"` fail only at runtime.

This breaks the **Open/Closed Principle**: code should be *open for extension, closed for modification*. We want to **add** behavior by writing new code, not by **changing** working code.

---

## 4. The Solution (step by step)

**Step 1.** Find the part that changes (the discount calculation). Pull it out into an **interface**.

**Step 2.** Write **one class per variant**, each implementing that interface.

**Step 3.** The main class does not know *which* discount it is using. It just holds the interface and calls it.

**Step 4.** The caller decides which strategy to hand over.

```
CheckoutService  ────has a────▶  DiscountStrategy (interface)
                                        ▲
                  ┌─────────────────────┼──────────────────────┐
           RegularDiscount        PremiumDiscount        EmployeeDiscount
```

---

## 5. Full Working Code

```java
// Step 1: the strategy interface
@FunctionalInterface
interface DiscountStrategy {
    double apply(double amount);
}

// Step 2: one class per way of doing the job
class RegularDiscount implements DiscountStrategy {
    public double apply(double amount) { return amount; }
}

class PremiumDiscount implements DiscountStrategy {
    public double apply(double amount) { return amount * 0.90; }   // 10% off
}

class EmployeeDiscount implements DiscountStrategy {
    public double apply(double amount) { return amount * 0.70; }   // 30% off
}

// Step 3: context. It has NO idea which discount it is using
class CheckoutService {
    private final DiscountStrategy strategy;

    CheckoutService(DiscountStrategy strategy) {
        this.strategy = strategy;
    }

    double finalPrice(double amount) {
        return strategy.apply(amount);      // just delegate
    }
}

// Step 4: caller picks
public class Main {
    public static void main(String[] args) {
        System.out.println(new CheckoutService(new RegularDiscount()).finalPrice(1000));  // 1000.0
        System.out.println(new CheckoutService(new PremiumDiscount()).finalPrice(1000));  // 900.0

        // Java 8+: because it is a @FunctionalInterface, a lambda IS a strategy
        System.out.println(new CheckoutService(a -> a - 50).finalPrice(1000));            // 950.0 (flat Rs.50 off)
    }
}
```

**What just happened?**
- Adding a "Festival" discount tomorrow = create `FestivalDiscount`. **Nothing else changes.**
- Each strategy can be unit-tested alone.
- The lambda version shows the pattern is really just "pass behavior as a parameter".

---

## 6. Real Backend Version (Spring Boot, no if-else at all)

This is the style you want to show in interviews. Spring finds all strategy beans for you.

```java
public interface PaymentStrategy {
    String type();                 // the key: "UPI", "CARD", "NETBANKING"
    void pay(double amount);
}

@Component
class UpiPayment implements PaymentStrategy {
    public String type() { return "UPI"; }
    public void pay(double amount) { System.out.println("Paid " + amount + " via UPI"); }
}

@Component
class CardPayment implements PaymentStrategy {
    public String type() { return "CARD"; }
    public void pay(double amount) { System.out.println("Paid " + amount + " via Card"); }
}

@Service
class PaymentService {
    private final Map<String, PaymentStrategy> strategies;

    // Spring injects EVERY bean that implements PaymentStrategy
    PaymentService(List<PaymentStrategy> all) {
        this.strategies = all.stream()
                .collect(Collectors.toMap(PaymentStrategy::type, Function.identity()));
    }

    void pay(String type, double amount) {
        PaymentStrategy s = strategies.get(type);
        if (s == null) throw new IllegalArgumentException("Unsupported payment type: " + type);
        s.pay(amount);
    }
}
```

**Why this is beautiful:** to add `WalletPayment`, you only write one new `@Component`. `PaymentService` is never opened again.

---

## 7. Where You Have Already Seen It

| Place | Strategy | Variants |
|---|---|---|
| `Collections.sort(list, comparator)` | `Comparator` | sort by name, by age, by salary |
| `ThreadPoolExecutor` | `RejectedExecutionHandler` | Abort, CallerRuns, Discard |
| Spring Security | `PasswordEncoder` | BCrypt, Argon2, PBKDF2 |
| Spring | `Resource` loading | classpath, file, URL |

---

## 8. When to Use / When NOT to Use

**Use it when:**
- You see a growing `if / else if` or `switch` choosing between algorithms.
- The same task can be done in several interchangeable ways (pricing, sorting, routing, retry, compression, validation).
- You want to choose behavior at runtime (config, user input, feature flag).

**Do NOT use it when:**
- There are only 2 variants and they will never grow. A simple `if` is clearer.
- The variants are not really interchangeable (different inputs/outputs).

---

## 9. Anti-Patterns (mistakes people make)

### Mistake 1: Keeping the if-else and calling it Strategy
```java
// BAD: factory-style switch inside the service defeats the whole point
DiscountStrategy s;
if (type.equals("PREMIUM")) s = new PremiumDiscount();
else if (type.equals("EMPLOYEE")) s = new EmployeeDiscount();
```
**Fix:** use a `Map<String, Strategy>` (shown in section 6) or a simple enum-to-strategy lookup.

### Mistake 2: Strategies that keep changing state
```java
// BAD: one shared instance, many threads, mutable field
class BadDiscount implements DiscountStrategy {
    private double lastAmount;                 // shared mutable state!
    public double apply(double amount) {
        lastAmount = amount;                   // thread A overwrites thread B's value
        return lastAmount * 0.9;
    }
}
```
**Fix:** keep strategies **stateless**. Everything needed should come in as method arguments.

### Mistake 3: A fat interface
```java
// BAD: half of the strategies don't need most of these
interface PaymentStrategy { void pay(); void refund(); void schedule(); void exportReport(); }
```
**Fix:** one interface, one job. Split it up.

### Mistake 4: Context peeking inside the strategy
```java
if (strategy instanceof PremiumDiscount) { ... }   // BAD: breaks polymorphism
```
**Fix:** if the context needs to know the type, the behavior belongs in the strategy.

### Mistake 5: Over-engineering
Making 5 classes for two fixed options that never change. Keep it simple.

---

## 10. Strategy vs Similar Patterns (very common interview question)

| Compare | Difference in simple words |
|---|---|
| **Strategy vs State** | Strategy: *the caller* picks the algorithm and it usually stays. State: *the object itself* changes behavior as its state changes (e.g. Order: NEW → PAID → SHIPPED) and states often move to the next state. |
| **Strategy vs Template Method** | Strategy uses **composition** (plug in an object, change at runtime). Template Method uses **inheritance** (subclass overrides steps, fixed at compile time). |
| **Strategy vs Factory** | Factory decides **which object to create**. Strategy decides **which behavior to run**. They are often used together: a factory hands you the right strategy. |
| **Strategy vs Command** | Strategy = *how* to do something (algorithm). Command = *what* to do, packaged as an object (request, undo, queue). |

---

## 11. Interview Questions & Easy Answers

**Q1. Which SOLID principle does Strategy support?**
Open/Closed (add new behavior without modifying existing code). Also Single Responsibility (each strategy has one job) and Dependency Inversion (context depends on an interface, not concrete classes).

**Q2. How do lambdas relate to Strategy?**
If the strategy interface has one method, a lambda *is* a strategy. `Comparator` is the classic case.

**Q3. How would you pick the strategy at runtime?**
A map keyed by type/enum, a factory, or a config/feature flag. In Spring, inject `List<Strategy>` and build the map.

**Q4. Can strategies be Spring singletons?**
Yes, as long as they are stateless.

**Q5. Give a project example.**
"In our payment module we had UPI, card and wallet flows. I replaced a 200-line switch with a `PaymentStrategy` interface and one `@Component` per method. New payment types became a one-class change."

---

## 12. Cheat Sheet

- **Problem:** many algorithms + big if-else.
- **Idea:** interface + one class per algorithm + inject it.
- **Win:** add behavior by *adding* code, not *editing* code.
- **Watch out:** keep strategies stateless and the interface small.
- **Remember:** Google Maps travel modes.

---
layout: docs
title: Builder Design Pattern in Java
---

# Builder Pattern

**Category:** Creational (it is about *how objects get created*)

---

## 1. In One Line (plain English)

> When an object has **many fields (some required, some optional)**, don't use a giant constructor. Fill the values **one by one with clearly named steps**, then call `build()` to get the final object.

**30-second interview answer:** "Builder is for constructing complex objects step by step with readable, named methods. It avoids telescoping constructors and half-initialized objects, validates everything in `build()`, and gives me immutable results. In Java, `StringBuilder`, `HttpRequest.newBuilder()`, and Lombok's `@Builder` are everyday examples."

---

## 2. The Real-Life Story

You order a **custom burger**.

The counter person doesn't hand you a form with 12 boxes in a strict order. Instead you say:

> "Wheat bun, one chicken patty, **no onions**, extra cheese, add peri-peri sauce."

You mention only what matters, in any order, and the kitchen **assembles it at the end**.

| Burger world | Code world |
|---|---|
| Your spoken instructions | Builder methods (`.bun("wheat")`, `.extraCheese()`) |
| "That's all, make it" | `.build()` |
| The finished burger | The final immutable object |
| Optional extras | Optional fields |

---

## 3. The Problem (what hurts without it)

### Pain 1: Telescoping constructors
```java
class Order {
    Order(String id, String customerId, List<String> items) { ... }
    Order(String id, String customerId, List<String> items, String coupon) { ... }
    Order(String id, String customerId, List<String> items, String coupon, boolean giftWrap) { ... }
    Order(String id, String customerId, List<String> items, String coupon, boolean giftWrap, String note) { ... }
}

new Order("O-1", "C-9", items, null, true, null);   // what is true? what are the nulls??
```
Unreadable. Easy to swap two `String` arguments by mistake, and the compiler won't complain.

### Pain 2: JavaBean setters
```java
Order o = new Order();
o.setId("O-1");
o.setCustomerId("C-9");
// forgot o.setItems(...)    <- object is half-built and still usable
```
- Object is in an **invalid state** between calls.
- You can **never make it immutable** (setters change it forever).
- Not thread-safe.

---

## 4. The Solution (step by step)

**Step 1.** Make the product's constructor **private**, taking a `Builder`.

**Step 2.** Create a **static nested `Builder`** with the same fields.

**Step 3.** Each builder method sets one value and **returns `this`**, so calls can be chained.

**Step 4.** `build()` **validates** everything and creates the final object, which can have only `final` fields (immutable).

```
Order.builder("O-1","C-9") ──▶ .item("Keyboard") ──▶ .coupon("DIWALI10") ──▶ .build() ──▶ Order (immutable)
```

---

## 5. Full Working Code

```java
import java.util.*;

public final class Order {
    // all final = immutable
    private final String orderId;           // required
    private final String customerId;        // required
    private final List<String> items;       // required (at least 1)
    private final String couponCode;        // optional
    private final boolean giftWrap;         // optional
    private final String note;              // optional

    // private: the ONLY way in is through the Builder
    private Order(Builder b) {
        this.orderId = b.orderId;
        this.customerId = b.customerId;
        this.items = List.copyOf(b.items);   // defensive copy -> caller can't change it later
        this.couponCode = b.couponCode;
        this.giftWrap = b.giftWrap;
        this.note = b.note;
    }

    // required fields go in the entry method, so they can never be forgotten
    public static Builder builder(String orderId, String customerId) {
        return new Builder(orderId, customerId);
    }

    public static final class Builder {
        private final String orderId;
        private final String customerId;
        private final List<String> items = new ArrayList<>();
        private String couponCode;           // defaults: null / false
        private boolean giftWrap;
        private String note;

        private Builder(String orderId, String customerId) {
            this.orderId = Objects.requireNonNull(orderId, "orderId");
            this.customerId = Objects.requireNonNull(customerId, "customerId");
        }

        public Builder item(String item)     { this.items.add(item); return this; }
        public Builder coupon(String code)   { this.couponCode = code; return this; }
        public Builder giftWrap(boolean g)   { this.giftWrap = g; return this; }
        public Builder note(String note)     { this.note = note; return this; }

        public Order build() {
            // ALL validation lives here: an invalid Order can never exist
            if (items.isEmpty()) throw new IllegalStateException("An order needs at least one item");
            if (giftWrap && note == null) throw new IllegalStateException("Gift wrap needs a note");
            return new Order(this);
        }
    }

    // getters
    public String getOrderId()   { return orderId; }
    public String getCustomerId(){ return customerId; }
    public List<String> getItems(){ return items; }
    public String getCouponCode(){ return couponCode; }
    public boolean isGiftWrap()  { return giftWrap; }
    public String getNote()      { return note; }
}

public class Main {
    public static void main(String[] args) {
        Order order = Order.builder("O-1", "C-9")
                .item("Keyboard")
                .item("Mouse")
                .coupon("DIWALI10")
                .giftWrap(true)
                .note("Happy birthday!")
                .build();

        System.out.println(order.getItems());   // [Keyboard, Mouse]
    }
}
```

**Compare the call site:**
- Old: `new Order("O-1","C-9",items,"DIWALI10",true,"Happy birthday!")` (what is `true`?)
- New: every value has a **name**. It reads like a sentence.

---

## 6. Shortcut Used in Real Projects: Lombok

Writing builders by hand is boring. Most Spring Boot teams use Lombok:

```java
import lombok.Builder;
import lombok.Singular;
import lombok.Value;

@Value                   // makes all fields private final + getters, class immutable
@Builder
public class Order {
    String orderId;
    String customerId;
    @Singular List<String> items;      // generates .item("x") and .items(collection)
    String couponCode;
    boolean giftWrap;
    String note;
}

Order o = Order.builder().orderId("O-1").customerId("C-9").item("Keyboard").build();
```
Know the hand-written version for interviews; use Lombok in projects. Note: Lombok does not enforce "required" fields or custom validation for you unless you customize `build()`.

---

## 7. Variations You Should Know

### a) Records (Java 16+) for simple cases
```java
record Point(int x, int y) {}          // no builder needed for 2-3 fields
```

### b) `toBuilder()` (copy and tweak, nice with immutable objects)
```java
public Builder toBuilder() {
    Builder b = new Builder(orderId, customerId);
    b.items.addAll(items); b.couponCode = couponCode; b.giftWrap = giftWrap; b.note = note;
    return b;
}
Order changed = order.toBuilder().coupon("NEWYEAR").build();
```

### c) Step Builder / Telescoping-safe builder
Force required steps by returning different interfaces at each step, so the compiler stops you from skipping a required field. Used in some libraries; overkill for most code.

### d) Director (classic GoF)
A "director" class that knows recipes ("make a Margherita pizza") by calling builder steps in a fixed order. Rare in day-to-day Java.

---

## 8. Where You Have Already Seen It

| Place | Example |
|---|---|
| `StringBuilder` | `new StringBuilder().append("a").append("b").toString()` |
| Java 11 `HttpRequest` | `HttpRequest.newBuilder().uri(...).header(...).GET().build()` |
| `Stream.builder()` | build a stream by adding elements |
| `Locale.Builder`, `ProcessBuilder` | same idea |
| Spring | `UriComponentsBuilder`, `ResponseEntity.ok().header(...).body(...)`, `User.builder()` in Spring Security, `WebClient.builder()` |
| Kafka / AWS SDK | `ProducerRecord`, `PutObjectRequest.builder()` |

---

## 9. When to Use / When NOT to Use

**Use it when:**
- A class has **4+ fields** and several are optional.
- You want **immutable** objects with validation.
- Construction needs multiple steps or a fixed order of steps.
- You want readable test data (`aUser().withAge(30).build()`).

**Do NOT use it when:**
- The class has 2 or 3 simple fields. Use a constructor or a `record`.
- All fields are required and few. A constructor is clearer.
- The object is a plain DTO that frameworks fill via setters (e.g. some JPA entities need a no-arg constructor).

---

## 10. Anti-Patterns (mistakes people make)

### Mistake 1: Telescoping constructors
Shown in section 3. **Fix:** builder.

### Mistake 2: JavaBean setters for everything
Half-built objects, no immutability. **Fix:** builder + `final` fields.

### Mistake 3: No validation in `build()`
```java
public Order build() { return new Order(this); }   // BAD: allows empty items
```
**Fix:** check required/invalid combos in `build()`.

### Mistake 4: Storing the builder's mutable list directly
```java
this.items = b.items;   // BAD: builder (or caller) can still change the list later
```
**Fix:** `List.copyOf(b.items)`.

### Mistake 5: Reusing a builder across objects
```java
Order.Builder b = Order.builder("O-1","C-9").item("A");
Order o1 = b.build();
b.item("B");
Order o2 = b.build();   // o2 has A and B: state leaked from earlier use (fine only if intended)
```
**Fix:** create a fresh builder each time, or document the reuse.

### Mistake 6: Builder for a 2-field class
Pure noise. Use a constructor or `record`.

### Mistake 7: Required fields only checked at runtime when you could force them at compile time
**Fix:** take required fields in `builder(required1, required2)` as in our example.

---

## 11. Builder vs Similar Patterns

| Compare | Difference in simple words |
|---|---|
| **Builder vs Factory** | Factory returns a finished object in **one call**, choosing *which class*. Builder builds **one complex object over many calls**, controlling *how it's put together*. |
| **Builder vs Abstract Factory** | Abstract Factory returns a family of objects instantly. Builder constructs one object gradually. |
| **Builder vs Prototype** | Builder: start empty, add parts. Prototype: start from a complete copy, change parts. |
| **Builder vs Fluent interface** | Fluent = the chaining *style*. Builder = the *pattern* that uses chaining to construct an object. Not all fluent APIs are builders. |

---

## 12. Interview Questions & Easy Answers

**Q1. What problems does Builder solve?**
Telescoping constructors (too many parameters), unreadable `new X(null, true, null)` calls, half-initialized objects from setters, and mutable objects.

**Q2. How do you make the final object immutable?**
Private constructor, all fields `final`, no setters, defensive copy of collections (`List.copyOf`).

**Q3. Where does validation go?**
In `build()` (or the private constructor), so an invalid object is never created.

**Q4. Builder or constructor?**
Constructor/record for few required fields. Builder for many fields with optional ones.

**Q5. Is the Builder thread-safe?**
Usually not; builders are meant to be used by one thread to produce an immutable (thread-safe) result.

**Q6. Give a project example.**
"Our `NotificationRequest` had 12 fields, 8 optional. I replaced the constructors with a builder that validated channel-specific rules in `build()`, so invalid combos like SMS without a phone number couldn't be created."

---

## 13. Cheat Sheet

- **Problem:** too many constructor params, optional fields, setter-built half objects.
- **Idea:** private constructor + static nested builder + `build()`.
- **Win:** readable, validated, immutable.
- **Watch out:** defensive copies, validation in `build()`, don't overuse for tiny classes.
- **Remember:** ordering a custom burger.

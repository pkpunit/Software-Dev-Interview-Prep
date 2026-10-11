---
layout: docs
title: Factory Method Pattern
---

# Factory Method Pattern

> **One line:** Don't call `new` inside your business logic. Call a method that *returns* the object, and let a subclass decide *which* object.

**Category:** Creational | **Also known as:** Virtual Constructor

## Table of Contents

- [What](#what)
- [Why](#why)
- [How](#how)
- [Intuitive Example](#intuitive-example)
- [Code Example](#code-example)
- [Spring Example](#spring-example)
- [Variations](#variations)
- [Comparison](#comparison)
- [Anti-Patterns](#anti-patterns)
- [When to Use](#when-to-use)
- [In the JDK](#in-the-jdk)
- [Interview Questions](#interview-questions)
- [Cheat Sheet](#cheat-sheet)

---

## What

**GoF definition:** Define an interface for creating an object, but let subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses.

Four roles:

| Role | Responsibility | Logistics example |
|---|---|---|
| **Product** | Interface the client works with | `Transport` |
| **Concrete Product** | Actual implementations | `Truck`, `Ship` |
| **Creator** | Declares the factory method and holds the workflow that uses the product | `Logistics` |
| **Concrete Creator** | Overrides the factory method to return a specific product | `RoadLogistics`, `SeaLogistics` |

```
Creator (abstract)                      Product (interface)
 ├─ planDelivery()   ──── uses ──────►   ├─ load(cargo)
 └─ createTransport()  [abstract]        └─ deliver()
          ▲                                      ▲
   ┌──────┴────────┐                      ┌──────┴──────┐
RoadLogistics   SeaLogistics            Truck          Ship
 └─ returns new Truck()
```

---

## Why

### The problem: `new` scattered through business logic

```java
class LogisticsService {
    void planDelivery(String mode, String cargo) {
        Transport transport;
        if (mode.equals("ROAD")) {
            transport = new Truck();
        } else if (mode.equals("SEA")) {
            transport = new Ship();
        } else {
            throw new IllegalArgumentException("Unknown mode " + mode);
        }
        transport.load(cargo);
        transport.deliver();
    }
}
```

What hurts:

1. **Tight coupling:** the service knows every concrete class (`Truck`, `Ship`).
2. **Open/Closed violation:** adding air freight means editing this working, tested class.
3. **Duplication:** the same `if/else` gets copy-pasted wherever transport is needed.
4. **Hard to test:** you cannot swap in a fake `Transport` without changing the code.

### What the pattern buys you

- Business workflow is written **once**, against an interface.
- New variants are added by **adding a class**, not editing existing ones (OCP).
- Depends on abstractions, not concretions (DIP).
- Easy to test: override the factory method with a fake.

---

## How

1. Define the **Product** interface.
2. Implement **Concrete Products**.
3. Create an abstract **Creator** with:
   - an abstract **factory method** returning the Product interface
   - a **template workflow** that calls the factory method and uses the product
4. Create one **Concrete Creator** per product, overriding the factory method.
5. The client picks a creator (once, at the edge of the app) and talks to it through the `Creator` type only.

---

## Intuitive Example

**You run a courier company.** Every shipment follows the same process:

> plan route → load cargo → deliver → track

That process never changes. The only thing that differs is **the vehicle**:

- The road branch uses trucks.
- The sea branch uses ships.
- Tomorrow, the air branch uses planes.

Head office writes the process once (`planDelivery`). Each branch only answers one question: **"which vehicle do we use?"** (`createTransport`).

### Mental hooks (memorize these)

- **Parent writes the recipe, child chooses the ingredient.**
- **Hollywood Principle:** the parent calls the child's `createTransport()`, the child never calls the parent.
- **The Creator knows *when* and *why* to create; the subclass knows *what* to create.**
- **Smell test:** if a method that otherwise talks to an interface contains `new ConcreteClass()`, ask yourself, "should this be a factory method?"

---

## Code Example

```java
// ---------- Product ----------
interface Transport {
    void load(String cargo);
    void deliver();
}

// ---------- Concrete Products ----------
class Truck implements Transport {
    @Override public void load(String cargo) { System.out.println("Loading " + cargo + " onto a truck"); }
    @Override public void deliver()           { System.out.println("Driving cargo by road"); }
}

class Ship implements Transport {
    @Override public void load(String cargo) { System.out.println("Loading " + cargo + " into a container ship"); }
    @Override public void deliver()           { System.out.println("Sailing cargo across the sea"); }
}

// ---------- Creator ----------
abstract class Logistics {

    // Factory Method: subclasses decide the concrete Transport
    protected abstract Transport createTransport();

    // Template workflow: written once, never changes
    public final void planDelivery(String cargo) {
        Transport transport = createTransport();   // created lazily, per call
        System.out.println("Route planned for " + cargo);
        transport.load(cargo);
        transport.deliver();
    }
}

// ---------- Concrete Creators ----------
class RoadLogistics extends Logistics {
    @Override protected Transport createTransport() { return new Truck(); }
}

class SeaLogistics extends Logistics {
    @Override protected Transport createTransport() { return new Ship(); }
}

// ---------- Client ----------
public class FactoryMethodDemo {
    public static void main(String[] args) {
        run(new RoadLogistics(), "Laptops");
        run(new SeaLogistics(), "Containers");
    }

    // Depends only on Logistics: no concrete class is mentioned
    static void run(Logistics logistics, String cargo) {
        logistics.planDelivery(cargo);
    }
}
```

**Output:**

```
Route planned for Laptops
Loading Laptops onto a truck
Driving cargo by road
Route planned for Containers
Loading Containers into a container ship
Sailing cargo across the sea
```

### Adding air freight: zero edits to existing code

```java
class Plane implements Transport {
    @Override public void load(String cargo) { System.out.println("Loading " + cargo + " into cargo hold"); }
    @Override public void deliver()           { System.out.println("Flying cargo"); }
}

class AirLogistics extends Logistics {
    @Override protected Transport createTransport() { return new Plane(); }
}
```

### Testing: override the factory method with a fake

```java
@Test
void planDelivery_loadsAndDelivers() {
    Transport fake = mock(Transport.class);

    Logistics logistics = new Logistics() {
        @Override protected Transport createTransport() { return fake; }
    };

    logistics.planDelivery("Books");

    verify(fake).load("Books");
    verify(fake).deliver();
}
```

---

## Spring Example

In real Spring apps you rarely write one creator subclass per product. The common shape is a **registry-based factory**: Spring injects all implementations and the factory picks one by key.

> Strictly speaking this is a *Simple Factory / Strategy registry*, not the GoF inheritance form. It is what you will actually write at work, and it fixes the "giant switch" problem.

```java
public interface NotificationSender {
    String channel();
    void send(String to, String message);
}

@Component
class EmailSender implements NotificationSender {
    public String channel() { return "EMAIL"; }
    public void send(String to, String message) { /* JavaMailSender */ }
}

@Component
class SmsSender implements NotificationSender {
    public String channel() { return "SMS"; }
    public void send(String to, String message) { /* SMS gateway */ }
}

@Component
public class NotificationSenderFactory {

    private final Map<String, NotificationSender> senders;

    // Spring injects every NotificationSender bean
    public NotificationSenderFactory(List<NotificationSender> all) {
        // duplicate channel keys throw at startup: fail fast
        this.senders = all.stream()
                .collect(Collectors.toUnmodifiableMap(NotificationSender::channel, Function.identity()));
    }

    public NotificationSender get(String channel) {
        NotificationSender sender = senders.get(channel);
        if (sender == null) {
            throw new IllegalArgumentException("Unsupported channel: " + channel);
        }
        return sender;
    }
}

@Service
public class NotificationService {
    private final NotificationSenderFactory factory;

    public NotificationService(NotificationSenderFactory factory) { this.factory = factory; }

    public void notify(String channel, String to, String message) {
        factory.get(channel).send(to, message);
    }
}
```

Adding WhatsApp = add one `@Component` class. No existing class changes.

---

## Variations

### 1. Parameterized factory method

The creator takes a parameter and returns different products. Fine for a small, stable set, but it drifts toward the "God Switch" anti-pattern if it grows.

### 2. Static factory method (Effective Java, Item 1)

```java
List<String> list = List.of("a", "b");
Optional<String> opt = Optional.of("x");
```

Useful and common, but **not** the GoF pattern: static methods cannot be overridden, so there is no subclass decision.

### 3. Supplier-based (lightweight, composition over inheritance)

When you don't need a creator class hierarchy, pass the creation logic in:

```java
class Logistics {
    private final Supplier<? extends Transport> transportFactory;

    Logistics(Supplier<? extends Transport> transportFactory) {
        this.transportFactory = transportFactory;
    }

    void planDelivery(String cargo) {
        Transport transport = transportFactory.get();
        transport.load(cargo);
        transport.deliver();
    }
}

new Logistics(Truck::new).planDelivery("Laptops");
new Logistics(Ship::new).planDelivery("Containers");
```

---

## Comparison

| | Simple (Static) Factory | Factory Method | Abstract Factory |
|---|---|---|---|
| GoF pattern? | No (an idiom) | Yes | Yes |
| Mechanism | One method with `if/switch` | **Inheritance**: subclass overrides | **Composition**: factory object with several create methods |
| Creates | One product type | One product type | A **family** of related products |
| Add a new variant | Edit the switch | Add a subclass | Add a new concrete factory |
| Example | `TransportFactory.create("SEA")` | `SeaLogistics.createTransport()` | `ModernFurnitureFactory` |

---

## Anti-Patterns

### 1. The God Switch Factory

```java
// BAD
static Transport create(String type) {
    switch (type) {
        case "ROAD": return new Truck();
        case "SEA":  return new Ship();
        default:     return null;          // silent failure, NPE later
    }
}
```

- Every new type edits this method (OCP violation).
- Returning `null` for unknown input pushes the failure far from its cause.

**Fix:** registry/Spring map or a creator subclass. For unknown input, **throw** `IllegalArgumentException` (or return `Optional`).

### 2. Factory for the sake of a factory

```java
// BAD: no variation, no complex setup
class UserFactory {
    User createUser() { return new User(); }
}
```

**Fix:** use `new`. Introduce a factory only when there is real variation or non-trivial creation logic (YAGNI).

### 3. Downcasting the product in the client

```java
// BAD
Transport t = logistics.createTransport();
if (t instanceof Truck) {
    ((Truck) t).openTailgate();
}
```

This destroys the abstraction the pattern exists to provide.

**Fix:** put the behavior on the `Transport` interface, or rethink the abstraction. If clients need concrete types, you don't have a product *interface*.

### 4. Subclass explosion

```java
// BAD
class RedTruckLogistics extends Logistics { ... }
class BlueTruckLogistics extends Logistics { ... }
class RedShipLogistics extends Logistics { ... }
```

**Fix:** if the variation is just data, use a constructor parameter, the Supplier variation, or a Builder.

### 5. Business logic and side effects inside the factory

```java
// BAD
protected Transport createTransport() {
    Transport t = new Truck();
    auditRepository.save(...);       // DB write
    eventBus.publish(...);           // event
    return t;
}
```

Creation should only create. Side effects make the factory unpredictable and hard to test.

**Fix:** keep it pure; do the side effects in the template method or service layer.

### 6. Static global factory

```java
// BAD: hidden dependency, impossible to mock without PowerMock
Transport t = TransportFactory.getInstance().create("SEA");
```

**Fix:** inject the factory (constructor injection) so tests can supply a fake.

### 7. Calling the factory method from the Creator's constructor (Java gotcha)

```java
// BAD
abstract class Logistics {
    protected final Transport transport;
    Logistics() { this.transport = createTransport(); }   // runs BEFORE subclass fields are set
    protected abstract Transport createTransport();
}

class RoadLogistics extends Logistics {
    private final String depot;
    RoadLogistics(String depot) { super(); this.depot = depot; }   // assigned AFTER super()
    @Override protected Transport createTransport() { return new Truck(depot); }  // depot == null here!
}
```

An overridable method called from a constructor runs before the subclass is initialized.

**Fix:** call the factory method lazily (inside `planDelivery`, as in the main example), never from a constructor.

---

## When to Use

**Use it when:**

- You don't know in advance the exact types your code will work with.
- You want subclasses (or library users) to extend what gets created.
- The workflow is stable but the object being created varies.
- You want to swap in fakes for testing.

**Skip it when:**

- There is only one concrete class and no foreseeable variation.
- A plain constructor or a static factory (`List.of`) is enough.
- You need *families* of related objects (use [Abstract Factory](abstract-factory-pattern)).

---

## In the JDK

| Example | Note |
|---|---|
| `Collection.iterator()` / `Iterable.iterator()` | Textbook Factory Method: each collection returns its own `Iterator` |
| `Executors.newFixedThreadPool(n)` | Static factory returning an `ExecutorService` |
| `Calendar.getInstance()`, `NumberFormat.getInstance()` | Static factories; the returned type depends on locale |
| `List.of()`, `Optional.of()` | Static factory methods |
| Spring `BeanFactory.getBean()`, `FactoryBean<T>` | The container itself is a giant factory |

---

## Interview Questions

**Q1. Factory Method vs Abstract Factory?**
Factory Method creates **one** product via **inheritance** (subclass overrides). Abstract Factory creates a **family** of related products via **composition** (a factory object with several create methods). Abstract Factory's methods are often implemented as factory methods.

**Q2. Factory Method vs a static/simple factory?**
A simple factory is one method with conditional logic. Factory Method uses polymorphism, so adding a variant is a new subclass, not an edit.

**Q3. Which SOLID principles does it support?**
OCP (add variants without modifying), DIP (depend on `Transport`, not `Truck`), and SRP (creation separated from usage).

**Q4. Can a factory method be static?**
Static methods can't be overridden, so a static one is not the GoF form. It is a static factory method.

**Q5. How does Spring relate to this?**
The IoC container is a factory. `@Bean` methods are factory methods, and `FactoryBean<T>` customizes creation of a bean.

**Q6. Is it thread-safe?**
The pattern says nothing about it. Stateless creators are safe; thread safety depends on the products and on any shared state in the creator.

---

## Cheat Sheet

- **What:** subclass decides which object the parent creates.
- **Why:** remove `new` + `if/else` from business logic, follow OCP/DIP.
- **How:** Product interface → Concrete Products → abstract Creator (factory method + template) → Concrete Creators.
- **Hook:** parent = recipe, child = ingredient.
- **Avoid:** God Switch, factory without variation, downcasting, calling the factory method in a constructor, static global factories.
- **Spring in practice:** inject `List<Impl>` into a registry-based factory.

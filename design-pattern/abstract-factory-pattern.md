---
layout: docs
title: Abstract Factory Pattern in Java
---

# Abstract Factory Pattern

**Category:** Creational (it is about *how objects get created*)

---

## 1. In One Line (plain English)

> When you need **a group of objects that must belong together** (same "family"), ask **one factory** for the whole group. This way you can never accidentally mix parts from different families.

**30-second interview answer:** "Abstract Factory creates families of related objects without the client knowing the concrete classes. I define a factory interface with one method per product, and make one factory per family, like AWS or GCP. The client gets the factory once and everything it creates is guaranteed to be compatible."

---

## 2. The Real-Life Story

Go to **IKEA** and pick a *style*: **Modern** or **Victorian**.

- Modern set: modern chair + modern sofa + modern table.
- Victorian set: victorian chair + victorian sofa + victorian table.

You choose the style **once**. After that, everything the store hands you matches. You will never get a modern chair with a victorian table.

| IKEA world | Code world |
|---|---|
| "Furniture style" | **Abstract Factory** interface |
| Modern / Victorian | **Concrete factories** |
| Chair, Sofa, Table | **Products** (each has an interface too) |
| Matching set | **Family** |

---

## 3. The Problem (what hurts without it)

Your app must run on **AWS** in one customer's environment and **GCP** in another. You need two things: a file-storage client and a message-queue client.

```java
class ReportService {
    StorageClient storage;
    QueueClient queue;

    ReportService(String cloud) {
        if (cloud.equals("aws")) {
            storage = new S3Storage();
            queue   = new SqsQueue();
        } else if (cloud.equals("gcp")) {
            storage = new GcsStorage();
            queue   = new PubSubQueue();
        }
    }
}
```

Problems:

1. **The business class knows about every cloud.** Add Azure = open this class again (and every other class that does the same).
2. **Easy to mix by mistake:** `storage = new S3Storage(); queue = new PubSubQueue();` compiles fine, then fails at 2 AM in production.
3. The `if (cloud...)` is copy-pasted in many places.

---

## 4. The Solution (step by step)

**Step 1.** Create an interface for each **product**: `StorageClient`, `QueueClient`.

**Step 2.** Create the **abstract factory** interface with one method per product.

**Step 3.** Create **one concrete factory per family**: `AwsFactory`, `GcpFactory`. Each returns products of *its own* family only.

**Step 4.** The client takes a factory and asks it for products. It only ever sees interfaces.

```
                    CloudFactory (interface)
                    storage()   queue()
                       ▲             ▲
              ┌────────┴───┐   ┌─────┴──────┐
          AwsFactory       GcpFactory
          ├ S3Storage       ├ GcsStorage
          └ SqsQueue        └ PubSubQueue
```

---

## 5. Full Working Code

```java
// ---------- Step 1: product interfaces ----------
interface StorageClient { void upload(String key, byte[] data); }
interface QueueClient   { void publish(String message); }

// ---------- AWS family ----------
class S3Storage implements StorageClient {
    public void upload(String key, byte[] data) { System.out.println("[AWS S3] stored " + key); }
}
class SqsQueue implements QueueClient {
    public void publish(String msg) { System.out.println("[AWS SQS] sent " + msg); }
}

// ---------- GCP family ----------
class GcsStorage implements StorageClient {
    public void upload(String key, byte[] data) { System.out.println("[GCP GCS] stored " + key); }
}
class PubSubQueue implements QueueClient {
    public void publish(String msg) { System.out.println("[GCP PubSub] sent " + msg); }
}

// ---------- Step 2: the abstract factory ----------
interface CloudFactory {
    StorageClient createStorage();
    QueueClient   createQueue();
}

// ---------- Step 3: one factory per family ----------
class AwsFactory implements CloudFactory {
    public StorageClient createStorage() { return new S3Storage(); }
    public QueueClient   createQueue()   { return new SqsQueue(); }
}
class GcpFactory implements CloudFactory {
    public StorageClient createStorage() { return new GcsStorage(); }
    public QueueClient   createQueue()   { return new PubSubQueue(); }
}

// ---------- Step 4: the client. Knows NOTHING about AWS or GCP ----------
class ReportService {
    private final StorageClient storage;
    private final QueueClient queue;

    ReportService(CloudFactory factory) {
        this.storage = factory.createStorage();
        this.queue   = factory.createQueue();
    }

    void publishReport(String id, byte[] pdf) {
        storage.upload(id + ".pdf", pdf);
        queue.publish("report-ready:" + id);
    }
}

// ---------- Wiring: the ONLY place that knows the choice ----------
public class Main {
    public static void main(String[] args) {
        String cloud = System.getenv().getOrDefault("CLOUD", "aws");
        CloudFactory factory = cloud.equals("gcp") ? new GcpFactory() : new AwsFactory();

        new ReportService(factory).publishReport("42", new byte[0]);
        // aws -> [AWS S3] stored 42.pdf  /  [AWS SQS] sent report-ready:42
    }
}
```

**Key point:** `ReportService` never says `new S3Storage()`. Switching cloud = change **one line** in `Main`.

---

## 6. Spring Boot Version (what you do in real projects)

Spring's container is already an abstract factory. You just select a family using configuration:

```java
@Configuration
@ConditionalOnProperty(name = "cloud.provider", havingValue = "aws")
class AwsConfig {
    @Bean StorageClient storage() { return new S3Storage(); }
    @Bean QueueClient   queue()   { return new SqsQueue(); }
}

@Configuration
@ConditionalOnProperty(name = "cloud.provider", havingValue = "gcp")
class GcpConfig {
    @Bean StorageClient storage() { return new GcsStorage(); }
    @Bean QueueClient   queue()   { return new PubSubQueue(); }
}

@Service
class ReportService {
    ReportService(StorageClient storage, QueueClient queue) { ... }   // gets a consistent pair
}
```
`application.yml`: `cloud.provider: aws`. Done. Both beans always come from the same family.

---

## 7. Where You Have Already Seen It

| Place | What it creates |
|---|---|
| `DocumentBuilderFactory` (JAXP) | XML parser family |
| `TransformerFactory` | XML transformer family |
| JDBC `DriverManager` / `Connection` | Connection, Statement, ResultSet that all belong to one DB vendor |
| UI toolkits | Button + Checkbox + Menu for Windows vs Mac look |

JDBC is the best example: the `Connection` you get from MySQL gives you MySQL `Statement` and `ResultSet`, never Oracle ones.

---

## 8. When to Use / When NOT to Use

**Use it when:**
- You must create **several related objects** that must work together.
- You want to swap an **entire family** (cloud provider, DB vendor, theme, OS look and feel) with one switch.
- You want to hide concrete classes from client code.

**Do NOT use it when:**
- You create **only one** kind of object. Use Factory Method (or even plain `new`).
- Product types change often. Adding a new product (say `CacheClient`) means editing **every** factory. This is the pattern's main weakness.

---

## 9. Anti-Patterns (mistakes people make)

### Mistake 1: Client still decides with if-else
```java
// BAD: factory idea is gone
StorageClient s = cloud.equals("aws") ? new S3Storage() : new GcsStorage();
```
**Fix:** client receives a `CloudFactory`; only `main()`/config picks it.

### Mistake 2: Factory returns concrete types
```java
class AwsFactory { S3Storage createStorage() { ... } }   // BAD: leaks S3Storage
```
**Fix:** return the **interface** (`StorageClient`).

### Mistake 3: Injecting products separately
```java
new ReportService(new S3Storage(), new PubSubQueue());   // BAD: mixed families compile fine
```
**Fix:** inject the **factory**, so mixing is impossible.

### Mistake 4: Using it for a single product
One product type means this is just Factory Method. Do not build 6 classes for what 1 factory method can do.

### Mistake 5: God factory
A factory with 25 `createX()` methods. If the family is that big, split into sub-factories.

---

## 10. Abstract Factory vs Similar Patterns

| Compare | Difference in simple words |
|---|---|
| **Factory Method vs Abstract Factory** | Factory Method makes **one** product (subclass decides which). Abstract Factory makes a **family** (a factory object is passed in). Abstract Factory is usually built from several factory methods. |
| **Abstract Factory vs Builder** | Abstract Factory returns finished objects instantly, family by family. Builder assembles **one** complex object step by step. |
| **Abstract Factory vs Prototype** | Both can create objects. Prototype copies existing ones; Abstract Factory can be implemented using prototypes inside it. |
| **Abstract Factory vs Dependency Injection** | DI containers (Spring) often replace hand-written abstract factories. The idea is the same: pick the family at the wiring stage. |

---

## 11. Interview Questions & Easy Answers

**Q1. Why "abstract" factory?**
Because the factory itself is an interface. The client depends on the abstraction; the concrete factory is chosen elsewhere.

**Q2. What is the biggest downside?**
Adding a new *product* type forces changes in every concrete factory and the interface. Adding a new *family* is easy; adding a new *product* is hard.

**Q3. How does it differ from Factory Method?**
One product vs a family of products. Factory Method uses inheritance, Abstract Factory uses composition.

**Q4. How would you implement this in Spring Boot?**
`@Configuration` classes per family with `@ConditionalOnProperty` or `@Profile`; each exposes the related beans.

**Q5. Give a project example.**
"We supported AWS and on-prem. Storage, queue and secrets clients came from `AwsFactory` or `OnPremFactory`, chosen by one property. Services never mentioned a vendor."

---

## 12. Cheat Sheet

- **Problem:** need a group of matching objects, and must switch the whole group at once.
- **Idea:** one factory interface, one factory per family, client uses only interfaces.
- **Win:** consistency guaranteed, vendor swap = one line.
- **Weakness:** new product type touches every factory.
- **Remember:** IKEA Modern vs Victorian sets, or JDBC driver families.

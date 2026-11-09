# Adapter Pattern

**Category:** Structural (it is about *how objects are put together*)

---

## 1. In One Line (plain English)

> You have two pieces of code that **don't fit together** because their method names or shapes differ. Instead of changing either of them, write a small **translator class (the adapter)** in the middle.

**30-second interview answer:** "Adapter converts one interface into another that the client expects. I use it to integrate third-party or legacy code I can't modify, and to keep my domain independent of vendor SDKs. If we switch vendors, I just write a new adapter and nothing else changes."

---

## 2. The Real-Life Story

**Travel plug adapter.**

You land in London with an Indian laptop charger (3 round pins). The UK wall socket has a different shape. You can't change the socket, and you don't want to cut your charger.

So you plug a **small adapter** in between. The charger thinks it is plugged into an Indian socket. The wall thinks it is feeding a UK device.

```
Laptop charger ──▶ [ ADAPTER ] ──▶ UK wall socket
 (what you have)    (translator)    (what exists)
```

| Travel world | Code world |
|---|---|
| Your charger | **Client** (your code) |
| The shape your charger expects | **Target interface** |
| The UK socket | **Adaptee** (legacy/third-party code) |
| The plug adapter | **Adapter** |

Another example: a **language translator** between two people who don't share a language.

---

## 3. The Problem (what hurts without it)

Your app has its own way to take payments. Now you must use a **vendor SDK** that works very differently, and you can't edit it.

```java
// Vendor SDK (we CANNOT change it)
class LegacyGatewayClient {
    public int makePayment(String account, long amountInPaise, int currencyCode) { return 0; } // 0 = OK
    public String lastTxnRef() { return "TXN-123"; }
}
```

If your business code calls it directly:

```java
class CheckoutService {
    LegacyGatewayClient gateway = new LegacyGatewayClient();

    void checkout(String customer, BigDecimal amount) {
        long paise = amount.movePointRight(2).longValue();        // vendor-specific conversion
        int status = gateway.makePayment(customer, paise, 356);   // magic number 356 = INR
        if (status != 0) throw new RuntimeException("failed");
        String ref = gateway.lastTxnRef();
        ...
    }
}
```

Problems:

1. **Vendor details leak everywhere:** paise conversion, magic currency codes, status codes.
2. **Vendor lock-in:** switching to Razorpay or Stripe means editing every class that calls the SDK.
3. **Hard to test:** you can't test `CheckoutService` without the real SDK.
4. Every developer must learn the vendor's quirks.

---

## 4. The Solution (step by step)

**Step 1.** Define **your own clean interface** (the Target) describing what *your app* needs: `PaymentProcessor`.

**Step 2.** Write an **Adapter** that implements your interface and **internally calls the vendor SDK**, doing all the translation (units, codes, result objects, exceptions).

**Step 3.** Business code depends **only on your interface**.

```
CheckoutService ──▶ PaymentProcessor (your interface)
                          ▲
                 LegacyGatewayAdapter ──has-a──▶ LegacyGatewayClient (vendor)
                 RazorpayAdapter      ──has-a──▶ Razorpay SDK        (future)
```

---

## 5. Full Working Code

```java
import java.math.BigDecimal;

// ---------- Step 1: OUR clean interface and domain objects ----------
interface PaymentProcessor {
    PaymentResult pay(String customerId, BigDecimal amount, String currency);
}

record PaymentResult(boolean success, String transactionId) {}

// ---------- The vendor class we cannot change (the Adaptee) ----------
class LegacyGatewayClient {
    public int makePayment(String account, long amountInPaise, int currencyCode) {
        System.out.println("Vendor charging " + account + " " + amountInPaise + " paise");
        return 0;                      // 0 means success
    }
    public String lastTxnRef() { return "TXN-123"; }
}

// ---------- Step 2: the Adapter = the translator ----------
class LegacyGatewayAdapter implements PaymentProcessor {
    private final LegacyGatewayClient client;

    LegacyGatewayAdapter(LegacyGatewayClient client) { this.client = client; }

    @Override
    public PaymentResult pay(String customerId, BigDecimal amount, String currency) {
        long paise = amount.movePointRight(2).longValueExact();      // BigDecimal rupees -> long paise
        int currencyCode = "INR".equals(currency) ? 356 : 840;       // "INR" -> 356, else USD 840

        int status = client.makePayment(customerId, paise, currencyCode);

        return new PaymentResult(status == 0, client.lastTxnRef());  // vendor status -> our result
    }
}

// ---------- Step 3: business code knows ONLY PaymentProcessor ----------
class CheckoutService {
    private final PaymentProcessor processor;

    CheckoutService(PaymentProcessor processor) { this.processor = processor; }

    void checkout(String customer, BigDecimal amount) {
        PaymentResult r = processor.pay(customer, amount, "INR");
        System.out.println(r.success() ? "Paid. Ref: " + r.transactionId() : "Payment failed");
    }
}

public class Main {
    public static void main(String[] args) {
        PaymentProcessor processor = new LegacyGatewayAdapter(new LegacyGatewayClient());
        new CheckoutService(processor).checkout("C-1", new BigDecimal("499.00"));
        // Vendor charging C-1 49900 paise
        // Paid. Ref: TXN-123
    }
}
```

**Switching vendor later?** Write `RazorpayAdapter implements PaymentProcessor`, change one line in wiring. `CheckoutService` is untouched.

**Testing is easy:** pass a fake `PaymentProcessor` in unit tests, no vendor SDK needed.

---

## 6. Two Flavours: Object Adapter vs Class Adapter

**Object adapter (use this)**: the adapter **has** the adaptee as a field (composition). Shown above. Flexible, works even if the adaptee is `final`, and can adapt subclasses too.

**Class adapter**: the adapter **extends** the adaptee and implements the target (inheritance).
```java
class ClassAdapter extends LegacyGatewayClient implements PaymentProcessor { ... }
```
Needs multiple inheritance in classic form, locks you into one concrete class, and can't be used if the adaptee is `final`. In Java, prefer the object adapter.

---

## 7. Another Small Example: Adapting a Data Shape

Your code expects a `List<String>`, but a library gives you an array.

```java
String[] arr = {"a", "b", "c"};
List<String> list = Arrays.asList(arr);     // JDK adapter: array view as a List
```
`Arrays.asList` doesn't copy. It's a thin adapter that makes an array *look like* a `List`.

And a "bytes to characters" example:
```java
Reader reader = new InputStreamReader(System.in);   // adapts InputStream (bytes) to Reader (chars)
```

---

## 8. Where You Have Already Seen It

| Place | Adapts what to what |
|---|---|
| `Arrays.asList(array)` | array to `List` |
| `InputStreamReader` / `OutputStreamWriter` | byte stream to character stream |
| `Collections.enumeration(coll)` | `Collection` to legacy `Enumeration` |
| Spring MVC `HandlerAdapter` | lets `DispatcherServlet` call any kind of controller in a uniform way |
| Spring Data / JPA repositories | adapt your repository interface onto JDBC/Hibernate calls |
| Hexagonal architecture ("ports and adapters") | adapters connect the outside world (REST, DB, Kafka) to your core through ports |
| SLF4J bindings | adapt Logback / Log4j2 to the common SLF4J API |

---

## 9. When to Use / When NOT to Use

**Use it when:**
- You must use a **third-party or legacy class** whose interface doesn't match yours and you **can't change it**.
- You want to **isolate vendor code** so swapping vendors is easy.
- You're **migrating** from an old system to a new one gradually (old API on the outside, new implementation inside).
- Several classes you don't own do similar things with different method names, and you want one common interface.

**Do NOT use it when:**
- You own both sides. Just change one interface to match the other.
- The mismatch is tiny (one method rename). A simple wrapper method is enough.
- You want to **add behavior**. That's Decorator.

---

## 10. Anti-Patterns (mistakes people make)

### Mistake 1: Calling the vendor SDK from everywhere
```java
// in 40 different classes:
new LegacyGatewayClient().makePayment(...);
```
**Fix:** one adapter; everyone else uses your interface.

### Mistake 2: Business logic inside the adapter
```java
public PaymentResult pay(...) {
    if (amount.compareTo(LIMIT) > 0) applyFraudRules();    // BAD: this is business logic
    ...
}
```
**Fix:** the adapter only **translates**. Rules belong in services.

### Mistake 3: Leaking the vendor's types through your interface
```java
interface PaymentProcessor { LegacyResponse pay(...); }   // BAD: still coupled to vendor
```
**Fix:** return **your own** domain objects (`PaymentResult`).

### Mistake 4: Swallowing vendor errors
```java
try { client.makePayment(...); } catch (Exception e) { return new PaymentResult(false, null); }  // BAD
```
**Fix:** map vendor exceptions into meaningful domain exceptions (`PaymentDeclinedException`, `GatewayUnavailableException`) and keep the cause.

### Mistake 5: One giant adapter for many services
**Fix:** one adapter per adaptee/interface (Single Responsibility).

### Mistake 6: Hardcoding magic values in several adapters
Currency map, status map copy-pasted. **Fix:** share small mapping helpers or enums.

### Mistake 7: Unnecessary adapter
Wrapping your own class in another class "just in case". **Fix:** add the adapter when a real mismatch appears.

---

## 11. Adapter vs Similar Patterns (very common)

| Compare | Difference in simple words |
|---|---|
| **Adapter vs Decorator** | Adapter **changes the interface**. Decorator **keeps the interface** and adds behavior. |
| **Adapter vs Facade** | Adapter makes **one** incompatible class fit a known interface. Facade provides a **simpler front door to a whole subsystem** (many classes). |
| **Adapter vs Proxy** | Proxy has the **same interface** as the real object and controls access. Adapter has a **different interface** from the adaptee. |
| **Adapter vs Bridge** | Adapter is applied **after** the fact to make existing things fit. Bridge is designed **up front** to let abstraction and implementation vary independently. |

Memory trick: **Adapter = travel plug. Decorator = extra gear. Proxy = security guard. Facade = reception desk.**

---

## 12. Interview Questions & Easy Answers

**Q1. When did you last use Adapter?**
Good answer: "When integrating a third-party payment/SMS/email vendor. I defined our `NotificationSender` interface and wrote `TwilioAdapter`. Switching to another provider only needed a new adapter."

**Q2. How does Adapter help testing?**
Business code depends on your interface, so tests use a fake/mock implementation instead of the real vendor.

**Q3. Adapter vs Facade?**
Adapter: convert one interface to another. Facade: simplify a complex subsystem behind one easy interface.

**Q4. Is `Arrays.asList` an adapter?**
Yes. It lets an array be used through the `List` interface without copying.

**Q5. How does this relate to Hexagonal Architecture?**
"Ports" are your interfaces (like `PaymentProcessor`). "Adapters" are implementations that connect to the outside world (REST controller, JPA repository, Kafka consumer). Same idea at architecture scale.

**Q6. Class adapter vs object adapter?**
Class adapter uses inheritance; object adapter uses composition. Java favours composition (single inheritance, more flexible).

---

## 13. Cheat Sheet

- **Problem:** two interfaces don't match; you can't change one side.
- **Idea:** adapter implements the interface you want and calls the incompatible class inside.
- **Win:** decoupling from vendors; easy swapping and testing.
- **Watch out:** only translate (no business logic), don't leak vendor types, map exceptions.
- **Remember:** travel plug adapter.

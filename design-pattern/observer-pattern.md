# Observer Pattern

**Category:** Behavioral (it is about *how objects behave and talk to each other*)

---

## 1. In One Line (plain English)

> One object (the **subject**) has news. Many other objects (the **observers**) have signed up to hear it. When the news happens, the subject **tells everyone on its list automatically**, without knowing who they are or what they'll do with it.

**30-second interview answer:** "Observer is a one-to-many notification mechanism. Observers subscribe to a subject, and when the subject's state changes it notifies all of them through a common interface. The subject stays loosely coupled because it only knows the interface, so I can add or remove reactions without touching it. Spring's `ApplicationEvent` and `@EventListener` are a real example."

---

## 2. The Real-Life Story

**YouTube subscriptions.**

- A channel uploads a video. That's the *event*.
- Thousands of people clicked **Subscribe** earlier. They're on the channel's list.
- YouTube pings every subscriber. One person gets a phone notification, another gets an email, another does nothing.
- The channel does **not** call each viewer by hand, and doesn't care what they do next.
- You can **unsubscribe** any time; the channel keeps working.

| YouTube world | Code world |
|---|---|
| Channel | **Subject** (publisher) |
| Subscribers | **Observers** (listeners) |
| Subscribe / Unsubscribe | `subscribe()` / `unsubscribe()` |
| "New video!" | Event / `notifyAll()` |

Other examples: **newsletter**, **stock price alerts**, **button click listeners**, **Excel cells updating when a source cell changes**.

---

## 3. The Problem (what hurts without it)

When an order is placed, many things must happen: send email, reserve stock, update analytics, notify warehouse, write audit log.

```java
class OrderService {
    EmailService email;
    InventoryService inventory;
    AnalyticsService analytics;
    AuditService audit;
    WarehouseService warehouse;

    void placeOrder(Order o) {
        save(o);
        email.sendConfirmation(o);
        inventory.reserve(o);
        analytics.track(o);
        audit.log(o);
        warehouse.notifyShipping(o);    // new requirement? edit placeOrder again...
    }
}
```

Problems:

1. `OrderService` is **tightly coupled** to every other service. Imports everywhere.
2. Every new reaction (loyalty points, fraud check) = **edit `placeOrder`**.
3. Testing `placeOrder` needs mocks for all five services.
4. If `email.send()` throws, the rest of the steps never run.

---

## 4. The Solution (step by step)

**Step 1.** Define a small **observer interface** (`onOrderPlaced`).

**Step 2.** The subject keeps a **list of observers** and offers `subscribe` and `unsubscribe`.

**Step 3.** When something happens, the subject loops through its list and calls each observer.

**Step 4.** Each reaction (email, inventory, audit...) is a separate observer class that registers itself.

```
OrderService (Subject)
   │  subscribe(...)  unsubscribe(...)
   │  placeOrder() ──▶ notify all ─┬──▶ EmailNotifier
   │                               ├──▶ InventoryUpdater
   │                               └──▶ AuditLogger
```

Now `OrderService` knows **nothing** about email or inventory.

---

## 5. Full Working Code

```java
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

// The event data
record OrderPlaced(String orderId, double amount) {}

// Step 1: observer interface
interface OrderListener {
    void onOrderPlaced(OrderPlaced event);
}

// Step 2 + 3: the subject
class OrderService {
    // CopyOnWriteArrayList: safe if someone subscribes/unsubscribes while we are looping
    private final List<OrderListener> listeners = new CopyOnWriteArrayList<>();

    void subscribe(OrderListener l)   { listeners.add(l); }
    void unsubscribe(OrderListener l) { listeners.remove(l); }

    void placeOrder(String id, double amount) {
        System.out.println("Order saved: " + id);              // ... real work here ...
        OrderPlaced event = new OrderPlaced(id, amount);

        for (OrderListener l : listeners) {
            try {
                l.onOrderPlaced(event);
            } catch (Exception e) {
                // One broken listener must NOT stop the others
                System.err.println("Listener failed: " + e.getMessage());
            }
        }
    }
}

// Step 4: independent observers
class EmailNotifier implements OrderListener {
    public void onOrderPlaced(OrderPlaced e) { System.out.println("Email sent for " + e.orderId()); }
}

class InventoryUpdater implements OrderListener {
    public void onOrderPlaced(OrderPlaced e) { System.out.println("Stock reserved for " + e.orderId()); }
}

public class Main {
    public static void main(String[] args) {
        OrderService service = new OrderService();

        service.subscribe(new EmailNotifier());
        service.subscribe(new InventoryUpdater());
        service.subscribe(e -> System.out.println("AUDIT: " + e));   // lambda = tiny observer

        service.placeOrder("O-1", 499.0);
        // Order saved: O-1
        // Email sent for O-1
        // Stock reserved for O-1
        // AUDIT: OrderPlaced[orderId=O-1, amount=499.0]
    }
}
```

**Result:** adding a "loyalty points" feature means writing one new listener and calling `subscribe`. `OrderService` stays untouched.

---

## 6. Spring Boot Version (what you will use at work)

Spring has the pattern built in via events.

```java
// The event
public record OrderPlaced(String orderId, double amount) {}

// The publisher (subject)
@Service
public class OrderService {
    private final ApplicationEventPublisher publisher;

    public OrderService(ApplicationEventPublisher publisher) { this.publisher = publisher; }

    @Transactional
    public void placeOrder(String id, double amount) {
        // save order ...
        publisher.publishEvent(new OrderPlaced(id, amount));
    }
}

// Observers: just annotate a method
@Component
class EmailNotifier {
    @EventListener
    void handle(OrderPlaced e) { /* send email */ }
}

@Component
class InventoryUpdater {
    @Async                                   // run in another thread (needs @EnableAsync)
    @EventListener
    void handle(OrderPlaced e) { /* reserve stock */ }
}
```

**Important details for interviews:**
- By default Spring events are **synchronous**: listeners run in the **same thread** and the **same transaction** as the publisher. A failing listener can roll back the order.
- Use `@Async` for fire-and-forget reactions.
- Use `@TransactionalEventListener(phase = AFTER_COMMIT)` to react **only if the transaction commits** (e.g. don't send "order confirmed" email for a rolled-back order).

---

## 7. Observer vs Pub/Sub vs Kafka (very common confusion)

| | **Observer (in-process)** | **Pub/Sub with a broker (Kafka, SNS, RabbitMQ)** |
|---|---|---|
| Who knows whom | Subject holds direct references to observers | Publisher and subscriber **don't know each other** |
| Where | Same JVM/process | Across services/machines |
| Middleman | None | Broker |
| Durability | None: if the app crashes, events are lost | Stored; replay possible |
| Retry / ordering / scaling | Manual | Built in |
| Use for | UI events, in-service reactions | Microservice communication |

Simple rule: **inside one service use Observer/Spring events; between services use Kafka.** A common production design: Spring event inside the service, and a listener that publishes to Kafka.

---

## 8. Push vs Pull Style

- **Push:** subject sends all data in the event (`OrderPlaced(id, amount)`). Simple; used almost everywhere.
- **Pull:** subject only says "I changed" and passes itself. Observer asks for what it needs (`subject.getAmount()`). More flexible but couples observer to subject.

---

## 9. Where You Have Already Seen It

| Place | Observer |
|---|---|
| Swing / JavaFX / Android | `ActionListener`, `OnClickListener` |
| `java.beans.PropertyChangeListener` | bean property change notifications |
| `java.util.concurrent.Flow` / Reactive Streams | `Publisher` / `Subscriber` |
| Spring | `ApplicationEvent`, `@EventListener` |
| RxJava / Project Reactor | `Observable` / `Flux` + `subscribe()` |
| `java.util.Observable` | **deprecated since Java 9**; don't use |
| JavaScript | `addEventListener` |

---

## 10. When to Use / When NOT to Use

**Use it when:**
- One change must trigger **several independent reactions**.
- You don't know (or don't want to know) who is interested at compile time.
- You want to add/remove reactions without editing the core class.

**Do NOT use it when:**
- There is exactly one fixed reaction. A direct method call is simpler and easier to follow.
- You need **guaranteed delivery, retries, or ordering across services**. Use a message broker.
- The flow needs to be easy to trace. Too many events make code hard to follow.

---

## 11. Anti-Patterns (mistakes people make)

### Mistake 1: Forgetting to unsubscribe (memory leak)
```java
subject.subscribe(listener);   // short-lived object (screen, request scope)
// never unsubscribed -> subject keeps a strong reference -> listener can never be garbage collected
```
This is the famous **lapsed listener problem**. **Fix:** always `unsubscribe` when done, or use weak references / scoped lifecycles.

### Mistake 2: One failing observer stops everyone
```java
for (OrderListener l : listeners) l.onOrderPlaced(e);   // BAD: exception in #2 skips #3, #4
```
**Fix:** `try/catch` around each call (as in section 5).

### Mistake 3: Modifying the list while looping
Subscribing/unsubscribing inside a callback throws `ConcurrentModificationException` with a plain `ArrayList`. **Fix:** `CopyOnWriteArrayList`, or iterate over a copy.

### Mistake 4: Depending on observer order
"Email must run before inventory." The order isn't a promise. **Fix:** if order matters, it's not independent; make one observer call the next, or use an explicit workflow.

### Mistake 5: Slow or blocking observers
A listener calling a slow external API holds up the main thread. **Fix:** run listeners asynchronously (`@Async`, executor).

### Mistake 6: Observer chains and cycles
A updates B, B's observer updates C, C's observer updates A... infinite loop or impossible debugging. **Fix:** keep events one level deep; avoid listeners that publish events that loop back.

### Mistake 7: Expecting Observer to work across services
In-process events die with the process. **Fix:** Kafka / SNS for cross-service events.

### Mistake 8: Putting business-critical steps in listeners without thinking about transactions
Sending an email in a listener, then the DB transaction rolls back. **Fix:** `@TransactionalEventListener(phase = AFTER_COMMIT)`.

---

## 12. Observer vs Similar Patterns

| Compare | Difference in simple words |
|---|---|
| **Observer vs Pub/Sub** | Observer: subject knows its observers directly. Pub/Sub: a broker sits between, nobody knows each other. |
| **Observer vs Mediator** | Observer: one-to-many broadcast. Mediator: a central object coordinates two-way talk between many objects. |
| **Observer vs Callback** | A callback is one function passed in. Observer is a list of them with subscribe/unsubscribe. |
| **Observer vs Chain of Responsibility** | Observer notifies **all**. Chain passes the request along until **one** handles it. |

---

## 13. Interview Questions & Easy Answers

**Q1. What is the main benefit?**
Loose coupling. The subject doesn't depend on concrete observers, so you can add reactions without changing it.

**Q2. How is it different from Kafka-style pub/sub?**
Observer is in-process with direct references and no durability. Kafka is a broker between independent services with persistence, replay and scaling.

**Q3. What's the lapsed listener problem?**
Observers not unsubscribed remain referenced by the subject, so they never get garbage collected: a memory leak.

**Q4. Are Spring events sync or async?**
Sync by default (same thread, same transaction). Add `@Async` for async. Use `@TransactionalEventListener` to run after commit.

**Q5. How do you keep one observer from breaking others?**
Catch exceptions per observer, or run them asynchronously.

**Q6. Why was `java.util.Observable` deprecated?**
It's a class, not an interface (forces inheritance), not type-safe, `setChanged()` is protected, and it's not serialisable/thread-safe by design. Use `PropertyChangeListener`, Flow, or your own interface.

**Q7. Give a project example.**
"On order placement we published an `OrderPlaced` Spring event. Email and analytics listeners ran in-process; one listener published the event to Kafka for other microservices. Using `AFTER_COMMIT` guaranteed we never emitted events for rolled-back orders."

---

## 14. Cheat Sheet

- **Problem:** one change must trigger many reactions; tight coupling.
- **Idea:** subject keeps a list of observers and notifies them via an interface.
- **Win:** add/remove reactions with zero changes to the subject.
- **Watch out:** unsubscribe (leaks), catch exceptions, thread safety, transactions.
- **Scope:** in-process. For cross-service use Kafka.
- **Remember:** YouTube subscribe + bell icon.

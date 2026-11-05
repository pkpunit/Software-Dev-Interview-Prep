# CQRS — Command Query Responsibility Segregation

> **One-liner:** Use **one model to change data (Command)** and a **different model to read data (Query)** — so each side can be designed, scaled and optimized for its own job.

---

## Table of Contents

1. [The 30-second answer](#1-the-30-second-answer)
2. [Intuition: the restaurant analogy](#2-intuition-the-restaurant-analogy)
3. [Where it comes from: CQS → CQRS](#3-where-it-comes-from-cqs--cqrs)
4. [The problem CQRS solves](#4-the-problem-cqrs-solves)
5. [How CQRS works (architecture)](#5-how-cqrs-works-architecture)
6. [Three levels of CQRS](#6-three-levels-of-cqrs)
7. [CQRS in microservices](#7-cqrs-in-microservices)
8. [Keeping the read side in sync](#8-keeping-the-read-side-in-sync)
9. [Full example: Order service (Java + Spring Boot + Kafka)](#9-full-example-order-service-java--spring-boot--kafka)
10. [Eventual consistency — how to handle it](#10-eventual-consistency--how-to-handle-it)
11. [Benefits and drawbacks](#11-benefits-and-drawbacks)
12. [When to use / when NOT to use](#12-when-to-use--when-not-to-use)
13. [Anti-patterns and common mistakes](#13-anti-patterns-and-common-mistakes)
14. [CQRS vs related concepts](#14-cqrs-vs-related-concepts)
15. [Tools and technologies](#15-tools-and-technologies)
16. [Interview Q&A](#16-interview-qa)
17. [How to explain CQRS in an interview (script)](#17-how-to-explain-cqrs-in-an-interview-script)
18. [Cheat sheet](#18-cheat-sheet)
19. [References](#19-references)

---

## 1. The 30-second answer

**CQRS = Command Query Responsibility Segregation.**

- A **Command** changes state: *"Place order"*, *"Cancel order"*. It returns little or nothing.
- A **Query** reads state: *"Show my orders"*. It never changes anything.
- CQRS says: **don't force both through the same model.** Give writes their own model (full of business rules) and reads their own model (shaped exactly like the screen/API needs).

```
          ┌──────────── COMMAND SIDE (write) ────────────┐
Client ──▶│ Validate → Business rules → Write DB         │
          └───────────────────────┬──────────────────────┘
                                  │ events / replication
          ┌───────────────────────▼──────────────────────┐
Client ◀──│ Read DB (denormalized, fast) ◀── Query API   │
          └──────────────── QUERY SIDE (read) ───────────┘
```

**Why bother?** Reads and writes have *very different needs*. Writes need correctness and rules. Reads need speed and convenient shapes. One model trying to do both ends up doing both badly.

---

## 2. Intuition: the restaurant analogy

Picture a busy restaurant.

| Restaurant | Software |
|---|---|
| Waiter takes your order, kitchen checks stock, cooks it | **Command side** — validates, applies rules, changes state |
| The "Now Serving" board in the lobby | **Query side** — a ready-made, read-only view |
| Kitchen updates the board when an order is ready | **Events / sync** — write side updates the read side |
| Board is a few seconds behind the kitchen | **Eventual consistency** |

Why this works:

- Customers staring at the board **don't slow down the kitchen**. (Reads don't hurt writes.)
- The board is **shaped for reading** — just a token number and a status. Nobody has to open the kitchen's inventory book to know if the pizza is ready. (Read model ≠ write model.)
- If 500 people want to look at the board, you buy more TVs. You don't hire more chefs. (**Scale independently.**)

> **Recall hook:** *"Kitchen writes, board reads."*

---

## 3. Where it comes from: CQS → CQRS

- **CQS (Command-Query Separation)** — Bertrand Meyer's principle at the **method level**: a method should *either* do something (command) *or* return something (query), never both.
  ```java
  // Violates CQS: changes state AND returns data
  int incrementAndGet();

  // Follows CQS
  void increment();   // command
  int  get();         // query
  ```
- **CQRS** — Greg Young took that idea to the **architecture level**: separate models, services, and even databases for commands and queries.

> **Recall hook:** CQS = *methods*. CQRS = *whole models/services/databases*.

---

## 4. The problem CQRS solves

Most apps start as **CRUD** with one model and one database:

```
UI ──▶ Service ──▶ Entity (Order) ──▶ One DB
         ▲                               │
         └───────── same model ◀─────────┘
```

As the app grows, the single model starts to hurt:

1. **Different shapes.** The write side needs a clean normalized `Order` with rules. The read side wants *"order + customer name + product names + total + shipping status"* joined in one object. One entity can't be ideal for both.
2. **Different load.** Reads are usually far more frequent than writes (think product pages vs. checkouts). Scaling the one DB for the busiest side wastes money on the other.
3. **Lock contention.** Heavy reads and writes fight over the same tables and rows.
4. **Bloated models.** Entities get cluttered with fields and annotations needed only for display *or* only for business rules.
5. **Security.** A shared DB needs wide permissions; with CQRS the read side can be **read-only**, shrinking the attack surface.
6. **Microservices joins.** With *Database per Service*, data lives in many DBs. A query that needs Orders + Customers + Payments can't use a SQL JOIN (see section 7).

CQRS is the answer when these pains are **real and measured**, not imagined.

---

## 5. How CQRS works (architecture)

### The command side (write)

1. Client sends a **command** — an *intent* ("PlaceOrder"), named like a business task.
2. A **command handler** validates it and applies domain rules.
3. State is saved to the **write store**.
4. An **event** is published ("OrderPlaced") so others can react.

### The query side (read)

1. A **projector / event consumer** listens to those events.
2. It updates a **read model** (a ready-to-serve view — often denormalized).
3. A **query handler / API** reads directly from this view. No business logic, no joins on the hot path.

### Commands vs Queries at a glance

| | Command | Query |
|---|---|---|
| Purpose | Change state | Read state |
| Naming | Imperative task: `PlaceOrder`, `ShipOrder` | Question: `GetOrderById`, `ListOrdersByCustomer` |
| Returns | Nothing, or just an id / ack | Data (DTO / view) |
| Side effects | Yes | **None** |
| Model | Rich domain model with rules | Flat, denormalized view |
| Typical store | Relational (strong consistency) | Anything fast: Mongo, Elasticsearch, Redis, SQL view |
| Scaling | Based on write volume | Based on read volume |

### Task-based commands (important!)

Commands should express **business intent**, not raw data edits.

| Bad (data-centric, CRUD in disguise) | Good (task-based) |
|---|---|
| `setOrderStatus(id, "SHIPPED")` | `ShipOrder(orderId, trackingNo)` |
| `updateReservation(status = RESERVED)` | `BookHotelRoom(roomId, dates)` |

Task-based commands keep business rules in one place and make the system's behavior readable.

---

## 6. Three levels of CQRS

You don't have to jump to the fanciest version. Think of it as a ladder.

### Level 1 — Separate models, same database
Same DB, but separate classes/services for commands and queries (e.g., JPA entities for writes, lightweight DTO projections or SQL views for reads).
- ✅ Easy, no sync problem, strongly consistent.
- ❌ You don't get independent scaling. (The Debezium article notes this is simple but gives up most of CQRS's benefits.)

### Level 2 — Separate databases, synced by replication/events
Write DB and read DB are different instances, or even different technologies. Sync via DB-native replication, events (Kafka), or CDC (Debezium).
- ✅ Independent scaling, tuning, and tech choice.
- ❌ Eventual consistency, more infra.

### Level 3 — CQRS + Event Sourcing
The write side stores **a sequence of events** instead of current state; the current state is rebuilt by replaying them. Read models are projections built from the event stream.
- ✅ Full audit trail, time travel, rebuild any view anytime.
- ❌ Highest complexity. **Only for domains that truly need it** (e.g., finance, ledgers).

> **Important:** CQRS and Event Sourcing are **separate ideas** that work well together. You can do CQRS without Event Sourcing (most teams should).

```
Level 1:  [Cmd model] ─┐
                       ├─▶ ONE DB
          [Qry model] ─┘

Level 2:  [Cmd model] ─▶ Write DB ──sync──▶ Read DB ◀─ [Qry model]

Level 3:  [Cmd model] ─▶ Event Store ──events──▶ Projections ◀─ [Qry model]
```

---

## 7. CQRS in microservices

### The problem

With the **Database per Service** pattern, each service owns its data:

```
Order Service    → Orders DB
Customer Service → Customers DB
Payment Service  → Payments DB
```

Now the UI asks: *"Show my last 10 orders with customer name, payment status and item details."*
A SQL JOIN across three databases is impossible.

### Two solutions

| | API Composition | CQRS |
|---|---|---|
| How | An aggregator calls each service and stitches results in memory | Keep a **pre-built read-only view** updated by events from all services |
| Complexity | Simple | Higher |
| Query speed | Slow if services are slow; one slow service delays everything | Fast — single lookup |
| Availability | Depends on all services being up *at query time* | Reads still work even if a source service is down |
| Large joins / big data | In-memory joins get heavy | Handled at write time |
| Consistency | Real-time | Eventually consistent |

**Rule of thumb:** start with API Composition. Move to CQRS when composition becomes too slow or too heavy.

### Bonus: decoupled teams
Different teams own different services and deploy independently. With CQRS, the read service keeps **its own schema**, so a source service can change its internal model without coordinating every change with every consumer (it only needs to keep the event contract stable).

---

## 8. Keeping the read side in sync

This is the **hardest practical part** of CQRS. How does a write end up in the read DB?

| Option | How it works | Notes |
|---|---|---|
| **DB-native replication** | e.g., PostgreSQL streaming/logical replication to a replica | Simplest. Needs same/compatible DB. Can even be configured for strong consistency. |
| **Application events (Kafka)** | Service publishes events after saving; read service consumes them | Flexible, but **beware dual write** (below). |
| **Transactional Outbox** | Save business data + event row in **one DB transaction**; a relay publishes the outbox rows to Kafka | Reliable. Standard answer in interviews. |
| **CDC (Change Data Capture)** | Tool like **Debezium** reads the DB transaction log and streams changes to Kafka, then a sink writes to the read store | No app code change on the write side; works across different DB types (e.g., Postgres → MySQL, Postgres → time-series DB). |

### The dual-write trap ⚠️

```java
orderRepo.save(order);          // 1. DB commit succeeds
kafkaTemplate.send("order.placed", event);  // 2. app crashes / Kafka down → event lost!
```

The DB and Kafka are two systems; you can't update both atomically. If step 2 fails, the read side never learns about the order.

**Fix → Transactional Outbox:** write the event into an `outbox` table in the **same transaction** as the order. A separate process (Debezium or a poller) reliably moves outbox rows to Kafka. Result: **at-least-once delivery**, so consumers must be **idempotent**.

---

## 9. Full example: Order service (Java + Spring Boot + Kafka)

**Scenario:** E-commerce. Customers place and ship orders (write side) and view their order history (read side).

```
POST /orders ─▶ OrderCommandHandler ─▶ Postgres (orders + outbox)
                                              │  Debezium / relay
                                              ▼
                                        Kafka: order.placed, order.shipped
                                              │
                                              ▼
                                    OrderViewProjector ─▶ MongoDB (order_view)
                                                              ▲
GET /orders?customerId=... ─▶ OrderQueryController ───────────┘
```

> Code below is trimmed to show the idea (Spring Boot 3, Java 17+, Hibernate 6.2+ for embeddable records).

### 9.0 Warm-up: Level 1 CQRS (same DB, no Kafka)

Before the big version — you can do CQRS with just two classes:

```java
@Service
class OrderCommandService {                 // WRITE: rules + entities
    private final OrderRepository repo;
    OrderCommandService(OrderRepository repo) { this.repo = repo; }

    @Transactional
    public UUID placeOrder(PlaceOrderCommand cmd) {
        Order order = Order.place(cmd.customerId(), cmd.lines());
        return repo.save(order).getId();
    }
}

@Service
class OrderQueryService {                   // READ: projections, no entities, no rules
    private final JdbcTemplate jdbc;
    OrderQueryService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<OrderSummaryDto> findByCustomer(UUID customerId) {
        return jdbc.query("""
            SELECT o.id, o.status, o.total_amount, c.name AS customer_name
            FROM orders o JOIN customers c ON c.id = o.customer_id
            WHERE o.customer_id = ? ORDER BY o.created_at DESC
            """,
            (rs, i) -> new OrderSummaryDto(
                rs.getObject("id", UUID.class), rs.getString("customer_name"),
                rs.getString("status"), rs.getBigDecimal("total_amount")),
            customerId);
    }
}
```

Already a win: the write path uses a rich entity; the read path skips the ORM and returns exactly what the screen needs.

### 9.1 Commands (intent objects)

```java
public record OrderLine(String sku, int quantity, BigDecimal unitPrice) {
    public BigDecimal lineTotal() { return unitPrice.multiply(BigDecimal.valueOf(quantity)); }
}

public record PlaceOrderCommand(UUID customerId, List<OrderLine> lines) {}
public record ShipOrderCommand(UUID orderId, String trackingNo) {}
```

### 9.2 Write model (domain entity with business rules)

```java
@Entity
@Table(name = "orders")
public class Order {
    @Id private UUID id;
    private UUID customerId;
    @Enumerated(EnumType.STRING) private OrderStatus status;
    private BigDecimal totalAmount;
    @ElementCollection private List<OrderLine> lines = new ArrayList<>();
    @Version private long version;                    // optimistic locking

    protected Order() {}                              // for JPA

    public static Order place(UUID customerId, List<OrderLine> lines) {
        if (lines == null || lines.isEmpty())
            throw new IllegalArgumentException("Order must contain at least one item");
        Order o = new Order();
        o.id = UUID.randomUUID();
        o.customerId = customerId;
        o.lines = new ArrayList<>(lines);
        o.totalAmount = lines.stream().map(OrderLine::lineTotal)
                             .reduce(BigDecimal.ZERO, BigDecimal::add);
        o.status = OrderStatus.PLACED;
        return o;
    }

    public void ship() {                              // business rule lives HERE
        if (status != OrderStatus.PLACED)
            throw new IllegalStateException("Only PLACED orders can be shipped");
        status = OrderStatus.SHIPPED;
    }

    // getters omitted
}

public enum OrderStatus { PLACED, SHIPPED, CANCELLED }
```

### 9.3 Command handler + Outbox (reliable event publishing)

```java
@Entity
@Table(name = "outbox")
public class OutboxEvent {
    @Id private UUID id = UUID.randomUUID();
    private String aggregateId;
    private String type;                              // e.g. "order.placed" (used as Kafka topic)
    @Column(columnDefinition = "jsonb") private String payload;
    private Instant createdAt = Instant.now();

    protected OutboxEvent() {}
    public OutboxEvent(String aggregateId, String type, String payload) {
        this.aggregateId = aggregateId; this.type = type; this.payload = payload;
    }
}

@Service
public class OrderCommandHandler {
    private final OrderRepository orders;
    private final OutboxRepository outbox;
    private final ObjectMapper mapper;

    public OrderCommandHandler(OrderRepository orders, OutboxRepository outbox, ObjectMapper mapper) {
        this.orders = orders; this.outbox = outbox; this.mapper = mapper;
    }

    @Transactional                                    // order + outbox row commit TOGETHER
    public UUID handle(PlaceOrderCommand cmd) throws JsonProcessingException {
        Order order = orders.save(Order.place(cmd.customerId(), cmd.lines()));

        var event = new OrderPlacedEvent(order.getId(), order.getCustomerId(),
                order.getTotalAmount(), cmd.lines().size(), Instant.now(), order.getVersion());
        outbox.save(new OutboxEvent(order.getId().toString(), "order.placed",
                mapper.writeValueAsString(event)));
        return order.getId();
    }

    @Transactional
    public void handle(ShipOrderCommand cmd) throws JsonProcessingException {
        Order order = orders.findById(cmd.orderId())
                .orElseThrow(() -> new NoSuchElementException("Order not found"));
        order.ship();                                 // rule enforced; @Version bumps on flush

        var event = new OrderShippedEvent(order.getId(), cmd.trackingNo(), Instant.now(),
                order.getVersion() + 1);              // version after this update
        outbox.save(new OutboxEvent(order.getId().toString(), "order.shipped",
                mapper.writeValueAsString(event)));
    }
}

public record OrderPlacedEvent(UUID orderId, UUID customerId, BigDecimal totalAmount,
                               int itemCount, Instant occurredAt, long version) {}
public record OrderShippedEvent(UUID orderId, String trackingNo, Instant occurredAt, long version) {}
```

A relay (Debezium's Outbox Event Router, or a small scheduled poller) reads `outbox` and publishes to Kafka **keyed by `aggregateId`**, so all events for one order stay in order on one partition.

### 9.4 Read model (denormalized, shaped for the screen)

```java
@Document(collection = "order_view")
public record OrderView(
        @Id String orderId,
        String customerId,
        String status,
        BigDecimal totalAmount,
        int itemCount,
        String trackingNo,
        Instant placedAt,
        long version) {

    public OrderView shipped(String trackingNo, long newVersion) {
        return new OrderView(orderId, customerId, "SHIPPED", totalAmount,
                itemCount, trackingNo, placedAt, newVersion);
    }
}

public interface OrderViewRepository extends MongoRepository<OrderView, String> {
    List<OrderView> findByCustomerIdOrderByPlacedAtDesc(String customerId);
}
```

### 9.5 Projector (event consumer that builds the read model)

```java
@Component
public class OrderViewProjector {
    private final OrderViewRepository views;
    public OrderViewProjector(OrderViewRepository views) { this.views = views; }

    @KafkaListener(topics = "order.placed", groupId = "order-view-projector")
    public void on(OrderPlacedEvent e) {
        // save() = upsert by id → replaying the same event is harmless (idempotent)
        views.save(new OrderView(e.orderId().toString(), e.customerId().toString(),
                "PLACED", e.totalAmount(), e.itemCount(), null, e.occurredAt(), e.version()));
    }

    @KafkaListener(topics = "order.shipped", groupId = "order-view-projector")
    public void on(OrderShippedEvent e) {
        views.findById(e.orderId().toString()).ifPresent(v -> {
            if (e.version() > v.version()) {          // ignore stale / duplicate events
                views.save(v.shipped(e.trackingNo(), e.version()));
            }
        });
        // If the view is missing (placed event not processed yet), throw so the
        // consumer retries / sends to a dead-letter topic instead of silently dropping.
    }
}
```

### 9.6 APIs

```java
@RestController
@RequestMapping("/orders")
class OrderCommandController {                        // WRITE API
    private final OrderCommandHandler handler;
    OrderCommandController(OrderCommandHandler handler) { this.handler = handler; }

    @PostMapping
    ResponseEntity<Map<String, UUID>> place(@RequestBody PlaceOrderCommand cmd) throws Exception {
        UUID id = handler.handle(cmd);
        // 202: accepted, the read view will catch up shortly
        return ResponseEntity.accepted().body(Map.of("orderId", id));
    }

    @PostMapping("/{id}/ship")
    ResponseEntity<Void> ship(@PathVariable UUID id, @RequestParam String trackingNo) throws Exception {
        handler.handle(new ShipOrderCommand(id, trackingNo));
        return ResponseEntity.accepted().build();
    }
}

@RestController
@RequestMapping("/orders")
class OrderQueryController {                          // READ API — no business logic
    private final OrderViewRepository views;
    OrderQueryController(OrderViewRepository views) { this.views = views; }

    @GetMapping("/{id}")
    ResponseEntity<OrderView> get(@PathVariable String id) {
        return views.findById(id).map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    List<OrderView> byCustomer(@RequestParam String customerId) {
        return views.findByCustomerIdOrderByPlacedAtDesc(customerId);
    }
}
```

> In a real system the command and query controllers would usually be **separate deployables** (separate microservices) so they can scale independently.

### 9.7 Walkthrough (great for explaining in an interview)

1. `POST /orders` → `PlaceOrderCommand`.
2. Handler checks rules, saves **Order + OutboxEvent in one transaction** → Postgres.
3. Relay/Debezium publishes `order.placed` to Kafka.
4. `OrderViewProjector` consumes it and upserts a **flat `OrderView`** in MongoDB.
5. `GET /orders?customerId=…` reads MongoDB directly — one fast lookup, no joins.
6. `POST /orders/{id}/ship` → rule check → `order.shipped` event → projector updates the view's status.

---

## 10. Eventual consistency — how to handle it

After a command succeeds, the read view might be **milliseconds to seconds behind**. This is the #1 interview follow-up.

| Technique | Idea |
|---|---|
| **Return 202 Accepted + id** | Be honest: "accepted, processing." Client fetches later. |
| **Optimistic UI** | Frontend shows the new item immediately from its own state; the real data arrives later. |
| **Return the result from the command** | For the one just-created item, return needed fields in the command response. |
| **Read-your-writes** | Briefly read from the write side for the user's own fresh data, or pass a `version` token and have the query side wait/poll until `view.version >= token`. |
| **Polling / WebSocket / SSE** | UI polls or gets pushed an update when the view catches up. |
| **Monitor lag** | Track consumer lag (Kafka) and alert if the read side falls behind. |

Also remember:
- **Idempotent consumers** — Kafka gives at-least-once delivery; processing an event twice must not corrupt the view (upserts, version checks, dedupe by event id).
- **Ordering** — key events by aggregate id so one order's events arrive in order.
- **Rebuilding views** — replay events (or re-snapshot via CDC) to recreate a read model after a bug or schema change. A huge perk of the pattern.
- Many business flows are fine with a short delay; if one is not (e.g., the exact balance before a withdrawal), validate against the **write side** for that decision.

---

## 11. Benefits and drawbacks

### ✅ Benefits

- **Independent scaling** — add read replicas/instances without touching the write side.
- **Optimized models** — the write model focuses on rules; the read model is flat and fast. Each side can use the best database for the job (e.g., relational for writes, Elasticsearch/Mongo/time-series for reads).
- **Better performance** — reads become a single lookup on a pre-computed view.
- **Less contention** — reads don't lock write tables.
- **Security** — read store can be read-only; only the write service has write access.
- **Team and schema independence** — services evolve without tight coordination.
- **Cleaner code** — commands and queries are simple, focused, and easier to test.
- **Natural fit for events, audit trails and Event Sourcing.**

### ❌ Drawbacks

- **More complexity** — more components, more deployment and operational work. (Martin Fowler's warning: for most systems CQRS adds *risky* complexity.)
- **Eventual consistency** — the UI and business flows must tolerate lag.
- **Possible code duplication** — similar fields in multiple models, plus mapping code.
- **Sync infrastructure to run and monitor** — Kafka/CDC, dead-letter topics, replays.
- **Harder debugging** — a bug may live in the write side, the event, or the projector.
- **Steeper learning curve** for the team.

---

## 12. When to use / when NOT to use

### Use it when

- **Reads massively outnumber writes** (or vice versa) and you need to scale each side differently.
- **Read shapes differ a lot from write shapes** (dashboards, search, reports, aggregated views).
- **Microservices need cross-service queries** and API Composition has become too slow or heavy.
- The **domain is complex**, with rich business rules on writes, and a single model has become bloated.
- You need **multiple read representations** of the same data (list view, search index, analytics).
- You already use **event-driven architecture / Event Sourcing**.

### Don't use it when

- It's a **simple CRUD app** — one model is easier and faster to build.
- The team is **new to the pattern** and the benefits aren't proven.
- You **can't tolerate eventual consistency** for the key flows.
- Reads are slow only because of **missing indexes or bad queries** — fix those first.
- You only need heavy reporting → a **read replica / reporting database** is far simpler.

### Golden rules

1. **Apply it per bounded context / module, not to the whole system.** Different parts can make different choices.
2. **Start simple.** Single model first → Level 1 → Level 2 → (maybe) Event Sourcing, *when measurements justify it*.

---

## 13. Anti-patterns and common mistakes

| ❌ Mistake | Why it hurts | ✅ Do this instead |
|---|---|---|
| **CQRS everywhere** | Huge complexity for no gain | Use only where read/write imbalance or model mismatch is real |
| **Using the write model for reads** | Misses the whole point; you're back to one model | Dedicated read models / projections |
| **Sharing one DB schema for both sides** | Can't optimize or evolve independently | Separate schemas/stores (at least separate tables/views) |
| **Dual write** (save to DB, then send to Kafka separately) | Events get lost on failure → read side silently drifts | Transactional Outbox or CDC |
| **Non-idempotent projectors** | Duplicate delivery corrupts the view | Upserts, version checks, event-id dedupe |
| **Business logic in the read side** | Rules scattered; queries get side effects | Queries only read; rules stay on the command side |
| **Data-centric commands** (`setStatus`) | CRUD in disguise; rules leak to callers | Task-based commands (`ShipOrder`) |
| **Commands that return big data** | Blurs the separation | Return only an id/ack; fetch data via a query |
| **Ignoring eventual consistency in the UI** | Users think "my order vanished" | 202 + optimistic UI + read-your-writes tricks |
| **No lag monitoring or replay plan** | Stale views go unnoticed; can't fix them | Consumer-lag alerts, DLQ, rebuild tooling |
| **Treating CQRS = Event Sourcing** | Over-engineering | They're independent; adopt Event Sourcing only if needed |
| **Ignoring ordering** | Update processed before create | Key by aggregate id; version numbers |

---

## 14. CQRS vs related concepts

| Concept | What it is | Relation to CQRS |
|---|---|---|
| **CRUD** | One model for create/read/update/delete | What CQRS moves away from when CRUD hurts |
| **CQS** | Method-level rule: command *or* query | CQRS is the architectural-level version |
| **Event Sourcing** | Store changes as a sequence of events; rebuild state by replay | Often paired with CQRS; **not required** |
| **Read replica** | DB copy used for reads | A simpler cousin: same model, just scales reads. CQRS uses a *different model* |
| **Reporting database** | Separate DB just for heavy reports | Lighter alternative when you don't need CQRS for all queries |
| **Materialized view** | Pre-computed query result | A common way to implement the read model |
| **API Composition** | Aggregator calls services and joins in memory | Simpler alternative for cross-service queries |
| **Saga** | Manages distributed transactions with local txns + compensation | Handles *writes* across services; CQRS handles *queries* across services |
| **Outbox / CDC** | Reliable event publishing from a DB | The glue that keeps CQRS read models in sync |

---

## 15. Tools and technologies

- **Frameworks:** Axon Framework (CQRS + Event Sourcing for Java/Spring), Spring Boot + Spring Kafka, Eventuate.
- **Messaging:** Apache Kafka, RabbitMQ, AWS SNS/SQS/Kinesis.
- **CDC / replication:** Debezium (Kafka Connect), native PostgreSQL logical/streaming replication, AWS DMS.
- **Write stores:** PostgreSQL, MySQL, Oracle, event stores (EventStoreDB, Axon Server).
- **Read stores:** MongoDB, Elasticsearch/OpenSearch, Redis, Cassandra, DynamoDB, ClickHouse/QuestDB (analytics/time-series), materialized views.

---

## 16. Interview Q&A

**Q1. What is CQRS in simple words?**
Splitting an application into a write side (commands) and a read side (queries), each with its own model — and often its own database — so each can be optimized and scaled on its own.

**Q2. Difference between CQS and CQRS?**
CQS is a method-level principle: a method either changes state or returns data. CQRS applies the same idea to whole models, services and databases.

**Q3. Why not just use one model (CRUD)?**
For simple apps, you should. But as reads and writes diverge in shape, load and rules, one model becomes bloated and a bottleneck. CQRS lets each side specialize.

**Q4. How does the read side get its data?**
Through synchronization: DB-native replication, events published to Kafka/RabbitMQ, or CDC with Debezium. A projector consumes these and updates the read model. For reliability, I'd use the **Transactional Outbox** pattern.

**Q5. What is eventual consistency and how do you deal with it?**
The read model may lag the write model slightly. I handle it with 202 Accepted responses, optimistic UI, returning needed data from the command, version-based read-your-writes, and monitoring consumer lag. For critical decisions I read from the write side.

**Q6. Is CQRS the same as Event Sourcing?**
No. CQRS separates read/write models. Event Sourcing stores state as a sequence of events. They pair nicely (events feed the read projections), but each works alone.

**Q7. Do CQRS systems always need two databases?**
No. Level 1 uses the same database with separate models. Separate databases give the most benefit (independent scaling and tech), at the cost of sync complexity.

**Q8. What is the dual-write problem?**
Writing to the DB and publishing to Kafka as two separate steps can't be atomic — if the second fails, the read model drifts. Fix: Outbox pattern (event stored in the same transaction) or CDC.

**Q9. How do you make the projector idempotent?**
Use upserts keyed by aggregate id, track a version/sequence number and ignore stale events, or store processed event ids. Kafka is at-least-once, so duplicates will happen.

**Q10. How do you preserve ordering?**
Key Kafka messages by aggregate id so all events for the same entity go to one partition. Add a version number on events as a safety net.

**Q11. How does CQRS relate to microservices?**
With Database per Service, JOINs across services are impossible. CQRS builds a read-only view fed by events from multiple services, so cross-service queries become a single fast lookup. The alternative is API Composition, which is simpler but slower and less available.

**Q12. API Composition vs CQRS — which first?**
API Composition first (simpler). Switch to CQRS when composition is too slow, needs large in-memory joins, or depends too much on every service being up.

**Q13. What are the downsides?**
Complexity, eventual consistency, duplicated models/code, operational overhead (Kafka/CDC, DLQ, replay), harder debugging.

**Q14. When would you NOT use CQRS?**
Simple CRUD domains, small teams, strong-consistency-everywhere requirements, or when the real problem is a missing index or a read replica would do.

**Q15. How do you rebuild a read model if it gets corrupted?**
Drop it and replay the events (from Kafka retention, an event store, or a fresh CDC snapshot) through the projector. Being able to rebuild any view is a key advantage.

**Q16. What would you do if a command succeeds but the user doesn't see their data?**
Explain it's the eventual-consistency window. Check consumer lag. Improve UX (optimistic UI / read-your-writes). If lag is persistently high, scale consumers or fix projector bottlenecks.

**Q17. Should a command return data?**
Strictly, no — maybe just an id or acknowledgment. Pragmatically, returning a created id or minimal result is fine. Returning large datasets blurs the separation; use a query.

**Q18. How would you secure it?**
The read store can use read-only credentials, and only the write service gets write access — a smaller attack surface than one shared read/write DB.

**Q19. Real-world use case?**
E-commerce order history: place/cancel orders go through the write side with strict rules; "My Orders" reads from a denormalized view combining order, customer and shipment info. Other fits: banking dashboards, product search, analytics.

**Q20. Martin Fowler's advice on CQRS?**
Be cautious. It's valuable in specific complex or high-performance contexts, but for most systems it adds risky complexity. Use it in particular bounded contexts, not the entire system.

---

## 17. How to explain CQRS in an interview (script)

**Say it in 5 steps (≈60–90 seconds):**

1. **Define:** "CQRS means Command Query Responsibility Segregation — I use one model to *change* data and a separate model to *read* it."
2. **Why:** "Reads and writes have different needs: writes need business rules and consistency, reads need speed and convenient shapes. A single model compromises on both, and they scale differently."
3. **How:** "Commands go to a write service that validates and saves, and publishes an event. A projector consumes it and updates a denormalized read store. Queries hit that store directly."
4. **Example:** "In an e-commerce Order service, `PlaceOrder` hits Postgres and emits `OrderPlaced` through an outbox to Kafka. A consumer updates a MongoDB `OrderView` so 'My Orders' is one lookup with no cross-service joins."
5. **Trade-offs:** "The cost is complexity and eventual consistency, so I'd only use it where reads and writes truly diverge — and I'd handle consistency with idempotent consumers, ordered events and good UX."

**Memory hooks:**

- 🍽️ *Kitchen writes, board reads.*
- 🛣️ *Two roads, one destination — different traffic, different design.*
- ✋ *"Don't use it until CRUD hurts."*

---

## 18. Cheat sheet

```
CQRS = split WRITE model (commands) from READ model (queries)

Command  → changes state, task-based ("ShipOrder"), returns ack/id
Query    → reads state, no side effects, returns DTO/view

Levels:  1) same DB, 2 models   2) separate DBs + sync   3) + Event Sourcing

Sync:    DB replication | Kafka events | Outbox | CDC (Debezium)
Watch:   dual write, idempotency, ordering, lag, replay

Gives:   independent scaling, optimized models, speed, security, decoupling
Costs:   complexity, eventual consistency, duplication, ops overhead

Use:     read/write imbalance, complex domain, cross-service queries, multiple views
Avoid:   simple CRUD, no tolerance for lag, whole-system adoption

Related: CQS (method level) | Event Sourcing (events as truth) |
         API Composition (simpler alternative) | Saga (writes across services)
```

---

## 19. References

- Martin Fowler — *CQRS*: <https://martinfowler.com/bliki/CQRS.html>
- Debezium blog — *CQRS Design Pattern* (Vojtěch Juránek): <https://debezium.io/blog/2025/11/28/cqrs/>
- ByteByteGo — *A Pattern Every Modern Developer Should Know: CQRS*: <https://blog.bytebytego.com/p/a-pattern-every-modern-developer>
- Chris Richardson — *Pattern: CQRS* (microservices.io): <https://microservices.io/patterns/data/cqrs.html>
- Abhinav Singh — *Microservices Patterns: CQRS Pattern*: <https://blog.singhabhinav.in/microservices-patterns-cqrs-pattern-eaca6435bab7>
- Further reading: Greg Young's and Udi Dahan's writing on CQRS; Microsoft Azure Architecture Center — *CQRS pattern*; Debezium *Outbox Event Router* docs.

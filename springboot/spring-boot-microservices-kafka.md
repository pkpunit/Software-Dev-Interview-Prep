---
title: Spring Boot Microservices & Kafka Interview Questions & Answers
layout: docs
category: spring-boot
tags: [microservices, spring-cloud, api-gateway, service-discovery, kafka, spring-kafka, event-driven, saga, outbox, interview]
level: junior-to-senior
questions: 65
---

# Spring Boot Microservices & Kafka — Interview Questions & Answers

> **65 questions**: microservice architecture with Spring Cloud (discovery, gateway, config, tracing), resilience & data patterns, **Kafka internals** (partitions, replication, consumer groups, delivery semantics), **Spring Kafka** (producers, listeners, retries, DLT, transactions) and real event-driven scenarios (duplicates, ordering, lag, data loss).
> Every answer follows the same pattern: **In one line** → **Explained simply** (analogy) → **Example / code** → **Interview tip / trap / follow-up**.
> Sources consolidated: roadmap.sh and CodingShuttle (read in full), Spring Cloud / Spring for Apache Kafka reference docs, Apache Kafka documentation, microservices.io patterns, senior-level Spring Boot question lists (LinkedIn/Medium/Scribd topics: distributed transactions, rate limiting, service security, startup tuning), plus real interview scenarios.
> *(The Scribd, LinkedIn and Medium senior-engineer pages are bot-blocked/login-gated and could not be opened; their typical topics are covered from the standard senior question set.)*

**Legend:** 🟢 Easy &nbsp;|&nbsp; 🟡 Medium &nbsp;|&nbsp; 🔴 Hard &nbsp;|&nbsp; ⭐ Must-know (asked very often)

> 📎 **Companion pages:** `spring-boot-transactions.md` (Saga, Outbox, idempotency in depth) · `spring-boot-rest-api.md` (clients, resilience) · `spring-security.md` (service-to-service security) · `spring-boot-production.md` · `spring-boot-testing.md` · `spring-boot-core.md`

---

## 📑 On this page

| # | Section | Questions |
|---|---------|-----------|
| 1 | [Microservices Fundamentals & Spring Cloud](#1-microservices-fundamentals--spring-cloud) | Q1 – Q14 |
| 2 | [Resilience, Data & Architecture Patterns](#2-resilience-data--architecture-patterns) | Q15 – Q24 |
| 3 | [Kafka Fundamentals](#3-kafka-fundamentals) | Q25 – Q40 |
| 4 | [Spring for Apache Kafka](#4-spring-for-apache-kafka) | Q41 – Q54 |
| 5 | [Event-Driven Scenarios & Wrap-up](#5-event-driven-scenarios--wrap-up) | Q55 – Q65 |

**Quick revision — top 15 ⭐:** Q1 (monolith vs microservices) · Q3 (service boundaries) · Q6 (service discovery) · Q8 (API gateway) · Q10 (sync vs async) · Q11 (distributed tracing) · Q26–27 (Kafka core & replication) · Q29 (producer reliability) · Q31–32 (consumer groups & rebalancing) · Q34–35 (ordering & delivery semantics) · Q45–47 (error handling, DLT, poison pills) · Q49 (idempotent consumer) · Q55 (order event flow) · Q61 (no message loss)

---

## 1. Microservices Fundamentals & Spring Cloud

### Q1. ⭐🟢 What are microservices and how do they differ from a monolith?
**In one line:** An application built as **small, independently deployable services**, each owning one business capability and its own data, communicating over the network.

**Explained simply (analogy — shopping mall vs department store):** A monolith is one giant department store: change the billing counter and the whole store closes for renovation. Microservices are a **mall of independent shops** — each can be renovated, staffed and scaled on its own, but they need roads, signage and rules to cooperate.

| | Monolith | Microservices |
|---|----------|----------------|
| Deployment | One unit | **Independent** per service |
| Scaling | Whole app | **Per service** (scale only checkout) |
| Tech | One stack | Polyglot possible |
| Data | One shared DB | **Database per service** |
| Failure | One bug can take down all | **Isolation** (if resilience is designed) |
| Complexity | Simple ops, big codebase | Simple services, **hard distributed system** |
| Transactions | ACID, local | **Eventual consistency**, sagas |
| Team scaling | Merge conflicts, coordination | Autonomous teams (Conway's law) |

### Q2. 🟡 When should you NOT use microservices? (modular monolith)
- Small team/product, unclear domain, early-stage startup → microservices add **operational tax** (CI/CD per service, observability, networking, data consistency).
- **Modular monolith** (strict module boundaries inside one deployable, e.g., Spring Modulith) is often the best start; **extract services later** when scaling/team boundaries demand it.
- Warning signs of a **distributed monolith:** services deployed together, shared database, chatty synchronous calls, lock-step releases — all the cost, none of the benefits.

### Q3. ⭐🟡 How do you decide service boundaries?
**In one line:** Along **business capabilities / DDD bounded contexts**, not technical layers.

- ✅ `Order`, `Payment`, `Inventory`, `Catalog`, `Shipping` — each with its own language, data and team.
- ❌ `ControllerService`, `DaoService` (technical slicing), or "one service per table".
**Heuristics:** high cohesion inside, **low coupling** outside; a change in one business area shouldn't force changes in many services; a service should be **ownable by one team**; avoid transactions spanning services; use **events** to tell others what happened. **Anti-corruption layers** protect a new service from legacy models.

### Q4. 🟡 Why "database per service"? What do you lose?
**Why:** loose coupling (no hidden schema dependencies), independent scaling/tech (SQL vs Mongo), clear ownership, safe independent deployments.
**What you lose:** **cross-service joins** and **ACID transactions** → use **API composition**, **CQRS read models**, **sagas/outbox** (`spring-boot-transactions.md` Q45–51), and accept **eventual consistency**. Never let service B read service A's tables directly.

### Q5. 🟢 What does Spring Cloud provide?
| Concern | Spring Cloud component |
|---------|------------------------|
| Service discovery | Netflix **Eureka**, Consul, Zookeeper, **Kubernetes** (native DNS / Spring Cloud Kubernetes) |
| Client-side load balancing | **Spring Cloud LoadBalancer** |
| API gateway | **Spring Cloud Gateway** |
| Config | **Config Server**, Vault, K8s ConfigMaps |
| Resilience | **Resilience4j** (circuit breaker, retry, bulkhead, rate limiter) |
| Declarative clients | **OpenFeign** / HTTP interfaces |
| Messaging | **Spring Cloud Stream** (Kafka/RabbitMQ binders), Spring Kafka |
| Tracing | **Micrometer Tracing** + OpenTelemetry/Zipkin (Sleuth removed in Boot 3) |
| Contracts | **Spring Cloud Contract** |
**Modern note:** on Kubernetes, much of discovery/config/LB/retries is provided by the **platform and service mesh**; Spring Cloud is still used for gateway, resilience, messaging and observability.

### Q6. ⭐🟡 What is service discovery? Client-side vs server-side?
**In one line:** Services come and go (autoscaling, restarts) with **changing IPs**, so callers look up instances **by name** from a **registry** instead of hard-coding addresses.

```
Order Service ──► asks registry for "inventory-service" ──► [10.0.1.5:8080, 10.0.1.9:8080] ──► picks one (load balance)
```
| | Client-side (Eureka + Spring Cloud LoadBalancer) | Server-side (Kubernetes Service / cloud LB) |
|---|---------------------------------------------------|---------------------------------------------|
| Who picks the instance | **The calling service** | A **proxy/LB in front** |
| Registry | Eureka/Consul (services **register** + heartbeat) | K8s API / DNS (`http://inventory-service`) |
| Pros | Smart routing, no extra hop | **No client libraries**, language-agnostic |
```java
@Bean @LoadBalanced RestClient.Builder lb() { return RestClient.builder(); }
restClient.get().uri("http://inventory-service/stock/{sku}", sku) ...     // name resolved + balanced
```
**Eureka facts:** instances send heartbeats (default 30s); **self-preservation mode** stops evicting when many heartbeats are missed (network partition protection). **Kubernetes** typically makes Eureka unnecessary.

### Q7. 🟡 How does load balancing work in Spring Cloud?
**Spring Cloud LoadBalancer** (replaced Netflix Ribbon) picks an instance per request from the discovery list — default **round-robin**, with pluggable strategies (random, weighted, zone-aware) and health-check filtering. Works with `@LoadBalanced` `RestClient/WebClient/RestTemplate` and OpenFeign. On K8s, kube-proxy/Service already balances at L4; a **service mesh** can do smarter L7 balancing.

### Q8. ⭐🟡 What is an API Gateway and what does Spring Cloud Gateway do?
**In one line:** A **single entry point** for clients that routes requests to services and handles **cross-cutting edge concerns**.

**Responsibilities:** routing, **authentication/JWT validation**, **rate limiting**, **circuit breaking/fallback**, TLS termination, CORS, request/response transformation, aggregation (BFF), logging/tracing headers, canary routing.
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: orders
          uri: lb://order-service                  # discovery + load balancing
          predicates:
            - Path=/api/orders/**
            - Method=GET,POST
          filters:
            - StripPrefix=1
            - name: RequestRateLimiter             # Redis token bucket
              args: { redis-rate-limiter.replenishRate: 10, redis-rate-limiter.burstCapacity: 20, key-resolver: "#{@userKeyResolver}" }
            - name: CircuitBreaker
              args: { name: ordersCb, fallbackUri: forward:/fallback/orders }
            - TokenRelay=                           # forward the user's OAuth2 token
```
Built on **WebFlux/Netty** (non-blocking); there's also a servlet/MVC variant. **Predicates** decide *if* a route matches (Path, Header, Host, Method, Weight); **filters** modify request/response (pre/post). **Trap:** don't put business logic in the gateway; keep services validating tokens too (zero trust — `spring-security.md` Q42).

### Q9. 🟡 Config management in microservices — Config Server vs Kubernetes ConfigMaps/Secrets?
**Config Server:** central Git-backed config, per-app/profile/label, `@RefreshScope` + `/actuator/refresh` or Spring Cloud Bus; encryption support. **K8s ConfigMap/Secret:** env vars or mounted files (`spring.config.import=optional:configtree:/etc/config/`), no extra service, managed by deployment pipelines (GitOps). **Rule:** build **one image**, inject environment config externally; keep **secrets** in Secret managers/Vault. More: `spring-boot-core.md` Q37–44.

### Q10. ⭐🟡 Synchronous vs asynchronous communication — when to use which?
| | **Synchronous** (REST/gRPC) | **Asynchronous** (Kafka/RabbitMQ events) |
|---|------------------------------|------------------------------------------|
| Coupling | **Temporal coupling** (callee must be up) | Decoupled in time |
| Latency | Immediate response | Eventual |
| Failure impact | Cascades (needs resilience) | Buffered by broker |
| Use for | **Queries**, need an answer now, simple request/response | **Commands/events**, workflows, notifications, integration, high fan-out |
| Consistency | Easier to reason about | **Eventual**; needs idempotency |
| Tech | `RestClient`, Feign, gRPC | Kafka, RabbitMQ, SQS |
**Guidelines:** prefer **async events for state changes between services** (`OrderPlaced`) and **sync calls for reads** that must be fresh; avoid long **synchronous chains** (A→B→C→D = multiplied latency/failure). **gRPC** (HTTP/2 + Protobuf) for low-latency internal calls; **REST** for public/external APIs.

### Q11. ⭐🟡 How do you trace a request across microservices? (distributed tracing)
**In one line:** Propagate a **trace id** through every call (HTTP headers, Kafka headers); each hop records a **span**, and a backend (Zipkin/Tempo/Jaeger) stitches the timeline.

```
Gateway [span1] → Order [span2] → Inventory [span3]
                         └──► Kafka → Notification [span4]     all share traceId=4bf92f…
```
- **Spring Boot 3:** **Micrometer Tracing** (bridge to **OpenTelemetry** or Brave) — replaces Spring Cloud Sleuth.
- Propagation standard: **W3C `traceparent`** header; trace ids go into logs via **MDC** (`%X{traceId}`).
```properties
management.tracing.sampling.probability=0.1                    # sample 10% in prod
management.otlp.tracing.endpoint=http://otel-collector:4318/v1/traces
spring.kafka.template.observation-enabled=true                  # propagate through Kafka producer
spring.kafka.listener.observation-enabled=true                  # …and consumer
```
**Interview tip:** Tracing + **metrics** + **centralized logs** = the **three pillars of observability**; mention **correlation ids** for support teams.

### Q12. 🟡 What do you need for observability in a microservice platform?
- **Logs:** structured JSON, shipped to ELK/Loki; include `traceId`, `service`, `userId`.
- **Metrics:** Micrometer → **Prometheus → Grafana**; RED metrics per service, JVM, pools, **Kafka consumer lag**.
- **Traces:** OpenTelemetry (Q11).
- **Health/readiness:** Actuator probes for Kubernetes (`spring-boot-production.md`).
- **Alerting/SLOs:** latency p99, error rate, saturation, lag. Dashboards per service + **dependency maps**.

### Q13. 🟡 What are API composition and BFF? How do you avoid chatty APIs?
- **API composition:** a gateway/aggregator calls several services and **merges** the results for one screen (do calls **in parallel**, with timeouts and partial-failure handling — `spring-boot-rest-api.md` Q45).
- **BFF (Backend For Frontend):** a dedicated backend per client type (web/mobile/partner) that shapes data for that client — avoids over/under-fetching.
- Avoid **N calls per screen**: coarse-grained endpoints, **read models** (CQRS), caching, GraphQL gateway where suitable.

### Q14. 🟡 What does "12-factor" and cloud-native deployment mean for Spring Boot services?
Config in **env**, **stateless** processes (state in DB/Redis), **backing services** as attached resources, one **codebase → many deploys**, **logs to stdout**, **disposability** (fast start, **graceful shutdown**), dev/prod parity, **port binding** (embedded server), concurrency via **scaling out**. In Kubernetes: **liveness/readiness probes**, resource requests/limits (`-XX:MaxRAMPercentage`), HPA autoscaling, config via ConfigMaps/Secrets, **rolling updates** with `preStop` + graceful shutdown (`spring-boot-core.md` Q52).

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; Next: [Resilience, Data & Architecture Patterns →](#2-resilience-data--architecture-patterns)

---

## 2. Resilience, Data & Architecture Patterns

### Q15. ⭐🟡 How do you stop one failing service from taking down others? (cascading failures)
**In one line:** Combine **timeouts, bounded retries with backoff, circuit breakers, bulkheads and fallbacks** — details and code in `spring-boot-rest-api.md` Q43.

**Why failures cascade:** Service A calls slow B → A's threads pile up waiting → A stops serving everyone → A's callers pile up… **Defense:** (1) **timeouts** everywhere, (2) **circuit breaker** opens after repeated failures (fail fast, `CLOSED → OPEN → HALF_OPEN`), (3) **bulkhead** isolates thread/connection pools per dependency, (4) **retry only idempotent calls** with jitter (retry storms amplify outages), (5) **graceful degradation** (cached/default data), (6) **async messaging** to decouple, (7) **load shedding / rate limiting**, (8) health checks + autoscaling.

### Q16. ⭐🔴 How do you keep data consistent across services? (recap)
**Saga** (choreography/orchestration with compensations) + **Transactional Outbox** (atomic DB write + event) + **idempotent consumers** + **eventual consistency UX**. Avoid 2PC. Full explanation and code: `spring-boot-transactions.md` Q40–51.

### Q17. 🟡 What is CQRS and when is it worth it?
**In one line:** **Command Query Responsibility Segregation** — separate the **write model** (commands, business rules, normalized DB) from **read models** (denormalized views tuned for queries).
```
Command ─► Order service ─► writes DB ─► publishes OrderPlaced ─► projector ─► read DB (Elasticsearch / Redis / SQL view)
Query   ─────────────────────────────────────────────────────────────────────► read DB
```
**Use when:** read and write loads/shape differ greatly, you need **fast cross-service queries** (replacing joins), or you adopt event sourcing. **Cost:** eventual consistency between sides, more infrastructure, projection rebuild tooling. **Don't** use for simple CRUD.

### Q18. 🟡 What is event sourcing? Pros and cons?
State is stored as an **append-only sequence of events** (`AccountOpened`, `MoneyDeposited`) — current state = replay of events (plus snapshots).
**Pros:** full **audit/history**, time-travel/debugging, natural event publishing, rebuild new read models. **Cons:** complexity (**event versioning/upcasting**, replays), eventual consistency, harder ad-hoc queries (needs CQRS projections), steep learning curve. Tools: Axon, EventStoreDB; Kafka can be the log but isn't a full event-store out of the box.

### Q19. 🟡 Can you get "exactly-once" in microservices?
**Not end-to-end for external side effects.** Brokers/networks give **at-least-once** (or at-most-once). The practical goal is **effectively-once = at-least-once delivery + idempotent processing** (dedupe keys, upserts, unique constraints, idempotency keys). Kafka offers **exactly-once within Kafka** (transactions — Q50); anything touching a DB/HTTP needs idempotency (`spring-boot-transactions.md` Q42).

### Q20. 🟡 How do you handle API/event contracts and versioning between teams?
- **Consumer-driven contract tests** (Pact / Spring Cloud Contract) in CI.
- **Backward-compatible changes**: add optional fields, never rename/remove/retype; **tolerant reader** (ignore unknown fields).
- **Events:** use **Schema Registry** (Avro/Protobuf/JSON Schema) with compatibility modes (**BACKWARD** = new schema reads old data; **FORWARD**; **FULL**); version event types (`OrderPlaced.v2`) when breaking; keep old versions until consumers migrate.
- Document with OpenAPI/AsyncAPI; deprecation timelines.

### Q21. ⭐🟡 Service mesh vs Spring Cloud libraries — what's the difference?
**Service mesh** (Istio, Linkerd): **sidecar proxies (Envoy)** handle **mTLS, retries, timeouts, circuit breaking, traffic shifting (canary), telemetry** at the network layer — **no code changes**, language-agnostic. **Spring Cloud libs** do it **inside the app** (Java only, code/config).
**Trade-offs:** mesh adds operational complexity/latency but standardizes cross-cutting concerns; libs give business-aware fallbacks. **Trap:** enabling retries in **both** the mesh and the app multiplies attempts (retry storm) — pick one layer.

### Q22. ⭐🟡 How do you migrate a monolith to microservices? (strangler fig)
**Strangler Fig:** put a **facade/gateway** in front; **route one capability at a time** to a new service while the rest stays in the monolith; shrink the monolith until it disappears.
**Steps:** identify a seam (bounded context) → build the new service + its own data (use **CDC/outbox** to sync) → route traffic via gateway (feature flag/canary) → verify → cut over → remove old code. Use an **anti-corruption layer** to translate models; avoid a big-bang rewrite; keep the **database split** as the hardest part (dual-write risks → CDC).

### Q23. 🟡 How do you use Redis/distributed caching in microservices?
**Cache-aside:** read → check cache → miss → load DB → populate (TTL). `@Cacheable` with `spring-boot-starter-data-redis`/`RedisCacheManager`. Concerns: **invalidation** (TTL + event-driven eviction on `ProductUpdated`), **cache stampede** (locking/early refresh), **consistency** (stale reads acceptable?), serialization format, key naming/versioning, **don't cache per-user secrets** in shared keys. Redis also serves **rate limiting counters**, **distributed locks**, sessions (Spring Session), idempotency keys.

### Q24. 🟡 How do you do distributed locking and leader election?
Needed when **only one instance** may run a job or touch a resource (scheduled tasks — `spring-boot-core.md` Q60). Options: **ShedLock** (DB/Redis lock for `@Scheduled`), **Redis locks** (Redisson/`SET NX PX`), **ZooKeeper/etcd/Consul** leases, Kubernetes **Lease**/leader election, DB `SELECT … FOR UPDATE SKIP LOCKED`. **Rules:** locks need a **TTL** (crash safety), use a **fencing token** for correctness (a paused process may resume after losing the lock), keep critical sections short, and prefer **idempotent work** over locks when possible.

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Fundamentals](#1-microservices-fundamentals--spring-cloud) &nbsp;|&nbsp; Next: [Kafka Fundamentals →](#3-kafka-fundamentals)

---

## 3. Kafka Fundamentals

### Q25. ⭐🟢 What is Apache Kafka, what are its use cases, and why is it fast?
**In one line:** A **distributed, durable, partitioned commit log** used as an event streaming platform — producers **append** records, consumers **read at their own pace**, and data is **retained** (not deleted on read).

**Explained simply (analogy — a newspaper archive):** Publishers (producers) add editions to an ever-growing archive (log). Each reader (consumer group) keeps a **bookmark (offset)** and reads at their own speed; readers don't remove editions, so a new reader can start from the beginning.

**Use cases:** event-driven microservices, **decoupling** services, activity/audit streams, log/metric aggregation, **CDC** pipelines (Debezium), stream processing, data integration, outbox relay.
**Why it's fast:** **sequential disk I/O** (append-only log), **OS page cache**, **zero-copy** (`sendfile`) transfer, **batching + compression**, **partitioned** parallelism, and a simple consumer model (**offsets**, no per-message broker state).

### Q26. ⭐🟡 Explain Kafka's core concepts: broker, topic, partition, offset, record.
```
Topic "orders"  (3 partitions, replication factor 3)
 ├─ Partition 0: [0][1][2][3][4]…   ← offsets (immutable, ordered)   leader on Broker 1, replicas on 2,3
 ├─ Partition 1: [0][1][2]…
 └─ Partition 2: [0][1][2][3]…
Producer ──► appends to a partition (chosen by key hash)        Consumer group ──► each partition read by ONE consumer in the group
```
| Term | Meaning |
|------|---------|
| **Broker** | A Kafka server; a **cluster** has many |
| **Topic** | Named stream of records (logical category) |
| **Partition** | An **ordered, append-only log shard**; unit of **parallelism and ordering** |
| **Offset** | Position of a record **within a partition** (per-partition, not global) |
| **Record** | key + value + headers + timestamp |
| **Producer / Consumer** | Writes / reads records |
| **Consumer group** | A set of consumers sharing a topic's partitions (Q31) |
| **Replica** | A copy of a partition on another broker |

### Q27. ⭐🔴 How does Kafka replicate data? (leader, followers, ISR, `min.insync.replicas`)
**In one line:** Each partition has **one leader** (handles reads/writes) and **follower replicas** that copy it; the **ISR (in-sync replicas)** are followers caught up with the leader.

- `replication.factor=3` → 3 copies on 3 brokers.
- A write is **committed** when **all ISR members** have it (with `acks=all`). Consumers only see **committed** records (high-watermark).
- **`min.insync.replicas=2`** + `acks=all` → a write needs the leader **plus at least one** follower; if ISR shrinks below 2 → producers get **`NotEnoughReplicas`** (the cluster *refuses* writes rather than risk loss — **consistency over availability**).
- Leader dies → controller **elects a new leader from the ISR**. **`unclean.leader.election.enable=false`** (default) forbids electing an out-of-sync replica (prevents data loss).
**Production baseline:** RF=3, `min.insync.replicas=2`, `acks=all`, rack-aware replica placement.

### Q28. ⭐🟡 How does a producer choose the partition? Why do keys matter?
- **With a key:** `partition = murmur2(key) % numPartitions` → **same key → same partition** → **ordering per key**.
- **No key:** the **sticky partitioner** fills a batch for one partition, then switches (good batching, spread across partitions).
- Custom `Partitioner` possible.
```java
kafkaTemplate.send("orders", order.getCustomerId().toString(), event);   // key = customerId → all events of a customer in order
```
**Traps:** **hot partitions** (one very popular key); **increasing partitions later changes `hash % n`** → the same key may move to a different partition, breaking ordering for in-flight data. Choose the key = **aggregate/entity id** whose events must stay ordered.

### Q29. ⭐🔴 How do you make a producer reliable? (`acks`, retries, idempotence)
| Setting | Meaning |
|---------|---------|
| **`acks=0`** | Fire and forget — **may lose data** |
| **`acks=1`** | Leader acked — **lost if the leader dies before replicating** |
| **`acks=all`** (`-1`) | All **in-sync** replicas acked — **safest** (use with `min.insync.replicas≥2`) |
| **`enable.idempotence=true`** (default in Kafka ≥3.0) | Broker de-duplicates retries per producer/partition (producer id + sequence numbers) → **no duplicates from retries**, order preserved (`max.in.flight ≤ 5`) |
| `retries` / `delivery.timeout.ms` | Retry transient failures within the delivery timeout (default 2 min) |
```properties
spring.kafka.producer.acks=all
spring.kafka.producer.properties.enable.idempotence=true
spring.kafka.producer.properties.delivery.timeout.ms=120000
spring.kafka.producer.properties.max.in.flight.requests.per.connection=5
```
**Interview tip:** *"Idempotent producer removes duplicates from **producer retries**; it does **not** dedupe your **application re-sends** or consumer reprocessing."*

### Q30. 🟡 How do you tune producer throughput?
`linger.ms` (wait a few ms to fill batches, e.g., 5–20), `batch.size` (bytes per partition batch, 32–128 KB), **`compression.type`** (`lz4`/`zstd`/`snappy` — big win for text/JSON), `buffer.memory`, `max.in.flight`. Trade-off: **latency vs throughput**. Avoid per-message `.get()` (blocks) — send asynchronously and handle the callback.

### Q31. ⭐🟡 What is a consumer group? How are partitions assigned?
**In one line:** Consumers with the same **`group.id`** form a group; Kafka assigns each **partition to exactly one consumer in the group**, so the group **shares the work**; **different groups** each get **all** messages.

```
Topic orders (4 partitions)
Group A (3 consumers): C1→P0,P1   C2→P2   C3→P3          ← parallel processing, each message handled once per group
Group B (1 consumer):  D1→P0,P1,P2,P3                       ← independent copy for another service (e.g. analytics)
```
**Consequences:** **max useful consumers = number of partitions** (extra consumers idle); queue semantics **within** a group, **pub/sub** across groups. In Spring: `@KafkaListener(groupId = "billing")`.

### Q32. ⭐🔴 What is a rebalance? Why does it happen, and how do you reduce its impact?
**In one line:** When group membership changes, Kafka **reassigns partitions** — consumption **pauses** during it.

**Triggers:** consumer **joins/leaves/crashes**, **missed heartbeats** (`session.timeout.ms`), **slow processing exceeding `max.poll.interval.ms`** (consumer considered dead!), partition count change, subscription change, deployments (rolling restarts).
**Mitigations:**
- **Cooperative rebalancing** (`CooperativeStickyAssignor`) — incremental, doesn't stop everyone ("stop-the-world" eager protocol is the older default).
- **Static membership** (`group.instance.id`) — a restarting pod rejoins with the same identity within `session.timeout.ms` without a rebalance.
- Keep processing per poll **short**: lower `max.poll.records`, raise `max.poll.interval.ms` only if needed, offload long work carefully.
- Stable deployments (graceful shutdown, `maxSurge`), avoid autoscaling flapping. *(Newer Kafka's next-gen consumer group protocol (KIP-848) moves assignment logic to the broker to reduce rebalance pain.)*
**Trap:** after a rebalance, **uncommitted** records are redelivered to the new owner → **duplicates** → idempotent consumers (Q49).

### Q33. ⭐🟡 How do offsets and commits work? Which commit strategy is safe?
**In one line:** The consumer group stores the **next offset to read** per partition in the internal topic **`__consumer_offsets`**.

| Strategy | Behaviour | Risk |
|----------|-----------|------|
| **Auto-commit** (`enable.auto.commit=true`, every 5s) | Commits in the background | **Message loss** (committed before processed → crash) or duplicates |
| **Commit after processing** (manual) | Process → then commit | **At-least-once** ✅ (duplicates possible → idempotent handling) |
| **Commit before processing** | Commit → then process | **At-most-once** (loss on crash) |
```java
@KafkaListener(topics = "orders")
public void handle(OrderEvent e, Acknowledgment ack) {      // AckMode.MANUAL
    process(e);                                              // 1) do the work (idempotent!)
    ack.acknowledge();                                       // 2) then commit offset
}
```
`auto.offset.reset` (`latest`/`earliest`/`none`) only applies when **no committed offset exists** (new group). Spring Kafka manages commits via **`AckMode`** (default `BATCH`: commit after each poll's records are processed).

### Q34. ⭐🟡 What ordering guarantees does Kafka give?
- **Ordering only within a single partition.** No global order across partitions/topic.
- **Same key → same partition → ordered** (as long as the partition count doesn't change).
- Within a consumer group, one consumer processes a partition **sequentially** — so **don't process one partition's records in parallel threads** if order matters.
- Producer retries can reorder **without idempotence** (or `max.in.flight > 1` on old versions) → keep `enable.idempotence=true`.
- Retry topics / DLT **break ordering** for the failed message (it's processed later) — design for it (state checks, sequence/version numbers).

### Q35. ⭐🔴 Explain delivery semantics: at-most-once, at-least-once, exactly-once.
| Semantics | How | Outcome |
|-----------|-----|---------|
| **At-most-once** | Commit offset **before** processing; no retries | May **lose** messages, never duplicates |
| **At-least-once** (default practical) | Process **then** commit; producer retries | **No loss**, **duplicates possible** |
| **Exactly-once (EOS)** | Idempotent producer + **transactions** + consumers reading `read_committed`; offsets committed **in the same transaction** as outputs | Atomic **consume → process → produce** **within Kafka** |
**Caveat:** EOS covers **Kafka→Kafka** flows. Side effects in DB/HTTP still need **idempotency** or the **outbox**. Say: *"I use at-least-once + idempotent consumers; EOS where it's a Kafka-to-Kafka pipeline (Kafka Streams)."*

### Q36. 🟡 Retention vs log compaction?
- **Retention** (`retention.ms` default 7 days / `retention.bytes`): old **segments are deleted** by time/size — consumers can **replay** within the window.
- **Compaction** (`cleanup.policy=compact`): keeps the **latest record per key** (tombstone = value `null` deletes the key) → topics act like a **changelog/table** (e.g., latest customer profile, config, Kafka Streams state).
Both together: `cleanup.policy=compact,delete`. Compaction is **not instant** and doesn't guarantee ordering/uniqueness at read time.

### Q37. 🟡 How many partitions should a topic have?
**Rule of thumb:** `partitions ≥ max(target throughput / per-partition throughput, max consumer parallelism)`; consider future growth, **key distribution**, and broker/file-handle/replication overhead (thousands per broker add recovery time). **You can add partitions but never remove them**, and adding changes key→partition mapping (Q28). Typical: 6–30 for busy topics; **don't over-partition "just in case"**.

### Q38. 🟡 Kafka vs RabbitMQ vs ActiveMQ vs SQS — how do you choose?
| | **Kafka** | **RabbitMQ** | **SQS** |
|---|-----------|--------------|---------|
| Model | **Distributed log**, pull, consumer offsets | **Broker with queues/exchanges**, push | Managed queue |
| Retention/replay | ✅ Retained, **replayable** | ❌ Message removed after ack | Limited (14d, no replay) |
| Throughput | **Very high** (millions/s) | Moderate | High (managed) |
| Ordering | Per partition | Per queue (with caveats) | FIFO queues optional |
| Routing | Topic/partition | **Rich** (direct/topic/headers, priorities, TTL, per-message routing) | Simple |
| Best for | **Event streaming, event sourcing, pipelines, many consumers** | **Task queues, complex routing, RPC** | Simple serverless queues |

### Q39. 🟡 What is KRaft and what happened to ZooKeeper?
Historically Kafka used **ZooKeeper** for cluster metadata/controller election. **KRaft** (Kafka Raft) moves metadata management **into Kafka itself** (a quorum of controller nodes) — simpler operations, faster failover, better scalability. ZooKeeper mode is **removed in Kafka 4.0**. New clusters should use KRaft.

### Q40. 🟡 What are Kafka Streams, Kafka Connect and Schema Registry?
- **Kafka Streams:** Java library for **stateful stream processing** (filter, map, join, aggregate, windowing) with local state stores and EOS; runs inside your service.
- **Kafka Connect:** framework of **source/sink connectors** (JDBC, Debezium CDC, S3, Elasticsearch) — move data in/out without writing code.
- **Schema Registry (Confluent/Apicurio):** stores **Avro/Protobuf/JSON Schema** versions and enforces **compatibility rules**; messages carry a schema id → smaller payloads and safe evolution (Q20, Q62).

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Resilience & Patterns](#2-resilience-data--architecture-patterns) &nbsp;|&nbsp; Next: [Spring for Apache Kafka →](#4-spring-for-apache-kafka)

---

## 4. Spring for Apache Kafka

### Q41. ⭐🟢 How do you set up Kafka in a Spring Boot application?
```xml
<dependency><groupId>org.springframework.kafka</groupId><artifactId>spring-kafka</artifactId></dependency>
```
```yaml
spring:
  kafka:
    bootstrap-servers: kafka-1:9092,kafka-2:9092
    producer:
      acks: all
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      properties: { enable.idempotence: true, linger.ms: 10, compression.type: lz4 }
    consumer:
      group-id: billing-service
      auto-offset-reset: earliest
      enable-auto-commit: false
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JsonDeserializer
        spring.json.trusted.packages: com.acme.events
        max.poll.records: 200
    listener:
      ack-mode: record                 # or manual
      concurrency: 3
```
Boot auto-configures `KafkaTemplate`, `ConsumerFactory`, `ConcurrentKafkaListenerContainerFactory`, and `KafkaAdmin` (can create topics from `NewTopic` beans):
```java
@Bean NewTopic orders() { return TopicBuilder.name("orders").partitions(6).replicas(3).config("min.insync.replicas", "2").build(); }
```

### Q42. ⭐🟡 How do you publish messages with `KafkaTemplate`? How do you handle send results?
```java
@Service
class OrderEventPublisher {
    private final KafkaTemplate<String, OrderEvent> kafka;
    OrderEventPublisher(KafkaTemplate<String, OrderEvent> kafka) { this.kafka = kafka; }

    void publish(OrderEvent e) {
        kafka.send("orders", e.orderId(), e)                          // key = orderId → per-order ordering
             .whenComplete((result, ex) -> {                          // CompletableFuture<SendResult> (Spring Kafka 3)
                 if (ex != null) log.error("send failed key={}", e.orderId(), ex);   // retry/DLQ/outbox decision here
                 else log.debug("sent partition={} offset={}", result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
             });
    }
}
```
**Rules:** `send()` is **asynchronous** — don't assume success; **don't call `.get()` per message** on a hot path (kills throughput); on failure fall back to **outbox/retry**. **Never publish inside a DB transaction and assume atomicity** → **Outbox** (`spring-boot-transactions.md` Q40–41). Use headers for `eventId`, `eventType`, `traceId`, `schemaVersion`.

### Q43. ⭐🟡 How do `@KafkaListener` and concurrency work?
```java
@Component
class PaymentListener {
    @KafkaListener(topics = "orders", groupId = "payment-service", concurrency = "3")
    public void on(ConsumerRecord<String, OrderEvent> rec) {
        log.info("p={} o={} key={}", rec.partition(), rec.offset(), rec.key());
        paymentService.handle(rec.value());
    }
}
```
- Spring creates a **`ConcurrentMessageListenerContainer`** with `concurrency` **consumer threads** inside **one app instance**; total consumers in the group = `instances × concurrency`, effective only up to **partition count**.
- Each partition is handled by **one thread at a time** (ordering preserved per partition).
- Listener method runs on the **consumer thread** — slow processing blocks polling → risk of **`max.poll.interval.ms`** timeout/rebalance (Q32). Offload carefully (bounded executor + manual acks) or reduce `max.poll.records`.
- Common params: `topicPattern`, `containerFactory`, `properties`, `id`, `autoStartup`, `@Header(KafkaHeaders.RECEIVED_KEY)`, `@Payload`.

### Q44. 🟡 How do manual acknowledgements work in Spring Kafka?
```yaml
spring.kafka.listener.ack-mode: manual        # or manual_immediate
```
```java
@KafkaListener(topics = "orders")
public void listen(OrderEvent e, Acknowledgment ack) {
    try { service.process(e); ack.acknowledge(); }              // commit only after success
    catch (RecoverableException ex) { ack.nack(Duration.ofSeconds(2)); }    // redeliver after a pause (batch/record listeners)
}
```
**AckModes:** `RECORD` (commit after each record), `BATCH` (default; after each poll batch), `TIME`, `COUNT`, `MANUAL`, `MANUAL_IMMEDIATE`. Prefer **default/record + error handler** unless you need custom control; remember uncommitted offsets are redelivered after crashes/rebalances.

### Q45. ⭐🔴 How do you handle errors and retries in a Spring Kafka consumer?
**In one line:** Configure a **`DefaultErrorHandler`** with a **`BackOff`** and a **recoverer** (e.g., publish to a **Dead Letter Topic**).
```java
@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    var recoverer = new DeadLetterPublishingRecoverer(template);                       // → "<topic>.DLT" by default (same partition)
    var backoff = new ExponentialBackOffWithMaxRetries(4);                             // 1s, 2s, 4s, 8s
    backoff.setInitialInterval(1_000); backoff.setMultiplier(2.0);
    var handler = new DefaultErrorHandler(recoverer, backoff);
    handler.addNotRetryableExceptions(IllegalArgumentException.class, ValidationException.class);   // don't retry permanent errors
    return handler;
}
// Boot picks up a CommonErrorHandler bean automatically for the default listener container factory.
```
**How it behaves:** failed record is **re-polled/retried (seeking back)** per back-off **blocking that partition**; after retries are exhausted → **recoverer** (DLT) and the offset moves on.
**Classify errors:** **transient** (timeouts, DB down) → retry with backoff; **permanent** (invalid payload, business rule) → **don't retry**, send to DLT immediately.
**Trap:** long blocking back-offs can exceed `max.poll.interval.ms` → rebalance — use **non-blocking retries** (Q46) for long delays.

### Q46. ⭐🔴 What is a Dead Letter Topic (DLT) and non-blocking retry (`@RetryableTopic`)?
**DLT:** a topic where **unprocessable messages** are parked (with error headers: exception class/message, original topic/partition/offset) so the **main flow isn't blocked** and failures can be **inspected and replayed**.
**Non-blocking retries (`@RetryableTopic`):** failed messages are forwarded to **retry topics with delays**, so the main topic keeps flowing:
```java
@Component
class OrderConsumer {
    @RetryableTopic(attempts = "4",
                    backoff = @Backoff(delay = 2000, multiplier = 2.0),
                    dltTopicSuffix = ".dlt",
                    exclude = { ValidationException.class })                           // skip retries for permanent errors
    @KafkaListener(topics = "orders", groupId = "payment")
    void handle(OrderEvent e) { paymentService.process(e); }

    @DltHandler
    void dlt(OrderEvent e, @Header(KafkaHeaders.EXCEPTION_MESSAGE) String reason) {
        alerts.send("DLT: " + e.orderId() + " " + reason);                              // alert, persist, ticket
    }
}
// topics created: orders, orders-retry-2000, orders-retry-4000, orders-retry-8000, orders.dlt
```
**Trade-off:** non-blocking retries **lose strict ordering** for that key (a later event can overtake the failed one). Build **replay tooling** for the DLT and **alert on DLT volume**. Always **monitor** DLTs — an ignored DLT is silent data loss.

### Q47. ⭐🔴 What is a poison pill and how does `ErrorHandlingDeserializer` help?
**In one line:** A record that **can't be deserialized** (corrupt/incompatible JSON/Avro) throws **inside the consumer's `poll()`** — before your listener — so without protection the consumer **retries the same offset forever** (infinite loop, partition stuck).

**Fix:** wrap deserializers with **`ErrorHandlingDeserializer`**; it catches the failure, gives the container a **`DeserializationException`** (with raw bytes), and the **`DefaultErrorHandler`** sends it to the **DLT** and **moves on**.
```yaml
spring.kafka.consumer:
  value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
  properties:
    spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JsonDeserializer
```
Also use `addNotRetryableExceptions(DeserializationException.class)`. **Prevention:** schema registry + compatibility checks, validate at the producer, never change field types incompatibly.

### Q48. 🟡 How do you serialize payloads? JSON vs Avro/Protobuf; what are `trusted.packages` and type headers?
- **JSON** (`JsonSerializer/Deserializer`): easy, human-readable, larger, schema by convention.
- **Avro/Protobuf + Schema Registry:** compact, **enforced evolution**, polyglot — preferred at scale.
- `JsonSerializer` adds a **`__TypeId__` header** with the producer's class name; the consumer maps it to a class — causes problems when producer/consumer **packages differ** or for **security** (deserializing arbitrary classes). Prefer **explicit target types** (`spring.json.value.default.type`, `spring.json.use.type.headers=false`) and restrict `spring.json.trusted.packages` (never `*` in production).
- Include an **`eventId`**, **`eventType`**, **`occurredAt`**, `version` in a stable **event envelope**.

### Q49. ⭐🔴 How do you build an idempotent consumer in Spring Kafka?
**Why needed:** at-least-once delivery (rebalances, retries, producer re-sends) **will** produce duplicates.
```java
@KafkaListener(topics = "payments")
@Transactional                                                                  // DB transaction around dedupe + business effect
public void on(PaymentEvent e, @Header("eventId") String eventId) {
    if (!processedEvents.insertIfAbsent(eventId)) { log.info("duplicate {}", eventId); return; }   // unique constraint on event_id
    ledger.apply(e);                                                             // same transaction → both or neither
}
```
**Techniques:** **dedupe table** (event id with unique key, TTL cleanup), **natural idempotency** (upsert by business key, `status = PAID` instead of `+= amount`), **versioning** (`if event.version <= stored.version → skip`), conditional updates (`UPDATE … WHERE status='PENDING'`). **Order matters:** record the id and apply the effect in **one transaction**. For external calls use **idempotency keys** with the downstream API. More: `spring-boot-transactions.md` Q42.

### Q50. 🔴 How do Kafka transactions / exactly-once work in Spring Kafka?
```yaml
spring.kafka.producer.transaction-id-prefix: tx-orders-      # enables transactions (unique per instance/partition mapping)
spring.kafka.consumer.properties.isolation.level: read_committed     # consumers see only committed transactional data
```
```java
@KafkaListener(topics = "orders")
@Transactional("kafkaTransactionManager")                      // consume → process → produce atomically (Spring starts a Kafka tx, sends offsets in it)
public void process(OrderEvent in) { kafka.send("payments", toPayment(in)); }
```
- Atomic across: **produced records + consumed offsets** (`sendOffsetsToTransaction`). A failure aborts → nothing visible, input redelivered.
- **Not** atomic with a **database** — DB + Kafka remains a dual-write (use Outbox).
- Costs: latency, `transaction.timeout.ms`, careful with **zombie fencing** (transactional ids).
Use for **Kafka-to-Kafka** pipelines; for DB effects rely on **idempotency**.

### Q51. 🟡 How do you tune consumer throughput? (batch listeners and poll settings)
```java
@KafkaListener(topics = "events", batch = "true")
public void batch(List<ConsumerRecord<String, Event>> records) { repo.saveAll(map(records)); }     // one DB roundtrip per batch
```
Knobs: `max.poll.records`, `fetch.min.bytes`/`fetch.max.wait.ms`, `max.partition.fetch.bytes`, listener `concurrency` (≤ partitions), batch listeners, **bulk DB writes** (`jdbc.batch_size`), avoid per-record remote calls, keep `max.poll.interval.ms` > worst-case batch time. Scale out by **adding partitions + consumers**; measure **lag** (Q52).

### Q52. ⭐🟡 How do you monitor Kafka consumers? What is consumer lag?
**Lag** = (latest offset in partition) − (group's committed offset) = **how far behind** the consumer is.
- CLI: `kafka-consumer-groups.sh --bootstrap-server … --describe --group billing`.
- Metrics: Micrometer exposes `kafka.consumer.*` (`records-lag-max`, `records-consumed-rate`, rebalance/commit metrics); use Burrow/Kafka Exporter/Cruise Control/Confluent Control Center → Prometheus/Grafana.
- **Alert on:** growing lag, **DLT message count**, rebalance frequency, error rate, **time-lag** (age of oldest unprocessed message), under-replicated partitions (broker side).

### Q53. 🟡 How do you test Kafka code?
- **`@EmbeddedKafka`** (`spring-kafka-test`) — in-JVM broker, fast:
```java
@SpringBootTest @EmbeddedKafka(partitions = 1, topics = "orders", bootstrapServersProperty = "spring.kafka.bootstrap-servers")
class OrderFlowTest { /* send with KafkaTemplate; await with Awaitility until consumer effect is visible */ }
```
- **Testcontainers `KafkaContainer`** (+ `@ServiceConnection` in Boot 3.1+) — real Kafka (preferred for realistic behaviour).
- **Unit test listeners** by calling the method directly; mock `KafkaTemplate`; test **error handler/DLT** paths and **idempotency (send the same event twice)**. Use **Awaitility** (never `Thread.sleep`). See `spring-boot-testing.md`.

### Q54. 🟡 How do you shut down or control Kafka listeners gracefully?
- Spring stops containers on context close (`spring.kafka.listener.shutdown-timeout`); with `server.shutdown=graceful` ensure in-flight records finish and offsets commit before exit; in Kubernetes combine with a **readiness drop + `terminationGracePeriodSeconds`** (`spring-boot-core.md` Q52).
- Control programmatically via **`KafkaListenerEndpointRegistry`** (`stop()/start()/pause()/resume()`), `@KafkaListener(autoStartup = "false")` — useful for **maintenance windows**, back-pressure (pause when a downstream DB is down), or leader-only consumption.
- Use **static membership** + cooperative rebalancing so rolling deployments don't trigger rebalance storms (Q32).

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Kafka Fundamentals](#3-kafka-fundamentals) &nbsp;|&nbsp; Next: [Event-Driven Scenarios →](#5-event-driven-scenarios--wrap-up)

---

## 5. Event-Driven Scenarios & Wrap-up

### Q55. ⭐🔴 Scenario: design the order → payment → inventory flow with Kafka (saga + outbox).
```
Client ─POST /orders─► OrderService ──(1 tx: INSERT order PENDING + INSERT outbox OrderCreated)──► DB
                              │ outbox relay (Debezium CDC or poller)
                              ▼
                       topic: order-events  (key = orderId)
                              │
              ┌───────────────┴────────────────┐
              ▼                                ▼
      PaymentService (group: payment)    InventoryService (group: inventory)
      idempotent; charges; outbox ──► topic: payment-events (PaymentCompleted | PaymentFailed)
                                      InventoryService: reserve stock ──► inventory-events (StockReserved | StockFailed)
              ▼
      OrderService (consumes payment-/inventory-events): both OK → CONFIRMED;
                    any failure → CANCELLED + trigger compensation (Refund / ReleaseStock)
```
**Design points:** **key = `orderId`** (ordering per order); **outbox** for atomic DB+event; **idempotent consumers** (event ids); **saga state** (`PENDING/CONFIRMED/CANCELLED`) in the order; **compensations** (refund, release stock) are idempotent; **DLT + alerts**; **timeouts** (scheduled check for stuck PENDING orders); **versioned event schemas** via registry; **choreography** for simple flows, **orchestrator** (Temporal/Camunda/state machine) when steps and rules grow (`spring-boot-transactions.md` Q47). API returns **202/201 PENDING**, the client polls/gets pushed updates.

### Q56. ⭐🟡 Scenario: "Consumers are processing the same message twice." What do you do?
**Causes:** rebalances before commit, crash after processing but before commit, **retries/DLT replays**, producer re-sends (app-level), outbox relay at-least-once, manual offset reset.
**Fix (you can't prevent all duplicates → make them harmless):**
1. **Idempotent processing** — dedupe table/unique constraint/natural idempotency (Q49).
2. **Commit after processing** in the same logical unit; use **manual/record ack** where needed.
3. Reduce rebalances (cooperative assignor, static membership, shorter polls — Q32).
4. Idempotent producer (`enable.idempotence=true`) to remove **producer-retry** duplicates.
5. Idempotency keys on **downstream calls** (payments).
**Interview line:** *"Exactly-once is a property of the **outcome**, achieved by at-least-once delivery + idempotent handlers."*

### Q57. ⭐🟡 Scenario: events for the same customer arrive out of order. How do you guarantee ordering?
- **Key by the entity id** (`customerId`) so all its events go to **one partition**; one consumer thread per partition (Q34).
- Don't parallelise within a partition; **don't change partition count** casually.
- Producer: idempotence on, `max.in.flight ≤ 5`; avoid parallel producers for the same key without sequencing.
- **Retry topics/DLT** reorder — add a **sequence/version number** and handle **stale/out-of-order events** (ignore if `event.version <= current`; or buffer/park until the gap fills).
- Across **different** entities/topics there's **no ordering** — design the domain so cross-entity ordering isn't required (or use a saga with state).

### Q58. ⭐🔴 Scenario: "Consumer lag keeps growing in production." — triage.
1. **Confirm:** which group/partitions; is lag **uniform** (throughput problem) or **on a few partitions** (hot key/stuck consumer)?
2. **Consumers alive?** Rebalance loops (`max.poll.interval.ms` exceeded), crash loops, **poison message** retrying forever (Q47, Q59), paused listener.
3. **Processing slow?** DB/downstream latency, N+1, per-record remote calls, GC → profile; add **batching/bulk writes**; fix slow dependency (circuit breaker).
4. **Not enough parallelism?** `instances × concurrency` < partitions → scale consumers (up to partition count); if already = partitions → **add partitions** (mind key ordering) or optimise per-message cost.
5. **Producer burst?** Temporary spike — autoscale on lag (KEDA), allow catch-up.
6. **Broker/network:** under-replicated partitions, throttling, fetch settings.
7. **Prevent:** lag alerts (size + time), load tests, capacity planning, backpressure.

### Q59. 🟡 Scenario: "One bad message blocks the whole partition."
Classic **poison pill / head-of-line blocking:** the consumer retries the same offset indefinitely. **Fix:** `ErrorHandlingDeserializer` for bad payloads (Q47); `DefaultErrorHandler` with **bounded retries** + **DLT** (Q45); **classify exceptions** (don't retry permanent errors); non-blocking `@RetryableTopic` for transient errors (Q46); **alert on DLT**; keep a **replay tool** to reprocess after fixing the bug. Never `catch (Exception) { log }` and swallow — you'll commit the offset and **silently lose** the event.

### Q60. 🟡 Scenario: "Frequent rebalances / consumers keep leaving the group."
**Look at:** processing time per poll > `max.poll.interval.ms` (reduce `max.poll.records`, speed up processing, raise the interval); **GC pauses**/CPU starvation causing missed heartbeats (`session.timeout.ms`/`heartbeat.interval.ms`); rolling deployments/autoscaler flapping (use **static membership**, cooperative assignor, slower scale-down); K8s probes killing pods; network issues; too many consumers for partitions. Check logs for `Attempt to heartbeat failed`, `Member … has left`, `CommitFailedException`.

### Q61. ⭐🔴 Scenario: "How do you guarantee no message loss end-to-end?"
**Producer:** `acks=all`, `enable.idempotence=true`, sensible `delivery.timeout.ms`, **check send results** (callback) and fall back to **outbox** — better: **outbox from the start**.
**Broker/topic:** `replication.factor=3`, **`min.insync.replicas=2`**, `unclean.leader.election.enable=false`, rack awareness, adequate **retention**, monitor under-replicated partitions.
**Consumer:** `enable.auto.commit=false`; **commit only after successful processing**; bounded retries + **DLT** (never drop silently); **idempotent** handlers; handle deserialization errors.
**Operations:** alert on **DLT count, lag, ISR shrink**; backups/mirroring (MirrorMaker/Cluster Linking) for DR; test failure modes (kill broker/consumer, network partitions).
**Common loss causes:** `acks=0/1`, auto-commit, swallowed exceptions, fire-and-forget `send()` ignoring failures, unclean elections, short retention + slow consumers.

### Q62. 🟡 Scenario: "We must change an event's schema without breaking consumers."
- Use **Schema Registry** with **BACKWARD** (or FULL) compatibility; changes allowed: **add optional field with default**, remove optional field (per mode); **don't** rename/retype/make required.
- For a breaking change publish a **new event type/topic version** (`OrderPlaced.v2`) and **dual-publish** during migration; migrate consumers; retire v1.
- Consumers use **tolerant readers** (ignore unknown fields) — `FAIL_ON_UNKNOWN_PROPERTIES=false`; keep **contract tests** in CI; **upcast** old versions when replaying history.

### Q63. 🟡 Scenario: "How do you reprocess/replay historical events or backfill a new service?"
- **New consumer group** with `auto.offset.reset=earliest` → reads the retained history (limited by retention; use **compacted** topics or an **event archive in S3/data lake** for long history).
- **Reset offsets** of an existing group (`kafka-consumer-groups --reset-offsets --to-datetime/--to-earliest --execute`) with consumers stopped.
- Replay from the **DLT** after the fix (republish to the original topic with idempotent handlers).
- Make handlers **idempotent**, throttle replay to protect downstreams, and consider **read-model rebuild** jobs (CQRS projections). Beware replays triggering **side effects** (emails/payments) — gate with a replay flag or separate group/handler.

### Q64. 🟡 How do you secure Kafka and organise topics across teams?
- **Transport & auth:** TLS (`SSL`), **SASL** (SCRAM/OAUTHBEARER/Kerberos/mTLS); **ACLs/RBAC** per principal and topic/group; encrypt sensitive payload fields; don't put PII in keys/headers unnecessarily.
```yaml
spring.kafka.properties:
  security.protocol: SASL_SSL
  sasl.mechanism: SCRAM-SHA-512
  sasl.jaas.config: org.apache.kafka.common.security.scram.ScramLoginModule required username="${KAFKA_USER}" password="${KAFKA_PASSWORD}";
```
- **Governance:** naming convention `<domain>.<entity>.<event>.v1` (e.g., `orders.order.created.v1`), ownership per topic, quotas, retention per use-case, schema registry enforcement, auto-create topics **off**, DLT naming, data classification.

### Q65. ⭐🟢 Explain microservices with Kafka in 60 seconds (project-style answer).
> "We split the system by **business capability**, each service owning its **own database**, and use **Spring Cloud/Kubernetes** for discovery, a **gateway** for edge concerns (JWT, rate limits), **Resilience4j** timeouts/circuit breakers on sync calls, and **OpenTelemetry tracing + Prometheus metrics** for observability. For state changes across services we use **Kafka events** — **outbox pattern** for atomic DB + event, **sagas with compensations** instead of distributed transactions.
> On Kafka I choose the **key = aggregate id** for per-entity ordering, run **`acks=all`, idempotent producers, RF=3, `min.insync.replicas=2`**, consume with **manual/after-processing commits** and **idempotent handlers** (at-least-once delivery, effectively-once outcome). Spring Kafka's **`DefaultErrorHandler` + `@RetryableTopic` + DLT + `ErrorHandlingDeserializer`** prevent poison pills; I monitor **consumer lag, DLT volume and rebalances**, use **schema registry compatibility** for evolution, and test with **Testcontainers/EmbeddedKafka**."

[⬆ Back to top](#-on-this-page) &nbsp;|&nbsp; [← Spring for Apache Kafka](#4-spring-for-apache-kafka)

---

## ✅ Last-minute cheat sheet

| Topic | One-liner to remember |
|-------|----------------------|
| Microservices | Independent deployables, own data; cost = distributed-system complexity |
| Boundaries | Business capability / bounded context, not technical layers |
| Discovery | Registry or K8s DNS; callers use service names |
| Gateway | Single entry: routing, JWT, rate limit, circuit breaker |
| Sync vs async | Queries sync, state changes async events |
| Tracing | Micrometer Tracing + OTel; `traceparent`; trace ids in logs |
| Consistency | Saga + Outbox + idempotent consumers (no 2PC) |
| Kafka log | Partitioned, replicated, retained commit log |
| Partition | Unit of parallelism **and** ordering |
| Key | Same key → same partition → ordered |
| Reliability | `acks=all` + idempotence + RF3 + `min.insync.replicas=2` |
| Consumer group | One consumer per partition per group; max consumers = partitions |
| Rebalance | Pauses consumption; cooperative + static membership reduce it |
| Commits | After processing (at-least-once); auto-commit risks loss |
| Semantics | At-most / at-least (default) / exactly-once only within Kafka |
| Spring errors | `DefaultErrorHandler` + backoff + DLT; `@RetryableTopic` non-blocking |
| Poison pill | `ErrorHandlingDeserializer` + DLT |
| Idempotent consumer | Dedupe table / upsert / version check in same transaction |
| Lag | Latest offset − committed offset; alert on it and on DLT |
| No loss | Producer acks + broker replication + consumer commit-after-process + DLT |

## 🎤 How to answer in an interview (template)
1. **One-line definition.**
2. **Analogy** (mall of shops, newspaper archive).
3. **Tiny example** (config/annotation/code).
4. **The trap** (duplicates, ordering, rebalance, dual-write).
5. **What you do in real projects** (outbox, idempotency, DLT, lag alerts, contract tests).

## 📚 References
- [roadmap.sh – Spring Boot Interview Questions](https://roadmap.sh/questions/spring-boot) · [Coding Shuttle – 100 Spring Boot Questions](https://www.codingshuttle.com/blogs/100-spring-boot-interview-questions-with-answers-for-2-to-5-years-experienced-java-developers)
- [Spring for Apache Kafka Reference](https://docs.spring.io/spring-kafka/reference/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Spring Cloud Gateway](https://docs.spring.io/spring-cloud-gateway/reference/) · [Spring Cloud](https://spring.io/projects/spring-cloud)
- [microservices.io – Patterns (Saga, Outbox, CQRS, Strangler)](https://microservices.io/patterns/)
- [Resilience4j](https://resilience4j.readme.io/) · [Debezium Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html)

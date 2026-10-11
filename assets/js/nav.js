/* ------------------------------------------------------------------
   THE ONLY FILE YOU EDIT TO ADD CONTENT.
   - A page WITH `path`    = published (path is the file location, no extension)
   - A page WITHOUT `path` = planned (shown greyed out, not clickable)
   To publish a page: create the .md file, then add its `path` here.
------------------------------------------------------------------- */
window.NAV = [
  { id: "design-patterns", emoji: "🧩", title: "Design patterns",
    desc: "Creational, structural and behavioural patterns with Java examples.",
    pages: [
      { title: "Singleton", path: "design-pattern/singleton-pattern", desc: "Seven implementations, how they break, and the fixes." },
      { title: "Factory Method", path: "design-pattern/factory-method-pattern", desc: "Let a subclass decide which object the parent creates." },
      { title: "Abstract Factory", desc: "Create families of related objects." },
      { title: "Builder", desc: "Construct complex objects step by step." },
      { title: "Prototype", desc: "Clone objects instead of building from scratch." },
      { title: "Adapter and Decorator", desc: "Wrap objects to change or extend behaviour." },
      { title: "Observer", desc: "Notify many listeners when state changes." },
      { title: "Strategy", desc: "Swap algorithms at runtime." }
    ]},
  { id: "java", emoji: "☕", title: "Java core",
    desc: "Language and JVM questions that come up in every backend round.",
    pages: [
      { title: "Collections and HashMap internals", desc: "Hashing, resizing, treeification, ConcurrentHashMap." },
      { title: "Concurrency and executors", desc: "Threads, locks, volatile, CompletableFuture." },
      { title: "JVM memory and garbage collection", desc: "Heap layout, GC algorithms, tuning basics." },
      { title: "Streams and lambdas", desc: "Pipelines, collectors, common pitfalls." },
      { title: "Java 17 and 21 features", desc: "Records, sealed classes, virtual threads." }
    ]},
  { id: "spring", emoji: "🍃", title: "Spring Boot",
    desc: "How the framework works under the hood.",
    pages: [
      { title: "IoC and dependency injection", desc: "Containers, bean scopes, constructor injection." },
      { title: "Bean lifecycle", desc: "Creation, post-processing, destruction." },
      { title: "Auto-configuration", desc: "How starters and conditions wire beans." },
      { title: "Transactions", desc: "@Transactional, propagation, common traps." },
      { title: "REST API design", desc: "Idempotency, versioning, error handling." }
    ]},
  { id: "kafka", emoji: "📨", title: "Kafka and messaging",
    desc: "Event-driven design for production and interviews.",
    pages: [
      { title: "Kafka architecture", desc: "Brokers, topics, partitions, replication." },
      { title: "Producers and consumers", desc: "Acks, batching, offsets, consumer groups." },
      { title: "Rebalancing and ordering", desc: "Why partitions rebalance and what it costs." },
      { title: "Delivery guarantees", desc: "At-least-once, at-most-once, exactly-once." }
    ]},
  { id: "system-design", emoji: "🏗️", title: "System design",
    desc: "Components and trade-offs for open-ended design rounds.",
    pages: [
      { title: "Rate limiter", desc: "Token bucket, sliding window, distributed counters." },
      { title: "URL shortener", desc: "ID generation, storage, caching." },
      { title: "Distributed cache", desc: "Eviction, consistency, cache stampede." },
      { title: "Saga and idempotency", desc: "Consistency across microservices." }
    ]},
  { id: "dsa", emoji: "🧮", title: "Data structures and algorithms",
    desc: "Patterns for coding rounds, in optimal Java.",
    pages: [
      { title: "Arrays and strings", desc: "Two pointers, sliding window, prefix sums." },
      { title: "Linked lists", desc: "Fast and slow pointers, reversal, merging." },
      { title: "Trees and graphs", desc: "DFS, BFS, topological sort." },
      { title: "Dynamic programming", desc: "State, transitions, memoisation to tabulation." }
    ]},
  { id: "cloud", emoji: "☁️", title: "Cloud and DevOps",
    desc: "Deployment and runtime knowledge.",
    pages: [
      { title: "Kubernetes essentials", desc: "Pods, deployments, services, probes." },
      { title: "AWS core services", desc: "EC2, S3, SQS, SNS, RDS, IAM." }
    ]}
];

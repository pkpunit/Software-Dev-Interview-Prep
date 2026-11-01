---
layout: docs          
title: Java Multithreading and Concurrency Interview Questions
description: Thread, volatile, locks, deadlock, executors and fork-join, with detailed answers and code.
---
# Java Multithreading & Concurrency Interview Questions (Detailed)

> Covers ~50 of the most-asked thread and concurrency questions. Each answer follows the same flow: **What → Why → How → Pitfalls → Interview one-liner**.

## Table of Contents

1. [Thread Basics](#1-thread-basics)
2. [Memory Model and Visibility](#2-memory-model-and-visibility)
3. [Thread Safety, Race Conditions, Deadlock](#3-thread-safety-race-conditions-deadlock)
4. [Inter-Thread Communication (wait / notify)](#4-inter-thread-communication-wait--notify)
5. [Locks and Synchronizers](#5-locks-and-synchronizers)
6. [Concurrent Collections](#6-concurrent-collections)
7. [Executors and Thread Pools](#7-executors-and-thread-pools)
8. [JVM and Tooling](#8-jvm-and-tooling)
9. [Singleton and Concurrency](#9-singleton-and-concurrency)
10. [Best Practices](#10-best-practices)
11. [Legacy: Swing Threading](#11-legacy-swing-threading)
12. [Scenario-Based Questions](#12-scenario-based-questions)
13. [Interview Cheat Sheet](#13-interview-cheat-sheet)

* * *

## 1. Thread Basics

### Q1. What is a Thread in Java?

**What?** A thread is an independent path of execution inside a process. Every Java program starts with one thread (`main`); you can create more.

**Why?** To use multiple CPU cores and to avoid blocking on slow work (I/O, network, DB).

- **CPU-bound work:** split across N cores, so a 100 ms job can finish in about 100/N ms (ideal case).
- **I/O-bound work:** while one thread waits for the network, others keep working.

```
Process (JVM)
 ├── Heap (shared by all threads)
 ├── Method area / Metaspace (shared)
 ├── Thread-1 → own stack + program counter
 ├── Thread-2 → own stack + program counter
 └── Thread-3 → own stack + program counter
```

**Thread lifecycle (`Thread.State`):**

| State           | Meaning                                                     |
|-----------------|-------------------------------------------------------------|
| `NEW`           | Created, `start()` not called yet                           |
| `RUNNABLE`      | Running or ready to run (waiting for CPU)                   |
| `BLOCKED`       | Waiting to enter a `synchronized` block (monitor lock)      |
| `WAITING`       | Waiting indefinitely: `wait()`, `join()`, `LockSupport.park()` |
| `TIMED_WAITING` | Waiting with timeout: `sleep(ms)`, `wait(ms)`, `join(ms)`   |
| `TERMINATED`    | `run()` finished or died with an exception                  |

> **Interview one-liner:** A thread is a lightweight unit of execution that shares the process heap but has its own stack.

### Q2. What is the difference between Thread and Process?

| Aspect         | Process                                  | Thread                                  |
|----------------|------------------------------------------|-----------------------------------------|
| Memory         | Own separate address space               | Shares heap and method area of process  |
| Stack          | Own                                      | Own stack per thread                    |
| Communication  | IPC (sockets, pipes, files), expensive   | Shared objects, cheap but needs sync    |
| Creation cost  | Heavy                                    | Lighter                                 |
| Crash impact   | Isolated, others keep running            | An `OutOfMemoryError` can affect the whole JVM |
| Example        | Two JVMs running two apps                | Request-handling threads in Tomcat      |

> Do not confuse: heap is shared, but **stack memory is private per thread** and holds local variables, parameters and the call stack.

### Q3. How do you implement a Thread in Java?

At the language level, a `Thread` object represents the thread and a `Runnable` represents the task. There are four common ways:

**1. Extend `Thread`**

```java
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Running in " + Thread.currentThread().getName());
    }
}
new MyThread().start();
```

**2. Implement `Runnable` (preferred)**

```java
Runnable task = () -> System.out.println("Running in " + Thread.currentThread().getName());
new Thread(task, "worker-1").start();
```

**3. Implement `Callable` and use an `ExecutorService`** (returns a result)

```java
ExecutorService pool = Executors.newFixedThreadPool(2);
Future<Integer> f = pool.submit(() -> 21 * 2);
System.out.println(f.get());   // 42
pool.shutdown();
```

**4. Virtual threads (Java 21+)**

```java
Thread.startVirtualThread(() -> System.out.println("virtual"));
// or
try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    exec.submit(() -> System.out.println("virtual in executor"));
}
```

> **Pitfall:** calling `start()` twice on the same `Thread` throws `IllegalThreadStateException`.

### Q4. When to use Runnable vs extending Thread?

**Prefer `Runnable`.** Reasons:

| Reason                    | Explanation                                                                 |
|---------------------------|-----------------------------------------------------------------------------|
| Single inheritance        | Java allows one superclass. Extending `Thread` blocks you from extending anything else, but you can implement many interfaces. |
| Separation of concerns    | `Runnable` = *what to run*, `Thread` = *how to run it*. The same task can be run by a thread, a pool, or a scheduler. |
| Works with executors      | Thread pools accept `Runnable`/`Callable`, not "thread subclasses".         |
| Lambda friendly           | `() -> doWork()`                                                            |

Extend `Thread` only when you really need to change thread behaviour itself (rare).

### Q5. What is the difference between `start()` and `run()`?

| `start()`                                         | `run()`                                  |
|---------------------------------------------------|------------------------------------------|
| Asks the JVM to create a **new** thread, which then calls `run()` | Plain method call in the **current** thread |
| Can be called once                                | Can be called any number of times        |
| Concurrent execution                              | No concurrency at all                    |

```java
Thread t = new Thread(() -> System.out.println(Thread.currentThread().getName()));
t.run();    // prints "main"      (no new thread!)
t.start();  // prints "Thread-0"  (new thread)
```

> **Interview one-liner:** `run()` is just the task body. `start()` is what actually spawns the thread.

### Q6. What is the difference between Runnable and Callable?

| Feature          | `Runnable` (JDK 1.0)        | `Callable<V>` (JDK 1.5)               |
|------------------|-----------------------------|---------------------------------------|
| Method           | `void run()`                | `V call() throws Exception`           |
| Return value     | None                        | Returns a result                      |
| Checked exception| Cannot throw                | Can throw                             |
| Used with        | `Thread`, `Executor`        | `ExecutorService.submit()` → `Future` |

```java
Callable<String> task = () -> {
    if (Math.random() > 0.5) throw new IllegalStateException("boom");
    return "done";
};
Future<String> future = pool.submit(task);
try {
    String result = future.get();              // blocks until ready
} catch (ExecutionException e) {
    Throwable cause = e.getCause();            // the exception thrown inside call()
}
```

### Q7. What is FutureTask?

**What?** `FutureTask<V>` is a cancellable asynchronous computation. It implements `RunnableFuture<V>` = `Runnable` + `Future<V>`.

**Why?** It lets you wrap a `Callable` so a **plain `Thread`** can run it and you can still fetch the result.

```java
FutureTask<Integer> ft = new FutureTask<>(() -> {
    Thread.sleep(500);
    return 100;
});
new Thread(ft).start();            // or pool.submit(ft)

System.out.println(ft.isDone());   // false (probably)
System.out.println(ft.get());      // blocks until done -> 100
```

Key methods: `get()`, `get(timeout, unit)`, `cancel(boolean mayInterrupt)`, `isDone()`, `isCancelled()`.

> For modern pipelines prefer `CompletableFuture` (non-blocking chaining), but `FutureTask` is still the building block behind `ExecutorService.submit`.

### Q8. How do you stop a thread in Java?

Java has **no safe forced-kill API**. `Thread.stop()`, `suspend()` and `resume()` were deprecated because they can leave shared data corrupted or cause deadlocks. In Java 20+ `Thread.stop()` throws `UnsupportedOperationException`.

Stopping is **cooperative**: you ask, the thread decides when to exit.

**Option 1: volatile flag**

```java
class Worker implements Runnable {
    private volatile boolean running = true;

    public void stop() { running = false; }

    @Override
    public void run() {
        while (running) {
            doWork();
        }
        cleanup();
    }
}
```

**Option 2: interruption (preferred, also wakes blocked threads)**

```java
Thread t = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        try {
            doBlockingWork();               // e.g. queue.take(), Thread.sleep()
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // restore the flag
            break;
        }
    }
});
t.start();
// later
t.interrupt();
```

**With executors:** `future.cancel(true)` or `pool.shutdownNow()`.

> **Rule:** never swallow `InterruptedException`. Either rethrow it or restore the flag with `Thread.currentThread().interrupt()`.

### Q9. What is the difference between `interrupted()` and `isInterrupted()`?

| Method                          | Static? | Clears interrupt flag? | Use                                   |
|---------------------------------|---------|------------------------|---------------------------------------|
| `Thread.interrupted()`          | Yes     | **Yes**                | Check *current* thread and reset flag |
| `thread.isInterrupted()`        | No      | **No**                 | Query any thread without changing it  |
| `thread.interrupt()`            | No      | Sets the flag          | Request that thread to stop           |

```java
Thread.currentThread().interrupt();
System.out.println(Thread.currentThread().isInterrupted()); // true
System.out.println(Thread.interrupted());                   // true  (and flag cleared)
System.out.println(Thread.interrupted());                   // false
```

Also remember: methods that throw `InterruptedException` (`sleep`, `wait`, `join`, `BlockingQueue.take`) **clear** the flag when they throw it.

### Q10. What happens when an exception occurs in a thread?

- If **uncaught**, that thread dies. Other threads keep running (including `main`).
- The JVM first calls the thread's `UncaughtExceptionHandler`. Default behaviour is to print the stack trace to `System.err`.

```java
Thread t = new Thread(() -> { throw new RuntimeException("oops"); }, "worker");
t.setUncaughtExceptionHandler((thread, ex) ->
        System.err.println("Thread " + thread.getName() + " failed: " + ex.getMessage()));
t.start();

// Global fallback for all threads
Thread.setDefaultUncaughtExceptionHandler((th, ex) -> log.error("Uncaught in {}", th, ex));
```

**Executors behave differently:**

| API                       | Exception behaviour                                                    |
|---------------------------|------------------------------------------------------------------------|
| `pool.execute(runnable)`  | Goes to the uncaught handler; the worker thread dies and is replaced   |
| `pool.submit(task)`       | **Swallowed** into the `Future`; you see it only on `future.get()` (`ExecutionException`) |

> **Pitfall:** `submit()` and never calling `get()` hides failures silently.

### Q11. What does `Thread.yield()` do?

A **hint** to the scheduler that the current thread is willing to give up the CPU. The scheduler may ignore it, and the same thread may be picked again immediately. It does not release locks and gives no ordering guarantee.

Rarely used in production code. Prefer `Thread.onSpinWait()` for spin loops or proper blocking primitives.

### Q12. There are three threads T1, T2, T3. How do you ensure they run in the order T1, T2, T3?

**Approach 1: `join()` from the starter (simplest)**

```java
t1.start(); t1.join();
t2.start(); t2.join();
t3.start(); t3.join();
```

**Approach 2: each thread joins the previous one**

```java
Thread t1 = new Thread(() -> System.out.println("T1"));
Thread t2 = new Thread(() -> { join(t1); System.out.println("T2"); });
Thread t3 = new Thread(() -> { join(t2); System.out.println("T3"); });
t3.start(); t2.start(); t1.start();   // start order doesn't matter now

static void join(Thread t) {
    try { t.join(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
}
```

**Approach 3: single-thread executor (FIFO)**

```java
ExecutorService single = Executors.newSingleThreadExecutor();
single.submit(task1); single.submit(task2); single.submit(task3);
single.shutdown();
```

**Approach 4: `CompletableFuture` chain**

```java
CompletableFuture.runAsync(task1)
                 .thenRun(task2)
                 .thenRun(task3)
                 .join();
```

> If tasks are strictly sequential, ask yourself whether you need threads at all. This question tests whether you know `join()`, executors and futures.

### Q13. How do you force a thread to start?

You **cannot**. `start()` only makes the thread *eligible*. The OS/JVM scheduler decides when it actually runs. There is no API to control scheduling (thread priorities are only hints). It is the same idea as `System.gc()`: a request, not a command.

* * *

## 2. Memory Model and Visibility

### Q14. What is the Java Memory Model (JMM)?

**What?** A specification of **how and when writes made by one thread become visible to other threads**, and which instruction reorderings are legal. It makes Java behave predictably across CPUs and OSes.

**Why it matters?** Each CPU core has caches and the compiler/CPU may reorder instructions. Without rules, thread B may never see thread A's update.

```
Thread A                      Thread B
 L1/L2 cache  <---- ? ---->   L1/L2 cache
        \                    /
         ------ Main memory ------
```

**Happens-before rules** (if A happens-before B, A's writes are visible to B):

| Rule                    | Guarantee                                                              |
|-------------------------|------------------------------------------------------------------------|
| Program order           | Each action in a thread happens-before later actions in that thread    |
| Monitor lock            | `unlock` of a monitor happens-before every later `lock` of the same monitor |
| Volatile variable       | A write to a volatile field happens-before every later read of it      |
| Thread start            | `Thread.start()` happens-before any action in the started thread       |
| Thread join/termination | All actions in a thread happen-before another thread returns from `join()` on it |
| Interruption            | `interrupt()` happens-before the interrupted thread detects it         |
| Finalizer               | End of constructor happens-before start of finalizer                   |
| Transitivity            | A hb B and B hb C ⇒ A hb C                                             |

Also: `final` fields are safely published after the constructor finishes (if `this` does not escape).

### Q15. What is a volatile variable?

**What?** A modifier for **fields** (instance and static, not local variables, and not combined with `final`) that guarantees:

1. **Visibility:** a write is immediately visible to all threads reading it.
2. **Ordering:** prevents reordering around the volatile access (the happens-before rule above).

It does **not** guarantee **atomicity** of compound actions.

```java
class Flag {
    private volatile boolean ready = false;   // visible to all threads

    void writer() { ready = true; }
    void reader() { while (!ready) { /* spin */ } }  // without volatile this may loop forever
}
```

```java
private volatile int count;
void inc() { count++; }   // NOT atomic: read, add, write (lost updates)
```

| Use volatile for                        | Do NOT use volatile for              |
|-----------------------------------------|--------------------------------------|
| Stop/status flags                       | Counters (`count++`)                 |
| Safe publication of immutable objects   | Check-then-act logic                 |
| Double-checked locking singleton        | Anything needing multi-variable invariants |

### Q16. What is the difference between volatile and atomic variables?

| Aspect         | `volatile`                          | `AtomicInteger` / `AtomicReference` etc.    |
|----------------|-------------------------------------|---------------------------------------------|
| Visibility     | Yes                                 | Yes (uses volatile internally)              |
| Atomic compound ops (`++`, CAS) | **No**             | **Yes**, via CAS (compare-and-swap)         |
| Mechanism      | Memory barriers                     | Lock-free CPU instruction (`cmpxchg`)       |
| Blocking       | No                                  | No (retry loop on contention)               |

```java
AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet();                         // atomic ++
counter.compareAndSet(5, 10);                      // set to 10 only if current is 5
counter.updateAndGet(x -> Math.min(x * 2, 100));   // atomic functional update
```

**High contention?** Use `LongAdder` / `LongAccumulator`. They stripe the counter across cells and sum on read, so they scale better than `AtomicLong` for write-heavy metrics.

> **Interview one-liner:** volatile gives visibility, atomics give visibility **plus** atomic read-modify-write.

### Q17. What is the difference between Stack and Heap (and why is it a threading question)?

| Aspect       | Stack                                       | Heap                                       |
|--------------|---------------------------------------------|--------------------------------------------|
| Owner        | One per thread (private)                    | One per JVM (shared by all threads)        |
| Stores       | Local variables, parameters, call frames; references to objects | All objects and arrays        |
| Lifetime     | Freed when the method returns               | Garbage collected                          |
| Thread safety| Local primitives are inherently safe        | Needs synchronization if shared and mutable|
| Error        | `StackOverflowError`                        | `OutOfMemoryError`                         |

**Why threading?** Local variables live on a thread's stack, so they are never shared. Objects live on the heap, so if two threads hold a reference to the same object, you must protect it. Threads may also cache heap values in registers/CPU caches, which is exactly the problem `volatile` solves.

### Q18. What is ThreadLocal?

**What?** A variable where **each thread has its own independent copy**.

**Why?**

- Make non-thread-safe, expensive objects safe without locking (e.g. `SimpleDateFormat`, `Random`).
- Carry per-request context (user id, trace id, transaction) without passing it through every method.

```java
private static final ThreadLocal<SimpleDateFormat> FMT =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

String format(Date d) { return FMT.get().format(d); }   // each thread uses its own instance
```

**Pitfall: memory leaks in thread pools.** Pool threads live long, so values stay referenced. Always clean up.

```java
try {
    CONTEXT.set(requestContext);
    handle();
} finally {
    CONTEXT.remove();      // MUST do this in pools
}
```

Notes: `InheritableThreadLocal` copies the value to child threads; `ThreadLocalRandom` is the built-in per-thread RNG. Prefer `DateTimeFormatter` (immutable and thread-safe) over `SimpleDateFormat`. Spring's `SecurityContextHolder` and MDC logging are `ThreadLocal`-based.

### Q19. How do you create an immutable object, and why does it matter for concurrency?

Immutable objects can be shared across threads **with no synchronization**, since their state never changes.

**Recipe:**

1. Declare the class `final` (so no subclass can add mutability).
2. Make all fields `private final`.
3. No setters.
4. Initialize everything in the constructor.
5. **Defensively copy** mutable inputs and outputs (arrays, `Date`, collections).
6. Do not let `this` escape from the constructor.

```java
public final class Order {
    private final String id;
    private final List<String> items;

    public Order(String id, List<String> items) {
        this.id = id;
        this.items = List.copyOf(items);      // defensive, unmodifiable copy
    }

    public String getId()          { return id; }
    public List<String> getItems() { return items; }   // already unmodifiable
}
```

Shortcut (Java 16+): `record Order(String id, List<String> items) {}`, but still copy mutable components in the compact constructor.

Examples in JDK: `String`, `Integer`, `LocalDate`, `List.of(...)`.

* * *

## 3. Thread Safety, Race Conditions, Deadlock

### Q20. What is thread safety? Is Vector thread-safe?

**What?** A class is thread-safe if it behaves correctly when accessed from multiple threads, with no extra synchronization by the caller.

**Vector:** yes. Its methods are `synchronized`. `ArrayList` is not.

**But:** thread-safe methods do not make **compound actions** safe.

```java
Vector<Integer> v = new Vector<>();
if (!v.contains(5)) {      // check
    v.add(5);              // act: another thread may add 5 in between
}
// Fix: synchronized (v) { ... }  or use a concurrent/Set structure
```

| Class          | Thread-safe? | Prefer instead                                   |
|----------------|--------------|--------------------------------------------------|
| `Vector`, `Hashtable` | Yes (coarse locks, legacy) | `CopyOnWriteArrayList`, `ConcurrentHashMap` |
| `ArrayList`, `HashMap`| No   | Wrap with `Collections.synchronizedXxx` or use concurrent versions |
| `StringBuffer` | Yes          | `StringBuilder` if not shared                    |

Ways to achieve thread safety: **immutability, confinement (ThreadLocal / stack), synchronization, atomics, concurrent collections.**

### Q21. What is a race condition? Give an example.

**What?** The result depends on the **timing/interleaving** of threads. Two classic patterns:

- **Read-modify-write:** `count++`
- **Check-then-act:** `if (x == null) x = create();`

```java
class Counter {
    private int count = 0;
    void inc() { count++; }     // load, add 1, store: three steps
}
// 2 threads x 100,000 increments -> result is usually < 200,000
```

```
Thread A: read 5
Thread B: read 5
Thread A: write 6
Thread B: write 6    <- one increment lost
```

**Fixes:**

```java
synchronized void inc() { count++; }          // lock
AtomicInteger count = new AtomicInteger();    // lock-free
count.incrementAndGet();
```

> **Data race vs race condition:** a *data race* is unsynchronized access to shared data (at least one write). A *race condition* is a logic bug caused by timing. You can have a race condition without a data race (e.g. two atomic operations that must be done together).

### Q22. How do you avoid deadlock in Java? (with code)

**What?** Two or more threads wait on each other forever, so the program hangs.

**Four Coffman conditions (all must hold):**

| Condition          | Meaning                                              |
|--------------------|------------------------------------------------------|
| Mutual exclusion   | Resource held exclusively                            |
| Hold and wait      | Holds one lock while waiting for another             |
| No pre-emption     | Locks cannot be forcibly taken away                  |
| Circular wait      | T1 waits for T2, T2 waits for T1 (cycle)             |

**Deadlock example:**

```java
Object A = new Object(), B = new Object();

new Thread(() -> { synchronized (A) { sleep(100); synchronized (B) { } } }).start();
new Thread(() -> { synchronized (B) { sleep(100); synchronized (A) { } } }).start();
// T1 holds A wants B, T2 holds B wants A -> stuck forever
```

**Prevention (break one condition):**

1. **Lock ordering (breaks circular wait): always acquire locks in the same global order.**

```java
static void transfer(Account from, Account to, long amt) {
    Account first  = from.id < to.id ? from : to;
    Account second = from.id < to.id ? to   : from;
    synchronized (first) {
        synchronized (second) {
            from.debit(amt); to.credit(amt);
        }
    }
}
```

2. **`tryLock` with timeout (breaks hold-and-wait):**

```java
if (lock1.tryLock(1, TimeUnit.SECONDS)) {
    try {
        if (lock2.tryLock(1, TimeUnit.SECONDS)) {
            try { /* work */ } finally { lock2.unlock(); }
        }
    } finally { lock1.unlock(); }
}
```

3. Hold fewer locks, for a shorter time; avoid calling foreign/alien code while holding a lock.
4. Use higher-level utilities (concurrent collections, queues) instead of manual locking.

**Detection:** `jstack <pid>` or `jcmd <pid> Thread.print` prints "Found one Java-level deadlock"; or `ThreadMXBean.findDeadlockedThreads()` programmatically.

### Q23. What is the difference between livelock and deadlock? What is starvation?

| Problem        | Thread state       | Progress | Analogy                                          |
|----------------|--------------------|----------|--------------------------------------------------|
| **Deadlock**   | Blocked, waiting   | None     | Two cars on a one-lane bridge, neither reverses  |
| **Livelock**   | Active, running    | None     | Two people in a corridor both stepping aside, again and again |
| **Starvation** | Waiting repeatedly | Others progress, this thread does not | Low-priority thread never gets the lock/CPU |

Livelock fix: add randomized back-off, or impose a priority/ordering. Starvation fix: use **fair** locks (`new ReentrantLock(true)`) and avoid long critical sections.

### Q24. How do you check if a thread holds a lock?

`Thread.holdsLock(Object obj)` is a **static** method. It returns `true` only if the **current** thread holds the monitor of `obj`.

```java
synchronized (lock) {
    System.out.println(Thread.holdsLock(lock));   // true
}
System.out.println(Thread.holdsLock(lock));       // false
```

Typical use: assertions, e.g. `assert Thread.holdsLock(this);` inside a method documented as "caller must hold the lock".

For `ReentrantLock`: `lock.isHeldByCurrentThread()`, `lock.getHoldCount()`.

### Q25. What happens if a thread throws an exception inside a synchronized block?

The **lock is released automatically**, whether the block exits normally or by exception. That is the advantage of `synchronized` over manual locks.

```java
synchronized (lock) {
    throw new RuntimeException();   // monitor released as the exception propagates
}
```

With `Lock`, you **must** release in `finally`, otherwise the lock stays held forever:

```java
lock.lock();
try {
    work();
} finally {
    lock.unlock();      // always
}
```

> Side effect to remember: the object may be left in a half-updated state when the exception happens. Other threads can then see inconsistent data, so keep critical sections small and exception-safe.

* * *

## 4. Inter-Thread Communication (wait / notify)

### Q26. How do you share data between two threads?

| Technique                         | When to use                                                 |
|-----------------------------------|-------------------------------------------------------------|
| Shared object + `synchronized` / `Lock` | Simple shared state                                   |
| `volatile` / `Atomic*`            | Single flag or counter                                      |
| **`BlockingQueue`**               | Producer-consumer hand-off (best default)                   |
| Concurrent collections            | Shared maps/lists                                           |
| `Exchanger`                       | Two threads swap buffers at a rendezvous point              |
| `Future` / `CompletableFuture`    | Pass a result back from a task                              |
| `wait()` / `notify()`             | Low-level; prefer the above                                 |

```java
BlockingQueue<String> q = new LinkedBlockingQueue<>();
new Thread(() -> q.offer("hello")).start();           // producer
new Thread(() -> System.out.println(q.take())).start(); // consumer (take blocks until available)
```

### Q27. What is the difference between notify() and notifyAll()?

Many threads can wait on the same monitor (the **wait set**).

| Method        | Effect                                                       | Risk                                      |
|---------------|--------------------------------------------------------------|-------------------------------------------|
| `notify()`    | Wakes **one arbitrary** waiting thread                       | May wake the wrong thread, which can cause a lost signal / hang |
| `notifyAll()` | Wakes **all** waiting threads; they compete for the lock     | Thundering herd, but safe                 |

Use `notify()` only when (1) all waiters are waiting on the **same condition** and (2) any one of them can proceed. Otherwise use `notifyAll()`. When in doubt, `notifyAll()`.

Better: `ReentrantLock` with multiple `Condition`s (`notFull`, `notEmpty`) so you can signal precisely.

### Q28. Why are wait, notify and notifyAll defined in Object and not in Thread?

- Java locks are **per object**, not per thread. Every object has a monitor.
- `wait()` means "release **this object's** monitor and sleep until someone signals **this object**".
- If `wait()` were on `Thread`, it would be unclear which lock the thread is waiting on, since a thread can hold several monitors.

```java
synchronized (queue) {
    while (queue.isEmpty()) queue.wait();     // waits on queue's monitor
}
// elsewhere
synchronized (queue) { queue.add(x); queue.notifyAll(); }
```

### Q29. Why must wait() and notify() be called from a synchronized block?

1. **API requirement:** calling them without owning the monitor throws `IllegalMonitorStateException`.
2. **Prevents the lost wake-up race:** the check of the condition and the call to `wait()` must be atomic.

```
Without the lock:
 Consumer: sees queue empty ...
 Producer: adds item, calls notify()      <- nobody is waiting yet, signal lost
 Consumer: calls wait()                   <- sleeps forever
```

Holding the monitor makes "check condition + wait" one atomic step relative to "change condition + notify".

### Q30. Why should you call wait() in a loop?

Because of **spurious wake-ups** (a thread can wake with no notify) and because **the condition can change again** between the notify and the moment the woken thread reacquires the lock.

```java
synchronized (lock) {
    while (!condition) {        // WHILE, never IF
        lock.wait();
    }
    // condition is guaranteed true here
}
```

Same rule for `Condition.await()`.

### Q31. Write code for the Producer-Consumer problem.

**High-level (recommended): `BlockingQueue`**

```java
public class ProducerConsumer {
    public static void main(String[] args) {
        BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(5);   // bounded

        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 10; i++) {
                    queue.put(i);                       // blocks if full
                    System.out.println("Produced " + i);
                }
                queue.put(-1);                          // poison pill = stop signal
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });

        Thread consumer = new Thread(() -> {
            try {
                while (true) {
                    int v = queue.take();               // blocks if empty
                    if (v == -1) break;
                    System.out.println("Consumed " + v);
                }
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });

        producer.start();
        consumer.start();
    }
}
```

**Low-level: wait / notify**

```java
class Buffer {
    private final Queue<Integer> q = new LinkedList<>();
    private final int capacity = 5;

    public synchronized void put(int v) throws InterruptedException {
        while (q.size() == capacity) wait();     // full
        q.add(v);
        notifyAll();
    }

    public synchronized int take() throws InterruptedException {
        while (q.isEmpty()) wait();              // empty
        int v = q.remove();
        notifyAll();
        return v;
    }
}
```

| Approach          | Pros                              | Cons                                |
|-------------------|-----------------------------------|-------------------------------------|
| `BlockingQueue`   | Simple, correct, back-pressure    | None for most cases                 |
| `wait/notify`     | No library needed, teaches basics | Easy to get wrong                   |
| `Lock + Condition`| Separate `notFull`/`notEmpty`     | More code                           |
| `Semaphore`       | Two semaphores (empty/full slots) | Need extra mutex for the buffer     |

### Q32. What is the difference between wait() and sleep()?

| Aspect            | `wait()`                          | `sleep()`                           |
|-------------------|-----------------------------------|-------------------------------------|
| Defined in        | `Object`                          | `Thread` (static)                   |
| Releases lock?    | **Yes**                           | **No**                              |
| Needs synchronized| **Yes**                           | No                                  |
| Wake-up           | `notify()` / `notifyAll()` / timeout / interrupt | Timeout / interrupt  |
| Purpose           | Inter-thread coordination         | Pause current thread                |
| State             | `WAITING` / `TIMED_WAITING`       | `TIMED_WAITING`                     |

> **Pitfall:** `Thread.sleep()` inside `synchronized` keeps everyone else blocked on that lock.

* * *

## 5. Locks and Synchronizers

### Q33. What is the difference between synchronized and ReentrantLock?

| Feature                    | `synchronized`                      | `ReentrantLock`                                  |
|----------------------------|-------------------------------------|--------------------------------------------------|
| Acquire / release          | Automatic (block/method scope)      | Manual: `lock()` / `unlock()` in `finally`       |
| Try without blocking       | No                                  | `tryLock()`, `tryLock(timeout)`                  |
| Interruptible wait         | No                                  | `lockInterruptibly()`                            |
| Fairness                   | No (unfair)                         | Optional: `new ReentrantLock(true)`              |
| Multiple wait conditions   | One (`wait/notify`)                 | Many `Condition` objects                         |
| Lock across methods        | No                                  | Yes                                              |
| Introspection              | No                                  | `isLocked()`, `getQueueLength()`, `isHeldByCurrentThread()` |
| Risk                       | Low                                 | Forgetting `unlock()` = permanent lock           |

Both are **reentrant** (the same thread can re-acquire a lock it already holds).

```java
private final ReentrantLock lock = new ReentrantLock();

void update() {
    lock.lock();
    try {
        // critical section
    } finally {
        lock.unlock();
    }
}
```

**Rule of thumb:** use `synchronized` by default (simple, JIT-optimized). Use `ReentrantLock` when you need `tryLock`, timeouts, fairness, interruptibility or multiple conditions.

> Virtual threads note: on Java 21–23, blocking inside `synchronized` can pin the carrier thread; `ReentrantLock` does not. JDK 24 (JEP 491) largely removes this pinning.

### Q34. What is the difference between CountDownLatch and CyclicBarrier?

| Aspect            | `CountDownLatch`                                   | `CyclicBarrier`                                    |
|-------------------|----------------------------------------------------|----------------------------------------------------|
| Idea              | "Wait until N events happen"                       | "All N threads wait for each other, then go together" |
| Who waits         | Waiting threads call `await()`; others call `countDown()` | The **same** N threads call `await()`       |
| Reusable          | **No**, one-shot (count stays 0)                   | **Yes**, resets after each trip                    |
| Barrier action    | No                                                 | Optional `Runnable` run when the last thread arrives |
| Typical use       | Wait for services to start; start gun / finish line| Phased parallel algorithms, simulations            |

```java
// CountDownLatch: main waits for 3 workers
CountDownLatch latch = new CountDownLatch(3);
for (int i = 0; i < 3; i++) {
    new Thread(() -> { doWork(); latch.countDown(); }).start();
}
latch.await();            // returns when count hits 0
```

```java
// CyclicBarrier: 3 threads meet at the barrier each round
CyclicBarrier barrier = new CyclicBarrier(3, () -> System.out.println("Phase done"));
for (int i = 0; i < 3; i++) {
    new Thread(() -> {
        for (int round = 0; round < 2; round++) {
            doPhaseWork();
            barrier.await();      // all 3 must arrive; barrier then resets
        }
    }).start();
}
```

Also know **`Phaser`** (flexible, dynamic number of parties, multiple phases).

### Q35. What is a Semaphore?

**What?** A counter of **permits**. `acquire()` takes a permit (blocks if none left), `release()` returns it.

**Why?** To limit concurrent access to a resource that exists in limited numbers: DB connections, API rate limiting, parallel download slots.

```java
Semaphore sem = new Semaphore(3);        // max 3 threads inside at once

void callExternalApi() throws InterruptedException {
    sem.acquire();
    try {
        // at most 3 threads here
    } finally {
        sem.release();
    }
}
```

- `new Semaphore(1)` acts like a mutex, but **not owned by a thread** (any thread may release).
- `tryAcquire()` / `tryAcquire(timeout)` for non-blocking attempts.
- `new Semaphore(n, true)` for fairness.

### Q36. What is a ReadWriteLock?

**What?** A pair of locks. The **read lock** can be held by many threads at once (if no writer). The **write lock** is exclusive.

**Why?** Read-heavy data (caches, config) gets much better concurrency than one exclusive lock.

```java
class Cache {
    private final Map<String, String> map = new HashMap<>();
    private final ReadWriteLock rw = new ReentrantReadWriteLock();

    String get(String k) {
        rw.readLock().lock();
        try { return map.get(k); } finally { rw.readLock().unlock(); }
    }

    void put(String k, String v) {
        rw.writeLock().lock();
        try { map.put(k, v); } finally { rw.writeLock().unlock(); }
    }
}
```

| Detail                | Note                                                           |
|-----------------------|----------------------------------------------------------------|
| Reentrant limits      | Up to 65,535 read holds and 65,535 write holds                 |
| Downgrade             | Write lock → read lock allowed                                 |
| Upgrade               | Read lock → write lock **not allowed** (deadlocks)             |
| Alternative           | `StampedLock` supports optimistic reads, even faster; not reentrant |

### Q37. What is a busy spin?

**What?** A thread waits for a condition by looping on it **without giving up the CPU** (no `sleep`/`wait`/`yield`).

```java
while (!ready) {
    Thread.onSpinWait();      // Java 9+: CPU hint for spin loops
}
```

**Why?** When the expected wait is **nanoseconds to microseconds**, parking and waking a thread (context switch, cache loss) costs more than spinning. Used in low-latency systems (e.g. LMAX Disruptor, lock implementations).

| Pros                                | Cons                                         |
|-------------------------------------|----------------------------------------------|
| Lowest wake-up latency, keeps CPU cache warm | Burns 100% of a core while waiting  |
| No context switch                   | Bad if wait is long or CPUs are scarce       |

* * *

## 6. Concurrent Collections

### Q38. What is the difference between synchronized and concurrent collections?

| Aspect       | Synchronized (`Collections.synchronizedMap`, `Hashtable`, `Vector`) | Concurrent (`ConcurrentHashMap`, `CopyOnWriteArrayList`, ...) |
|--------------|-----------------------------------------|------------------------------------------------|
| Locking      | One lock on the **whole** collection    | Fine-grained locks, CAS, or copy-on-write      |
| Scalability  | Poor: threads queue up                  | High                                           |
| Iteration    | Needs manual `synchronized` or throws `ConcurrentModificationException` | Weakly consistent, no CME |
| Compound ops | Caller must lock                        | Atomic helpers: `putIfAbsent`, `computeIfAbsent`, `merge` |
| Null keys/values | Depends on wrapped class            | `ConcurrentHashMap` forbids nulls              |

**Pick the right concurrent collection:**

| Need                                  | Class                                         |
|---------------------------------------|-----------------------------------------------|
| Concurrent map                        | `ConcurrentHashMap`                           |
| Sorted concurrent map/set             | `ConcurrentSkipListMap` / `Set`               |
| Read-mostly list/set                  | `CopyOnWriteArrayList` / `CopyOnWriteArraySet`|
| Non-blocking queue/deque              | `ConcurrentLinkedQueue` / `Deque`             |
| Hand-off between threads              | `ArrayBlockingQueue`, `LinkedBlockingQueue`, `SynchronousQueue`, `PriorityBlockingQueue`, `DelayQueue` |

```java
ConcurrentMap<String, LongAdder> hits = new ConcurrentHashMap<>();
hits.computeIfAbsent("home", k -> new LongAdder()).increment();   // atomic, no external lock
```

### Q39. What is the concurrency level of ConcurrentHashMap?

- **Java 5–7:** the map was split into **segments** (each a small lock-protected table). `concurrencyLevel` (default **16**) = estimated number of threads updating at once = number of segments. 16 writers could proceed in parallel if they hit different segments.
- **Java 8+:** segments were **removed**. Writes use **CAS** for empty bins and `synchronized` on the **first node of a bin** only. Parallelism is now roughly "number of bins". The `concurrencyLevel` constructor argument is kept for compatibility and only used as a **sizing hint**.

| Version | Locking granularity                         |
|---------|---------------------------------------------|
| ≤ Java 7| Segment (default 16)                        |
| ≥ Java 8| Per bucket (CAS + synchronized on bin head) |

Also: reads are generally lock-free (volatile reads), and large bins convert to red-black trees (treeify) like `HashMap`.

* * *

## 7. Executors and Thread Pools

### Q40. What is a thread pool and why use it?

**What?** A set of **pre-created, reusable worker threads** that take tasks from a queue.

**Why?**

- Thread creation/teardown is expensive (stack memory, OS calls).
- Unbounded thread creation can crash the app (`OutOfMemoryError: unable to create native thread`).
- Gives control: size, queueing, rejection, naming, monitoring.

```
 Tasks ──► [ Work Queue ] ──► Worker-1
                             ├► Worker-2
                             └► Worker-3
```

**`ThreadPoolExecutor` parameters:**

| Parameter         | Meaning                                                   |
|-------------------|-----------------------------------------------------------|
| `corePoolSize`    | Threads kept alive even if idle                           |
| `maximumPoolSize` | Upper bound of threads                                    |
| `keepAliveTime`   | How long extra (non-core) threads stay idle before dying  |
| `workQueue`       | Holds tasks waiting for a thread                          |
| `threadFactory`   | Names/configures threads                                  |
| `handler`         | What to do when saturated (rejection policy)              |

**Task submission order (important!):**

1. Fewer than `core` threads → create a new thread.
2. Else → put the task in the **queue**.
3. Queue full and fewer than `max` threads → create an extra thread.
4. Queue full and `max` reached → **reject**.

**Factory methods (`Executors`):**

| Method                       | Behaviour                         | Caveat                                      |
|------------------------------|-----------------------------------|---------------------------------------------|
| `newFixedThreadPool(n)`      | n threads, **unbounded** queue    | Queue can grow until OOM                    |
| `newCachedThreadPool()`      | Creates threads on demand, reuses idle | Unbounded threads                      |
| `newSingleThreadExecutor()`  | One thread, tasks run in order    | Unbounded queue                             |
| `newScheduledThreadPool(n)`  | Delayed / periodic tasks          |                                             |
| `newWorkStealingPool()`      | `ForkJoinPool` based              |                                             |
| `newVirtualThreadPerTaskExecutor()` | One virtual thread per task (Java 21) | Great for blocking I/O              |

**Production tip:** build `ThreadPoolExecutor` yourself with a **bounded queue**, a named `ThreadFactory` and an explicit rejection policy.

```java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
        4, 8, 60, TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(100),
        new ThreadFactoryBuilder().setNameFormat("order-worker-%d").build(), // Guava; or custom
        new ThreadPoolExecutor.CallerRunsPolicy());
```

Always `shutdown()` (graceful) / `shutdownNow()` (interrupt) and `awaitTermination(...)`.

**Sizing:** CPU-bound ≈ `cores + 1`; I/O-bound ≈ `cores × (1 + waitTime/computeTime)`.

### Q41. What happens if you submit a task when the pool's queue is full?

It depends on the **queue type** and the **rejection handler**.

| Setup                                          | Result                                                   |
|------------------------------------------------|----------------------------------------------------------|
| **Unbounded** queue (`LinkedBlockingQueue()`)  | Never rejected; the queue keeps growing (memory risk)    |
| **Bounded** queue + threads < max              | New thread is created                                   |
| **Bounded** queue full + threads == max        | Rejection handler runs                                   |

**Rejection policies:**

| Policy                | Behaviour                                                   |
|-----------------------|-------------------------------------------------------------|
| `AbortPolicy` (default)| Throws `RejectedExecutionException`                        |
| `CallerRunsPolicy`    | Caller thread runs the task, which slows the producer (back-pressure) |
| `DiscardPolicy`       | Silently drops the new task                                 |
| `DiscardOldestPolicy` | Drops the oldest queued task, retries                       |
| Custom                | Log, persist, retry later                                   |

**Worked example:** core = 3, max = 5, `ArrayBlockingQueue(3)`.

```
Task 1-3 → 3 core threads
Task 4-6 → queue (3 slots)
Task 7-8 → 2 extra threads (up to max 5)
Task 9   → REJECTED
```

So submitting only 5 tasks will **not** throw (a common confusion). Capacity before rejection = `max + queueCapacity` = 8.

### Q42. What is the difference between submit() and execute()?

| Aspect          | `execute(Runnable)`                  | `submit(Runnable / Callable)`              |
|-----------------|--------------------------------------|--------------------------------------------|
| Defined in      | `Executor`                           | `ExecutorService`                          |
| Return          | `void`                               | `Future<T>`                                |
| Accepts         | `Runnable` only                      | `Runnable` or `Callable`                   |
| Exceptions      | Propagate to uncaught handler; worker thread replaced | **Captured in the Future**; thrown only on `get()` |
| Cancel/result   | Not possible                         | `future.cancel()`, `future.get()`          |

```java
pool.execute(() -> { throw new RuntimeException("seen in logs"); });
pool.submit(() -> { throw new RuntimeException("SILENT unless you call get()"); });
```

### Q43. What is the Fork/Join framework?

**What?** (Java 7) A pool (`ForkJoinPool`) for **divide-and-conquer** tasks: split a big task into subtasks (**fork**), run them in parallel, then combine (**join**).

**Key idea: work stealing.** Each worker has its own deque. An idle worker steals tasks from the tail of a busy worker's deque, which gives good load balancing.

```java
class SumTask extends RecursiveTask<Long> {
    private static final int THRESHOLD = 10_000;
    private final int[] arr; private final int lo, hi;

    SumTask(int[] arr, int lo, int hi) { this.arr = arr; this.lo = lo; this.hi = hi; }

    @Override
    protected Long compute() {
        if (hi - lo <= THRESHOLD) {                  // small enough: compute directly
            long sum = 0;
            for (int i = lo; i < hi; i++) sum += arr[i];
            return sum;
        }
        int mid = (lo + hi) >>> 1;
        SumTask left  = new SumTask(arr, lo, mid);
        SumTask right = new SumTask(arr, mid, hi);
        left.fork();                                 // run left async
        return right.compute() + left.join();        // compute right here, then join left
    }
}
long total = ForkJoinPool.commonPool().invoke(new SumTask(data, 0, data.length));
```

| Class              | Use                                   |
|--------------------|---------------------------------------|
| `RecursiveTask<V>` | Returns a result                      |
| `RecursiveAction`  | No result                             |

**Used internally by:** `parallelStream()`, `CompletableFuture.supplyAsync` (default pool: `ForkJoinPool.commonPool()`).
**Caveat:** do not run blocking I/O in the common pool; it starves other users.

### Q44. What is a blocking method?

A method that **does not return until its work is done** (or it is interrupted/times out). The thread sits in `WAITING`, `TIMED_WAITING` or `BLOCKED` state meanwhile.

| Blocking                                         | Non-blocking / async                          |
|--------------------------------------------------|-----------------------------------------------|
| `ServerSocket.accept()`, `InputStream.read()`    | NIO `Selector`, `AsynchronousChannel`         |
| `BlockingQueue.take()/put()`                     | `queue.poll()/offer()`                        |
| `Thread.sleep()`, `join()`, `Future.get()`       | `CompletableFuture.thenApply(...)`            |
| `lock.lock()`                                    | `lock.tryLock()`                              |

**Rules:** blocking methods usually throw `InterruptedException`, so handle it correctly. Never block inside a small shared pool (e.g. common ForkJoinPool or a pool used for non-blocking event loops). With virtual threads (Java 21) blocking is cheap, since the JVM unmounts the virtual thread while it waits.

* * *

## 8. JVM and Tooling

### Q45. How do you take a thread dump?

A thread dump is a snapshot of **every thread's state and stack trace**. It is the first tool for hangs, high CPU, deadlocks and pool exhaustion.

| Method                              | Command / key                                         |
|-------------------------------------|-------------------------------------------------------|
| `jstack`                            | `jps` (find PID) then `jstack -l <pid> > dump.txt`    |
| `jcmd`                              | `jcmd <pid> Thread.print`                             |
| Linux signal                        | `kill -3 <pid>` (prints to the app's stdout/log)      |
| Windows console                     | `Ctrl + Break`                                        |
| Virtual threads (JDK 21+)           | `jcmd <pid> Thread.dump_to_file -format=json file.json` |
| Programmatic                        | `Thread.getAllStackTraces()`, `ThreadMXBean`          |

**Best practice:** take **3 dumps, 5–10 seconds apart**, to see which threads are stuck vs moving.

**What to look for:**

- `Found one Java-level deadlock` section at the bottom
- Many threads `BLOCKED` on the same monitor (`waiting to lock <0x...>`)
- Pool threads all in `WAITING` on a queue = idle; all in your code = saturated
- Threads in `RUNNABLE` in a tight loop = high CPU (match with `top -H` thread id converted to hex `nid`)

Tools to analyze: fastThread.io, Eclipse MAT (for heap), VisualVM, JConsole.

### Q46. Which JVM parameter controls the thread stack size?

`-Xss`, e.g. `-Xss512k` or `-Xss2m`.

| Point               | Detail                                                                |
|---------------------|-----------------------------------------------------------------------|
| Default             | Typically 1 MB on 64-bit Linux/Windows                                |
| Effect              | Max depth of recursion/call chain per thread                          |
| Too small           | `StackOverflowError` sooner                                           |
| Too large           | Fewer threads fit in memory (`threads × stack size`)                  |
| Per-thread override | `new Thread(group, runnable, name, stackSizeBytes)` (a hint)          |

Related: `-XX:ThreadStackSize`, `-Xmx` (heap), `-XX:MaxDirectMemorySize`.

* * *

## 9. Singleton and Concurrency

### Q47. What is double-checked locking (DCL) in Singleton?

**What?** Lazy initialization that avoids locking on every call: check once without a lock, then lock and check again.

```java
public class Singleton {
    private static volatile Singleton instance;      // volatile is MANDATORY

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {                      // 1st check (no lock)
            synchronized (Singleton.class) {
                if (instance == null) {              // 2nd check (locked)
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

**Why `volatile`?** `instance = new Singleton()` is three steps: (1) allocate memory, (2) run constructor, (3) assign reference. Without `volatile` the JIT/CPU may reorder 3 before 2, so another thread sees a non-null but **half-constructed** object. DCL was broken in Java ≤ 1.4; it works correctly from Java 5 (JSR-133) **only with `volatile`**.

> Full discussion with all variants is in [Singleton Design Pattern](../design-pattern/singleton-pattern).

### Q48. How do you create a thread-safe Singleton?

| Approach                   | Lazy | Thread-safe | Notes                                              |
|----------------------------|------|-------------|----------------------------------------------------|
| Eager static field         | No   | Yes         | Simplest                                           |
| `synchronized` getInstance | Yes  | Yes         | Locks on every call                                |
| Double-checked locking     | Yes  | Yes         | Needs `volatile`                                   |
| **Bill Pugh static holder**| Yes  | Yes         | Relies on class-loading guarantee, no locks        |
| **Enum singleton**         | No   | Yes         | Safe against reflection and serialization (Joshua Bloch's recommendation) |

```java
// Bill Pugh holder
public class Config {
    private Config() {}
    private static class Holder { static final Config INSTANCE = new Config(); }
    public static Config getInstance() { return Holder.INSTANCE; }
}

// Enum
public enum Registry { INSTANCE; /* fields and methods */ }
```

In Spring Boot, prefer container-managed singleton beans (default scope) over hand-written singletons.

* * *

## 10. Best Practices

### Q49. List multithreading best practices you follow.

| # | Practice                                         | Why                                                                  |
|---|--------------------------------------------------|----------------------------------------------------------------------|
| 1 | **Name your threads / pools**                    | Thread dumps and logs become readable (`order-worker-3` vs `Thread-17`) |
| 2 | **Minimize lock scope**                          | Locking is costly; use `synchronized` blocks over whole methods      |
| 3 | **Prefer high-level utilities over wait/notify** | `CountDownLatch`, `Semaphore`, `BlockingQueue`, `CompletableFuture` are tested and optimized |
| 4 | **Prefer concurrent collections**                | `ConcurrentHashMap` over `Hashtable` / `synchronizedMap`             |
| 5 | **Prefer immutability**                          | No sync needed                                                       |
| 6 | **Use executors, not raw `new Thread()`**        | Reuse, bounded resources, lifecycle management                       |
| 7 | **Always unlock in `finally`**                   | Avoid permanent locks on exceptions                                  |
| 8 | **Acquire locks in a fixed order**               | Prevents deadlock                                                    |
| 9 | **Never swallow `InterruptedException`**         | Restore flag or rethrow                                              |
| 10| **Do not call alien/unknown code while holding a lock** | Avoids deadlocks and long holds                               |
| 11| **Clean up `ThreadLocal`** in pools              | Prevents leaks and cross-request data bleed                          |
| 12| **Bound queues and pools**                       | Back-pressure instead of OOM                                         |
| 13| **Document thread-safety** (`@ThreadSafe`, `@GuardedBy`) | Maintainability                                              |
| 14| **Test under load, use tools** (jstack, JFR, thread sanitizers, jcstress) | Concurrency bugs hide in dev                 |

* * *

## 11. Legacy: Swing Threading

> Rarely asked now; included for completeness.

### Q50. Is Swing thread-safe?

**No.** Swing components are **not** thread-safe. All UI creation and updates must happen on the **Event Dispatch Thread (EDT)**. Updating from other threads causes random rendering bugs and exceptions.

### Q51. invokeAndWait vs invokeLater?

| Method                          | Behaviour                                             | Blocks caller? |
|---------------------------------|-------------------------------------------------------|----------------|
| `SwingUtilities.invokeLater(r)` | Queues `r` to run on the EDT, returns immediately     | No             |
| `SwingUtilities.invokeAndWait(r)` | Runs `r` on the EDT and waits for it to finish      | **Yes** (do not call from the EDT itself, or it deadlocks) |

```java
SwingUtilities.invokeLater(() -> progressBar.setValue(50));
```

For long background work use `SwingWorker` (`doInBackground()` off-EDT, `done()`/`process()` on EDT).

### Q52. Which Swing methods are thread-safe?

A few: `repaint()`, `revalidate()`, `invalidate()`, and adding/removing listeners (`addXxxListener` / `removeXxxListener`). Text component methods like `JTextComponent.setText()`, `JTextArea.append()/insert()` are documented thread-safe as well, but treat everything else as EDT-only.

* * *

## 12. Scenario-Based Questions

### S1. A production app is hung. How do you find a deadlock?

1. Take **thread dumps** (`jstack -l <pid>` or `kill -3 <pid>`), ideally 3 in a row.
2. Search for `Found one Java-level deadlock` and read the "waiting to lock / locked" chain with line numbers.
3. Check heap and GC (`jstat -gcutil`, GC logs) to rule out a GC pause.
4. Fix: enforce lock order, reduce lock scope, use `tryLock` with timeout.
5. Prevention: add a `ThreadMXBean.findDeadlockedThreads()` health check and alert on it.

### S2. In a trading app, "place order" and "cancel order" arrive on different threads and cancel runs first. What do you do?

The core problem is **ordering of events for the same key (orderId)**.

| Option                                    | Idea                                                                 |
|-------------------------------------------|----------------------------------------------------------------------|
| **Per-key serialization (best)**          | Route all events of an `orderId` to the same single-thread executor (hash by id) or the same **Kafka partition** (key = orderId). Order preserved, parallel across different orders. |
| State machine + idempotency               | Cancel on an unknown order is parked as "cancel pending"; when the order arrives it is created and immediately cancelled. |
| Version / sequence numbers                | Reject or re-queue out-of-order events by sequence                   |
| UI guard                                  | Disable cancel until the order is acknowledged (helps but is not sufficient alone) |

```java
ExecutorService[] lanes = new ExecutorService[8];          // 8 single-thread lanes
for (int i = 0; i < lanes.length; i++) lanes[i] = Executors.newSingleThreadExecutor();

void submit(String orderId, Runnable event) {
    lanes[Math.floorMod(orderId.hashCode(), lanes.length)].submit(event);
}
```

### S3. How would you download thousands of images using threads?

- Use a **bounded pool** (I/O bound: e.g. 20–50 threads), or virtual threads with a `Semaphore` to cap concurrent connections.
- Submit each download as a task, collect `Future`s / `CompletableFuture`s.
- Add timeouts, retries with back-off, and per-host rate limits.
- Handle failures per task so one bad URL does not kill the batch.

```java
ExecutorService pool = Executors.newFixedThreadPool(32);
List<CompletableFuture<Path>> futures = urls.stream()
        .map(u -> CompletableFuture.supplyAsync(() -> download(u), pool))
        .toList();
CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
pool.shutdown();
```

### S4. There are 5 threads but only 3 should execute at a time. How?

- **`Semaphore(3)`**: all 5 threads call `acquire()` / `release()` around the work.
- Or simply a **pool of size 3** and submit 5 tasks (the extra 2 wait in the queue).

* * *

## 13. Interview Cheat Sheet

| Question                                       | Short Answer                                                              |
|------------------------------------------------|---------------------------------------------------------------------------|
| `start()` vs `run()`?                          | `start()` creates a new thread; `run()` is a normal call                  |
| Runnable vs Callable?                          | Callable returns a value and can throw checked exceptions                 |
| How to stop a thread?                          | Cooperatively: interrupt or volatile flag                                 |
| `interrupted()` vs `isInterrupted()`?          | First clears the flag (static); second does not                           |
| volatile guarantees?                           | Visibility and ordering, **not** atomicity                                |
| volatile vs atomic?                            | Atomics add atomic read-modify-write (CAS)                                |
| `wait()` vs `sleep()`?                         | `wait` releases the lock and needs synchronized; `sleep` keeps the lock   |
| Why wait in a loop?                            | Spurious wake-ups and changed conditions                                  |
| Why wait/notify in Object?                     | Locks belong to objects, not threads                                      |
| notify vs notifyAll?                           | One vs all waiters; default to `notifyAll`                                |
| Deadlock conditions?                           | Mutual exclusion, hold and wait, no pre-emption, circular wait            |
| Easiest deadlock fix?                          | Global lock ordering                                                      |
| synchronized vs ReentrantLock?                 | Lock adds tryLock, timeout, fairness, interruptibility, many conditions   |
| CountDownLatch vs CyclicBarrier?               | Latch is one-shot "wait for events"; barrier is reusable "meet together"  |
| Semaphore?                                     | N permits; limits concurrent access                                       |
| ConcurrentHashMap internals?                   | Java 7: segments; Java 8+: CAS + per-bin `synchronized`                   |
| Pool task order?                               | core threads → queue → extra threads up to max → reject                   |
| `submit()` vs `execute()`?                     | submit returns Future and captures exceptions                             |
| Pool queue full?                               | `RejectedExecutionException` by default (bounded queue + max reached)     |
| DCL needs?                                     | `volatile` on the instance field                                          |
| Best singleton?                                | Enum, or Bill Pugh holder for lazy                                        |
| How to analyze a hang?                         | Thread dump (`jstack`, `jcmd`, `kill -3`), look for deadlock/BLOCKED      |
| Thread stack size flag?                        | `-Xss`                                                                    |
| Virtual threads (Java 21)?                     | Cheap threads for blocking I/O; do not pool them, create one per task     |

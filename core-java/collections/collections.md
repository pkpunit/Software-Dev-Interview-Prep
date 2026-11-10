# Java Collections Framework Interview Questions (Detailed)

> One-stop revision file for the Java Collections Framework. It consolidates the Durga Sir *Collections Framework* PDF, igmguru, Javarevisited, the harp-lab/learning-zone GitHub list and the commonly asked HashMap / Comparable / Comparator internals. Important questions follow **What → Why → How → Pitfalls → Interview one-liner**. Easy or less important questions get a short answer.

**Legend:** ⭐ = must-know (asked very often, answer in depth) · 🟢 = quick / easy question (short answer)

**Version note:** Everything is written for **Java 8 → Java 21+**. Where the older PDF or blogs say something that was true only in Java 1.4–7, the answer calls it out (see also the last section, *Where Older Sources Are Outdated*).

## Table of Contents

01. [Collections Framework Basics](#1-collections-framework-basics)
02. [List: ArrayList, LinkedList, Vector, Stack](#2-list-arraylist-linkedlist-vector-stack)
03. [Iterators, Fail-Fast and Fail-Safe](#3-iterators-fail-fast-and-fail-safe)
04. [Set: HashSet, LinkedHashSet, TreeSet, EnumSet](#4-set-hashset-linkedhashset-treeset-enumset)
05. [Map and HashMap Internals](#5-map-and-hashmap-internals)
06. [Sorting: Comparable and Comparator](#6-sorting-comparable-and-comparator)
07. [Queue, Deque and PriorityQueue](#7-queue-deque-and-priorityqueue)
08. [Concurrent Collections](#8-concurrent-collections)
09. [Utility Classes, Immutable and Sequenced Collections](#9-utility-classes-immutable-and-sequenced-collections)
10. [Scenario-Based Questions](#10-scenario-based-questions)
11. [Time Complexity and How to Choose a Collection](#11-time-complexity-and-how-to-choose-a-collection)
12. [Interview Cheat Sheet](#12-interview-cheat-sheet)
13. [Where Older Sources Are Outdated](#13-where-older-sources-are-outdated)

* * *

## 1. Collections Framework Basics

### Q1. What is the Java Collections Framework? ⭐

**What?** A set of **interfaces, classes and algorithms** in `java.util` (and `java.util.concurrent`) that represent a **group of objects as a single unit**, with ready-made data structures (dynamic array, linked list, hash table, red-black tree, heap) and ready-made operations (add, remove, search, sort, iterate).

**Why?** Plain arrays are painful:

| Array limitation | How collections fix it |
|------------------|------------------------|
| **Fixed size.** Once created, you cannot grow or shrink it. | Collections are **growable** (`ArrayList` resizes itself). |
| Holds only **homogeneous** elements (unless you use `Object[]`, which loses type safety). | Generics give **type-safe** collections, or `Object` collections can hold anything. |
| **No ready-made methods.** Searching, sorting, removing duplicates need hand-written code. | Every collection class sits on a standard data structure with **readymade methods**. |

**Benefits (interview list):** less programming effort, higher performance and quality (tested, optimized implementations), interoperability between unrelated APIs, easier to learn new APIs, software reuse.

> **Interview one-liner:** The Collections Framework is Java's standard architecture of interfaces and implementations for storing and manipulating groups of objects.

### Q2. What is the difference between an Array and a Collection? ⭐

| Aspect | Array | Collection |
|--------|-------|------------|
| Size | **Fixed** | **Growable / shrinkable** |
| Element type | Homogeneous only | Homogeneous and heterogeneous (with `Object` / raw types) |
| Primitives | Can hold **primitives and objects** | Holds **objects only** (primitives are auto-boxed to `Integer`, `Long`, …) |
| Memory | Better (no wrapper objects, no spare capacity) | Slightly worse (boxing, node objects, spare capacity) |
| Performance | Faster for raw indexed access | Slower than a raw array, but fast enough for almost everything |
| Ready-made methods | None (`length` field only; helpers live in `Arrays`) | Yes (`add`, `remove`, `contains`, `sort`, …) |
| Underlying data structure | None | Each class is built on a standard data structure |

> **Pitfall:** the older PDF/blogs say "arrays are recommended for memory and performance, collections are not". That is true only for primitive-heavy hot paths. In day-to-day code, prefer collections and measure before optimizing.

### Q3. What is the difference between `Collection` and `Collections`? 🟢

| `Collection` | `Collections` |
|--------------|---------------|
| An **interface** (root of the List / Set / Queue hierarchy) | A **utility class** with only **static** methods |
| Defines the basic operations: `add`, `remove`, `size`, `iterator`, … | Provides algorithms: `sort`, `reverse`, `shuffle`, `max`, `min`, `binarySearch`, `unmodifiableXxx`, `synchronizedXxx` |

Also remember `Arrays` (utility class for arrays) and `Objects` (utility for null-safe `equals`, `hash`).

### Q4. Explain the Collection framework hierarchy. ⭐

```
                 Iterable (I)
                     │
                Collection (I)  ← root of all single-element groups
      ┌──────────────┼────────────────┐
    List (I)       Set (I)         Queue (I)
      │              │                │
 ArrayList        HashSet          PriorityQueue
 LinkedList       LinkedHashSet    Deque (I) ── ArrayDeque, LinkedList
 Vector─Stack     SortedSet (I)    BlockingQueue (I) ── ArrayBlockingQueue ...
 CopyOnWrite-       │
  ArrayList      NavigableSet (I)
                    │
                 TreeSet

                 Map (I)   ← NOT a child of Collection
      ┌──────────┼──────────────┬───────────────┐
   HashMap   Hashtable   SortedMap (I)    ConcurrentMap (I)
      │         │              │                 │
LinkedHashMap Properties  NavigableMap (I)  ConcurrentHashMap
                               │
                            TreeMap
```

**The 9 key interfaces (Durga Sir):** `Collection`, `List`, `Set`, `SortedSet`, `NavigableSet`, `Queue`, `Map`, `SortedMap`, `NavigableMap`. In modern Java also remember `Deque` (double-ended queue), `BlockingQueue`, `ConcurrentMap`, and from Java 21 the `Sequenced*` interfaces.

| Interface | Duplicates | Order | Key idea |
|-----------|------------|-------|----------|
| `List` | Allowed | Insertion order, index based | Ordered sequence |
| `Set` | **Not allowed** | Usually none (`LinkedHashSet` = insertion, `TreeSet` = sorted) | Uniqueness |
| `Queue` | Allowed | FIFO (or by priority) | Hold elements **before processing** |
| `Deque` | Allowed | Both ends | Queue **and** stack |
| `Map` | Keys **no**, values **yes** | Depends on implementation | Key → value lookup |

> `Map` does not extend `Collection` because a `Collection` models **single elements**, while a `Map` models **key-value pairs**. Forcing `Map` into `Collection` would make methods like `add(E)` or `contains(Object)` ambiguous (is it a key? a value? an entry?). Instead, `Map` gives three **views**: `keySet()`, `values()`, `entrySet()`.

### Q5. What are the methods of the `Collection` interface? 🟢

| Method | Purpose |
|--------|---------|
| `boolean add(E e)` / `addAll(Collection c)` | Insert one / many |
| `boolean remove(Object o)` / `removeAll(Collection c)` | Remove one / all matching |
| `boolean retainAll(Collection c)` | Keep **only** those present in `c` (intersection) |
| `void clear()` | Remove everything |
| `boolean contains(Object o)` / `containsAll(Collection c)` | Search |
| `boolean isEmpty()` / `int size()` | State |
| `Object[] toArray()` / `T[] toArray(T[] a)` | Convert to array |
| `Iterator<E> iterator()` | Get a cursor |
| `default removeIf(Predicate)`, `stream()`, `forEach(Consumer)` | Java 8 additions |

Notes from the PDF: there is **no concrete class that implements `Collection` directly** (you always use a `List`, `Set` or `Queue` implementation), and there is **no `get()` in `Collection`**: you iterate to read.

### Q6. Why does `Collection` not extend `Cloneable` and `Serializable`? 🟢

`Collection` only describes *behaviour of a group*. If it extended these marker interfaces, **every** implementation would be forced to be cloneable and serializable. Leaving them out gives implementers freedom: `ArrayList`, `LinkedList`, `HashMap` etc. choose to implement them, while custom or specialised collections need not.

### Q7. What is the benefit of Generics in collections? 🟢

- **Compile-time type safety**: adding a `String` to a `List<Integer>` is a compile error instead of a runtime `ClassCastException`.
- **No casting** when reading elements.
- Cleaner, self-documenting code.

```java
List raw = new ArrayList();
raw.add("hello");
Integer i = (Integer) raw.get(0);      // ClassCastException at RUNTIME

List<String> safe = new ArrayList<>();
safe.add(10);                          // compile error
```

Generics are **erased** at runtime (type erasure), so `List<String>` and `List<Integer>` are the same class at runtime.

### Q8. Why can collections not hold primitives? What is autoboxing's catch? ⭐

Generic type arguments must be **reference types**, so `List<int>` is illegal; you use `List<Integer>`. Java auto-boxes `int ↔ Integer`.

**Catches:**

```java
List<Integer> list = new ArrayList<>(List.of(10, 20, 30));
list.remove(1);                      // remove(int index)  -> removes 20 (index 1)
list.remove(Integer.valueOf(10));    // remove(Object o)   -> removes the value 10

Integer a = 127, b = 127;
System.out.println(a == b);          // true  (Integer cache: -128..127)
Integer c = 128, d = 128;
System.out.println(c == d);          // false (different objects!) -> always use equals()
```

- Boxing allocates objects, so `List<Integer>` uses much more memory than `int[]`. For huge numeric data use primitive arrays or primitive-specialised libraries.
- Unboxing a `null` `Integer` throws `NullPointerException`.

### Q9. What are the default capacities of the common collections? ⭐

| Collection | Default capacity | Growth |
|------------|------------------|--------|
| `ArrayList` | **10** (allocated lazily on first `add`; empty array before that) | `old + (old >> 1)` ≈ **1.5×** |
| `Vector` | **10** | **2×** (or by `capacityIncrement` if given) |
| `HashMap` / `HashSet` / `LinkedHashMap` | **16** buckets, load factor **0.75** (allocated lazily on first `put`) | **2×** (table size always a power of two) |
| `Hashtable` | **11**, load factor 0.75 | `old * 2 + 1` |
| `PriorityQueue` | **11** | roughly 2× while small (< 64), then 1.5× |
| `ArrayDeque` | 16 (modern JDKs; 8 in old ones) | ×2 (circular array) |
| `ConcurrentHashMap` | 16 | ×2 |

> **Pitfall:** the PDF writes ArrayList growth as `(current * 3/2) + 1`. That was **Java 6**. Since Java 7/8 it is `oldCapacity + (oldCapacity >> 1)`: 10 → 15 → 22 → 33 → 49 …

### Q10. What are legacy classes in the framework? 🟢

Classes that existed in **Java 1.0**, before the Collections Framework (1.2), and were later retro-fitted: `Vector`, `Stack`, `Hashtable`, `Properties`, `Dictionary` (abstract), and the `Enumeration` interface. They are all synchronized on every method, which makes them slow. Prefer `ArrayList`, `ArrayDeque`, `HashMap`/`ConcurrentHashMap`, `Iterator`.

### Q11. Which interface is `RandomAccess`? Why is it a marker? 🟢

`java.util.RandomAccess` has **no methods**, so it is a **marker interface**. It tells algorithms that `get(index)` is O(1), so index-based loops are efficient. `ArrayList` and `Vector` implement it, `LinkedList` does **not**.

`Collections.binarySearch` and others check `instanceof RandomAccess` to choose between an indexed algorithm and an iterator-based one.

### Q12. What are `Iterable` and the for-each loop? 🟢

`Iterable<T>` has a single abstract method `iterator()` (plus defaults `forEach`, `spliterator`). Any class that implements it can be used in the enhanced `for` loop; the compiler rewrites the loop to use `iterator()`, `hasNext()` and `next()`.

```java
for (String s : list) { ... }
// is compiled roughly to:
for (Iterator<String> it = list.iterator(); it.hasNext(); ) { String s = it.next(); ... }
```

`Map` is **not** `Iterable` (iterate `entrySet()`).

### Q13. Which collection do I pick? (60-second decision guide) ⭐

```
Need key → value lookup?
 ├─ Yes → Need sorted keys?  ── Yes → TreeMap (or ConcurrentSkipListMap if concurrent)
 │         Need insertion/access order? ── Yes → LinkedHashMap (LRU!)
 │         Multi-threaded? ── Yes → ConcurrentHashMap
 │         Otherwise → HashMap
 └─ No  → Need uniqueness?
           ├─ Yes → sorted? TreeSet · insertion order? LinkedHashSet · else HashSet · enum? EnumSet
           └─ No  → Need to process in order (FIFO/priority)?
                     ├─ FIFO / stack / both ends → ArrayDeque
                     ├─ By priority → PriorityQueue
                     ├─ Hand-off between threads → BlockingQueue
                     └─ Index access / general list → ArrayList (default choice)
                        Read-mostly + multi-threaded → CopyOnWriteArrayList
```

### Q14. What are the common thread-safe options and which one should I prefer? 🟢

Use **concurrent collections** (`ConcurrentHashMap`, `CopyOnWriteArrayList`, `BlockingQueue`) over `Vector`/`Hashtable`/`Collections.synchronizedXxx` in new code. Details are in the [Concurrent Collections](#8-concurrent-collections) section; for locks, thread pools and `wait/notify`, see the [Multithreading page](https://pkpunit.github.io/Software-Dev-Interview-Prep/core-java/multithreading/java-multithreading-concurrency).

* * *

## 2. List: ArrayList, LinkedList, Vector, Stack

### Q15. What is a `List`? What guarantees does it give? 🟢

A `List` is an **ordered** collection (insertion order is preserved, elements have an **index** starting at 0) that **allows duplicates** and allows `null` (for the common implementations). The index is what lets you tell duplicates apart and is why the extra methods exist:

`add(int, E)`, `addAll(int, Collection)`, `get(int)`, `set(int, E)` (returns the old element), `remove(int)`, `indexOf`, `lastIndexOf`, `subList`, `listIterator()`, and Java 8 `replaceAll`, `sort`.

### Q16. How does `ArrayList` work internally? ⭐

**What?** A **resizable (dynamic) array**: an `Object[] elementData` plus an `int size`. Allows duplicates, `null`, preserves insertion order, is **not thread-safe**, implements `RandomAccess`, `Serializable`, `Cloneable`.

**Why it is fast for reads:** `get(i)` is just `elementData[i]` (after a bounds check): **O(1)**.

**Growth (the key interview detail):**

```
new ArrayList<>()     → elementData = {}  (shared empty array, capacity 0)
1st add()             → capacity becomes 10
add 11th element      → newCapacity = 10 + (10 >> 1) = 15  → Arrays.copyOf (new array, copy 10 items)
add 16th element      → 15 + 7 = 22
add 23rd element      → 22 + 11 = 33
```

When the array is full, a **bigger array is allocated and all elements are copied** (`Arrays.copyOf`). That single add costs O(n), but spread over many adds it averages **O(1) amortized**.

**Insert / remove in the middle shifts elements** with `System.arraycopy`:

```
list = [A, B, C, D, E]   remove(1)  (remove B)
shift C,D,E one slot left:  [A, C, D, E, E]  → last slot set to null → [A, C, D, E, null]  size = 4
```

| Operation | Cost |
|-----------|------|
| `get(i)`, `set(i, e)` | O(1) |
| `add(e)` at end | O(1) amortized |
| `add(i, e)`, `remove(i)` | O(n) (shifting) |
| `contains`, `indexOf` | O(n) |

**Tuning:** `new ArrayList<>(expectedSize)` avoids repeated resizing; `ensureCapacity(n)` before bulk adds; `trimToSize()` frees spare capacity.

**Pitfalls:**

- `new ArrayList<>(Collection c)` is a **shallow copy**: the new list holds the *same* element objects.
- `ArrayList.clone()` is also shallow.
- `remove(int)` vs `remove(Object)` confusion for `List<Integer>` (see Q8).
- Not synchronized: wrap with `Collections.synchronizedList(...)` or use `CopyOnWriteArrayList`.

> **Interview one-liner:** `ArrayList` = growable `Object[]`; O(1) random access, amortized O(1) append, O(n) middle insert/delete, grows by about 1.5× by allocating a new array and copying.

### Q17. How does `LinkedList` work internally? ⭐

**What?** A **doubly linked list**. Each element lives in a `Node`:

```java
private static class Node<E> {
    E item;
    Node<E> next;
    Node<E> prev;
}
// LinkedList keeps: Node<E> first;  Node<E> last;  int size;
```

```
first                                         last
  │                                             │
 [prev=null|A|next] ⇄ [prev|B|next] ⇄ [prev|C|next=null]
```

It implements **both `List` and `Deque`**, so it can act as list, queue and stack. It allows duplicates and `null`, keeps insertion order, is **not** synchronized and does **not** implement `RandomAccess`.

**Special methods (Deque side):** `addFirst`, `addLast`, `getFirst`, `getLast`, `removeFirst`, `removeLast`, `push`, `pop`, `peek`, `poll`, `offer`.

| Operation | Cost | Why |
|-----------|------|-----|
| `addFirst`, `addLast`, `removeFirst`, `removeLast` | **O(1)** | Just re-link head/tail |
| `get(i)`, `set(i, e)` | **O(n)** | Walk from the **nearer end** (head if `i < size/2`, else tail) |
| `add(i, e)`, `remove(i)` | **O(n)** | O(n) to *find* the node, then O(1) to re-link |
| Remove via `Iterator` / `ListIterator` | **O(1)** per removal | Already positioned on the node |

**Memory:** each element costs one `Node` object (object header + 3 references ≈ 24 bytes with compressed oops) on top of the element itself. An `ArrayList` slot is just 4 bytes.

> **Interview one-liner:** `LinkedList` is a doubly linked list giving O(1) at both ends and O(1) re-linking, but O(n) to reach any index. In practice `ArrayList` (or `ArrayDeque`) wins almost every benchmark because of memory overhead and CPU-cache locality.

### Q18. What is the difference between `ArrayList` and `LinkedList`? ⭐

| Aspect | `ArrayList` | `LinkedList` |
|--------|-------------|--------------|
| Data structure | Dynamic array | Doubly linked list |
| `get(i)` | **O(1)** | O(n) |
| Add / remove at **end** | O(1) amortized | O(1) |
| Add / remove at **start** | O(n) (shift) | **O(1)** |
| Add / remove in **middle** | O(n) (shift) | O(n) to find + O(1) to link |
| Memory per element | Low (one reference) | High (node + 2 links) |
| Interfaces | `List`, `RandomAccess` | `List`, `Deque` (also a Queue/Stack) |
| Cache friendliness | Excellent (contiguous) | Poor (scattered nodes) |
| Initial capacity concept | Yes (10) | No |

**Rule of thumb:** use `ArrayList` by default. Use `LinkedList` only if you really do many insertions/removals through an **iterator** in the middle of a huge list, and even then consider `ArrayDeque` for queue/stack needs.

### Q19. What is the difference between `ArrayList` and `Vector`? ⭐

| Aspect | `ArrayList` | `Vector` |
|--------|-------------|----------|
| Synchronization | **Not** synchronized | **All methods synchronized** |
| Thread safety | No | Yes (but only per method call) |
| Performance | Faster | Slower (lock on every call, even in single-threaded code) |
| Growth | ~50 % (1.5×) | **100 % (2×)** by default |
| Since | Java 1.2 | Java 1.0 (**legacy**) |
| Traversal | `Iterator`, `ListIterator` | `Iterator`, `ListIterator`, **`Enumeration`** |

> Vector's per-method lock does **not** make compound operations safe: `if (!v.contains(x)) v.add(x);` is still a race condition. For thread safety use `CopyOnWriteArrayList` (read-heavy) or `Collections.synchronizedList` with an external lock on compound actions.

To get a synchronized `ArrayList`: `List<String> sync = Collections.synchronizedList(new ArrayList<>());` (and manually `synchronized (sync) { ... }` while iterating).

### Q20. What is `Vector` and how does it grow? What are its special methods? 🟢

`Vector` is a legacy, synchronized, growable array. `new Vector()` → capacity 10; when full it **doubles** (`capacity * 2`), or grows by `capacityIncrement` if you passed one: `new Vector<>(initialCapacity, capacityIncrement)`.

Legacy-style methods: `addElement`, `removeElement`, `removeElementAt`, `removeAllElements`, `elementAt`, `firstElement`, `lastElement`, `elements()` (returns `Enumeration`), `capacity()`.

```java
Vector<Integer> v = new Vector<>();
System.out.println(v.capacity());     // 10
for (int i = 1; i <= 10; i++) v.addElement(i);
v.addElement(99);
System.out.println(v.capacity());     // 20
```

### Q21. What is `Stack`? Why is it discouraged? How do I do a stack properly? ⭐

`Stack<E>` extends `Vector` and gives LIFO: `push`, `pop`, `peek`, `empty()`, `search(o)` (returns the **1-based distance from the top**, or -1).

```java
Stack<String> s = new Stack<>();
s.push("A"); s.push("B"); s.push("C");   // stack: [A, B, C]  (C is the top)
s.search("C");   // 1
s.search("A");   // 3
s.search("Z");   // -1
```

**Why discouraged:** it inherits `Vector`'s synchronization cost, and because it *is-a* `Vector`, callers can break LIFO by calling `get(i)` / `add(i, e)`.

**Use `Deque` instead:**

```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);        // addFirst
stack.push(2);
stack.peek();         // 2  (top, not removed)
stack.pop();          // 2  (removes top)
```

### Q22. How do I iterate over a `List`? Which is best? 🟢

```java
for (int i = 0; i < list.size(); i++) { list.get(i); }  // OK for ArrayList; O(n²) for LinkedList!
for (String s : list) { ... }                            // preferred, simple
list.forEach(System.out::println);                       // Java 8
for (Iterator<String> it = list.iterator(); it.hasNext();) { ... }   // needed to remove while iterating
for (ListIterator<String> it = list.listIterator(); ...)             // bi-directional, add/set
list.stream().filter(...).forEach(...);                  // pipelines
```

### Q23. How do I remove elements from a list while iterating? ⭐

**Wrong:** calling `list.remove(...)` inside a for-each loop → `ConcurrentModificationException` (usually).

```java
List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4));
for (Integer x : list) {
    if (x == 2) list.remove(x);      // CME on the next call to next()
}
```

**Correct options:**

```java
// 1) Iterator.remove()  (the only safe way during iteration)
for (Iterator<Integer> it = list.iterator(); it.hasNext();) {
    if (it.next() % 2 == 0) it.remove();
}

// 2) removeIf (Java 8) - best and shortest
list.removeIf(x -> x % 2 == 0);

// 3) Collect what to keep, or iterate backwards by index
list = list.stream().filter(x -> x % 2 != 0).collect(Collectors.toList());
for (int i = list.size() - 1; i >= 0; i--) if (list.get(i) % 2 == 0) list.remove(i);
```

**Famous trap (very often asked):** removing the **second-last** element inside a for-each does **not** throw.

```
list = [1, 2, 3, 4]; for-each, remove 3 when seen:
  after next() returned 3, cursor = 3
  list.remove(3) → size becomes 3
  hasNext() checks  cursor != size  →  3 != 3  → false → loop just ends (4 is silently skipped!)
```

### Q24. What is the difference between `remove()` of `Collection` and `remove()` of `Iterator`? ⭐

- `collection.remove(obj)` / `list.remove(index)` changes the collection **without telling the iterator** → `modCount` changes → the iterator's next call throws `ConcurrentModificationException`.
- `iterator.remove()` removes the last element returned by `next()` **and re-syncs** the iterator's `expectedModCount`. It is the **only safe** removal during iteration.

### Q25. How do I remove duplicates from a `List`? 🟢

```java
// Keep first-seen order (LinkedHashSet) - the classic answer
List<Integer> unique = new ArrayList<>(new LinkedHashSet<>(numbers));

// Don't care about order:        new ArrayList<>(new HashSet<>(numbers))
// Sorted result:                 new ArrayList<>(new TreeSet<>(numbers))
// Java 8 streams:                numbers.stream().distinct().collect(Collectors.toList());
```

`LinkedHashSet` removes duplicates (it is a `Set`) and keeps insertion order (linked list across entries), in O(n) total.

### Q26. What does `Arrays.asList()` return? What are the traps? ⭐

It returns a **fixed-size list view backed by the original array** (it is `Arrays.ArrayList`, a private inner class, not `java.util.ArrayList`).

```java
String[] arr = {"A", "Z", "B"};
List<String> list = Arrays.asList(arr);

arr[0] = "K";            // write-through: list is now [K, Z, B]
list.set(1, "L");        // allowed: arr becomes [K, L, B]
list.add("X");           // UnsupportedOperationException (size is fixed)
list.remove(0);          // UnsupportedOperationException
```

**Other traps:**

- `Arrays.asList(new int[]{1,2,3})` gives `List<int[]>` of **size 1** (primitive arrays are a single object). Use `Integer[]` or `IntStream.of(...).boxed().toList()`.
- Putting an incompatible element into the list view → `ArrayStoreException`.
- To get a real modifiable list: `new ArrayList<>(Arrays.asList(arr))`.
- Java 9+: `List.of(...)` is fully **immutable**, rejects `null`.

### Q27. What does `subList()` return? 🟢

A **view** of a range `[from, to)` of the original list, not a copy. Changes to the sublist (set, add, remove) **write through** to the parent. If you **structurally modify the parent** afterwards, using the sublist throws `ConcurrentModificationException`. Clearing a range quickly: `list.subList(2, 5).clear();`. Copy when needed: `new ArrayList<>(list.subList(2, 5))`.

### Q28. How do I make an `ArrayList` read-only? 🟢

```java
List<String> view = Collections.unmodifiableList(list);   // read-only VIEW; changes to `list` still show up
List<String> immutable = List.copyOf(list);               // Java 10+: true immutable snapshot
List<String> literal   = List.of("a", "b");               // Java 9+
view.add("x");     // UnsupportedOperationException
```

### Q29. Difference between Array and `ArrayList`? 🟢

| Aspect | Array | `ArrayList` |
|--------|-------|-------------|
| Size | Fixed | Dynamic |
| Primitives | Yes (`int[]`) | No (`Integer`) |
| Generics | Not supported (covariant, `ArrayStoreException` at runtime) | Fully supported (compile-time safety) |
| Length | `arr.length` (field) | `list.size()` (method) |
| Add | `arr[i] = x` | `list.add(x)` |
| Dimensions | Multi-dimensional | Single (use `List<List<T>>`) |

Which is faster? Raw arrays are faster for primitives; for objects the difference is negligible.

### Q30. Why does `ListIterator` have `add()` but `Iterator` does not? 🟢

A plain `Iterator` is a one-way cursor over *any* collection, including ones with no defined position (a `HashSet`), so "insert here" has no meaning. A `ListIterator` works on a **List**, keeps a cursor *between* elements and can move both ways, so inserting at the cursor is well defined and does not disturb the iteration.

### Q31. How do I convert between array and list? 🟢

```java
// List → array
String[] a = list.toArray(new String[0]);        // preferred form (JDK optimizes new String[0])
String[] b = list.toArray(String[]::new);        // Java 11+

// array → List
List<String> l1 = Arrays.asList(arr);            // fixed-size view
List<String> l2 = new ArrayList<>(Arrays.asList(arr));   // modifiable copy
List<String> l3 = List.of(arr);                  // immutable (Java 9+)
```

### Q32. How do `ArrayList.sort`, `Collections.sort` and `List.sort` relate? 🟢

All end up in the same **stable** merge-based **TimSort** for objects (worst case O(n log n), nearly O(n) for already-sorted data). `Collections.sort(list)` just calls `list.sort(null)`. Stability means equal elements keep their original relative order, which is what makes multi-key sorting by successive sorts work. (Primitive arrays use dual-pivot quicksort in `Arrays.sort`.)

* * *
## 3. Iterators, Fail-Fast and Fail-Safe

### Q33. What are the three cursors in Java? Compare them. ⭐

A **cursor** is an object used to get elements one by one from a collection.

| Property | `Enumeration` | `Iterator` | `ListIterator` |
|----------|---------------|------------|----------------|
| Applicable to | **Legacy** classes only (`Vector`, `Stack`, `Hashtable`) | **Any** `Collection` (universal) | **Only `List`** implementations |
| Direction | Forward only | Forward only | **Both** directions |
| Operations | Read only | Read + **remove** | Read + remove + **add** + **set (replace)** |
| How to get | `elements()` / `keys()` | `iterator()` | `listIterator()` |
| Methods | `hasMoreElements()`, `nextElement()` | `hasNext()`, `next()`, `remove()` | `hasNext`, `next`, `nextIndex`, `hasPrevious`, `previous`, `previousIndex`, `remove`, `set`, `add` (9 total) |
| Since | 1.0 (legacy) | 1.2 | 1.2 |
| Fail-fast? | No | **Yes** (for non-concurrent collections) | Yes |

```java
List<String> l = new LinkedList<>(List.of("Baala", "Venki", "Chiru", "Naag"));
ListIterator<String> it = l.listIterator();
while (it.hasNext()) {
    String s = it.next();
    if (s.equals("Venki")) it.remove();
    if (s.equals("Chiru")) it.add("Charan");     // inserted right after Chiru
    if (s.equals("Naag"))  it.set("Naag-2");     // replaces the last returned element
}
// [Baala, Chiru, Charan, Naag-2]
```

Internally these are inner classes, e.g. `java.util.Vector$Itr`, `Vector$ListItr`, and an anonymous class for `elements()`.

> **Interview one-liner:** Enumeration (legacy, read-only) → Iterator (universal, + remove) → ListIterator (lists only, bidirectional, + add/set).

### Q34. What is the difference between `Iterator` and `Enumeration`? 🟢

`Iterator` adds `remove()`, has shorter method names (`hasNext`/`next` vs `hasMoreElements`/`nextElement`), works on every collection and is **fail-fast**. `Enumeration` is legacy, read-only, works only with legacy classes and is not fail-fast, so Iterator is the safer choice.

### Q35. What is the difference between `Iterator` and `ListIterator`? 🟢

`Iterator`: forward only, any collection, can only `remove`. `ListIterator`: lists only, forward **and** backward (`hasPrevious`, `previous`), index aware (`nextIndex`), can `add` and `set` while iterating.

### Q36. What are fail-fast iterators? How are they implemented? ⭐

**What?** An iterator that **detects structural modification of the collection during iteration** (not made through the iterator itself) and immediately throws `ConcurrentModificationException` (CME) instead of returning unpredictable results.

**How (inside `ArrayList`):**

```java
protected transient int modCount = 0;     // in AbstractList: counts STRUCTURAL changes

private class Itr implements Iterator<E> {
    int cursor;                           // index of next element
    int lastRet = -1;                     // index of last returned element
    int expectedModCount = modCount;      // snapshot taken when the iterator is created

    public boolean hasNext() { return cursor != size; }

    public E next() {
        checkForComodification();         // if (modCount != expectedModCount) throw new CME
        ...
    }
    public void remove() {
        ...
        ArrayList.this.remove(lastRet);
        expectedModCount = modCount;      // iterator re-syncs itself - that's why it.remove() is safe
    }
}
```

- `add`, `remove`, `clear`, (`sort`) increment `modCount`. That is a **structural modification**.
- `list.set(i, x)` on an ArrayList and `map.put(existingKey, newValue)` on a HashMap are **not** structural (size/shape unchanged) → no CME.
- The check happens in `next()` (and `remove()`), **not** in `hasNext()`, which explains the "second-last element" quirk from Q23.

**Pitfall:** fail-fast is **best effort**, not a guarantee. The JDK says never write correctness logic that depends on catching CME. It is a *bug detector*.

**Examples:** iterators of `ArrayList`, `LinkedList`, `Vector`, `HashMap`, `HashSet`, `TreeMap`, `LinkedHashMap`, `Collections.synchronizedXxx` views.

### Q37. What are fail-safe (weakly consistent) iterators? ⭐

**What?** Iterators that **do not throw CME** when the collection is modified during iteration. "Fail-safe" is the informal name; the official term in the Javadoc is **weakly consistent**.

There are two flavours:

| Flavour | How it works | Sees later modifications? | Example |
|---------|--------------|---------------------------|---------|
| **Snapshot** | Iterates over a **copy** of the array taken at iterator creation | **Never** | `CopyOnWriteArrayList`, `CopyOnWriteArraySet` |
| **Weakly consistent** | Iterates over the **live** structure without locking the whole thing | **Maybe** (may or may not reflect changes after creation, never duplicates/skips an element it already passed) | `ConcurrentHashMap`, `ConcurrentLinkedQueue`, `ConcurrentSkipListMap` |

```java
CopyOnWriteArrayList<String> l = new CopyOnWriteArrayList<>(List.of("A", "B", "C"));
Iterator<String> it = l.iterator();     // snapshot of [A, B, C]
l.add("D");
while (it.hasNext()) System.out.println(it.next());   // A B C  (D not visible, no exception)
```

**Limitations of snapshot iterators:** `it.remove()` throws `UnsupportedOperationException` (it works on a copy), and each write costs O(n) memory/time.

> **Pitfall:** the PDF and several blogs say *"every fail-safe iterator works on a cloned copy"*. That is true only for the **CopyOnWrite** classes. `ConcurrentHashMap` does **not** copy, so its iterator may show a concurrent update.

### Q38. Fail-fast vs fail-safe: compare. ⭐

| Property | Fail-fast | Fail-safe / weakly consistent |
|----------|-----------|-------------------------------|
| Throws CME on concurrent modification | **Yes** | **No** |
| Works on | Original collection | Snapshot copy, or live concurrent structure |
| Extra memory | No | Snapshot types: yes |
| Sees updates after iterator creation | N/A (throws) | Snapshot: no; weakly consistent: possibly |
| `iterator.remove()` | Supported | Often **unsupported** (COW) |
| Examples | `ArrayList`, `HashMap`, `HashSet`, `Vector` | `CopyOnWriteArrayList`, `ConcurrentHashMap` |

### Q39. When exactly does `ConcurrentModificationException` occur, and how do I avoid it? ⭐

It occurs when the collection's structure is changed **behind the iterator's back**: by the same thread inside a loop, or by another thread.

**Ways to avoid it:**

1. Use `iterator.remove()` / `removeIf(...)`.
2. Collect items to remove in a separate list, then `removeAll(toRemove)` after the loop.
3. Iterate a **copy**: `for (T t : new ArrayList<>(list)) { list.remove(t); }`.
4. Use a concurrent collection (`CopyOnWriteArrayList`, `ConcurrentHashMap`).
5. For synchronized wrappers, lock manually around the whole iteration.
6. Streams: build a **new** collection with `filter(...).collect(...)`.

### Q40. How do I iterate a synchronized collection safely? 🟢

`Collections.synchronizedList/Map/Set` synchronize individual methods only. **Iteration is multiple calls**, so you must hold the wrapper's lock for the **whole loop**:

```java
List<String> sync = Collections.synchronizedList(new ArrayList<>());
synchronized (sync) {                 // lock on the wrapper object
    for (String s : sync) { ... }
}
```

Otherwise another thread can modify it between `hasNext()` and `next()` → CME. (Concurrent collections avoid this need.)

### Q41. What are the different ways to iterate a `Map`? 🟢

```java
Map<String, Integer> map = new HashMap<>();

for (Map.Entry<String, Integer> e : map.entrySet()) {        // BEST: one pass, no extra lookups
    String k = e.getKey(); Integer v = e.getValue();
}
for (String k : map.keySet()) { map.get(k); }                // extra get() per key - avoid if you need values
for (Integer v : map.values()) { ... }                       // values only
map.forEach((k, v) -> System.out.println(k + "=" + v));      // Java 8
Iterator<Map.Entry<String, Integer>> it = map.entrySet().iterator();   // needed to remove while iterating
map.entrySet().removeIf(e -> e.getValue() < 10);             // safe bulk removal
```

`keySet()`, `values()` and `entrySet()` are **live views**: changes to the map show in the view and removing from the view removes from the map. They do not support `add`.

* * *

## 4. Set: HashSet, LinkedHashSet, TreeSet, EnumSet

### Q42. What is a `Set`? How does it differ from a `List`? ⭐

A `Set` models a **mathematical set**: **no duplicates** and no index. It adds **no new methods** to `Collection`; it only tightens the contract of `add` (returns `false` if the element is already present, without error).

| Aspect | `List` | `Set` |
|--------|--------|-------|
| Duplicates | Allowed | **Not allowed** |
| Order | Insertion order kept | Usually none (`LinkedHashSet`: insertion, `TreeSet`: sorted) |
| Index access | Yes (`get(i)`) | **No** |
| `null` | Allowed | `HashSet`/`LinkedHashSet`: one `null`; `TreeSet`: not allowed (natural ordering) |
| Implementations | `ArrayList`, `LinkedList`, `Vector` | `HashSet`, `LinkedHashSet`, `TreeSet` |
| Use when | Order/duplicates matter | You need uniqueness / fast membership test |

Compare all three groups: **List** = ordered with duplicates, **Set** = unique, **Map** = key → value (does not extend `Collection`).

### Q43. How does `HashSet` work internally? How does it guarantee uniqueness? ⭐

**What?** `HashSet` is a thin wrapper around a **`HashMap`**. Your element is stored as the **key**; every key maps to the same dummy value object `PRESENT`.

```java
public class HashSet<E> {
    private transient HashMap<E, Object> map;
    private static final Object PRESENT = new Object();   // shared dummy value

    public HashSet() { map = new HashMap<>(); }

    public boolean add(E e) { return map.put(e, PRESENT) == null; }   // null → key was new → true
    public boolean remove(Object o) { return map.remove(o) == PRESENT; }
    public boolean contains(Object o) { return map.containsKey(o); }
}
```

**Why unique?** A `HashMap` cannot contain duplicate keys. `put` on an existing key returns the old value (`PRESENT`, not null), so `add` returns `false` and nothing changes. "Duplicate" is decided by **`hashCode()` then `equals()`** of your element.

**Facts:** default capacity 16, load factor 0.75, one `null` allowed (HashMap allows one null key), not thread-safe, O(1) average `add/remove/contains`, no order guarantee.

```java
HashSet<String> set = new HashSet<>();
set.add("Z");                   // true
System.out.println(set.add("Z"));  // false: duplicate, no exception
```

> **Interview one-liner:** HashSet = HashMap with the elements as keys and a constant dummy value, so uniqueness comes from the map's unique keys (hashCode + equals).

### Q44. What is the difference between `HashSet`, `LinkedHashSet` and `TreeSet`? ⭐

| Property | `HashSet` | `LinkedHashSet` | `TreeSet` |
|----------|-----------|-----------------|-----------|
| Underlying structure | Hash table (`HashMap`) | Hash table + **doubly linked list** (`LinkedHashMap`) | **Red-black tree** (`TreeMap`) |
| Iteration order | **None / unpredictable** | **Insertion order** | **Sorted** (natural or `Comparator`) |
| `add/remove/contains` | **O(1)** average | **O(1)** average (slightly slower than HashSet) | **O(log n)** |
| `null` element | One allowed | One allowed | **Not allowed** with natural ordering (NPE) |
| Heterogeneous elements | Allowed | Allowed | **Not allowed** (needs mutual comparability, else `ClassCastException`) |
| Duplicate check uses | `hashCode()` + `equals()` | `hashCode()` + `equals()` | **`compareTo()` / `compare()`** (returns 0 → duplicate) |
| Extra methods | – | – | `first`, `last`, `floor`, `ceiling`, `higher`, `lower`, `headSet`, `tailSet`, `subSet`, `descendingSet`, `pollFirst`, `pollLast` |
| Since | 1.2 | **1.4** | 1.2 |
| Best for | Fast lookup, uniqueness | Uniqueness **+ predictable order** (caches, history) | **Sorted** unique data, range queries |

```java
Set<Integer> hs  = new HashSet<>(List.of(30, 10, 20));        // any order
Set<Integer> lhs = new LinkedHashSet<>(List.of(30, 10, 20));  // [30, 10, 20]
Set<Integer> ts  = new TreeSet<>(List.of(30, 10, 20));        // [10, 20, 30]
```

### Q45. Can we add `null` to `HashSet` and `TreeSet`? 🟢

- **`HashSet` / `LinkedHashSet`:** yes, **one** `null` (hash of null is 0 → bucket 0).
- **`TreeSet`:** **No** (natural ordering): `compareTo` on `null` throws `NullPointerException`. In Java 7+ even adding `null` to an **empty** `TreeSet` throws NPE (the PDF says the first `null` is allowed; that was true up to Java 6). With a custom `Comparator` that handles nulls (`Comparator.nullsFirst(...)`) a `null` is allowed.

### Q46. How does `TreeSet` work internally? ⭐

`TreeSet` is backed by a `TreeMap` (elements are keys, dummy value). The `TreeMap` is a **red-black tree**, a self-balancing binary search tree, so the height stays ≤ 2·log₂(n+1).

```
 Insert 10, 20, 30, 5 into a TreeSet (after rebalancing: root black, no two reds in a row)
            20 (B)
           /      \
       10 (B)     30 (B)
        /
      5 (R)
```

- On every `add`, Java walks down comparing with `compareTo()`/`compare()`: negative → go left, positive → go right, **0 → treat as duplicate and stop**.
- Insert/delete may **rotate** and **recolour** nodes to keep balance → guaranteed **O(log n)**.
- Elements must be **mutually comparable** (implement `Comparable`) **or** you supply a `Comparator`; otherwise `ClassCastException`:

```java
TreeSet<StringBuffer> t = new TreeSet<>();
t.add(new StringBuffer("A"));   // ClassCastException: StringBuffer is not Comparable
```

All wrappers and `String` are already `Comparable`; `StringBuffer`/`StringBuilder` (before Java 11) are not.

### Q47. What are `SortedSet` and `NavigableSet`? What are their methods? ⭐

`SortedSet` (1.2) keeps elements in sorted order: `first()`, `last()`, `headSet(to)` (elements `< to`), `tailSet(from)` (`>= from`), `subSet(from, to)` (`from ≤ x < to`), `comparator()` (null for natural order).

`NavigableSet` (1.6) adds **closest-match navigation**:

| Method | Returns |
|--------|---------|
| `floor(e)` | greatest element **≤ e** |
| `lower(e)` | greatest element **< e** |
| `ceiling(e)` | least element **≥ e** |
| `higher(e)` | least element **> e** |
| `pollFirst()` / `pollLast()` | remove and return first / last |
| `descendingSet()` / `descendingIterator()` | reverse view |

```java
TreeSet<Integer> t = new TreeSet<>(List.of(1000, 2000, 3000, 4000, 5000));
t.ceiling(2000);   // 2000   (≥)
t.higher(2000);    // 3000   (>)
t.floor(3000);     // 3000   (≤)
t.lower(3000);     // 2000   (<)
t.pollFirst();     // 1000  (removed)
t.descendingSet(); // [5000, 4000, 3000, 2000]
```

`NavigableMap` (TreeMap) offers the same with `Key` suffix: `floorKey`, `lowerKey`, `ceilingKey`, `higherKey`, `floorEntry`, `pollFirstEntry`, `descendingMap`, `headMap`, `tailMap`, `subMap`.

> **Use case:** "find the nearest value", "which time slot/price tier does X fall in", "predecessor/successor" in O(log n).

### Q48. What is the contract between `equals()` and `hashCode()`? Why override both? ⭐

**Contract:**

1. If `a.equals(b)` is `true`, then `a.hashCode() == b.hashCode()` **must** hold.
2. If hash codes are equal, objects **may or may not** be equal (collisions are allowed).
3. `hashCode()` must return the same value while the fields used in `equals` do not change.
4. `equals` must be reflexive, symmetric, transitive, consistent, and `x.equals(null)` is `false`.

**Why both?** A hash collection finds an element in two steps: **(1) `hashCode()` → bucket, (2) `equals()` → the right element inside the bucket.** If you override only `equals`, two "equal" objects get different default (identity-based) hash codes, land in different buckets and the collection never compares them.

```java
class Student {
    int id; String name;
    Student(int id, String name) { this.id = id; this.name = name; }
}
Student s1 = new Student(1, "Alex"), s2 = new Student(1, "Alex");
Set<Student> set = new HashSet<>();
set.add(s1); set.add(s2);
System.out.println(set.size());          // 2  ← "duplicate" is stored twice!
System.out.println(s1.equals(s2));       // false (identity equality)
```

**Correct version:**

```java
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Student)) return false;
    Student other = (Student) o;
    return id == other.id && Objects.equals(name, other.name);
}
@Override public int hashCode() { return Objects.hash(id, name); }
// Java 16+: record Student(int id, String name) {}   → generates both correctly
```

**Missing `hashCode` consequences:** `HashSet` shows duplicates, `HashMap.get(new Key(...))` returns `null`, `contains` fails.

**Missing `equals` but proper hashCode:** objects reach the right bucket but are never found equal, so you get duplicates again.

### Q49. What do I need to do to use a custom object as a key in a `HashMap`/`HashSet`/`TreeMap`? ⭐

- **Hash-based** (`HashMap`, `HashSet`, `LinkedHash*`, `ConcurrentHashMap`): override **`equals()` and `hashCode()`** following the contract, and make the key **immutable** (or at least do not change fields used in `hashCode` after insertion).
- **Sorted** (`TreeMap`, `TreeSet`): implement `Comparable` or pass a `Comparator`, and keep `compareTo` **consistent with `equals`**, otherwise the collection violates its own contract (e.g. a `Set` appears to hold "duplicates", or `TreeSet` drops an element that `equals` says is different).

```java
// compareTo inconsistent with equals:
BigDecimal a = new BigDecimal("1.0"), b = new BigDecimal("1.00");
a.equals(b);        // false  (different scale)
a.compareTo(b);     // 0      (numerically equal)
new HashSet<>(List.of(a, b)).size();   // 2
new TreeSet<>(List.of(a, b)).size();   // 1  ← TreeSet only uses compareTo
```

### Q50. What is `EnumSet`? 🟢

A specialised `Set` for **enum constants only**. It is an abstract class; you create it through factory methods (`of`, `noneOf`, `allOf`, `range`, `complementOf`). Internally it is a **bit vector** (`RegularEnumSet` uses one `long` for enums with ≤ 64 constants, `JumboEnumSet` for more), so operations are extremely fast and memory-light.

- Iterates in **declaration (ordinal) order**; no `null`; type-safe (all elements from one enum); weakly-consistent iterator (no CME); not thread-safe.

```java
enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }
EnumSet<Day> weekend = EnumSet.of(Day.SAT, Day.SUN);
EnumSet<Day> weekdays = EnumSet.complementOf(weekend);
EnumSet<Day> midWeek = EnumSet.range(Day.TUE, Day.THU);
```

### Q51. What is `EnumMap`? 🟢

A `Map` whose keys are **enum constants of one enum type**, implemented with an **array indexed by `ordinal()`**: faster and smaller than `HashMap`. Iteration follows the enum's declaration order; `null` keys are not allowed (`null` values are); not thread-safe.

```java
EnumMap<Priority, String> sla = new EnumMap<>(Priority.class);
sla.put(Priority.LOW, "24h"); sla.put(Priority.HIGH, "1h");
```

### Q52. What is the difference between `HashSet` and `HashMap`? 🟢

| `HashSet` | `HashMap` |
|-----------|-----------|
| Implements `Set` | Implements `Map` |
| Stores **elements** | Stores **key → value** pairs |
| No duplicates | Duplicate **keys** no, duplicate **values** yes |
| `add(e)` | `put(k, v)` |
| One `null` element | One `null` key + many `null` values |
| Built **on top of** a `HashMap` | Built on an array of buckets |

* * *

## 5. Map and HashMap Internals

### Q53. What is a `Map`? What are its main implementations? ⭐

A `Map` stores **key → value** pairs (each pair is an **entry**, `Map.Entry`). Keys are **unique**; values may repeat; each key maps to at most one value. It is **not** a `Collection`.

| Implementation | Structure | Order | `null` key / values | Thread-safe | Complexity |
|----------------|-----------|-------|---------------------|-------------|------------|
| `HashMap` | Hash table | None | 1 null key, many null values | No | O(1) avg |
| `LinkedHashMap` | Hash table + doubly linked list | **Insertion** (or **access** order) | same as HashMap | No | O(1) |
| `TreeMap` | Red-black tree | **Sorted by key** | **No null key** (natural ordering), null values OK | No | O(log n) |
| `Hashtable` | Hash table | None | **No nulls** | Yes (all methods synchronized) | O(1) |
| `ConcurrentHashMap` | Hash table with CAS + per-bin locks | None | **No nulls** | Yes (scalable) | O(1) |
| `ConcurrentSkipListMap` | Skip list | Sorted | No nulls | Yes | O(log n) |
| `IdentityHashMap` | Hash table using `==` | None | Allowed | No | O(1) |
| `WeakHashMap` | Hash table with weak keys | None | Allowed | No | O(1) |
| `EnumMap` | Array by ordinal | Enum order | No null key | No | O(1) |
| `Properties` | `Hashtable<Object,Object>` of Strings | None | No | Yes | O(1) |

### Q54. How does `HashMap` work internally? (the classic question) ⭐

**What?** `HashMap` stores entries in an **array of buckets** (`Node<K,V>[] table`). The **hash code of the key** decides which bucket an entry goes to. Entries that land in the same bucket form a **linked list** (and a **red-black tree** when the list gets long, Java 8+).

```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;     // spread hash of the key (cached)
    final K key;
    V value;
    Node<K,V> next;     // next node in the same bucket (collision chain)
}
transient Node<K,V>[] table;   // length is ALWAYS a power of 2 (16, 32, 64, ...)
transient int size;
int threshold;                  // = capacity * loadFactor  (16 * 0.75 = 12)
final float loadFactor;         // default 0.75
```

**Picture:**

```
table (capacity 16)
 [0] → null
 [1] → Node(k=17,v=A) → Node(k=33,v=B) → null      ← collision chain (same bucket)
 [2] → null
 [3] → Node(k=3,v=C)
 ...
 [15]→ null
```

**`put(key, value)` step by step:**

1. If `table` is null (first put) → `resize()` creates the 16-bucket table (threshold 12).
2. `h = key.hashCode()`; **spread** it: `hash = h ^ (h >>> 16)`.
3. Compute **bucket index**: `index = (n - 1) & hash`  (`n` = table length).
4. If `table[index]` is **empty** → create a new `Node` there. Done.
5. Else **collision**. Walk the bucket:
   - If a node has the **same hash** AND (**same reference `==`** OR **`key.equals(existingKey)`**) → it is the same key → **replace the value**, return the old value.
   - Otherwise append the new node at the **tail** of the list (Java 8; Java 7 inserted at the head).
   - If the list now holds **8 or more** nodes → try to **treeify** (only if `table.length ≥ 64`, else just resize).
6. After inserting a **new** key: `++modCount; if (++size > threshold) resize();`  → the table **doubles**.

**`get(key)` step by step:**

1. Compute `hash` and `index` exactly like `put`.
2. Look at the **first node** in the bucket: same hash and equal key → return its value.
3. Otherwise walk the chain (or search the tree) comparing hash and `equals`.
4. Not found → return `null`.

> **Two-step lookup to remember:** **hashCode() finds the bucket, equals() finds the entry in the bucket.**

> **Interview one-liner:** HashMap is an array of buckets indexed by `(n-1) & spread(hashCode)`; collisions form a linked list that becomes a red-black tree at 8+ nodes (Java 8+); the table doubles when size exceeds capacity × 0.75; average O(1) get/put.

### Q55. How is the bucket index calculated? Why `(n - 1) & hash` and why spread the hash? ⭐

```java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
int index = (n - 1) & hash;     // n = table.length, a power of 2
```

**Why `& (n-1)` instead of `% n`?** When `n` is a power of two, `hash % n == hash & (n-1)`, and the bit-AND is much cheaper than division/modulo. It also never gives a negative index.

**Why must `n` be a power of two?** Then `n - 1` is all 1-bits in the low positions (16 → `1111`, 32 → `11111`), so the AND keeps the **lowest log₂(n) bits** of the hash and uses every one of them.

**Why spread with `h ^ (h >>> 16)`?** Because only the **low bits** are used for the index, the **high 16 bits of the hashCode would be ignored** for small tables. XOR-ing the high half into the low half mixes them in, which reduces collisions for hash codes that differ only in the high bits.

**Numeric trace (n = 16):**

```
h        = 0x12345678
h >>> 16 = 0x00001234
hash     = 0x12345678 ^ 0x00001234 = 0x1234444C   (low 16 bits: 5678 ^ 1234 = 444C)

index (with spreading)    = 0x1234444C & 0xF = 0xC = 12
index (without spreading) = 0x12345678 & 0xF = 0x8 = 8
```

**Special case:** `null` key → `hash = 0` → bucket 0. (`Hashtable` and `ConcurrentHashMap` throw NPE for null keys.)

### Q56. Worked example: collisions and `equals()`. ⭐

`"Aa"` and `"BB"` are the famous strings with the **same hashCode**:

```
"Aa" = 'A'(65)*31 + 'a'(97) = 2015 + 97 = 2112
"BB" = 'B'(66)*31 + 'B'(66) = 2046 + 66 = 2112      ← collision!
```

```java
Map<String,Integer> m = new HashMap<>();
m.put("Aa", 1);    // hash 2112, 2112 >>> 16 = 0 → hash 2112; index = 2112 & 15 = 0
m.put("BB", 2);    // same bucket 0, equals("Aa") false → appended:  [0] → Aa=1 → BB=2
m.get("BB");       // bucket 0 → first node "Aa": hash same but equals false → next node "BB": equals true → 2
```

So a collision costs an extra `equals()` per node walked. With a **good `hashCode`** chains stay very short (almost always 0 or 1 node), keeping lookup O(1).

### Q57. What is the load factor and why is it 0.75? What is the threshold? ⭐

- **Capacity** = number of buckets (default **16**).
- **Load factor** = how full the table may get before it grows (default **0.75**).
- **Threshold** = `capacity × loadFactor` = 16 × 0.75 = **12**. When `size > threshold` the map **resizes** (doubles).

**Trade-off:**

| Load factor | Effect |
|-------------|--------|
| **Lower** (0.5) | Fewer collisions, faster lookups, **more memory**, more frequent resizes |
| **Higher** (1.0) | Less memory, **more collisions**, slower get/put |
| **0.75** | Good compromise between time and space (chain lengths follow a Poisson distribution; the chance of a bucket reaching 8 nodes is about 6 in 100 million) |

```
Default map:   capacity 16, threshold 12
 add 12 entries → no resize
 add 13th       → size 13 > 12 → resize to 32, threshold 24
 add 25th       → resize to 64, threshold 48
```

### Q58. What is rehashing / resizing? How does it work internally? ⭐

When `size > threshold`, `resize()` **doubles the capacity** (16 → 32 → 64 …) and moves the nodes into the new table. (The PDF/blogs call the whole thing "rehashing"; in Java 8 the hash codes are **not recomputed**, because each node caches its `hash`.)

**Java 8 trick:** because capacity doubles, each node either **stays at the same index** or moves to `oldIndex + oldCapacity`. The deciding bit is `(hash & oldCapacity)`:

- `0` → stays at the same index (**low list**)
- `≠ 0` → moves to `index + oldCapacity` (**high list**)

**Numeric trace** (`Integer` keys: `hashCode = value`, so `hash = value`; oldCap = 16 → newCap = 32):

```
Keys 5, 21, 37 all collide in the 16-table:   5&15 = 5,   21&15 = 5,   37&15 = 5
Bucket 5:  5 → 21 → 37

Resize to 32. Test bit 16 (hash & oldCap):
  5  = 00101   & 10000 = 0   → low list  → stays at index 5
  21 = 10101   & 10000 = 16  → high list → index 5 + 16 = 21      (21 & 31 = 21 ✓)
  37 = 100101  & 010000 = 0  → low list  → stays at index 5       (37 & 31 = 5 ✓)

New table:   [5] → 5 → 37        [21] → 21
```

Relative order inside each bucket is **preserved** (Java 7 reversed it, which caused the infinite-loop bug in Q66).

**Cost:** resizing is **O(n)**. Avoid repeated resizes by pre-sizing: `new HashMap<>((int) (expected / 0.75f) + 1)` (or `HashMap.newHashMap(expected)` in Java 19+).

**Constructor capacity rounding:** `new HashMap<>(100)` → table size = next power of two ≥ 100 = **128** (`tableSizeFor`).

### Q59. How does `HashMap` handle collisions? What changed in Java 8? ⭐

**What is a collision?** Two **different keys** map to the **same bucket index**.

| | Java 7 and earlier | **Java 8+** |
|---|--------------------|-------------|
| Structure per bucket | Linked list only | Linked list → **red-black tree** when long |
| New node inserted | At the **head** of the list | At the **tail** |
| Worst-case lookup | **O(n)** | **O(log n)** (if keys are `Comparable`) |
| Resize order | List order reversed | List order preserved |

**Treeification rules (Java 8+):**

| Constant | Value | Meaning |
|----------|-------|---------|
| `TREEIFY_THRESHOLD` | **8** | A bucket that already has 8 nodes and gets another → convert to a tree |
| `MIN_TREEIFY_CAPACITY` | **64** | If the table has fewer than 64 buckets, **resize instead** of treeifying (more buckets spreads the keys better) |
| `UNTREEIFY_THRESHOLD` | **6** | During a resize, a tree bin that shrinks to ≤ 6 nodes goes back to a linked list |

Inside a tree bin, nodes are ordered by hash; for equal hashes it uses `compareTo` when keys are the same `Comparable` class, otherwise a tie-breaker (identity hash) and may need to search both subtrees. That is why **keys that implement `Comparable` give the true O(log n)**.

> **Why it matters:** it protects against **hash-collision DoS attacks** (an attacker sends many keys with the same hash to degrade a map to O(n)).

### Q60. What happens when two keys have the same `hashCode()`? What if they are also `equals()`? 🟢

- Same hashCode, **not equal** → same bucket, **both stored** as separate nodes in the chain/tree.
- Same hashCode and **equal** → it is the **same key**: `put` **replaces the value** and returns the old one.
- Different hashCodes can **still** land in the same bucket (index = low bits only).

### Q61. What happens if you `put` a duplicate key? What does `put` return? 🟢

The old value is **replaced** and `put` **returns the previous value** (or `null` if the key was new or mapped to null). The key object stored in the map is **not** replaced. `size` does not change and `modCount` is not incremented (not a structural change).

```java
map.put("Chiru", 700);              // returns null
Integer old = map.put("Chiru", 1000);   // returns 700; map now has Chiru=1000
map.putIfAbsent("Chiru", 5);        // keeps 1000 (only inserts when key absent/mapped to null)
```

### Q62. Does `HashMap` allow `null` key and `null` values? 🟢

Yes: **one** `null` key (always bucket 0) and **any number** of `null` values. A caveat: `map.get(k) == null` is ambiguous (key absent or mapped to null), so use `containsKey(k)` or `getOrDefault`. `Hashtable`, `ConcurrentHashMap` and `TreeMap` (natural ordering, for keys) do not allow null keys.

### Q63. Why should `HashMap` keys be immutable? What happens if a key is mutated? ⭐

The bucket is chosen from the key's hash **at insertion time**. If you later change a field that `hashCode()` uses, the key's hash changes, but the node is still in the **old bucket**:

```java
List<Integer> key = new ArrayList<>(List.of(1, 2));
Map<List<Integer>, String> map = new HashMap<>();
map.put(key, "value");          // stored in bucket derived from hash of [1, 2]

key.add(3);                      // hashCode of the list changes!
map.get(key);                    // null  → looks in a different bucket (and equals fails anyway)
map.containsKey(key);            // false
map.size();                      // still 1 → the entry is unreachable but not removed (memory leak)
```

**Best keys:** `String`, `Integer`, `Long`, enums, `record`s, and your own immutable classes (`final` class, `final` fields). `String` is the ideal key because it is immutable and caches its hash code.

**Related interview twist (harp-lab list):** *"An `Employee` object is a key; after `put`, you call `emp.setMarriedStatus(true)` and `put` again; what happens?"*

- If `hashCode/equals` **include** that field → the hash changed → the second `put` is treated as a **new key** → **two entries** (the first is now unreachable by the mutated object).
- If `hashCode/equals` **ignore** that field → same key → value **replaced**.
- Either way the lesson: **do not mutate fields used in `hashCode()` while the object is a key.**

### Q64. What are the characteristics of a good `hashCode()`? 🟢

- **Consistent** (same object, same value while state unchanged) and **equal objects → equal hash**.
- **Well distributed** (spreads keys across buckets, avoids clustering).
- **Fast** to compute.
- Typical recipe: `31 * result + field.hashCode()` for each significant field, or simply `Objects.hash(f1, f2, ...)`. `String.hashCode() = s[0]*31^(n-1) + ... + s[n-1]` and is cached in the `String`.

A bad `hashCode` (e.g. `return 1;`) is *legal* but turns the map into a single bucket: O(n) lists (O(log n) trees in Java 8+ for comparable keys).

### Q65. What is the difference between `HashMap` and `Hashtable`? ⭐

| Aspect | `HashMap` | `Hashtable` |
|--------|-----------|-------------|
| Synchronization | **Not** synchronized | **All methods synchronized** |
| Thread safety | No | Yes (per call, whole-table lock) |
| `null` key / value | 1 null key, many null values | **No null key, no null value** (NPE) |
| Performance | **Faster** | Slower (lock contention) |
| Since | Java 1.2 | Java 1.0 (**legacy**) |
| Superclass | `AbstractMap` | `Dictionary` |
| Iteration | `Iterator` (**fail-fast**) | `Iterator` (fail-fast) **and** `Enumeration` (not fail-fast) |
| Default capacity | 16, doubles (power of 2) | **11**, `old*2 + 1` |
| Index calc | `(n-1) & spread(hash)` | `(hash & 0x7FFFFFFF) % n` |
| Make thread-safe | `Collections.synchronizedMap(map)` | Already, can't be unsynchronized |
| Modern replacement | `ConcurrentHashMap` for concurrency | `ConcurrentHashMap` |

> `Hashtable` locks the **whole table** on every call, so one thread blocks all others. Use `ConcurrentHashMap` instead of `Hashtable` in new code.

### Q66. Is `HashMap` thread-safe? What goes wrong with concurrent use? ⭐

**No.** Problems when several threads write without synchronization:

- **Lost updates / overwritten entries** (two threads `put` into the same empty bucket).
- **Wrong `size`**, missing entries after a resize.
- **Java 7:** a concurrent **resize** could create a **cycle in a bucket's linked list** (because the transfer reversed the list order) → `get()` loops forever, **100 % CPU** (the infamous HashMap infinite loop). Java 8 preserves order, which removes this particular cycle but the map is **still not safe**.
- `ConcurrentModificationException` while one thread iterates and another modifies.

**Fixes:** `ConcurrentHashMap` (best), `Collections.synchronizedMap` (coarse lock), `Hashtable` (legacy), or confine the map to one thread / make it immutable after building.

### Q67. What is `LinkedHashMap`? How does it keep order? What is access order? ⭐

`LinkedHashMap extends HashMap` and additionally maintains a **doubly linked list running through all entries**. Each entry has `before` and `after` pointers on top of the HashMap `next` pointer. Lookup is still O(1) via the hash table; iteration follows the linked list.

| Mode | Constructor | Iteration order |
|------|-------------|-----------------|
| **Insertion order** (default) | `new LinkedHashMap<>()` | Order in which keys were first inserted (re-inserting an existing key does **not** change order) |
| **Access order** | `new LinkedHashMap<>(16, 0.75f, true)` | **Least-recently accessed → most-recently accessed**: every `get`/`put` moves the entry to the end |

**It is the standard way to build an LRU cache.** `put` calls the hook `removeEldestEntry(eldest)`; return `true` to evict the head (least recently used):

```java
class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    LRUCache(int capacity) {
        super(capacity, 0.75f, true);          // true = access order
        this.capacity = capacity;
    }
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;              // evict when over capacity
    }
}
LRUCache<Integer,String> c = new LRUCache<>(3);
c.put(1,"A"); c.put(2,"B"); c.put(3,"C");
c.get(1);            // order now: 2, 3, 1
c.put(4,"D");        // size 4 > 3 → evict eldest (2) → {3=C, 1=A, 4=D}
```

Not thread-safe (wrap with `Collections.synchronizedMap`, or use a library such as Caffeine for production).

### Q68. What is `TreeMap`? How does it keep keys sorted? ⭐

`TreeMap` is a `NavigableMap` backed by a **red-black tree** (self-balancing BST). Keys are sorted by **natural ordering** (`Comparable`) or a **`Comparator`** passed to the constructor.

- `get`, `put`, `remove`, `containsKey` → **O(log n)** (rotations + recolouring keep height ≈ log n).
- Keys must be **mutually comparable** (else `ClassCastException`); a **`null` key throws NPE** with natural ordering (Java 7+; the PDF says first null is allowed, that is Java ≤ 6). Values may be `null`.
- Duplicate detection uses `compareTo`/`compare` (0 = same key), **not** `equals`.
- Extra API: `firstKey`, `lastKey`, `floorKey`, `ceilingKey`, `lowerKey`, `higherKey`, `headMap`, `tailMap`, `subMap`, `pollFirstEntry`, `descendingMap`.
- Not synchronized (`ConcurrentSkipListMap` is the concurrent sorted map).

```java
TreeMap<String,String> t = new TreeMap<>();
t.put("b","Banana"); t.put("c","Cat"); t.put("a","Apple"); t.put("d","Dog"); t.put("g","Gun");
t.ceilingKey("c");     // c      (≥)
t.higherKey("e");      // g      (>)
t.floorKey("e");       // d      (≤)
t.lowerKey("e");       // d      (<)
t.pollFirstEntry();    // a=Apple (removed)
t.descendingMap();     // {g=Gun, d=Dog, c=Cat, b=Banana}
```

### Q69. `HashMap` vs `LinkedHashMap` vs `TreeMap`: compare. ⭐

| Aspect | `HashMap` | `LinkedHashMap` | `TreeMap` |
|--------|-----------|-----------------|-----------|
| Structure | Hash table | Hash table + linked list | Red-black tree |
| Ordering | None | Insertion / access | **Sorted by key** |
| get / put | **O(1)** | O(1) | **O(log n)** |
| Null key | 1 | 1 | **No** |
| Key comparison | `hashCode` + `equals` | `hashCode` + `equals` | `compareTo` / `Comparator` |
| Memory | Lowest | + 2 refs per entry | + tree node overhead (parent, left, right, colour) |
| Extra API | – | `removeEldestEntry`, access order | Navigation (`floorKey`, `headMap`, ...) |
| Use for | General lookups | Caches, predictable iteration | Sorted data, range queries, leaderboards |

### Q70. What is the difference between `HashMap` and `TreeMap` keys regarding heterogeneity? 🟢

`HashMap` accepts keys of any mix of types (as long as `hashCode`/`equals` work). `TreeMap` needs keys that can be **compared with each other** (same type or a common `Comparator`), otherwise `ClassCastException` at runtime.

### Q71. What is `IdentityHashMap`? 🟢

Same as `HashMap` except it compares keys with **`==` (reference equality)** and uses `System.identityHashCode` instead of `equals`/`hashCode`.

```java
String k1 = new String("key"), k2 = new String("key");     // two distinct objects, equal content

HashMap<String,String> hm = new HashMap<>();
hm.put(k1, "Pawan"); hm.put(k2, "Kalyan");
System.out.println(hm);       // {key=Kalyan}                 → equals() says same key, value replaced

IdentityHashMap<String,String> im = new IdentityHashMap<>();
im.put(k1, "Pawan"); im.put(k2, "Kalyan");
System.out.println(im);       // {key=Pawan, key=Kalyan}      → == says different keys, both kept
```

**Use:** object-graph algorithms (serialization, deep copy, "visited" sets by identity), proxies, debugging frameworks.

### Q72. What is `WeakHashMap`? When is it used? 🟢

A `HashMap` whose **keys are held by weak references**. If a key object has **no strong references elsewhere**, the garbage collector may collect it and the entry **disappears automatically**. In a normal `HashMap` the map's strong reference keeps the key alive forever (a classic memory leak).

```java
Map<Temp,String> m = new WeakHashMap<>();
Temp t = new Temp(); m.put(t, "Durga");
t = null; System.gc();       // entry is eligible for removal → eventually m is {}
```

**Use:** metadata caches attached to objects whose lifetime you do not control. **Caveat:** never use `String` literals or interned/cached values (e.g. small `Integer`s) as keys, since they are never collected; GC timing is unpredictable.

### Q73. What is `Properties`? 🟢

`Properties extends Hashtable<Object,Object>` but is meant for **String → String** pairs, typically **configuration files** (DB URL, user, password) so config changes need only a file edit, not a recompile/redeploy.

```java
Properties p = new Properties();
try (FileInputStream in = new FileInputStream("db.properties")) { p.load(in); }
String url = p.getProperty("url");
String port = p.getProperty("port", "5432");       // default value
p.setProperty("user", "scott");
try (FileOutputStream out = new FileOutputStream("db.properties")) { p.store(out, "updated"); }
```

(In Spring Boot, use `application.properties`/`application.yml` and `@Value`/`@ConfigurationProperties`.)

### Q74. What is `Dictionary`? 🟢

An **abstract legacy class** (Java 1.0) representing key → value mappings; superseded by the `Map` interface. `Hashtable` extends it. Null keys and values are not allowed. Do not use in new code.

### Q75. What are the useful `Map` methods added in Java 8? ⭐

```java
map.getOrDefault("x", 0);                          // no null check needed
map.putIfAbsent("k", v);                           // insert only if key absent (or null value)
map.computeIfAbsent("k", k -> new ArrayList<>())   // create value lazily - THE grouping idiom
   .add(item);
map.computeIfPresent("k", (k, v) -> v + 1);        // update only if present
map.compute("k", (k, v) -> v == null ? 1 : v + 1); // insert/update/remove (return null removes)
map.merge("word", 1, Integer::sum);                // frequency counter in one line
map.replaceAll((k, v) -> v * 2);
map.forEach((k, v) -> ...);
map.entrySet().removeIf(e -> e.getValue() == 0);
```

```java
Map<String,Integer> freq = new HashMap<>();
for (String w : words) freq.merge(w, 1, Integer::sum);       // count words
Map<Integer,List<String>> byLen = new HashMap<>();
for (String w : words) byLen.computeIfAbsent(w.length(), k -> new ArrayList<>()).add(w);
```

**Pitfall:** in `HashMap` (Java 9+), a mapping function passed to `computeIfAbsent`/`compute`/`merge` **must not modify the map**, or you get `ConcurrentModificationException`. This breaks naive recursive memoization such as Fibonacci with `memo.computeIfAbsent(n, k -> fib(k-1) + fib(k-2))`.

### Q76. What are the three collection views of a `Map`? 🟢

`keySet()` → `Set<K>`, `values()` → `Collection<V>` (may contain duplicates), `entrySet()` → `Set<Map.Entry<K,V>>`. They are **live views** backed by the map: removing from a view removes from the map; adding is **not** supported (`UnsupportedOperationException`). `Map.Entry` has `getKey()`, `getValue()`, `setValue()` (writes through to the map when the entry comes from `entrySet()`).

```java
for (Map.Entry<String,Integer> e : map.entrySet()) {
    if (e.getKey().equals("Nag")) e.setValue(10000);   // updates the map itself
}
```

### Q77. What is the difference between `containsKey()`, `keySet()` and `values()`? 🟢

`containsKey(k)` → boolean, O(1) in HashMap (checks key presence). `containsValue(v)` → O(n) scan. `keySet()` → live `Set` of keys. `values()` → live `Collection` of values. Common mistake: `map.keySet().contains(k)` works but `containsKey` is the direct way.

### Q78. How do I sort a `Map` by value? ⭐

A `Map` has no value ordering, so you sort its **entries** and collect into a `LinkedHashMap` (keeps that order).

```java
Map<String,Integer> sorted = map.entrySet().stream()
        .sorted(Map.Entry.<String,Integer>comparingByValue().reversed())   // highest value first
        .collect(Collectors.toMap(
                Map.Entry::getKey, Map.Entry::getValue,
                (a, b) -> a,                  // merge function (needed to choose LinkedHashMap)
                LinkedHashMap::new));
```

Sort by key: `new TreeMap<>(map)`. For top-N only, use a `PriorityQueue` (see scenarios).

### Q79. How do I convert `HashMap` to `ArrayList`? 🟢

```java
List<String>  keys   = new ArrayList<>(map.keySet());
List<Integer> values = new ArrayList<>(map.values());
List<Map.Entry<String,Integer>> entries = new ArrayList<>(map.entrySet());
```

### Q80. What are `ConcurrentHashMap` vs `HashMap` vs `Hashtable` vs `synchronizedMap`? ⭐

Short answer here; internals are in the [Concurrent Collections](#8-concurrent-collections) section.

| | `HashMap` | `Hashtable` | `Collections.synchronizedMap` | `ConcurrentHashMap` |
|---|-----------|-------------|-------------------------------|---------------------|
| Thread-safe | No | Yes | Yes | **Yes** |
| Locking | None | **Whole table** per call | **Whole map** per call | **CAS + lock on one bin** (reads lock-free) |
| Concurrent reads | – | One at a time | One at a time | **Many, no lock** |
| Concurrent writes | – | One at a time | One at a time | **Many** (different bins) |
| Null key/value | Both | Neither | Depends on wrapped map | **Neither** |
| Iterator | Fail-fast | Fail-fast | Fail-fast | **Weakly consistent (no CME)** |
| Compound atomic ops | No | No | No | Yes (`putIfAbsent`, `computeIfAbsent`, `merge`) |

* * *
## 6. Sorting: Comparable and Comparator

### Q81. What is `Comparable`? When is it used? ⭐

**What?** An interface in **`java.lang`** with one method, `int compareTo(T other)`. A class implements it to define its **natural (default) ordering**: *"this object compared to that one"*.

**Contract of `a.compareTo(b)`:**

| Return | Meaning |
|--------|---------|
| **negative** | `a` comes **before** `b` |
| **zero** | `a` and `b` are equal in ordering |
| **positive** | `a` comes **after** `b` |

**Why?** Sorted structures (`TreeSet`, `TreeMap`, `PriorityQueue`) and utilities (`Collections.sort(list)`, `Arrays.sort(arr)`, `binarySearch`) need a way to order elements. If you do not pass a `Comparator`, they call `compareTo`.

```java
class Employee implements Comparable<Employee> {
    String name; int eid;
    Employee(String name, int eid) { this.name = name; this.eid = eid; }

    @Override
    public int compareTo(Employee other) {
        return Integer.compare(this.eid, other.eid);     // natural order = ascending employee id
    }
    @Override public String toString() { return name + "-" + eid; }
}

List<Employee> list = new ArrayList<>(List.of(
        new Employee("Nag", 100), new Employee("Bala", 200),
        new Employee("Chiru", 50), new Employee("Venki", 150)));
Collections.sort(list);          // [Chiru-50, Nag-100, Venki-150, Bala-200]
```

All wrapper classes, `String`, `Date`, `LocalDate`, `BigDecimal`, enums (by ordinal) already implement `Comparable`. **`StringBuffer` / `StringBuilder` (before Java 11) do not**, so a `TreeSet<StringBuffer>` throws `ClassCastException`.

```java
"A".compareTo("Z");   // -25  (difference of chars)
"Z".compareTo("K");   //  15
"Z".compareTo("Z");   //   0
"Z".compareTo(null);  // NullPointerException
```

> **Interview one-liner:** `Comparable` = "I know how to compare *myself* to others", the one natural ordering defined **inside** the class.

### Q82. What is `Comparator`? When is it used? ⭐

**What?** A functional interface in **`java.util`** with the method `int compare(T o1, T o2)` (and an optional `equals`). It defines an **external, custom ordering** without touching the class.

**Why?**

- You want a **different order** than the natural one (e.g. by name instead of id).
- The class is **not `Comparable`** or you **cannot modify** it (third-party, `StringBuffer`).
- You need **multiple orderings** of the same class (by name, by salary, by joining date).

```java
// Classic anonymous/class style
class NameComparator implements Comparator<Employee> {
    public int compare(Employee a, Employee b) { return a.name.compareTo(b.name); }
}
Collections.sort(list, new NameComparator());

// Java 8 lambda / method references (preferred)
list.sort((a, b) -> a.name.compareTo(b.name));
list.sort(Comparator.comparing(e -> e.name));
list.sort(Comparator.comparing((Employee e) -> e.name).reversed());

// Where comparators plug in
TreeSet<Employee> ts = new TreeSet<>(Comparator.comparingInt(e -> e.eid));
PriorityQueue<Employee> pq = new PriorityQueue<>(Comparator.comparing(e -> e.name));
TreeMap<String,Integer> tm = new TreeMap<>(Comparator.reverseOrder());
```

### Q83. Comparable vs Comparator: what is the difference? ⭐

| Aspect | `Comparable` | `Comparator` |
|--------|--------------|--------------|
| Package | `java.lang` | `java.util` |
| Method | `compareTo(T o)` | `compare(T o1, T o2)` (+ optional `equals`) |
| Where the logic lives | **Inside** the class being sorted | In a **separate** class / lambda |
| Number of orderings | **One** (natural/default) | **Many** (one comparator each) |
| Modifies the class? | **Yes** (class must implement it) | **No** |
| Used by | `Collections.sort(list)`, `Arrays.sort(a)`, `TreeSet()`, `TreeMap()` with no comparator | `Collections.sort(list, cmp)`, `list.sort(cmp)`, `new TreeSet<>(cmp)` |
| Lambda friendly | No (a class implements it) | **Yes** (functional interface) |
| Typical implementors in the JDK | `String`, wrappers, `Date`, `BigDecimal` | `Collator`, `String.CASE_INSENSITIVE_ORDER`, `Comparator.*` helpers |

**Who decides?** The author of a class defines the **default natural sort order** via `Comparable`. A **user** of the class who wants something else supplies a `Comparator`.

```
Predefined Comparable class (String)      → natural order exists; use Comparator for another order
Predefined NON-Comparable class (StringBuffer) → no natural order; use Comparator
Your own class (Employee)                 → author: Comparable (DNSO);  user: Comparator for custom order
```

### Q84. What are the Java 8 `Comparator` helpers? How do I sort by multiple fields? ⭐

```java
Comparator<Employee> byDept   = Comparator.comparing(Employee::getDept);
Comparator<Employee> bySalary = Comparator.comparingDouble(Employee::getSalary);

// Multi-field: dept ascending, then salary DESC, then name ASC
list.sort(Comparator.comparing(Employee::getDept)
        .thenComparing(Employee::getSalary, Comparator.reverseOrder())
        .thenComparing(Employee::getName));

// Null handling
Comparator.comparing(Employee::getManager, Comparator.nullsFirst(Comparator.naturalOrder()));
Comparator.nullsLast(Comparator.naturalOrder());

// Reverse
Comparator.<Integer>naturalOrder().reversed();
Collections.reverseOrder();                 // reversed natural order
Collections.reverseOrder(someComparator);   // reversed custom order
```

Primitive-specialised `comparingInt/Long/Double` avoid boxing.

### Q85. What is the common bug with `compare()` returning `a - b`? ⭐

Subtraction **overflows** for large values, giving a wrong sign:

```java
int compare(int a, int b) { return a - b; }          // BUG
compare(Integer.MAX_VALUE, -1);                      // MAX_VALUE + 1 overflows → negative → wrong order!

// Correct
return Integer.compare(a, b);        // or Long.compare, Double.compare, a.compareTo(b)
```

Also keep the comparator **consistent** (sgn(compare(a,b)) == -sgn(compare(b,a)), transitive), otherwise `TimSort` may throw `IllegalArgumentException: Comparison method violates its general contract!`.

### Q86. What does the return value of `compare()` do inside a `TreeSet`? (PDF "trick" question) ⭐

`TreeSet` only trusts the sign of `compare(new, existing)`. Replace the body to see behaviour (insert `10, 0, 15, 5, 20, 20`):

| `compare` returns | Result | Why |
|-------------------|--------|-----|
| `a.compareTo(b)` (ascending) | `[0, 5, 10, 15, 20]` | Natural order |
| `-a.compareTo(b)` or `b.compareTo(a)` | `[20, 15, 10, 5, 0]` | Descending |
| always **`+1`** | `[10, 0, 15, 5, 20, 20]` | New element always "greater" → goes right → **insertion order**, duplicates kept (never 0) |
| always **`-1`** | `[20, 20, 5, 15, 0, 10]` | New element always "smaller" → goes left → **reverse insertion order** |
| always **`0`** | `[10]` | Every new element is "equal" to the first → treated as duplicate → **only the first is stored** |

Another PDF example: sort `String`s and `StringBuffer`s together by **length, then alphabetically** using `toString()` in one comparator. Allowed because a custom `Comparator` removes the "homogeneous + Comparable" restriction.

```java
Comparator<Object> byLenThenAlpha = (o1, o2) -> {
    String s1 = o1.toString(), s2 = o2.toString();
    int c = Integer.compare(s1.length(), s2.length());
    return c != 0 ? c : s1.compareTo(s2);
};
TreeSet<Object> t = new TreeSet<>(byLenThenAlpha);   // A, AA, XX, ABC, ABCE (duplicate "A" dropped)
```

### Q87. Why does `TreeSet` with a custom comparator drop elements I consider different? 🟢

Because `TreeSet`/`TreeMap` treat `compare(a, b) == 0` as **"same element"**. If you compare employees only by **name**, two different employees with the same name are "duplicates" and the second is silently ignored. Include a tie-breaker (e.g. id) in the comparator so that `0` really means "same".

### Q88. What does "consistent with equals" mean? 🟢

An ordering is consistent with equals when `a.compareTo(b) == 0` **if and only if** `a.equals(b)`. If not, sorted collections and hash collections disagree about duplicates (see `BigDecimal("1.0")` vs `"1.00"` in the Set section). Document it if you break the rule.

### Q89. Can I sort a `List` of non-`Comparable` objects? What exceptions can occur? 🟢

Pass a `Comparator`. Without one, `Collections.sort(list)` throws **`ClassCastException`** (element not `Comparable`, or mixed types such as `String` and `Integer`) and **`NullPointerException`** if the list contains `null` (use `nullsFirst/nullsLast`). `Collections.sort` requires a **modifiable** list (an immutable `List.of(...)` throws `UnsupportedOperationException`).

### Q90. Sort an array, a list and a map. Quick reference. 🟢

```java
int[] a = {10, 5, 20};            Arrays.sort(a);                       // primitives: natural order only
String[] s = {"A", "Z", "B"};     Arrays.sort(s);                       // natural
                                  Arrays.sort(s, Collections.reverseOrder());   // needs object array
List<Integer> l = ...;            Collections.sort(l);   l.sort(null);  l.sort(Comparator.reverseOrder());
Integer[] boxed = ...;            Arrays.sort(boxed, Comparator.reverseOrder());
// Descending int[]: IntStream.of(a).boxed().sorted(Comparator.reverseOrder()).mapToInt(Integer::intValue).toArray();
```

### Q91. What is the difference between `reverse()` and `reverseOrder()`? 🟢

- `Collections.reverse(list)` physically **reverses the current order** of the elements in the list (O(n)); it does **not** sort.
- `Collections.reverseOrder()` **returns a `Comparator`** that imposes the reverse of the natural ordering (or reverses a given comparator); use it to **sort** descending.

### Q92. How does `binarySearch` report "not found"? ⭐

`Collections.binarySearch(list, key)` / `Arrays.binarySearch(arr, key)` require the data to be **sorted by the same ordering** (pass the same `Comparator` that sorted it). Result:

- **found** → the index (0 … n-1)
- **not found** → `-(insertionPoint) - 1`, where *insertion point* is where the key would be inserted to keep order (so the result is always negative: `-(n+1) … -1`).

```java
// sorted list: [A, K, M, Z, a]   indexes 0..4
Collections.binarySearch(list, "Z");   // 3
Collections.binarySearch(list, "J");   // J would go at index 1 → -(1) - 1 = -2

// sorted with reverse comparator: [20, 15, 10, 5, 0]
Collections.binarySearch(list, 10, cmp);   // 2
Collections.binarySearch(list, 13, cmp);   // insertion point 2 → -3
```

On an unsorted list the result is **unpredictable**. For a list of n elements, "found" is `0 … n-1`, "not found" is `-(n+1) … -1`.

* * *

## 7. Queue, Deque and PriorityQueue

### Q93. What is a `Queue`? What are its methods? ⭐

A `Queue` holds elements **prior to processing**, normally **FIFO** (first in, first out). Example: mail IDs are queued and mails are sent in the same order. `LinkedList`, `ArrayDeque`, `PriorityQueue` and the concurrent queues implement it.

Each operation comes in **two forms**, one that **throws** and one that returns a **special value**:

| Operation | Throws exception | Returns special value |
|-----------|------------------|-----------------------|
| **Insert** | `add(e)` | `offer(e)` (`false` if bounded and full) |
| **Remove head** | `remove()` (`NoSuchElementException` if empty) | `poll()` (`null` if empty) |
| **Examine head** | `element()` (`NoSuchElementException` if empty) | `peek()` (`null` if empty) |

`BlockingQueue` adds two more forms: **blocks** (`put`, `take`) and **times out** (`offer(e, t, unit)`, `poll(t, unit)`).

### Q94. What is the difference between `poll()`, `remove()` and `peek()`? 🟢

- `peek()` → returns the head **without removing**; `null` if empty.
- `poll()` → returns **and removes** the head; **`null`** if empty.
- `remove()` → returns **and removes** the head; throws **`NoSuchElementException`** if empty.
- `element()` → like `peek()` but throws on empty.

Rule: prefer `offer/poll/peek` unless you *want* an exception for an empty queue.

### Q95. What is `Deque`? Why is `ArrayDeque` preferred? ⭐

`Deque` ("deck") = **double-ended queue**: insert/remove at **both** ends. Used as a **queue** (FIFO) it gives `offer/poll`; used as a **stack** (LIFO) it gives `push/pop/peek`.

| End | Insert | Remove | Examine |
|-----|--------|--------|---------|
| First | `addFirst` / `offerFirst` / `push` | `removeFirst` / `pollFirst` / `pop` | `getFirst` / `peekFirst` |
| Last | `addLast` / `offerLast` | `removeLast` / `pollLast` | `getLast` / `peekLast` |

**`ArrayDeque`** = **resizable circular array**:

- O(1) at both ends, no node objects → **faster and lighter than `LinkedList`** and than the synchronized `Stack`.
- **Does not allow `null`** (because `poll()` returns null for "empty").
- Not thread-safe (`ConcurrentLinkedDeque`, `LinkedBlockingDeque` are).

```java
Deque<Integer> stack = new ArrayDeque<>();   stack.push(1); stack.push(2); stack.pop();   // 2  (LIFO)
Deque<Integer> queue = new ArrayDeque<>();   queue.offer(1); queue.offer(2); queue.poll(); // 1 (FIFO)
```

> **Use `ArrayDeque` for both stack and queue** needs (BFS queues, DFS stacks, sliding window, monotonic deque).

### Q96. How does `PriorityQueue` work internally? ⭐

**What?** An **unbounded** queue that always gives you the **smallest element first** (natural order or `Comparator`), not FIFO. Internally it is a **binary min-heap stored in an array**.

```
Heap (min-heap): parent ≤ children.  Array layout for index i:
   parent(i) = (i - 1) / 2       left(i) = 2i + 1       right(i) = 2i + 2

       1                   array: [1, 3, 8, 5]
      / \
     3   8
    /
   5
```

**`offer(e)`: append at the end, then sift UP** (swap with parent while smaller). **O(log n)**.

```
offer 5 → [5]
offer 3 → [5,3]  → 3 < parent 5 → swap → [3,5]
offer 8 → [3,5,8]
offer 1 → [3,5,8,1] → parent(3)=idx1 (5) > 1 → swap → [3,1,8,5] → parent idx0 (3) > 1 → swap → [1,3,8,5]
```

**`poll()`: take the root, move the last element to the root, then sift DOWN** (swap with the smaller child). **O(log n)**.

```
poll → returns 1. Last element 5 → root: [5,3,8] → smaller child is 3 < 5 → swap → [3,5,8]
```

| Operation | Cost |
|-----------|------|
| `peek()` | **O(1)** |
| `offer`, `poll`, `add`, `remove()` | **O(log n)** |
| `remove(Object)`, `contains` | **O(n)** |
| Build from a collection | O(n) (heapify) |

**Key facts / pitfalls:**

- Default initial capacity **11**; grows automatically.
- **No `null`** elements; elements must be **`Comparable`** or you pass a `Comparator` (else `ClassCastException`).
- **Duplicates ARE allowed** (the PDF's "duplicates not allowed" is wrong).
- **Iteration / `toString()` order is NOT sorted**: it is just the heap array order, e.g. after inserting 0..10 and `poll()` you may see `[1, 3, 2, 7, 4, 5, 6, 10, 8, 9]`. Only `poll()` gives sorted order.
- Elements with equal priority: **no FIFO guarantee** (not stable).
- **Not thread-safe** → `PriorityBlockingQueue`.
- **Max-heap:** `new PriorityQueue<>(Collections.reverseOrder())` or `(a, b) -> b - a` (careful with overflow; prefer `Integer.compare(b, a)`).

```java
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));   // by 2nd value
```

**Uses:** task scheduling, Dijkstra, merge K sorted lists, top-K problems, median of a stream (two heaps), event simulation.

### Q97. What is `BlockingQueue`? ⭐

A `Queue` in `java.util.concurrent` that is **thread-safe** and supports **blocking** operations, providing **flow control** in addition to storage:

- `take()` **blocks** while the queue is **empty**.
- `put(e)` **blocks** while a bounded queue is **full**.

This makes it the best fit for the **Producer-Consumer** pattern: no manual `wait/notify`, plus **back-pressure** from the bounded capacity. It also gives **happens-before** guarantees between `put` and `take`.

| Implementation | Details |
|----------------|---------|
| `ArrayBlockingQueue` | **Bounded**, array based, single lock, optional fairness |
| `LinkedBlockingQueue` | Linked nodes, optionally bounded (default `Integer.MAX_VALUE` → effectively unbounded), **separate put and take locks** → higher throughput |
| `PriorityBlockingQueue` | **Unbounded**, heap ordered; `put` never blocks, `take` blocks when empty |
| `SynchronousQueue` | **Capacity 0**: each `put` waits for a matching `take` (direct hand-off). Used by `newCachedThreadPool` |
| `DelayQueue` | Elements implement `Delayed`; `take` only returns an element whose delay has **expired** (schedulers, retry with delay) |
| `LinkedTransferQueue` | `transfer(e)` blocks until a consumer **receives** the element (guaranteed hand-off) |
| `LinkedBlockingDeque` | Blocking double-ended queue (`BlockingDeque`) |

```java
BlockingQueue<Integer> q = new ArrayBlockingQueue<>(5);
// producer thread:  q.put(item);     // blocks if full
// consumer thread:  int x = q.take();  // blocks if empty
```

Full producer-consumer code (BlockingQueue, wait/notify, Lock + Condition) is on the [Multithreading page](https://pkpunit.github.io/Software-Dev-Interview-Prep/core-java/multithreading/java-multithreading-concurrency).

### Q98. `BlockingQueue` vs `TransferQueue`? 🟢

With a `BlockingQueue`, `put` only waits for **space**; the producer does not wait for a consumer. A `TransferQueue` adds `transfer(e)`, where the producer **blocks until a consumer actually receives** the element. Best for **message passing with delivery guarantee**.

### Q99. What is `BlockingDeque`? 🟢

A `Deque` with blocking operations at **both ends** (`putFirst/putLast`, `takeFirst/takeLast`), waiting for the deque to become non-empty (retrieval) or have space (insertion). Implementation: `LinkedBlockingDeque`. Used in **work-stealing** designs.

### Q100. What is the difference between `PriorityQueue` and `LinkedHashMap` / `TreeMap` for ordering? 🟢

`PriorityQueue` only guarantees the **head** is the smallest (cheap insert and remove-min, partial order). `TreeMap`/`TreeSet` keep **all** elements fully sorted and support range queries and ordered iteration (O(log n) each). Use a heap when you only repeatedly need the **min/max**.

### Q101. Which is better for a stack: `Stack`, `LinkedList` or `ArrayDeque`? 🟢

**`ArrayDeque`** (fast, no synchronization, no node overhead). `Stack` is legacy/synchronized; `LinkedList` works but uses more memory.

### Q102. What is `ConcurrentLinkedQueue`? 🟢

An **unbounded, non-blocking, thread-safe** FIFO queue using lock-free CAS (Michael–Scott algorithm). `poll()` returns `null` when empty (no blocking). Use when many threads share a queue and you do not need blocking semantics. Has a weakly-consistent iterator; `size()` is O(n).

### Q103. How would I use a `Queue` for BFS? 🟢

```java
Queue<Node> q = new ArrayDeque<>();
q.offer(root);
while (!q.isEmpty()) {
    Node cur = q.poll();
    visit(cur);
    for (Node nb : cur.neighbours) if (visited.add(nb)) q.offer(nb);   // Set.add returns false if seen
}
```

* * *

## 8. Concurrent Collections

### Q104. Why do we need concurrent collections? ⭐

Traditional collections (`ArrayList`, `HashMap`) are **not thread-safe**. The old thread-safe ones (`Vector`, `Hashtable`, `Collections.synchronizedXxx`) use **one lock for the whole collection**, so every operation, even a read, waits for that lock, which hurts scalability. They are also still fail-fast, so one thread iterating while another modifies throws CME.

**Concurrent collections (Java 5+, `java.util.concurrent`):**

1. **Always thread-safe.**
2. **Better performance** from smarter locking (CAS, per-bin locks, copy-on-write).
3. **Other threads may modify while one iterates**; iterators never throw CME (they are weakly consistent / snapshot).
4. Provide **atomic compound operations** (`putIfAbsent`, `computeIfAbsent`, `merge`, `replace(k, old, new)`).

Important ones: `ConcurrentHashMap`, `CopyOnWriteArrayList`, `CopyOnWriteArraySet`, `ConcurrentLinkedQueue/Deque`, `ConcurrentSkipListMap/Set`, the `BlockingQueue` family.

### Q105. How does `ConcurrentHashMap` work internally (Java 8+)? ⭐

**Structure:** the same idea as `HashMap`: a `Node<K,V>[] table`, buckets that are linked lists and become **red-black trees** (`TreeBin`) at 8+ nodes. The difference is **how it locks.**

**Writing (`put`):**

1. Compute `hash = spread(key.hashCode())` and the bin index `(n-1) & hash`.
2. If the table is not initialized → initialize it using **CAS** on `sizeCtl` (only one thread wins).
3. If the **bin is empty** → insert the new node with a single **CAS** (`casTabAt`): **no lock at all**.
4. If the bin is being resized (head node has hash `MOVED`) → this thread **helps** with the resize.
5. Otherwise **`synchronized (firstNodeOfBin)`** → walk the list/tree and insert or replace. Only that **one bin** is locked; writers to other bins proceed in parallel.
6. Update the element count with a striped counter (`baseCount` + `CounterCell[]`, same idea as `LongAdder`) to avoid contention, then possibly trigger a resize.

**Reading (`get`):** **no lock.** Node `val` and `next` are `volatile`, and the table slot is read with a volatile read, so readers see completed writes.

**Resize:** several threads can **cooperatively** move bins (each takes a stripe); moved bins are marked with a `ForwardingNode`, so readers are redirected to the new table.

```
Java 5-7:  Segment[16] ─ each Segment (ReentrantLock) owns a small hash table   → concurrency level = # segments
Java 8+ :  Node[] table ─ CAS for empty bin, synchronized on bin head for others → parallelism ≈ # of bins
```

**Behavioral facts:**

- **No `null` keys or values** (a `null` from `get` would be ambiguous: "absent" or "mapped to null"? and you cannot safely check with `containsKey` followed by `get` under concurrency).
- Iterators are **weakly consistent** (no CME).
- `size()` is an **estimate** under concurrent updates (use `mappingCount()` for a `long`).
- Compound operations: use the atomic ones, since `if (!map.containsKey(k)) map.put(k, v)` is **not atomic**.

```java
ConcurrentMap<String, LongAdder> hits = new ConcurrentHashMap<>();
hits.computeIfAbsent("home", k -> new LongAdder()).increment();   // atomic per key
map.merge("word", 1, Integer::sum);                               // atomic counter
map.putIfAbsent("k", v);                                          // atomic check-then-act
map.replace("k", oldVal, newVal);                                 // CAS-style replace
```

> The "default concurrency level 16" in the PDF describes the **Java 5-7** segment design; in Java 8+ the constructor argument is only a sizing hint.

> **Interview one-liner:** Java 8 ConcurrentHashMap = CAS for empty bins, `synchronized` on the head of a single bin for updates, lock-free volatile reads, cooperative resize, no nulls.

### Q106. What are the `ConcurrentMap` methods? 🟢

`ConcurrentMap` extends `Map` with atomic operations:

| Method | Behaviour |
|--------|-----------|
| `putIfAbsent(k, v)` | Insert only if key absent; returns the existing value otherwise |
| `remove(k, v)` | Remove only if `k` is currently mapped to `v` |
| `replace(k, oldV, newV)` | Replace only if currently mapped to `oldV` |
| `replace(k, v)` | Replace only if the key is present |

`put` always overwrites; `putIfAbsent` never does.

### Q107. `ConcurrentHashMap` vs `Hashtable` vs `synchronizedMap`: compare. ⭐

| Aspect | `ConcurrentHashMap` | `Collections.synchronizedMap` | `Hashtable` |
|--------|---------------------|-------------------------------|-------------|
| Locking | CAS + **per-bin** lock; **reads lock-free** | **Whole map** (one mutex) | **Whole table** |
| Concurrent threads | Many readers, many writers (different bins) | One at a time | One at a time |
| Iteration | Weakly consistent, **no CME** | Fail-fast; **manual sync** needed | Fail-fast |
| Nulls | Not allowed | Allowed (if wrapped map allows) | Not allowed |
| Atomic compound ops | **Yes** | No (lock yourself) | No |
| Since | 1.5 | 1.2 | 1.0 |

### Q108. When should I use `ConcurrentHashMap` instead of `HashMap`? ⭐

When **multiple threads** read/write the same map (caches, counters, registries, shared state). It gives thread safety **without** a single global lock, so it scales with cores. Use plain `HashMap` when a map is confined to one thread (it is simpler and a bit faster) or is **effectively immutable** after construction and safely published.

**Do not assume `ConcurrentHashMap` makes your *logic* atomic:** two separate calls (`get` then `put`) are still a race. Use `computeIfAbsent`, `merge` or `compute`, and keep the lambda **short and free of blocking calls or modifications of the same map**.

### Q109. Can we replace `Hashtable` with `ConcurrentHashMap`? 🟢

Yes, it is the recommended replacement, but watch for code that relied on `Hashtable` **locking the whole table** for compound operations. `if (ht.get(k) == null) ht.put(k, v)` is safe with an external `synchronized(ht)` but **not** with `ConcurrentHashMap`; use `putIfAbsent`. Also remove any `null` usage, since CHM throws NPE.

### Q110. What is `CopyOnWriteArrayList`? How does it work? ⭐

**What?** A thread-safe `ArrayList` variant: **every mutation (`add`, `set`, `remove`) creates a fresh copy of the underlying array**, modifies the copy, then swaps the volatile array reference.

```java
// simplified
private volatile Object[] array;
public boolean add(E e) {
    synchronized (lock) {                          // writers serialize
        Object[] old = array;
        Object[] copy = Arrays.copyOf(old, old.length + 1);
        copy[old.length] = e;
        array = copy;                              // atomic swap
        return true;
    }
}
public E get(int i) { return (E) array[i]; }       // no lock at all
```

- **Reads:** lock-free, O(1), never blocked by writers.
- **Writes:** O(n) time and memory (full copy), serialised by a lock.
- **Iterator:** a **snapshot** of the array at creation; never throws CME; **does not support `remove`/`set`/`add`** (`UnsupportedOperationException`).
- Allows duplicates, `null`, keeps insertion order, implements `RandomAccess`.
- Extra methods: `addIfAbsent(e)`, `addAllAbsent(c)`.

**Best for:** **read-mostly, write-rare** data shared across threads: **listener/observer lists**, configuration, routing tables. **Avoid** when writes are frequent or the list is large.

```java
CopyOnWriteArrayList<String> l = new CopyOnWriteArrayList<>();
l.add("A"); l.addIfAbsent("A");     // second call ignored → [A]
```

### Q111. `ArrayList` vs `CopyOnWriteArrayList` vs `Vector` vs `synchronizedList`? ⭐

| | `ArrayList` | `CopyOnWriteArrayList` | `Vector` | `synchronizedList` |
|---|-------------|------------------------|----------|--------------------|
| Thread-safe | No | **Yes** (copy per write) | Yes (lock per call) | Yes (lock per call) |
| Concurrent access | – | **Many readers, writes serialised** | One thread at a time | One thread at a time |
| Iterator | Fail-fast | **Snapshot, no CME** | Fail-fast | Fail-fast (manual lock) |
| `iterator.remove()` | Yes | **No (UOE)** | Yes | Yes |
| Write cost | O(1) amortized | **O(n)** | O(1) amortized | O(1) amortized |
| Since | 1.2 | 1.5 | 1.0 | 1.2 |

### Q112. What is `CopyOnWriteArraySet`? 🟢

A thread-safe `Set` implemented **on top of a `CopyOnWriteArrayList`** (uniqueness via `addIfAbsent`). Keeps insertion order, no duplicates, snapshot iterator (no CME, no `remove` via iterator), O(n) `add`/`contains`. Use only for **small, read-mostly** sets (e.g. listener sets). Compared to `Collections.synchronizedSet`: no manual locking for iteration but writes are expensive.

### Q113. What are `ConcurrentSkipListMap` / `ConcurrentSkipListSet`? 🟢

Thread-safe **sorted** map/set (implement `NavigableMap`/`NavigableSet`) based on a **skip list** (layers of linked lists giving O(log n) expected search). They are the **concurrent counterparts of `TreeMap`/`TreeSet`**, with lock-free (CAS) updates and weakly-consistent iterators. No nulls. Use for concurrent leaderboards / sorted registries.

### Q114. Compare the ways to make a collection thread-safe. ⭐

| Approach | Example | Pros | Cons |
|----------|---------|------|------|
| Legacy synchronized classes | `Vector`, `Hashtable` | Simple | Coarse lock, legacy |
| Synchronized wrappers | `Collections.synchronizedList(...)` | Wrap anything | Coarse lock, manual lock for iteration/compound ops |
| **Concurrent collections** | `ConcurrentHashMap`, `CopyOnWriteArrayList`, `BlockingQueue` | **Scalable**, atomic helpers | Slightly different semantics (weak iterators, no nulls) |
| **Immutability** | `List.of`, `Map.copyOf`, records | No sync needed at all | Cannot change |
| **Confinement** | Collection used by one thread (or `ThreadLocal`) | No sync | Cannot share |

* * *
## 9. Utility Classes, Immutable and Sequenced Collections

### Q115. What are the important methods of the `Collections` class? ⭐

| Category | Methods |
|----------|---------|
| Sorting / order | `sort(list)`, `sort(list, cmp)`, `reverse(list)`, `shuffle(list)`, `swap(list, i, j)`, `reverseOrder()`, `rotate(list, distance)` |
| Searching | `binarySearch(list, key[, cmp])`, `max(coll[, cmp])`, `min(coll[, cmp])`, `frequency(coll, o)`, `disjoint(c1, c2)` |
| Copy / fill | `copy(dest, src)`, `fill(list, o)`, `nCopies(n, o)`, `addAll(c, ...elements)` |
| **Synchronized wrappers** | `synchronizedList/Set/Map/Collection/SortedSet/SortedMap(...)` |
| **Unmodifiable views** | `unmodifiableList/Set/Map/Collection(...)` |
| Singleton / empty | `emptyList()`, `emptySet()`, `emptyMap()`, `singletonList(x)`, `singleton(x)`, `singletonMap(k, v)` (all immutable) |

```java
Collections.max(list);                       Collections.frequency(list, "A");
Collections.shuffle(list, new Random(42));   Collections.swap(list, 0, 1);
Collections.disjoint(a, b);                  // true if no common elements
```

### Q116. What are the important methods of the `Arrays` class? 🟢

`sort(a)`, `sort(a, cmp)` (objects only), `parallelSort`, `binarySearch`, `asList`, `copyOf(a, newLen)`, `copyOfRange`, `fill`, `equals`, `deepEquals`, `hashCode`, `toString`, `deepToString` (nested arrays), `stream(a)`, `setAll`. Rules for `Arrays.binarySearch` are identical to `Collections.binarySearch`: sorted input required, `-(insertionPoint) - 1` when not found.

```java
int[] a = {10, 5, 20, 11, 6};
Arrays.sort(a);                              // [5, 6, 10, 11, 20]
Arrays.binarySearch(a, 6);                   // 1
Arrays.binarySearch(a, 14);                  // insertion point 4 → -5
int[] copy = Arrays.copyOf(a, 8);            // pads with zeros
System.out.println(Arrays.toString(a));
```

### Q117. What is the difference between an unmodifiable view and an immutable collection? ⭐

| | `Collections.unmodifiableList(list)` | `List.copyOf(list)` / `List.of(...)` |
|---|--------------------------------------|--------------------------------------|
| What it is | **Read-only wrapper (view)** over the original | **Truly immutable** collection (own storage) |
| Original changes visible? | **Yes**: if someone modifies `list`, the view changes | No (copy) |
| Modifying via the wrapper | `UnsupportedOperationException` | `UnsupportedOperationException` |
| `null` elements | Whatever the backing list allows | **Rejected** (`NPE`) |

```java
List<String> base = new ArrayList<>(List.of("a", "b"));
List<String> view = Collections.unmodifiableList(base);
base.add("c");
System.out.println(view);        // [a, b, c]  ← view reflects the change!
List<String> snap = List.copyOf(base);   // frozen snapshot
```

For **defensive copies** in immutable classes use `List.copyOf` (a plain `unmodifiableList` of a list you keep a reference to is not really immutable).

### Q118. What are the Java 9+ factory methods `List.of`, `Set.of`, `Map.of`? What are the traps? ⭐

```java
List<String>  l = List.of("a", "b", "c");
Set<Integer>  s = Set.of(1, 2, 3);
Map<String,Integer> m  = Map.of("a", 1, "b", 2);                // up to 10 pairs
Map<String,Integer> m2 = Map.ofEntries(Map.entry("a", 1), Map.entry("b", 2));   // any size
```

- **Immutable**: `add/remove/set/put` → `UnsupportedOperationException`.
- **No `null`** elements/keys/values (NPE), and even `list.contains(null)` throws NPE.
- `Set.of(1, 1)` and `Map.of("a",1,"a",2)` throw **`IllegalArgumentException`** (duplicates).
- **Iteration order of `Set.of` / `Map.of` is unspecified and can vary between JVM runs** (randomized per JVM instance), so never depend on it.
- `Arrays.asList` ≠ `List.of`: the first is fixed-size but **writable (`set`)** and backed by the array; the second is fully immutable.
- `Stream.toList()` (Java 16) returns an unmodifiable list; `Collectors.toList()` makes no promise.

### Q119. What are Sequenced Collections (Java 21)? 🟢

**Problem:** getting the first/last element or reversing was inconsistent (`list.get(0)`, `deque.getFirst()`, `sortedSet.first()`, `linkedHashSet.iterator().next()`). **JEP 431** adds three interfaces with a uniform API:

| Interface | Implemented by |
|-----------|----------------|
| `SequencedCollection<E>` | `List`, `Deque`, `SequencedSet` |
| `SequencedSet<E>` | `LinkedHashSet`, `SortedSet`/`TreeSet` |
| `SequencedMap<K,V>` | `LinkedHashMap`, `SortedMap`/`TreeMap` |

New methods: `addFirst`, `addLast`, `getFirst`, `getLast`, `removeFirst`, `removeLast`, and **`reversed()`** (a **view** in reverse order). `SequencedMap` adds `firstEntry`, `lastEntry`, `pollFirstEntry`, `putFirst`, `putLast`, `sequencedKeySet/Values/EntrySet`.

```java
List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
list.getFirst();                 // 1     (Java 21)
list.getLast();                  // 3
list.reversed();                 // [3, 2, 1] view
LinkedHashMap<String,Integer> lhm = ...;
lhm.firstEntry(); lhm.putFirst("x", 0);
```

`TreeSet.addFirst()` throws `UnsupportedOperationException` (order is defined by the comparator).

### Q120. What is `Spliterator` / how do streams relate to collections? 🟢

Every `Collection` has `stream()` / `parallelStream()` backed by a `Spliterator` (a splittable iterator for parallel traversal). Streams do **not** store data; they pipeline operations over a collection. Collect results back with `Collectors.toList/toSet/toMap/groupingBy/counting/partitioningBy`.

```java
Map<Boolean, List<Integer>> evenOdd = nums.stream().collect(Collectors.partitioningBy(n -> n % 2 == 0));
Map<Integer, Long> countByLen = words.stream().collect(Collectors.groupingBy(String::length, Collectors.counting()));
Map<String,Integer> m = list.stream().collect(Collectors.toMap(Item::name, Item::qty, Integer::sum)); // merge fn avoids IllegalStateException on duplicate keys
```

### Q121. What is the difference between `Collection.stream().forEach` and a for-each loop? 🟢

Both iterate. `forEach` on a stream does not guarantee order for `parallelStream()` (use `forEachOrdered`), and a lambda cannot modify local variables (effectively final) or throw checked exceptions easily. Use a plain loop when you need break/continue/modification of locals.

### Q122. How do I get a thread-safe, sorted, unique collection? 🟢

`ConcurrentSkipListSet` (sorted, unique, concurrent) or `Collections.synchronizedSortedSet(new TreeSet<>())` (coarse lock).

### Q123. What does `clone()` on a collection do? 🟢

`ArrayList.clone()`, `HashMap.clone()`, `HashSet.clone()` return a **shallow copy**: a new container holding the **same element objects**. Modify an element object through one list and the other list sees it. For deep copies you must copy the elements yourself (copy constructors, serialization, or mapper).

### Q124. How do you check if two collections are equal? 🟢

`List.equals`: same size and **pairwise equal elements in the same order**. `Set.equals`: same size and `containsAll` (order irrelevant). `Map.equals`: same entry set. `Collection` itself does not define equality beyond `Object` (e.g. a `List` is never equal to a `Set`, and a `Queue` uses identity).

### Q125. How do I make a `List` of fixed size `n` filled with a value? 🟢

`new ArrayList<>(Collections.nCopies(n, 0))`. (Do **not** use `Arrays.asList(new Integer[n])` for a growable list, and `Collections.nCopies` alone is immutable.)

### Q126. How can I synchronise a `Collection` / `List` / `Set` / `Map` from an existing one? 🟢

```java
Collection<Integer> c = Collections.synchronizedCollection(list);
List<Integer> l = Collections.synchronizedList(list);
Set<Integer> s = Collections.synchronizedSet(set);
Map<K,V> m = Collections.synchronizedMap(map);
SortedMap<K,V> sm = Collections.synchronizedSortedMap(treeMap);
```

Each returns a **wrapper** whose methods lock on the wrapper (`mutex`); you still need `synchronized(wrapper)` when iterating (Q40).

* * *

## 10. Scenario-Based Questions

### S1. Design an LRU cache. Which collection would you use? ⭐

**Quick answer:** `LinkedHashMap` in **access-order** mode with `removeEldestEntry` (code in the *LinkedHashMap* question above). Thread-safety: wrap with `Collections.synchronizedMap` (coarse) or use Caffeine/Guava for real concurrency.

**Interview answer from scratch (LeetCode 146, O(1) `get`/`put`): `HashMap` + doubly linked list.**

```java
class LRUCache {
    private static class Node { int key, val; Node prev, next; Node(int k, int v) { key = k; val = v; } }
    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0), tail = new Node(0, 0);   // dummy sentinels

    LRUCache(int capacity) { this.capacity = capacity; head.next = tail; tail.prev = head; }

    public int get(int key) {
        Node n = map.get(key);
        if (n == null) return -1;
        remove(n); addFront(n);                 // mark as most recently used
        return n.val;
    }
    public void put(int key, int value) {
        Node n = map.get(key);
        if (n != null) { n.val = value; remove(n); addFront(n); return; }
        if (map.size() == capacity) {           // evict least recently used (just before tail)
            Node lru = tail.prev;
            remove(lru); map.remove(lru.key);
        }
        n = new Node(key, value);
        map.put(key, n); addFront(n);
    }
    private void remove(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void addFront(Node n) { n.next = head.next; n.prev = head; head.next.prev = n; head.next = n; }
}
```

**Why both structures?** The map gives O(1) lookup; the linked list gives O(1) re-ordering and eviction of the oldest.

### S2. Count the frequency of millions of words. ⭐

`HashMap<String,Integer>` with `merge`:

```java
Map<String,Integer> freq = new HashMap<>();
for (String w : words) freq.merge(w, 1, Integer::sum);
// or streams: words.stream().collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
```

- Pre-size the map to avoid rehashing.
- Multi-threaded: `ConcurrentHashMap` + `merge`, or `LongAdder` values; or split the data, count per thread, then merge the maps.
- Memory-bound data: external sort/MapReduce style or count-min sketch.

### S3. Top K frequent elements. ⭐

Count with a `HashMap`, then keep a **min-heap of size K** (O(n log K), better than sorting O(n log n)):

```java
Map<Integer,Integer> count = new HashMap<>();
for (int x : nums) count.merge(x, 1, Integer::sum);

PriorityQueue<Map.Entry<Integer,Integer>> pq =
        new PriorityQueue<>(Comparator.comparingInt(Map.Entry::getValue));   // min-heap by frequency
for (Map.Entry<Integer,Integer> e : count.entrySet()) {
    pq.offer(e);
    if (pq.size() > k) pq.poll();              // drop the least frequent
}
List<Integer> result = new ArrayList<>();
while (!pq.isEmpty()) result.add(pq.poll().getKey());
Collections.reverse(result);                    // most frequent first
```

Alternative: **bucket sort** by frequency in O(n).

### S4. Remove duplicates from a large list preserving insertion order. 🟢

`new ArrayList<>(new LinkedHashSet<>(list))`: O(n), uniqueness from the `Set`, order from the linked list.

### S5. Which collection keeps elements sorted while you frequently insert? ⭐

`TreeSet` (unique values) or `TreeMap` (key → value): **O(log n)** insert, delete, search, plus range/navigation queries. An `ArrayList` + `sort` after every insert is O(n log n) each time, and a sorted `ArrayList` with binary-search insertion is O(n) because of shifting. In a concurrent setting use `ConcurrentSkipListMap/Set`.

### S6. Design a leaderboard where scores are always sorted. ⭐

```java
// score → players (ties allowed), highest score first
TreeMap<Integer, List<String>> board = new TreeMap<>(Comparator.reverseOrder());

void addScore(String player, int score) {
    board.computeIfAbsent(score, s -> new ArrayList<>()).add(player);       // O(log n)
}
List<String> top(int n) {
    List<String> out = new ArrayList<>();
    for (List<String> players : board.values()) {
        for (String p : players) { out.add(p); if (out.size() == n) return out; }
    }
    return out;
}
```

- Updating a player's score also requires a `Map<String,Integer> current` to remove the old entry.
- Only need the **top N**? A min-heap of size N (`PriorityQueue`) is enough.
- Concurrent: `ConcurrentSkipListMap`.
- At real scale (millions of users, many servers) you would use a **Redis sorted set (ZSET)** or a DB index instead of an in-memory collection.

### S7. Thread-safe cache with the collections framework. ⭐

```java
private final ConcurrentMap<String, Value> cache = new ConcurrentHashMap<>();

Value get(String key) {
    return cache.computeIfAbsent(key, k -> loadFromDb(k));   // load-once per key, atomic
}
```

- `computeIfAbsent` guarantees the loader runs **once per key** even under contention (keep the loader short; it locks that bin).
- Need **eviction/TTL/size limits** → Caffeine/Guava, or `LinkedHashMap` (LRU) behind a lock.
- Avoid `if (!map.containsKey(k)) map.put(k, v)` (race).

### S8. Many threads read a list often, writes are rare. Which collection? 🟢

`CopyOnWriteArrayList`: lock-free reads, copy on write. Example: listener lists, feature-flag lists, routing tables. If writes are frequent use `Collections.synchronizedList` or a `ConcurrentHashMap`-based design.

### S9. Which collection for unique elements in insertion order? 🟢

`LinkedHashSet`. (Search history, "recently viewed unique items", menu entries.)

### S10. First non-repeating character in a string. 🟢

```java
Map<Character,Integer> counts = new LinkedHashMap<>();       // keeps first-seen order
for (char c : s.toCharArray()) counts.merge(c, 1, Integer::sum);
for (Map.Entry<Character,Integer> e : counts.entrySet())
    if (e.getValue() == 1) return e.getKey();
```

### S11. Group anagrams. 🟢

```java
Map<String, List<String>> groups = new HashMap<>();
for (String w : words) {
    char[] c = w.toCharArray(); Arrays.sort(c);
    groups.computeIfAbsent(new String(c), k -> new ArrayList<>()).add(w);   // key = sorted letters
}
return new ArrayList<>(groups.values());
```

### S12. Two Sum with a `HashMap` (O(n)). 🟢

```java
Map<Integer,Integer> seen = new HashMap<>();          // value → index
for (int i = 0; i < nums.length; i++) {
    Integer j = seen.get(target - nums[i]);
    if (j != null) return new int[]{j, i};
    seen.put(nums[i], i);
}
```

### S13. Union, intersection and difference of two lists. 🟢

```java
Set<Integer> union = new HashSet<>(a);        union.addAll(b);
Set<Integer> inter = new HashSet<>(a);        inter.retainAll(b);
Set<Integer> diff  = new HashSet<>(a);        diff.removeAll(b);
```

Use sets, since `retainAll`/`removeAll` on two `ArrayList`s are O(n·m).

### S14. Sort a list of employees by department, then salary descending, then name. 🟢

```java
employees.sort(Comparator.comparing(Employee::getDept)
        .thenComparing(Employee::getSalary, Comparator.reverseOrder())
        .thenComparing(Employee::getName));
```

### S15. You must iterate a `Map` and delete entries by a condition. 🟢

`map.entrySet().removeIf(e -> e.getValue() < threshold);` or an explicit `Iterator` with `it.remove()`. Never call `map.remove(k)` inside a for-each over the same map (CME), except on a `ConcurrentHashMap`.

### S16. A `HashMap` in production is slow / CPU spikes. What do you check? ⭐

1. **Bad `hashCode()`** (constant or poorly distributed) → long chains. Add a good `hashCode` (or make keys `Comparable` for O(log n) trees).
2. **Frequent resizing** → pre-size the map.
3. **Mutable keys** or missing `equals/hashCode` → lost entries / duplicates.
4. **Concurrent writes without synchronization** (Java 7 infinite loop, lost updates) → use `ConcurrentHashMap`.
5. **Boxing / huge key objects** → memory pressure and GC; consider primitive collections.

### S17. Choose a collection: quick Q&A table. 🟢

| Requirement | Pick |
|-------------|------|
| Fast random access by index | `ArrayList` |
| Queue / stack, FIFO or LIFO | `ArrayDeque` |
| Always get smallest / highest-priority first | `PriorityQueue` |
| Unique + fast lookup | `HashSet` |
| Unique + insertion order | `LinkedHashSet` |
| Unique + sorted | `TreeSet` |
| Key → value lookup | `HashMap` |
| Key → value + insertion/access order (LRU) | `LinkedHashMap` |
| Key → value sorted by key / range queries | `TreeMap` |
| Concurrent key → value | `ConcurrentHashMap` |
| Concurrent read-mostly list | `CopyOnWriteArrayList` |
| Producer-consumer between threads | `BlockingQueue` |
| Keys are enum constants | `EnumMap` / `EnumSet` |

* * *

## 11. Time Complexity and How to Choose a Collection

### Q127. Time complexity of common operations. ⭐

| Collection | get / access | add / put | insert / remove (middle) | contains / search | Notes |
|------------|-------------|-----------|--------------------------|-------------------|-------|
| `ArrayList` | **O(1)** | O(1) amortized (end) | O(n) | O(n) | Resize copies array |
| `LinkedList` | O(n) | O(1) at ends | O(n) find + O(1) link | O(n) | O(1) via iterator |
| `Vector` | O(1) | O(1) amortized | O(n) | O(n) | Synchronized |
| `ArrayDeque` | O(1) at ends | O(1) at ends | O(n) | O(n) | Circular array |
| `HashMap` / `HashSet` | O(1) avg | O(1) avg | O(1) avg | O(1) avg | Worst case O(log n) with tree bins (O(n) before Java 8) |
| `LinkedHashMap` / `LinkedHashSet` | O(1) | O(1) | O(1) | O(1) | Slightly more overhead |
| `TreeMap` / `TreeSet` | O(log n) | O(log n) | O(log n) | O(log n) | Sorted, red-black tree |
| `PriorityQueue` | peek **O(1)** | offer **O(log n)** | poll O(log n) | O(n) | `remove(Object)` is O(n) |
| `ConcurrentHashMap` | O(1) | O(1) | O(1) | O(1) | Lock-free reads |
| `CopyOnWriteArrayList` | O(1) | **O(n)** | O(n) | O(n) | Copy per write |
| `ConcurrentSkipListMap` | O(log n) | O(log n) | O(log n) | O(log n) | Expected |
| `EnumSet` / `EnumMap` | O(1) | O(1) | O(1) | O(1) | Bit vector / array |

### Q128. What are the main performance considerations when choosing a collection? 🟢

1. **Operation mix**: mostly reads → `ArrayList`/`HashMap`; frequent head insert/remove → `ArrayDeque`; sorted queries → `TreeMap`.
2. **Time complexity** of the *dominant* operation (not every operation).
3. **Memory** footprint (boxing, node overhead, load factor, spare capacity).
4. **Ordering** needs (insertion, sorted, none).
5. **Thread-safety** needs (confinement vs concurrent collections).
6. **Null / duplicate** requirements.
7. **Pre-size** collections (`ArrayList(n)`, `HashMap(n/0.75+1)`) when the size is known.
8. **Code to interfaces**: `List<String> l = new ArrayList<>();` so you can swap implementations.

* * *

## 12. Interview Cheat Sheet

| Question | Short Answer |
|----------|--------------|
| `Collection` vs `Collections`? | Root interface vs utility class with static helpers |
| Why does `Map` not extend `Collection`? | It stores key-value pairs, not single elements |
| `ArrayList` vs `LinkedList`? | Dynamic array (O(1) get) vs doubly linked list (O(1) ends, O(n) get) |
| `ArrayList` growth? | New array of ≈1.5× (`old + old>>1`), default capacity 10 (lazy) |
| `ArrayList` vs `Vector`? | Unsynchronized, grows 1.5× vs synchronized legacy, grows 2× |
| Why avoid `Stack`? | Legacy and synchronized; use `ArrayDeque` |
| `Iterator` vs `ListIterator` vs `Enumeration`? | Universal + remove / lists only, bidirectional, add/set / legacy read-only |
| Fail-fast? | Throws CME via `modCount` check (`ArrayList`, `HashMap`) |
| Fail-safe? | No CME; snapshot (`CopyOnWrite*`) or weakly consistent (`ConcurrentHashMap`) |
| Safe removal while iterating? | `iterator.remove()` or `removeIf` |
| How does `HashSet` ensure uniqueness? | Backed by `HashMap`; element is key, value is dummy `PRESENT` |
| `HashSet` vs `LinkedHashSet` vs `TreeSet`? | No order, insertion order, sorted (O(1)/O(1)/O(log n)) |
| How does `HashMap` work? | Array of buckets, index `(n-1) & (h ^ h>>>16)`, `equals` inside bucket |
| Default capacity / load factor? | 16 / 0.75 → resize at 13th entry |
| Collision handling? | Linked list; tree at 8 nodes if table ≥ 64 (Java 8+) |
| Treeify / untreeify thresholds? | 8 / 6; `MIN_TREEIFY_CAPACITY` = 64 |
| Resize cost? | O(n); each node stays or moves by `+oldCap` |
| `equals`/`hashCode` contract? | Equal objects must have equal hash codes |
| Why immutable keys? | Mutating key changes the hash → entry becomes unreachable |
| `HashMap` vs `Hashtable`? | Unsync, nulls allowed, faster vs synchronized, no nulls, legacy |
| `HashMap` vs `ConcurrentHashMap`? | Not thread-safe vs CAS + per-bin lock, no nulls, no CME |
| `ConcurrentHashMap` internals (Java 8)? | CAS for empty bin, `synchronized` on bin head, lock-free reads |
| `LinkedHashMap` use? | LRU cache with `accessOrder=true` + `removeEldestEntry` |
| `TreeMap` internals? | Red-black tree, O(log n), sorted by `Comparable`/`Comparator`, no null key |
| `Comparable` vs `Comparator`? | `compareTo` inside class (natural, one) vs `compare` outside (custom, many) |
| `a - b` in comparator? | Can overflow; use `Integer.compare` |
| `PriorityQueue` internals? | Binary min-heap in an array; offer/poll O(log n), peek O(1); iteration not sorted |
| `poll()` vs `remove()`? | `poll` returns null when empty; `remove` throws |
| `ArrayDeque` vs `LinkedList`? | Circular array (faster, no nulls) vs linked nodes |
| `BlockingQueue`? | Thread-safe queue with blocking `put`/`take` (producer-consumer) |
| `CopyOnWriteArrayList`? | Copy array on every write; lock-free snapshot reads; read-mostly |
| `Arrays.asList`? | Fixed-size array-backed view; `add/remove` throw |
| `List.of` vs `unmodifiableList`? | Immutable, no nulls vs read-only view of a changeable list |
| Binary search not found? | `-(insertionPoint) - 1` |
| `Collections.sort` algorithm? | Stable TimSort |

* * *

## 13. Where Older Sources Are Outdated

The Durga PDF (2016, Java 7 era) and some blogs contain statements that are **no longer true**. Know the corrections so you do not repeat them in an interview.

| Older statement | Reality (Java 8 → 21) |
|-----------------|-----------------------|
| `ArrayList` new capacity = `(cur * 3/2) + 1` | `old + (old >> 1)`; initial array allocated lazily (capacity 10 on first add) |
| `TreeSet`/`TreeMap` allow **one** `null` into an empty collection | Java 7+: `null` throws `NullPointerException` even when empty (natural ordering) |
| `PriorityQueue` does not allow duplicates | Duplicates **are allowed** (no nulls) |
| `PriorityQueue` default capacity 11 and prints sorted | Capacity 11 is right, but `toString()`/iteration shows **heap order**, not sorted order |
| `ConcurrentHashMap` concurrency level 16 (segments) | Java 8+ has **no segments**: CAS + `synchronized` on a bin head; `concurrencyLevel` is only a sizing hint |
| `ConcurrentHashMap` iterator works on a read-only **copy** | It is **weakly consistent** over the live table; only `CopyOnWrite*` iterate a snapshot |
| `ConcurrentHashMap` is "slower than `HashMap`" so avoid | Slight overhead, but it is the standard for shared maps; `Hashtable`/`synchronizedMap` are far slower under contention |
| `ConcurrentHashMap` is "synchronized" | It is **thread-safe** without locking the whole map; reads are lock-free |
| HashMap collision = linked list only; new node at head | Java 8+: tail insertion, treeification (8 / 64 / 6) |
| HashMap resize recomputes every hash | Hash is cached in the node; only the extra bit is tested (`hash & oldCap`) |
| "Updating" an element is a structural modification (fail-fast) | Only **structural** changes (add/remove/clear) bump `modCount`; `set` on a list and updating a map value do not |
| Fail-safe iterators always use a cloned copy | Only snapshot types; others are weakly consistent |
| `Stack` for LIFO | Prefer `Deque<E> stack = new ArrayDeque<>()` |
| `Vector`/`Hashtable` for thread safety | Prefer concurrent collections |
| `new Integer(10)` in examples | Deprecated; use `Integer.valueOf(10)` or autoboxing |
| `Hashtable` default capacity 11 | Still true (and `old*2+1` growth) |
| PDF's comparison table says `Collections.synchronizedSet` was introduced in 1.7 | `Collections.synchronizedSet` exists since Java **1.2**; `CopyOnWriteArraySet` is Java **1.5** |

> **Where to read more in your repo:** locks, executors, `wait/notify`, `ThreadLocal`, deadlocks → [Java Multithreading & Concurrency](https://pkpunit.github.io/Software-Dev-Interview-Prep/core-java/multithreading/java-multithreading-concurrency).

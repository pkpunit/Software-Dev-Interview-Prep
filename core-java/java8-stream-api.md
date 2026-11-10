# Java 8 Features and Stream API Interview Questions (Detailed)

> One-stop revision file for Java 8 and the Stream API. It consolidates the Durga Sir *Java 8 New Features* PDF, igmguru, harp-lab (learning-zone), the devgenius *Java 8 Interview Questions* article, the Medium *Java 8 features* article and the commonly asked Stream API interview problems. Important questions follow **What → Why → How → Pitfalls → Interview one-liner**. The last big sections teach you **how to think** about unseen Stream problems (a pattern playbook plus solved problems).

**Legend:** ⭐ = must-know (asked very often, answered in depth) · 🟢 = quick / easy question (short answer) · 🧩 = pattern or problem-solving idea

**Version note:** Java 8 is the base. Where a later version (9, 10, 11, 16, 21) changed or improved something, it is marked **(Java N)**. Where the older PDF or blogs say something that is no longer accurate, it is called out (see the last section).

## Table of Contents

01. [Java 8 Overview](#1-java-8-overview)
02. [Lambda Expressions](#2-lambda-expressions)
03. [Functional Interfaces](#3-functional-interfaces)
04. [Method and Constructor References](#4-method-and-constructor-references)
05. [Default and Static Methods in Interfaces](#5-default-and-static-methods-in-interfaces)
06. [Optional](#6-optional)
07. [Stream API Fundamentals](#7-stream-api-fundamentals)
08. [Collectors Deep Dive](#8-collectors-deep-dive)
09. [Parallel Streams and CompletableFuture](#9-parallel-streams-and-completablefuture)
10. [Date and Time API (java.time)](#10-date-and-time-api-javatime)
11. [Other Java 8 Changes](#11-other-java-8-changes)
12. [Stream Problem-Solving Playbook](#12-stream-problem-solving-playbook)
13. [Solved Stream Problems by Pattern](#13-solved-stream-problems-by-pattern)
14. [Pitfalls and When NOT to Use Streams](#14-pitfalls-and-when-not-to-use-streams)
15. [How Did You Use Java 8 in Your Project? and Cheat Sheet](#15-how-did-you-use-java-8-in-your-project-and-cheat-sheet)
16. [Where Older Sources Are Outdated](#16-where-older-sources-are-outdated)

* * *

## 1. Java 8 Overview

### Q1. What are the major features of Java 8? Why was it important? ⭐

Java 8 (released **18 March 2014**) is the biggest release after Java 5. Before it, Java was purely object-oriented: you passed *objects*, even when you only wanted to pass a piece of *behaviour*. Java 8 added **functional-programming style** to Java (this does **not** make Java a functional language).

| Feature | One-line purpose |
|---------|------------------|
| **Lambda expressions** | Short anonymous functions; pass behaviour as data |
| **Functional interfaces** | Interfaces with one abstract method (target type of a lambda) |
| **Method / constructor references** (`::`) | Shorthand for lambdas that only call an existing method |
| **Default and static methods in interfaces** | Evolve interfaces without breaking implementers |
| **Stream API** | Declarative, pipeline-style processing of collections |
| **Optional** | A container that makes "value may be absent" explicit |
| **New Date and Time API** (`java.time`) | Immutable, thread-safe, clearer date/time classes |
| **CompletableFuture** | Non-blocking, composable asynchronous programming |
| `forEach`, `removeIf`, `replaceAll`, `Map.merge/compute...` | New methods on collections to use lambdas |
| Repeatable and type annotations | Annotation improvements |
| `StringJoiner`, `Base64`, `Arrays.parallelSort` | Utility additions |
| Nashorn JavaScript engine | Run JavaScript on the JVM (**deprecated in 11, removed in 15**) |
| PermGen removed → **Metaspace** | Class metadata moved to native memory |

> **Interview one-liner:** Java 8 brought lambdas, streams, default methods, Optional and java.time, which together let you write short, declarative, easier-to-parallelize code.

### Q2. Release timeline: how long between Java 7 and Java 8? 🟢

Java 7: **28 July 2011** → Java 8: **18 March 2014** (about 2 years 7 months). The PDF lists Java 9 as 22 Sep 2016; Java 9 actually shipped on **21 Sep 2017**, then Java 10 in March 2018. After Java 9 the cadence became **every 6 months**, with LTS releases (8, 11, 17, 21, 25).

### Q3. Is Java 8 still relevant in interviews? 🟢

Yes. Lambdas, streams, Optional and `java.time` are used in almost every modern Java codebase and are asked at nearly every level. Interviews for 7+ years of experience expect you to **write stream pipelines on the spot** and to explain **internals and trade-offs** (laziness, parallel streams, collectors, CompletableFuture).

### Q4. What is functional programming and how does Java 8 support it? 🟢

Functional programming builds programs from **functions** that take inputs and return outputs, preferring **immutability** and **no side effects**. Java 8 supports it through: lambdas (functions as values), functional interfaces (function types), higher-order methods (methods that take/return functions: `filter`, `map`, `Comparator.comparing`), and streams (function pipelines).

| Imperative (how) | Declarative / functional (what) |
|------------------|----------------------------------|
| Loops, mutable counters, `if` blocks | `filter`, `map`, `reduce`, `collect` |
| You control the iteration (**external iteration**) | The library controls it (**internal iteration**) |

### Q5. What is type inference? Did it exist before Java 8? 🟢

The compiler deduces types for you. Java 5 introduced inference for generic **methods**, Java 7 added the **diamond** `new ArrayList<>()`, and Java 8 improved **target typing** so lambda parameter types come from the functional interface (`(a, b) -> a + b`). Java 10 added `var` for local variables and Java 11 allowed `var` in lambda parameters.

* * *

## 2. Lambda Expressions

### Q6. What is a lambda expression? ⭐

**What?** An **anonymous function**: a block of code with **parameters and a body**, but **no name, no return type declaration and no access modifier**. It is also called a *closure* (it can capture variables from its surroundings).

**Syntax:** `(parameters) -> expression` or `(parameters) -> { statements; }`

```java
// Normal method
public void m1() { System.out.println("hello"); }
// As a lambda
() -> System.out.println("hello")

public int add(int a, int b) { return a + b; }
(int a, int b) -> a + b          // explicit types
(a, b) -> a + b                  // types inferred
```

**Why?** To pass *behaviour* as an argument with minimal code, mainly to implement functional interfaces (`Runnable`, `Comparator`, `Predicate`) and to feed the Stream API.

> **Interview one-liner:** A lambda is an anonymous function that provides the implementation of a functional interface's single abstract method.

### Q7. What are the rules for writing a lambda? ⭐

1. **Zero or more** parameters. Zero parameters need empty parentheses: `() -> 42`.
2. Parameter **types are optional** when the compiler can infer them from context: `(a, b) -> a + b`.
3. Multiple parameters are **comma separated**.
4. **One parameter** with inferred type: parentheses optional: `x -> x * x`. (With an explicit type or annotation you need them: `(int x) -> x * x`.)
5. **One statement** body: braces and `return` are optional (the value of the expression is returned). **More than one statement**: braces are mandatory and you must write `return` if a value is expected.
6. You **cannot mix** explicit and inferred types in one parameter list (`(int a, b)` is illegal).
7. A lambda needs a **target type**: it can only be used where a functional interface is expected.

```java
Runnable r        = () -> System.out.println("hi");
Comparator<String> c = (a, b) -> a.length() - b.length();
Function<String,Integer> f = s -> s.length();
BinaryOperator<Integer> add = (a, b) -> { int sum = a + b; return sum; };
```

### Q8. How is a lambda related to a functional interface? ⭐

A lambda **is** an implementation of a functional interface's single abstract method. You store it in a **functional interface reference** and call that method. Without a functional interface type, a lambda has no meaning (`Object o = () -> {};` does not compile).

```java
interface Interf { int square(int x); }

Interf i = x -> x * x;                 // lambda implements square()
System.out.println(i.square(7));       // 49
```

**Before and after (the PDF pattern):**

```java
// Without lambda: a whole class
class Demo implements Interf { public int square(int x) { return x * x; } }
Interf i = new Demo();

// With lambda: one line
Interf i = x -> x * x;
```

### Q9. Lambda vs anonymous inner class: what are the differences? ⭐

| Aspect | Anonymous inner class | Lambda expression |
|--------|----------------------|-------------------|
| What it is | A **class** without a name | A **function** without a name |
| Can implement | Interface with **any number** of abstract methods; can also **extend** abstract/concrete classes | Only an interface with **one** abstract method (functional interface) |
| `this` | Refers to the **anonymous class object** | Refers to the **enclosing class object** (lambda has no `this` of its own) |
| Instance variables | Can declare fields | **Cannot** declare fields; variables inside are plain **locals** |
| Variable shadowing | Can shadow outer variables | **Cannot** redeclare an enclosing local variable with the same name (compile error) |
| Compilation | Separate class file (`Outer$1.class`) | **No** extra `.class` file; body is compiled into a **private synthetic method** of the enclosing class and linked at runtime with `invokedynamic` |
| Instance creation | A new object each time the code runs | A **non-capturing** lambda is created once and reused; a **capturing** lambda may allocate on each evaluation |
| Verbosity | High | Low |
| Use when | You need state, multiple methods, or to extend a class | A single behaviour is enough |

```java
class Test {
    int x = 777;
    void m2() {
        Runnable r = () -> {
            int x = 888;               // compile error if a local x already existed in m2()
            System.out.println(x);     // 888
            System.out.println(this.x);// 777  (this = enclosing Test object)
        };
        r.run();
    }
}
```

> Note: "anonymous inner class != lambda". Anywhere an anonymous class implements a **functional interface** you can replace it with a lambda; you cannot replace an anonymous class that has state or several methods.

### Q10. What variables can a lambda access? What does "effectively final" mean? ⭐

A lambda can use:

- **Instance fields and static fields** of the enclosing class (read and write).
- **Local variables and parameters** of the enclosing method **only if they are `final` or *effectively final***: assigned once and never changed afterwards (before or after the lambda).

```java
int y = 20;                          // effectively final (never reassigned)
Runnable r = () -> System.out.println(y);   // OK
// y = 30;                           // would make y NOT effectively final → compile error at the lambda

int count = 0;
list.forEach(s -> count++);          // compile error: count is modified inside the lambda
```

**Why?** Local variables live on the **stack of the method** and the lambda may run later or on another thread. Java **copies the value** into the lambda; if the original could change, the two copies would silently disagree (and cause thread-safety problems).

**Workarounds:** use a one-element array or `AtomicInteger` (`AtomicInteger c = new AtomicInteger(); list.forEach(s -> c.incrementAndGet());`), or better, express it with `count()`, `reduce()` or `collect()` instead of mutating state.

> The PDF says lambda locals are "implicitly final". The precise term is **effectively final**.

### Q11. Does a lambda create a new object every time it is executed? 🟢

Not necessarily. A **non-capturing** lambda (uses no outside locals or `this`) is created **once** (one shared instance per call site). A **capturing** lambda needs to hold the captured values, so a new instance may be created per evaluation. The JVM is free to choose the implementation; do not rely on identity of lambda objects.

### Q12. How does the JVM implement lambdas? 🟢

`javac` compiles the lambda body into a **private (often static) synthetic method** such as `lambda$main$0` in the same class. At the lambda site it emits an **`invokedynamic`** instruction. On first execution the JVM calls `LambdaMetafactory`, which **generates a small hidden class at runtime** that implements the functional interface and delegates to that method. Benefits: no extra class file per lambda, and JVM can optimize.

### Q13. How do checked exceptions work inside lambdas? ⭐

A lambda body cannot throw a **checked** exception unless the functional interface's method **declares** it (`Callable.call() throws Exception` does; `Function.apply` does not).

```java
// Option 1: try/catch inside the lambda
list.forEach(s -> {
    try { process(s); } catch (IOException e) { throw new UncheckedIOException(e); }
});

// Option 2: a reusable wrapper (cleaner when repeated)
@FunctionalInterface interface ThrowingConsumer<T> { void accept(T t) throws Exception; }
static <T> Consumer<T> wrap(ThrowingConsumer<T> tc) {
    return t -> { try { tc.accept(t); } catch (Exception e) { throw new RuntimeException(e); } };
}
list.forEach(wrap(s -> process(s)));
```

### Q14. How do I sort a list using a lambda? 🟢

```java
List<String> names = Arrays.asList("Ravi", "Asha", "Karan");
names.sort((a, b) -> a.compareTo(b));            // lambda
names.sort(String::compareTo);                   // method reference
names.sort(Comparator.comparing(String::length).thenComparing(Comparator.naturalOrder()));
```

### Q15. What are the advantages of lambdas? 🟢

- **Less code**, better readability (no anonymous-class boilerplate).
- Behaviour can be **passed as an argument** (higher-order functions), enabling APIs like streams.
- Enables **internal iteration** and **easy parallelism** (the library decides how to run it).
- Encourages **stateless, side-effect-free** code, which is easier to test.

### Q16. Can a lambda be serialized, and can it be recursive? 🟢

A lambda is serializable only if its target type is `Serializable` (e.g. cast `(Runnable & Serializable)`), which is rarely used. A lambda cannot refer to **itself** by name directly; use a field or a method reference to a named method to recurse.

* * *

## 3. Functional Interfaces

### Q17. What is a functional interface? ⭐

An interface with **exactly one abstract method** (SAM, *single abstract method*). It may also contain any number of **default** and **static** methods, and it may redeclare **`Object` methods** (like `equals`) because those do not count (every class already implements them). It is the **target type** for lambdas and method references.

```java
@FunctionalInterface
interface Greeting {
    void greet(String name);                    // the single abstract method
    default void hello() { System.out.println("hello"); }   // allowed
    static Greeting polite() { return n -> System.out.println("Dear " + n); }   // allowed
    boolean equals(Object o);                   // Object method, does not count
}
```

**Pre-Java 8 examples:** `Runnable` (`run`), `Callable` (`call`), `Comparable` (`compareTo`), `Comparator` (`compare`), `ActionListener` (`actionPerformed`).

### Q18. What is `@FunctionalInterface`? Is it mandatory? ⭐

An **optional** marker annotation (works like `@Override`): it asks the **compiler to verify** the interface has exactly one abstract method, and tells readers that lambdas are intended. Without it, any interface with one abstract method is still functional.

```java
@FunctionalInterface interface A { void m1(); }                 // OK
@FunctionalInterface interface B { void m1(); void m2(); }      // compile error: 2 abstract methods
@FunctionalInterface interface C { }                            // compile error: 0 abstract methods
```

### Q19. Functional interface and inheritance: what are the rules? ⭐

```java
@FunctionalInterface interface A { void methodOne(); }

@FunctionalInterface interface B extends A { }                       // OK: no new abstract method
@FunctionalInterface interface C extends A { void methodOne(); }     // OK: same method redeclared
@FunctionalInterface interface D extends A { void methodTwo(); }     // compile error: second abstract method
interface E extends A { void methodTwo(); }                          // OK, but E is a NORMAL interface (not functional)
```

A child interface stays functional only if it **adds no new abstract method**. Default and static methods can be added freely.

### Q20. Name the important built-in functional interfaces (`java.util.function`). ⭐

The package has 40+ interfaces, built around **four core shapes**:

| Interface | Method | Input → Output | Typical use |
|-----------|--------|----------------|-------------|
| **`Predicate<T>`** | `boolean test(T t)` | T → boolean | Conditions, `filter`, `anyMatch` |
| **`Function<T,R>`** | `R apply(T t)` | T → R | Transform, `map` |
| **`Consumer<T>`** | `void accept(T t)` | T → nothing | Side effects, `forEach`, `peek` |
| **`Supplier<T>`** | `T get()` | nothing → T | Lazy creation, `orElseGet`, `generate` |

**Variations:**

| Family | Interfaces |
|--------|-----------|
| **Two arguments** | `BiPredicate<T,U>`, `BiFunction<T,U,R>`, `BiConsumer<T,U>` |
| **Same type in/out** | `UnaryOperator<T>` (= `Function<T,T>`), `BinaryOperator<T>` (= `BiFunction<T,T,T>`, also has `minBy`/`maxBy`) |
| **Primitive specializations** (avoid boxing) | `IntPredicate`, `IntFunction<R>`, `ToIntFunction<T>`, `IntUnaryOperator`, `IntBinaryOperator`, `IntConsumer`, `IntSupplier`, same for `Long`/`Double`; `BooleanSupplier`, `ObjIntConsumer`, etc. |

```java
Predicate<Integer> gt10 = i -> i > 10;
Function<String,Integer> len = s -> s.length();
Consumer<String> print = s -> System.out.println(s);
Supplier<LocalDate> today = LocalDate::now;
UnaryOperator<Integer> sq = x -> x * x;           // sq.apply(5) = 25
BinaryOperator<Integer> add = (a, b) -> a + b;    // add.apply(1, 2) = 3
BiFunction<Integer,Integer,Integer> mul = (a, b) -> a * b;
```

### Q21. Predicate vs Function: what is the difference? ⭐

| Predicate | Function |
|-----------|----------|
| For **conditional checks** | For **performing an operation and returning a result** |
| `Predicate<T>`: one type parameter (the input) | `Function<T,R>`: two type parameters (input, return) |
| Method `test(T t)` | Method `apply(T t)` |
| Returns **only `boolean`** | Returns **any type** |
| Default methods: `and`, `or`, `negate`; static `isEqual`, (Java 11) `not` | Default methods: `andThen`, `compose`; static `identity` |

> A `Predicate` is just a boolean-valued function.

### Q22. How do I combine predicates? Show an example. ⭐

```java
int[] x = {0, 5, 10, 15, 20, 25, 30};
Predicate<Integer> p1 = i -> i > 10;
Predicate<Integer> p2 = i -> i % 2 == 0;

// p1             → 15, 20, 25, 30        (greater than 10)
// p2             → 0, 10, 20, 30         (even)
// p1.negate()    → 0, 5, 10              (NOT greater than 10)
// p1.and(p2)     → 20, 30                (greater than 10 AND even)
// p1.or(p2)      → 0, 10, 15, 20, 25, 30 (greater than 10 OR even)
// Predicate.not(p1) / Predicate.isEqual("a")   (Java 11 / Java 8)

static void m1(Predicate<Integer> p, int[] x) {
    for (int v : x) if (p.test(v)) System.out.println(v);
}
```

`and`/`or` are **short-circuit** like `&&`/`||`. Typical use: build filters dynamically, `list.stream().filter(p1.and(p2.negate()))`.

### Q23. What is the difference between `andThen` and `compose`? ⭐

```java
Function<Integer,Integer> times2 = x -> x * 2;
Function<Integer,Integer> plus3  = x -> x + 3;

times2.andThen(plus3).apply(5);   // plus3(times2(5))  = 13   → "this, then that"
times2.compose(plus3).apply(5);   // times2(plus3(5))  = 16   → "that, then this"
Function.identity();              // x -> x
```

`Consumer.andThen(c2)` runs two consumers in sequence on the same input. `Supplier` has no composition.

### Q24. What are Supplier and Consumer used for? 🟢

`Supplier<T>` produces a value **lazily** (called only when needed): `Optional.orElseGet(Supplier)`, `Stream.generate(Supplier)`, `Objects.requireNonNull(x, Supplier<String>)`, `Collectors.toCollection(TreeSet::new)`. `Consumer<T>` performs an action with no result: `forEach`, `peek`, `Optional.ifPresent`.

### Q25. What are `UnaryOperator` and `BinaryOperator`? 🟢

Specializations of `Function`/`BiFunction` where **all types are the same**. `UnaryOperator<T>`: `T → T` (`List.replaceAll(UnaryOperator)`, `Stream.iterate`). `BinaryOperator<T>`: `(T, T) → T` (`reduce`, `Map.merge`, `Collectors.toMap` merge function). `BinaryOperator.minBy(cmp)` / `maxBy(cmp)` return the smaller/larger of two.

### Q26. Why do the primitive versions (`IntPredicate`, `ToIntFunction`) exist? 🟢

To **avoid boxing/unboxing**. `Predicate<Integer>` boxes each `int` into an `Integer` object; `IntPredicate` works on the raw `int`. For large data this reduces memory and GC pressure. Streams have matching `IntStream`, `LongStream`, `DoubleStream`.

### Q27. Is `Comparator` a functional interface? 🟢

Yes: single abstract method `compare(T, T)`; its `boolean equals(Object)` is an `Object` method so it does not count. It also has many Java 8 **default/static** helpers: `reversed()`, `thenComparing()`, `comparing()`, `comparingInt()`, `naturalOrder()`, `reverseOrder()`, `nullsFirst()`, `nullsLast()` (see the [Collections page](collections.md) for the full Comparator discussion).

### Q28. How do you create your own functional interface and use it with a lambda? 🟢

```java
@FunctionalInterface
interface TriFunction<A, B, C, R> { R apply(A a, B b, C c); }

TriFunction<Integer,Integer,Integer,Integer> sum3 = (a, b, c) -> a + b + c;
sum3.apply(1, 2, 3);   // 6
```

Prefer the built-in interfaces whenever one fits; create your own for 3+ arguments, checked exceptions, or domain naming.

* * *

## 4. Method and Constructor References

### Q29. What is a method reference? ⭐

A **method reference** (`::`) is a shorthand for a lambda that **only calls an existing method**. The functional interface method is mapped to your method; the **argument types must match** (return type, method name and modifiers need not match). It is an alternative, more readable syntax; the compiler picks the lambda for you.

```java
list.forEach(s -> System.out.println(s));     // lambda
list.forEach(System.out::println);            // method reference (same behaviour)
```

**Why?** Reuse existing code; the intent is clearer; slightly less code.

### Q30. What are the four kinds of method references? ⭐

| Kind | Syntax | Equivalent lambda | Example |
|------|--------|-------------------|---------|
| **Static method** | `ClassName::staticMethod` | `x -> ClassName.staticMethod(x)` | `Integer::parseInt`, `Math::abs`, `Test::m1` |
| **Instance method of a particular (bound) object** | `objRef::method` | `x -> objRef.method(x)` | `System.out::println`, `t::m2`, `str::equals` |
| **Instance method of an arbitrary object of a given type (unbound)** | `ClassName::instanceMethod` | `(a, b) -> a.instanceMethod(b)` | `String::length`, `String::compareToIgnoreCase`, `Employee::getName` |
| **Constructor** | `ClassName::new` | `x -> new ClassName(x)` | `ArrayList::new`, `Sample::new`, `Employee[]::new`, `int[]::new` |

> `System.out::println` is a reference to an **instance method of the object `System.out`** (a `PrintStream`), not a static method (the harp-lab page says static, which is wrong).

```java
// Static
Runnable r = Test::m1;                       // run() calls static m1()

// Bound instance
class Test { public void m2(int i) { System.out.println("From Method Reference:" + i); } }
Interf i1 = new Test()::m2;  i1.m1(20);

// Unbound instance: first lambda parameter becomes the receiver
Function<String,Integer> f = String::length;           // s -> s.length()
BiPredicate<String,String> eq = String::equalsIgnoreCase;  // (a, b) -> a.equalsIgnoreCase(b)

// Constructor
interface Interf { Sample get(String s); }
Interf f1 = Sample::new;                               // s -> new Sample(s)
Supplier<List<String>> sup = ArrayList::new;
Function<Integer,int[]> arr = int[]::new;
String[] names = stream.toArray(String[]::new);
```

### Q31. When should I prefer a lambda over a method reference? 🟢

When you need to **add logic** (`x -> x * 2 + 1`), **reorder or fix arguments**, or when the method reference would be ambiguous or less readable. Use a method reference when it reads like plain English (`Employee::getName`).

### Q32. Explain `System.out::println`. 🟢

`System.out` is a static `PrintStream` object; `println` is an instance method. `System.out::println` is a **bound-instance method reference**: it becomes `x -> System.out.println(x)` for whatever type the functional interface supplies (`Consumer<String>`, `Consumer<Integer>`...).

### Q33. What is a constructor reference used for in streams? 🟢

To create objects or arrays from stream data: `names.stream().map(Employee::new).collect(toList())`, `stream.toArray(Integer[]::new)`, `Collectors.toCollection(TreeSet::new)`. The constructor chosen depends on the functional interface's parameter types.

* * *

## 5. Default and Static Methods in Interfaces

### Q34. Why were default methods introduced? ⭐

**Problem:** Before Java 8 an interface could contain only **public abstract methods** and **public static final constants**. Adding a method to a widely-used interface (like `Collection`) would **break every implementing class**.

**Solution:** `default` methods give a **concrete implementation inside the interface**. Existing implementers compile unchanged and inherit it; they may override it. This is how `Iterable.forEach`, `Collection.stream()`, `Collection.removeIf`, `List.sort`, `Map.getOrDefault` and `Comparator.reversed` were added **without breaking old code (backward compatibility)**. They are also called **defender methods** or **virtual extension methods**.

```java
interface Vehicle {
    void start();
    default void honk() { System.out.println("Beep beep!"); }
}
class Car implements Vehicle { public void start() { System.out.println("started"); } }
new Car().honk();     // inherited default
```

### Q35. What happens if a class implements two interfaces with the same default method (diamond problem)? ⭐

The compiler **forces** the class to override the method (otherwise compile error). Inside the override, pick one with `InterfaceName.super.method()`.

```java
interface Left  { default void m1() { System.out.println("Left"); } }
interface Right { default void m1() { System.out.println("Right"); } }

class Test implements Left, Right {
    @Override public void m1() {
        Left.super.m1();                       // explicitly call Left's version (or write your own)
    }
}
```

**Resolution rules (in order):**

1. **A class method always wins** over any interface default (the "class wins" rule, even an inherited superclass method).
2. A **more specific interface** (a sub-interface that overrides the default) wins over its parent.
3. Otherwise the class **must override** and may delegate with `X.super.m()`.

If one interface has a default and the other the **abstract** version of the same method, the class must still implement it.

### Q36. Can a default method override `Object` methods like `hashCode()` or `equals()`? 🟢

**No**: compile error. Every class already inherits `Object`'s methods, and "class wins", so an interface default could never take effect. Default methods also cannot be `final`, `synchronized` or `static`.

### Q37. What are static methods in interfaces? How are they different from default methods? ⭐

| Default method | Static method |
|----------------|---------------|
| Instance-level, has `this` (the implementing object) | Belongs to the **interface itself** |
| **Inherited** and can be **overridden** by implementers | **Not inherited**; **cannot be overridden** |
| Called on an **object** | Called **only via the interface name**: `Interf.sum(10, 20)` |
| Used to evolve behaviour | Used for **utility/helper** methods (`Comparator.naturalOrder()`, `Stream.of()`, `List.of()`) |

```java
interface Interf { static void sum(int a, int b) { System.out.println(a + b); } }
class Test implements Interf {
    public static void main(String[] args) {
        Interf.sum(10, 20);      // OK
        // Test.sum(10, 20);     // compile error: static interface methods are not inherited
        // new Test().sum(1,2);  // compile error
    }
}
```

A class may declare a method with the same signature, but it is a **separate method**, not an override. An interface also cannot declare a static method that clashes with an `Object` method.

### Q38. Can I write `main()` in an interface? 🟢

Yes (since 8). `public static void main(String[] args)` inside an interface can be run directly with `java InterfaceName`.

### Q39. Interface with default methods vs abstract class: what is the difference? ⭐

| Interface (with default methods) | Abstract class |
|----------------------------------|----------------|
| Variables are always `public static final` (**no instance state**) | Can have **instance variables** (object state) |
| Never talks about the **state** of an object | Can represent state |
| **No constructors** | Can have constructors |
| **No instance or static initializer blocks** | Can have both |
| A class can implement **many** interfaces | A class can extend only **one** class |
| A functional interface can be the target of a **lambda** | Cannot be a lambda target |
| Cannot override `Object` methods as defaults | Can override `Object` methods |
| Methods are implicitly `public` (private allowed in Java 9) | Any access modifier |

> Interface with default method **!=** abstract class. Use an interface to define a **capability**, an abstract class to share **state and partial implementation**.

### Q40. Can interfaces have private methods? 🟢

**Java 9** added `private` and `private static` methods in interfaces so that several default methods can **share code** without exposing a helper. (Not available in Java 8.)

### Q41. Name important default methods added to existing interfaces in Java 8. 🟢

`Iterable.forEach(Consumer)`, `Collection.stream() / parallelStream() / removeIf(Predicate)`, `List.replaceAll(UnaryOperator) / sort(Comparator)`, `Map.forEach / getOrDefault / putIfAbsent / computeIfAbsent / computeIfPresent / compute / merge / replaceAll`, `Comparator.reversed / thenComparing`, `Predicate.and / or / negate`, `Function.andThen / compose`.

### Q42. What is the `forEach()` method? Is it a terminal operation? 🟢

`Iterable.forEach(Consumer)` (a default method on every `Iterable`/`Collection`) iterates and applies the action to each element. `Stream.forEach(Consumer)` is a **terminal operation**; in a **parallel** stream order is **not guaranteed** (use `forEachOrdered` to preserve encounter order).

```java
list.forEach(System.out::println);
map.forEach((k, v) -> System.out.println(k + "=" + v));
```

* * *
## 6. Optional

### Q43. What is `Optional`? Why was it introduced? ⭐

**What?** `java.util.Optional<T>` is a **container that holds either one non-null value or nothing**. It makes the "value may be absent" case **visible in the method signature** instead of hiding it behind `null`.

**Why?** `null` is the source of `NullPointerException` (Tony Hoare's "billion dollar mistake"). A method returning `Optional<User>` forces the caller to *decide* what happens when there is no user, and it removes the nested `if (x != null)` pyramid.

```java
Optional<String> name  = Optional.of("Alice");          // value must be non-null (else NPE)
Optional<String> maybe = Optional.ofNullable(getName());// value may be null → empty Optional
Optional<String> none  = Optional.empty();

name.isPresent();                       // true
name.ifPresent(n -> System.out.println(n));          // runs only when present
name.orElse("Unknown");                 // "Alice"
none.orElse("Unknown");                 // "Unknown"
```

> **Interview one-liner:** Optional is a return-type wrapper that models absence explicitly and gives a fluent API (`map`, `filter`, `orElse`) instead of null checks.

### Q44. List the important `Optional` methods and when to use which. ⭐

| Method | Behaviour |
|--------|-----------|
| `of(v)` | Wrap a **non-null** value (NPE if null) |
| `ofNullable(v)` | Wrap a value that **may be null** |
| `empty()` | Empty Optional |
| `isPresent()` / `isEmpty()` (**Java 11**) | Check presence |
| `get()` | Returns value or throws `NoSuchElementException`. **Avoid** without checking |
| `orElse(other)` | Value or the given default (default is **always evaluated**) |
| `orElseGet(Supplier)` | Value or **lazily computed** default |
| `orElseThrow(Supplier)` | Value or throw your exception; `orElseThrow()` no-arg (**Java 10**) |
| `ifPresent(Consumer)` | Run action if present |
| `ifPresentOrElse(Consumer, Runnable)` | **(Java 9)** present / absent branches |
| `map(Function)` | Transform the value if present (returns `Optional<R>`) |
| `flatMap(Function<T, Optional<R>>)` | Like `map` but the function already returns an Optional (avoids `Optional<Optional<R>>`) |
| `filter(Predicate)` | Keep the value only if it matches, else empty |
| `or(Supplier<Optional>)` | **(Java 9)** alternative Optional if empty |
| `stream()` | **(Java 9)** 0 or 1 element stream (handy in `flatMap`) |

### Q45. `orElse` vs `orElseGet`: what is the difference? ⭐

`orElse(x)` evaluates **`x` eagerly, even when a value is present**. `orElseGet(supplier)` calls the supplier **only if the Optional is empty**.

```java
String value = optional.orElse(expensiveDefault());      // expensiveDefault() ALWAYS runs
String value = optional.orElseGet(() -> expensiveDefault()); // runs only when empty
```

Use `orElse` for **constants** (cheap), `orElseGet` for **anything costly or with side effects** (DB call, object creation, logging).

### Q46. `map` vs `flatMap` in `Optional`. 🧩 ⭐

```java
// Without Optional: null-check pyramid
String city = null;
if (user != null && user.getAddress() != null) city = user.getAddress().getCity();

// With Optional: flat chain, no nulls
String city = Optional.ofNullable(user)
        .map(User::getAddress)        // Address → Optional<Address>   (map wraps for you)
        .map(Address::getCity)
        .orElse("Unknown");

// If a getter already RETURNS Optional, use flatMap, otherwise you get Optional<Optional<Address>>
class User { Optional<Address> getAddress() {...} }
String city = Optional.of(user).flatMap(User::getAddress).map(Address::getCity).orElse("Unknown");
```

Rule: **`map` if the function returns a plain value, `flatMap` if it returns an `Optional`.**

### Q47. What are the best practices and anti-patterns for `Optional`? ⭐

**Do:**

- Use it as a **return type** where "no result" is a normal outcome (`findById`, `Stream.findFirst`).
- Prefer `orElse`, `orElseGet`, `orElseThrow`, `map`, `ifPresent` over `get()`.
- Return an **empty collection**, never `Optional<List<T>>`.

**Don't:**

- `if (opt.isPresent()) { opt.get() }` (that is a null check in disguise): use `ifPresent` / `map`.
- Use it as a **field** (not `Serializable`, extra memory), **method parameter** or in **collections**.
- Wrap it and then call `get()` blindly (the exception moves, not disappears).
- Use `Optional.of(maybeNull)`: it throws NPE; use `ofNullable`.
- Use **`Optional` for primitives**: use `OptionalInt`, `OptionalLong`, `OptionalDouble` (returned by `IntStream.max()`, `average()`).

### Q48. How do I handle a null value with `Optional` in a real scenario? 🟢

```java
class User { String email; String getEmail() { return email; } }
User user = new User();
String email = Optional.ofNullable(user.getEmail()).orElse("Email not available");

// Throw a domain exception when absent
User u = userRepo.findById(id).orElseThrow(() -> new UserNotFoundException(id));
```

### Q49. Is `Optional` serializable? Can it be used in `equals`/`hashCode`? 🟢

`Optional` is **not `Serializable`** (that is why it should not be a field). It has proper `equals`, `hashCode` and `toString` (`Optional[value]` / `Optional.empty`).

* * *

## 7. Stream API Fundamentals

### Q50. What is a Stream? ⭐

**What?** A `java.util.stream.Stream<T>` is a **sequence of elements supporting aggregate operations**, processed in a **pipeline**. It is **not a data structure**: it **stores nothing**, it just carries values from a **source** (collection, array, file, generator) through **operations** to a **result**.

**Key properties (memorize):**

| Property | Meaning |
|----------|---------|
| **Not a store** | Does not hold data; the source holds it |
| **Does not modify the source** | `filter`/`map` produce new results; the original list is untouched |
| **Lazy** | Intermediate operations do nothing until a **terminal** operation runs |
| **Consumable once** | After a terminal operation the stream is **closed**; reuse → `IllegalStateException: stream has already been operated upon or closed` |
| **Internal iteration** | The library iterates; you describe *what* to do |
| **Possibly unbounded** | `Stream.iterate`/`generate` are infinite; short-circuit with `limit` etc. |
| **Sequential or parallel** | Same pipeline, switch with `parallel()` |

**Shape of every pipeline:**

```
 SOURCE  →  intermediate op  →  intermediate op  →  TERMINAL op
 list        filter / map /      sorted / limit       collect / count /
             flatMap / distinct                       forEach / reduce
```

### Q51. What is the difference between `Collection` and `Stream`? ⭐

| Collection | Stream |
|------------|--------|
| **Stores** a group of objects as one entity (data structure) | **Processes** a group of objects (computation, no storage) |
| Eagerly populated; elements can be **added/removed** | Elements are produced **on demand**; cannot add/remove |
| **External iteration** (you write the loop) | **Internal iteration** |
| Can be traversed **many times** | Can be traversed **once** |
| Finite | Can be **infinite** |
| Work with elements individually (`get`, `contains`) | Apply functions to all elements together |

`java.util.stream` streams are **different** from `java.io` streams: `java.io` streams (`InputStream`, `Reader`) read **bytes/characters from files, sockets**; `java.util.stream` streams process **objects**.

### Q52. What are the ways to create a Stream? ⭐

```java
list.stream();                                  // from a Collection (default method added in Java 8)
list.parallelStream();                          // parallel from a Collection
Arrays.stream(new int[]{1, 2, 3});              // IntStream from array
Arrays.stream(new String[]{"x", "y"});          // Stream<String>
Stream.of("x", "y", "z");                       // from values
Stream.of(1, 2, 3, 4);
IntStream.range(1, 5);                          // 1,2,3,4        (end exclusive)
IntStream.rangeClosed(1, 5);                    // 1,2,3,4,5      (end inclusive)
"hello".chars();                                // IntStream of char codes
Files.lines(Paths.get("input.txt"));            // one element per line (close it: try-with-resources)
Stream.iterate(1, n -> n + 1);                  // infinite: 1,2,3,...
Stream.iterate(1, n -> n < 100, n -> n * 2);    // (Java 9) finite iterate with predicate
Stream.generate(Math::random);                  // infinite from a Supplier
Stream.builder().add("a").add("b").build();
new Random().ints(10, 0, 100);                  // 10 random ints
Pattern.compile(",").splitAsStream("a,b,c");
map.entrySet().stream();                        // Maps are not streamed directly; stream their entrySet/keySet/values
Stream.ofNullable(x);                           // (Java 9) 0 or 1 element
```

> **Pitfall:** `Stream.of(intArray)` gives `Stream<int[]>` (one element: the array). Use `Arrays.stream(intArray)` or `IntStream.of(intArray)`.

### Q53. Intermediate vs terminal operations. List them. ⭐

| | **Intermediate** | **Terminal** |
|---|------------------|--------------|
| Returns | **Another Stream** | A **value / collection / void** |
| Executes when | **Lazily**, only when a terminal op runs | Triggers the whole pipeline |
| How many | 0..n, chainable | Exactly 1 (closes the stream) |

**Intermediate (by nature):**

| Kind | Operations | Notes |
|------|-----------|-------|
| **Stateless** | `filter`, `map`, `mapToInt/Long/Double`, `mapToObj`, `flatMap`, `peek`, `boxed`, `asLongStream` | Each element processed independently |
| **Stateful** | `sorted`, `distinct` | Need to see **all** (or many) elements; `sorted` is a **barrier** |
| **Short-circuiting** | `limit`, `takeWhile` (Java 9) | Can stop early, so they work on infinite streams |
| **Stateful (positional)** | `skip`, `dropWhile` (Java 9) | Count or track position, but cannot end an infinite stream |

**Terminal:** `forEach`, `forEachOrdered`, `collect`, `reduce`, `count`, `min`, `max`, `sum`, `average` (primitive streams), `toArray`, `iterator`, and the **short-circuiting** terminals `anyMatch`, `allMatch`, `noneMatch`, `findFirst`, `findAny`. **(Java 16)** `toList()`.

### Q54. What is lazy evaluation? Show how elements flow through the pipeline. ⭐🧩

Intermediate operations **only build the pipeline**. Nothing runs until a terminal operation. When it does, elements flow **one at a time through all stages** (**vertical processing**), not stage-by-stage (horizontal).

```java
List<Integer> nums = List.of(1, 2, 3, 4);

Optional<Integer> r = nums.stream()
        .filter(n -> { System.out.println("filter " + n); return n % 2 == 0; })
        .map(n -> { System.out.println("map " + n); return n * 10; })
        .findFirst();
// Output:
// filter 1        ← 1 fails the filter, never reaches map
// filter 2        ← 2 passes
// map 2           ← mapped
// (stops: findFirst is short-circuiting; 3 and 4 are never touched)
// r = Optional[20]
```

```java
nums.stream().filter(n -> { System.out.println("never printed"); return true; });   // no terminal op → NOTHING runs
```

**Benefits:** unnecessary work is skipped, **no intermediate collections** are created, and operations are **fused into a single pass**.

**Exception, `sorted()`:** it must see **all elements** before emitting any, so everything before it runs for all elements first, then the rest flows. Put `filter` **before** `sorted` to sort fewer items.

### Q55. How does the Stream work internally? 🟢

Each intermediate call wraps the previous stage into a new **pipeline stage object** (`ReferencePipeline.Head → StatelessOp → StatelessOp ...`), recording the operation, but doing no work. When the terminal operation fires, the stages are chained into a **`Sink` chain** and the source's **`Spliterator`** pushes every element through it in **one pass**. A `Spliterator` ("splittable iterator") supports traversal and **splitting** for parallel streams, and reports characteristics (`SIZED`, `ORDERED`, `DISTINCT`, `SORTED`).

### Q56. `map` vs `flatMap`. ⭐🧩

- **`map`**: `Function<T, R>`, one input → **one output**. Structure preserved.
- **`flatMap`**: `Function<T, Stream<R>>`, one input → **zero or more outputs**, then all streams are **flattened** into one.

```java
List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3, 4), List.of(5));

nested.stream().map(l -> l).collect(toList());              // [[1, 2], [3, 4], [5]]  (still nested)
nested.stream().flatMap(List::stream).collect(toList());    // [1, 2, 3, 4, 5]

List<String> sentences = List.of("java is fun", "streams are lazy");
sentences.stream()
         .flatMap(s -> Arrays.stream(s.split(" ")))
         .collect(toList());        // [java, is, fun, streams, are, lazy]

// characters of words:  "Hello" → H,e,l,l,o
Stream.of("Hello", "world").flatMap(w -> w.chars().mapToObj(c -> (char) c))...
```

**Pattern 🧩:** whenever you see a **collection inside a collection** ("all orders of all customers", "all words in all lines", "all skills of all employees") → `flatMap`.

### Q57. `map` vs `mapToInt` and why use primitive streams? 🟢

`mapToInt/mapToLong/mapToDouble` return `IntStream/LongStream/DoubleStream`, which avoid boxing and add `sum()`, `average()`, `max()`, `min()`, `summaryStatistics()`. Convert back with `mapToObj` or `boxed()`.

```java
int total = employees.stream().mapToInt(Employee::getAge).sum();
double avg = employees.stream().mapToDouble(Employee::getSalary).average().orElse(0);
IntSummaryStatistics st = nums.stream().mapToInt(Integer::intValue).summaryStatistics();
st.getMin(); st.getMax(); st.getAverage(); st.getSum(); st.getCount();
```

### Q58. `filter`, `limit`, `skip`, `distinct`, `sorted`: what do they do? 🟢

| Operation | Behaviour |
|-----------|-----------|
| `filter(Predicate)` | Keep elements matching the condition |
| `limit(n)` | First `n` elements (short-circuits infinite streams) |
| `skip(n)` | Discard first `n` elements |
| `distinct()` | Remove duplicates using **`equals`/`hashCode`** (keeps the first occurrence; stateful) |
| `sorted()` | Natural order (elements must be `Comparable`, else `ClassCastException`) |
| `sorted(Comparator)` | Custom order (stable for ordered streams) |
| `takeWhile(Predicate)` | **(Java 9)** take elements until the first failure |
| `dropWhile(Predicate)` | **(Java 9)** drop elements until the first failure, then keep the rest |

`sorted()` produces a sorted **view in the stream**; the original list order is unchanged.

### Q59. `findFirst` vs `findAny`. ⭐

Both return `Optional<T>` (empty if the stream is empty) and **short-circuit**.

- `findFirst()` → always the **first in encounter order** (deterministic).
- `findAny()` → **any** element; in a **parallel** stream it may differ between runs but is **faster** (no coordination). In sequential streams it usually returns the first.

### Q60. `anyMatch`, `allMatch`, `noneMatch`: how do they behave on an empty stream? 🧩

| Method | Returns `true` when... | On an **empty** stream |
|--------|------------------------|------------------------|
| `anyMatch(p)` | at least one element matches | **`false`** |
| `allMatch(p)` | **all** elements match | **`true`** (vacuous truth!) |
| `noneMatch(p)` | **no** element matches | **`true`** |

All short-circuit: `anyMatch` stops at the first match, `allMatch`/`noneMatch` at the first counter-example.

### Q61. `forEach` vs `forEachOrdered` vs `peek`. 🟢

- `forEach`: terminal; in a parallel stream the order is **not** guaranteed.
- `forEachOrdered`: terminal; processes in **encounter order** even when parallel (loses some parallel benefit).
- `peek(Consumer)`: **intermediate**, runs an action on each element as it flows by. Meant for **debugging** (print/log). Do not use it for real work (side effects), and note that from **Java 9** `count()` may skip the pipeline entirely when the size is known from the source:

```java
long c = List.of(1, 2, 3).stream().peek(System.out::println).count();   // Java 9+: prints nothing, returns 3
```

### Q62. `map()` vs `peek()`. 🟢

`map` **transforms** elements (the output stream carries the new values). `peek` only **observes** (the stream carries the same elements); use it to debug a pipeline.

### Q63. What does `reduce()` do? Explain all three forms. ⭐🧩

`reduce` **combines all elements into a single value** by repeatedly applying an operation.

```java
// 1) Optional<T> reduce(BinaryOperator<T>)            - no identity → may be empty
Optional<Integer> sum = nums.stream().reduce((a, b) -> a + b);

// 2) T reduce(T identity, BinaryOperator<T>)          - identity is the starting value / neutral element
int sum = nums.stream().reduce(0, Integer::sum);       // 0 for +, 1 for *, "" for concat
int max = nums.stream().reduce(Integer.MIN_VALUE, Integer::max);

// 3) <U> U reduce(U identity, BiFunction<U,T,U> accumulator, BinaryOperator<U> combiner)
//    result type differs from element type; combiner merges partial results in parallel
int totalLength = words.stream().reduce(0, (acc, w) -> acc + w.length(), Integer::sum);
```

**Trace for `[1,2,3,4]` with `reduce(0, +)`:** `0+1=1 → 1+2=3 → 3+3=6 → 6+4=10`.

**Rules for correctness (essential for parallel streams):** the operator must be **associative**, **stateless**, and the identity must satisfy `op(identity, x) == x`.

### Q64. `reduce()` vs `collect()`. ⭐

| `reduce` | `collect` |
|----------|-----------|
| **Immutable reduction**: combines into a **single value** (number, String) | **Mutable reduction**: accumulates into a **mutable container** (List, Set, Map, StringBuilder) |
| Creates a **new object each step** | **Mutates one container** (supplier → accumulator → combiner → finisher) |
| `reduce(0, Integer::sum)` | `collect(Collectors.toList())` |

**Do not** use `reduce` to build a collection (`reduce(new ArrayList<>(), ...)`): it copies on every step (O(n²)) and is unsafe in parallel. Use `collect`.

### Q65. What do `count()`, `min()`, `max()`, `sum()`, `average()` return? 🟢

`count()` → `long`. `min(cmp)`/`max(cmp)` on `Stream<T>` → `Optional<T>`. On `IntStream`: `sum()` → `int`, `max()/min()` → `OptionalInt`, `average()` → `OptionalDouble`.

```java
Optional<Employee> oldest = emps.stream().max(Comparator.comparingInt(Employee::getAge));
OptionalInt maxAge = emps.stream().mapToInt(Employee::getAge).max();
```

**Ties:** `max` returns the **first** of equal maxima (it uses `BinaryOperator.maxBy`, which keeps the earlier one when `compare >= 0`).

### Q66. How do I convert a stream to an array? 🟢

```java
Integer[] arr = nums.stream().toArray(Integer[]::new);   // typed array via constructor reference
int[] prim    = nums.stream().mapToInt(Integer::intValue).toArray();
Object[] objs = nums.stream().toArray();                 // no generator → Object[]
```

### Q67. What is a short-circuiting operation? 🟢

An operation that can **finish without processing all elements**: intermediate `limit`, `takeWhile`; terminal `findFirst`, `findAny`, `anyMatch`, `allMatch`, `noneMatch`. Essential for infinite streams: `Stream.iterate(1, n -> n + 1).filter(n -> n % 7 == 0).limit(5)`.

### Q68. Can a stream be reused? What happens? ⭐

No. After a terminal operation, the stream is closed:

```java
Stream<Integer> s = list.stream();
s.forEach(System.out::println);
s.count();     // IllegalStateException: stream has already been operated upon or closed
```

Create a new stream each time, or keep a `Supplier<Stream<T>> sup = () -> list.stream();` and call `sup.get()` when needed.

### Q69. How do I stream a `Map`? 🟢

A `Map` is not a `Collection`, so stream its views:

```java
map.entrySet().stream()
   .filter(e -> e.getValue() > 10)
   .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
   .map(Map.Entry::getKey)
   .collect(toList());
map.keySet().stream();   map.values().stream();
```

### Q70. What is `StringJoiner` and how does it relate to `Collectors.joining`? 🟢

`StringJoiner` builds a delimited string with optional prefix/suffix; `Collectors.joining(delim, prefix, suffix)` uses it internally.

```java
StringJoiner j = new StringJoiner(".", "Prefix-", "-suffix");
for (String s : "Hello the brave world".split(" ")) j.add(s);
System.out.println(j);     // Prefix-Hello.the.brave.world-suffix
String.join(", ", "a", "b", "c");     // a, b, c
```

### Q71. How do I generate 10 random numbers, sorted? 🟢

```java
new Random().ints(10, 0, 100).sorted().forEach(System.out::println);
```

### Q72. `Stream.of` vs `Arrays.stream` vs `Collection.stream`? 🟢

`Stream.of(a, b, c)` for literal values (passing a single array of references works; a primitive array becomes one element). `Arrays.stream(arr)` for arrays (primitive arrays give `IntStream` etc.; supports ranges `Arrays.stream(arr, from, to)`). `collection.stream()` for collections.

### Q73. What new Stream methods came after Java 8? 🟢

| Java | Additions |
|------|-----------|
| 9 | `takeWhile`, `dropWhile`, `iterate(seed, hasNext, next)`, `Stream.ofNullable`, `Collectors.filtering/flatMapping` |
| 10 | `Collectors.toUnmodifiableList/Set/Map` |
| 12 | `Collectors.teeing` |
| 16 | `Stream.toList()` (unmodifiable), `mapMulti` |

### Q74. What is the difference between `Collectors.toList()` and `Stream.toList()`? 🟢

`Collectors.toList()` returns a **mutable `ArrayList`** in practice but makes **no guarantee** of type, mutability or serializability. `Stream.toList()` (**Java 16**) returns an **unmodifiable** list and allows `null` elements (unlike `List.of`).

### Q75. When should I use parallel streams? Short answer. 🟢

For **large, CPU-bound, stateless** pipelines on easily splittable sources (`ArrayList`, arrays, `IntStream.range`) when ordering does not matter. Details are in the [Parallel Streams](#9-parallel-streams-and-completablefuture) section.

* * *

## 8. Collectors Deep Dive

The examples use this sample data (also used in the [problem section](#13-solved-stream-problems-by-pattern)):

```java
class Employee {
    private int id; private String name; private int age; private String gender;
    private String dept; private double salary; private int yearOfJoining;
    Employee(int id, String name, int age, String gender, String dept, double salary, int yoj) {
        this.id = id; this.name = name; this.age = age; this.gender = gender;
        this.dept = dept; this.salary = salary; this.yearOfJoining = yoj;
    }
    public int getId() { return id; }              public String getName() { return name; }
    public int getAge() { return age; }            public String getGender() { return gender; }
    public String getDept() { return dept; }       public double getSalary() { return salary; }
    public int getYearOfJoining() { return yearOfJoining; }
    @Override public String toString() { return name; }
}
```

| id | name | age | gender | dept | salary | joined |
|----|------|-----|--------|------|--------|--------|
| 1 | Asha | 28 | F | IT | 60000 | 2018 |
| 2 | Ravi | 35 | M | IT | 90000 | 2014 |
| 3 | Meena | 32 | F | HR | 50000 | 2016 |
| 4 | Karan | 41 | M | HR | 70000 | 2010 |
| 5 | Divya | 26 | F | Finance | 55000 | 2021 |
| 6 | Arun | 38 | M | Finance | 80000 | 2012 |
| 7 | Neha | 30 | F | IT | 90000 | 2017 |
| 8 | Vikram | 45 | M | Sales | 65000 | 2008 |

> **Printing note:** `groupingBy`/`toMap` return a `HashMap`, so a real run may print string keys in a different order (for example `{Sales=1, Finance=2, HR=2, IT=3}`). Map results in this file are written with keys in alphabetical order for readability. The *contents* are what matter.

### Q76. What is a `Collector`? What are its four parts? ⭐

`collect(Collector)` is the terminal operation that performs a **mutable reduction**. A `Collector<T, A, R>` has four functions:

| Part | Role | Example for `toList()` |
|------|------|-----------------------|
| **supplier** | Creates the empty mutable container | `ArrayList::new` |
| **accumulator** | Adds one element into the container | `List::add` |
| **combiner** | Merges two containers (parallel streams) | `(l1, l2) -> { l1.addAll(l2); return l1; }` |
| **finisher** | Optional final transformation | identity |

```java
Collector<String, StringBuilder, String> joiner = Collector.of(
        StringBuilder::new,                       // supplier
        StringBuilder::append,                    // accumulator
        (a, b) -> { a.append(b); return a; },     // combiner: must RETURN the merged container
        StringBuilder::toString);                 // finisher
Stream.of("Hello", ", ", "World").collect(joiner);   // "Hello, World"
```

### Q77. List the important `Collectors` with examples. ⭐

```java
// To collections
.collect(toList());  .collect(toSet());  .collect(toCollection(TreeSet::new));
.collect(toMap(Employee::getId, Employee::getName));          // Map<Integer,String>

// Strings
.map(Employee::getName).collect(joining(", ", "[", "]"));     // [Asha, Ravi, ...]

// Numbers
.collect(counting());                                          // Long
.collect(summingDouble(Employee::getSalary));                  // 560000.0
.collect(averagingDouble(Employee::getSalary));                // 70000.0
.collect(summarizingDouble(Employee::getSalary));              // count, sum, min, average, max
.collect(maxBy(Comparator.comparingDouble(Employee::getSalary)));   // Optional<Employee>

// Grouping and partitioning
.collect(groupingBy(Employee::getDept));                       // Map<String, List<Employee>>
.collect(partitioningBy(e -> e.getSalary() > 60000));          // Map<Boolean, List<Employee>> (keys false, true)

// Wrappers
.collect(mapping(Employee::getName, toList()));                // transform then collect (use as downstream)
.collect(collectingAndThen(toList(), Collections::unmodifiableList));
.collect(reducing(0.0, Employee::getSalary, Double::sum));
.collect(teeing(counting(), summingDouble(Employee::getSalary), (n, sum) -> sum / n));   // Java 12
```

### Q78. How does `groupingBy` work? Explain the three overloads. ⭐🧩

`groupingBy(classifier)` puts each element into the bucket named by `classifier(element)`; the default result is a `HashMap<K, List<T>>`.

```java
// 1) classifier only → Map<K, List<T>>
Map<String, List<Employee>> byDept = emps.stream().collect(groupingBy(Employee::getDept));
// {Finance=[Divya, Arun], HR=[Meena, Karan], IT=[Asha, Ravi, Neha], Sales=[Vikram]}

// 2) classifier + downstream collector → what to do WITH each group
Map<String, Long> count = emps.stream().collect(groupingBy(Employee::getDept, counting()));
// {Finance=2, HR=2, IT=3, Sales=1}
Map<String, Double> avg = emps.stream().collect(groupingBy(Employee::getDept, averagingDouble(Employee::getSalary)));
// {Finance=67500.0, HR=60000.0, IT=80000.0, Sales=65000.0}
Map<String, List<String>> names = emps.stream()
        .collect(groupingBy(Employee::getDept, mapping(Employee::getName, toList())));
// {Finance=[Divya, Arun], HR=[Meena, Karan], IT=[Asha, Ravi, Neha], Sales=[Vikram]}

// 3) classifier + map factory + downstream → choose the Map type (sorted / insertion ordered)
Map<String, Long> sorted = emps.stream().collect(groupingBy(Employee::getDept, TreeMap::new, counting()));
Map<String, Long> insertion = emps.stream().collect(groupingBy(Employee::getDept, LinkedHashMap::new, counting()));
```

**Multi-level grouping:**

```java
Map<String, Map<String, Long>> deptGender = emps.stream().collect(
        groupingBy(Employee::getDept, groupingBy(Employee::getGender, counting())));
// {IT={F=2, M=1}, HR={F=1, M=1}, Finance={F=1, M=1}, Sales={M=1}}
```

**Max/min per group:** `groupingBy` + `maxBy` returns `Optional`, so unwrap it:

```java
Map<String, Employee> top = emps.stream().collect(groupingBy(Employee::getDept,
        collectingAndThen(maxBy(Comparator.comparingDouble(Employee::getSalary)), Optional::get)));
// {Finance=Arun, HR=Karan, IT=Ravi, Sales=Vikram}
```

> Result map order is **not guaranteed** (`HashMap`); use the 3-argument form for `TreeMap`/`LinkedHashMap`.

### Q79. `groupingBy` vs `partitioningBy`. ⭐

| `groupingBy` | `partitioningBy` |
|--------------|------------------|
| Classifier returns **any key** → **n groups** | Predicate → **exactly two groups** |
| Key type = classifier result | Keys are always **`Boolean`** (`false`, `true`) |
| Missing group → no key | **Both keys always present** (empty list if none) |
| Default `HashMap` | Special compact two-entry map |

```java
Map<Boolean, List<Employee>> byGender = emps.stream().collect(partitioningBy(e -> e.getGender().equals("F")));
// true=[Asha, Meena, Divya, Neha], false=[Ravi, Karan, Arun, Vikram]
Map<Boolean, Long> cnt = nums.stream().collect(partitioningBy(n -> n % 2 == 0, counting()));
```

### Q80. How does `toMap` work and what are its traps? ⭐

```java
Map<Integer, String> idToName = emps.stream().collect(toMap(Employee::getId, Employee::getName));
```

**Traps:**

1. **Duplicate keys → `IllegalStateException: Duplicate key ...`**. Provide a **merge function** (3-arg form):
   ```java
   Map<String, Double> totalByDept = emps.stream()
           .collect(toMap(Employee::getDept, Employee::getSalary, Double::sum));   // IT=240000, HR=120000, Finance=135000, Sales=65000
   ```
2. **`null` values → `NullPointerException`** (uses `HashMap.merge`).
3. Default map type is `HashMap`; pass a 4th argument for `LinkedHashMap::new` / `TreeMap::new`.
4. For concurrent/parallel use `toConcurrentMap`.

### Q81. `Collectors.joining`, `counting`, `summingInt`, `averagingInt`: return types? 🟢

`joining` → `String`. `counting()` → `Long`. `summingInt` → `Integer` (`summingLong` → `Long`, `summingDouble` → `Double`). `averagingInt/Long/Double` → **`Double`**. `summarizingInt` → `IntSummaryStatistics`. Mixing these up in a `Map<String, Integer>` declaration is a common compile error: `counting()` gives `Map<K, Long>`.

### Q82. What is `collectingAndThen`? 🟢

Applies a **finisher** to another collector's result: `collectingAndThen(toList(), Collections::unmodifiableList)`, `collectingAndThen(maxBy(cmp), Optional::get)`, `collectingAndThen(counting(), Long::intValue)`.

### Q83. What is `Collectors.teeing` (Java 12)? 🟢

Runs **two collectors over the same stream** and merges their results with a function: one pass, two results.

```java
double avg = emps.stream().collect(teeing(summingDouble(Employee::getSalary), counting(), (sum, n) -> sum / n));   // 70000.0
```

### Q84. `Collectors.filtering` and `flatMapping` (Java 9): why? 🟢

Inside a `groupingBy`, a **stream `filter` before grouping removes empty groups** entirely, while `filtering` as a **downstream** keeps the group key (with an empty list).

```java
// Departments with their employees earning > 60000 (empty list kept for departments with none)
emps.stream().collect(groupingBy(Employee::getDept, filtering(e -> e.getSalary() > 60000, toList())));
```

### Q85. How do I write a custom collector? 🟢

Use `Collector.of(supplier, accumulator, combiner, finisher)` (see Q76). The combiner **must return** the merged container (a classic compile error is writing a block lambda without `return`).

### Q86. Which collection does `Collectors.toSet()` return, and does it keep order? 🟢

A `HashSet` (no order guarantee, no duplicates). Use `toCollection(LinkedHashSet::new)` to keep encounter order, `toCollection(TreeSet::new)` for sorted.

* * *

## 9. Parallel Streams and CompletableFuture

### Q87. How do parallel streams work? ⭐

`list.parallelStream()` or `stream.parallel()`. The source is **split** (via its `Spliterator`) into chunks, chunks are processed on **multiple threads** of the **common `ForkJoinPool`**, and partial results are **combined** (the `combiner`/associative operation). Parallelism defaults to **number of cores − 1** (+ the calling thread). `isParallel()` tells you; `sequential()` switches back (the **last** call wins for the whole pipeline).

```java
long count = LongStream.rangeClosed(1, 10_000_000).parallel().filter(n -> n % 3 == 0).count();
```

### Q88. Sequential vs parallel streams: when to use each? ⭐

**Parallel helps when:** large data (roughly > 10,000 elements and **real work per element**), **CPU-bound** and **stateless** operations, **cheap-to-split sources** (`ArrayList`, arrays, `IntStream.range`, `HashMap` is OK-ish), **order does not matter**, many cores available.

**Parallel hurts when:**

| Problem | Why |
|---------|-----|
| Small data | Thread/split/merge overhead dominates |
| **I/O-bound** (DB, HTTP) | Threads just wait; and they block the **shared** common pool |
| `LinkedList`, `Stream.iterate`, `TreeSet` | Poor splitting |
| **Shared mutable state** | Race conditions, wrong results |
| Operations needing order (`limit`, `skip`, `findFirst`, `forEachOrdered`, `sorted`) | Expensive coordination |
| Boxed types | Boxing cost; prefer `IntStream` |

> **Rule:** *measure first*. Parallel is an optimization, not a default.

### Q89. What are the risks of parallel streams? ⭐

1. **Thread-unsafe accumulation** (e.g. adding to a shared `ArrayList` inside `forEach`) → lost updates / `ArrayIndexOutOfBounds`. Use `collect`, not side effects.
2. **Shared common pool:** a slow parallel pipeline can starve **every other** parallel stream and `CompletableFuture.supplyAsync()` using the default pool. For isolation, run the parallel stream inside your own `ForkJoinPool.submit(...)`.
3. **Ordering:** `forEach` order is arbitrary (`forEachOrdered` preserves it).
4. **Non-associative reduce** (e.g. subtraction) gives nondeterministic results.
5. **Non-thread-safe sources** modified during traversal.

```java
// WRONG
List<Integer> out = new ArrayList<>();
IntStream.range(0, 1000).parallel().forEach(out::add);     // race condition

// RIGHT
List<Integer> out = IntStream.range(0, 1000).parallel().boxed().collect(toList());
```

### Q90. What is `ForkJoinPool` and how do parallel streams use it? 🟢

`ForkJoinPool` is a thread pool for **divide-and-conquer** tasks using **work stealing** (idle threads steal queued subtasks from busy threads). Parallel streams use the static **`ForkJoinPool.commonPool()`**: a task is **forked** (split) until small enough, solved, and results **joined**. Tune with `-Djava.util.concurrent.ForkJoinPool.common.parallelism=N`.

### Q91. What is `Spliterator` and how is it different from `Iterator`? 🟢

| Feature | `Iterator` | `Spliterator` |
|---------|------------|---------------|
| Parallel support | No | **Yes** via `trySplit()` |
| Traversal | External: `hasNext()` + `next()` | Internal: `tryAdvance()`, `forEachRemaining()` |
| Size estimate | No | `estimateSize()` |
| Characteristics | None | `ORDERED`, `SIZED`, `SORTED`, `DISTINCT`, `IMMUTABLE`... |

### Q92. How do I use `Collection.removeIf`, `replaceAll` and `sort`? 🟢

```java
list.removeIf(s -> s.startsWith("B"));            // remove matching (safe, no CME)
list.replaceAll(String::toUpperCase);             // transform in place (List only)
list.sort(Comparator.comparing(String::length));  // in-place stable sort
```

### Q93. What is `CompletableFuture`? Why is it better than `Future`? ⭐

`Future` (Java 5) problems: `get()` **blocks**, you **cannot chain** tasks, **cannot complete manually**, no built-in **exception handling** or **combining**. `CompletableFuture<T>` (Java 8) implements `Future` **and `CompletionStage`**, giving a **non-blocking, composable pipeline** of async steps, like streams for asynchronous values.

```java
CompletableFuture<Void> f = CompletableFuture
        .supplyAsync(() -> fetchUserById("42"))          // runs on ForkJoinPool.commonPool (or your executor)
        .thenApply(user -> enrich(user))                  // transform result
        .thenAccept(user -> System.out.println(user))     // consume
        .exceptionally(ex -> { log(ex); return null; });  // recover
f.join();                                                 // wait if you must
```

### Q94. List the important `CompletableFuture` methods. ⭐

| Need | Method |
|------|--------|
| Start async | `supplyAsync(Supplier[, executor])` (returns value), `runAsync(Runnable)` (no value) |
| Transform result | `thenApply(Function)` (sync step), `thenApplyAsync` |
| Consume result | `thenAccept(Consumer)`, `thenRun(Runnable)` |
| **Chain dependent async call** (flat) | **`thenCompose(Function<T, CompletableFuture<U>>)`** |
| **Combine two independent** futures | **`thenCombine(other, BiFunction)`** |
| Wait for many | `allOf(f1, f2, ...)` (CF<Void>), `anyOf(...)` |
| Error handling | `exceptionally(Function)`, `handle(BiFunction<T, Throwable, R>)` (success **and** failure), `whenComplete` |
| Get result | `join()` (unchecked `CompletionException`), `get()` (checked exceptions), `getNow(default)` |
| Manual | `complete(value)`, `completeExceptionally(ex)` |
| Timeouts (**Java 9**) | `orTimeout`, `completeOnTimeout` |

**`thenApply` vs `thenCompose`** is the `map` vs `flatMap` of futures: if your function **returns a `CompletableFuture`**, use `thenCompose` (otherwise you get `CompletableFuture<CompletableFuture<T>>`).

### Q95. Show a realistic example: call two services in parallel and combine. ⭐

```java
ExecutorService io = Executors.newFixedThreadPool(10);   // dedicated pool for blocking I/O

CompletableFuture<User>  userF  = CompletableFuture.supplyAsync(() -> userService.get(id), io);
CompletableFuture<List<Order>> ordersF = CompletableFuture.supplyAsync(() -> orderService.byUser(id), io);

CompletableFuture<Profile> profileF = userF.thenCombine(ordersF, Profile::new)   // both done → build
        .exceptionally(ex -> Profile.empty());

Profile p = profileF.join();    // total time ≈ max(userCall, orderCall), not the sum

// many futures
List<CompletableFuture<Price>> fs = ids.stream().map(i -> CompletableFuture.supplyAsync(() -> price(i), io)).collect(toList());
CompletableFuture.allOf(fs.toArray(new CompletableFuture[0])).join();
List<Price> prices = fs.stream().map(CompletableFuture::join).collect(toList());
```

**Always pass your own executor for blocking I/O**; the default common pool is sized for CPU work and shared.

### Q96. `join()` vs `get()`. 🟢

Both block for the result. `get()` throws **checked** `InterruptedException` and `ExecutionException`. `join()` throws unchecked `CompletionException` (convenient in lambdas and streams).

### Q97. How is `CompletableFuture` different from a parallel stream? 🟢

A parallel stream parallelizes **one data-parallel computation** on the common pool and **blocks** until done. `CompletableFuture` composes **independent asynchronous tasks** (often I/O), **non-blocking**, with explicit **executor, timeout and error handling**.

* * *

## 10. Date and Time API (java.time)

### Q98. Why a new Date and Time API? What was wrong with `Date` and `Calendar`? ⭐

| Old (`java.util.Date`, `Calendar`, `SimpleDateFormat`) | New (`java.time`, JSR-310) |
|---------------------------------------------------------|----------------------------|
| **Mutable** → not thread-safe | **Immutable** and **thread-safe** (every change returns a new object) |
| `Date` is really a **timestamp**, misleading name and toString | Clear separate types: date, time, date-time, zone, instant |
| Months start at **0**, years offset from 1900 | Months **1–12**, real years |
| `SimpleDateFormat` is **not thread-safe** | `DateTimeFormatter` is **thread-safe** |
| Poor time-zone and DST handling | Full **IANA zone** rules (`ZoneId`, `ZonedDateTime`) |
| Clumsy arithmetic | Fluent: `plusDays`, `minusMonths`, `with(...)` |

The API is **inspired by Joda-Time** (same lead author) but it is Oracle's own `java.time`, not the Joda library itself (the PDF calls it "Joda-Time API").

### Q99. Key classes of `java.time`? ⭐

| Class | Represents | Example |
|-------|-----------|---------|
| `LocalDate` | Date only (no time, no zone) | `2026-11-10` |
| `LocalTime` | Time only | `12:39:26.587` |
| `LocalDateTime` | Date + time, **no zone** | `2026-11-10T12:39:26` |
| `ZonedDateTime` | Date + time + **time zone** (with DST rules) | `...[Asia/Kolkata]` |
| `OffsetDateTime` | Date + time + **fixed UTC offset** | `...+05:30` |
| `Instant` | A point on the UTC timeline (machine time, epoch nanos) | timestamps, logs |
| `ZoneId` / `ZoneOffset` | Time zone / fixed offset | `ZoneId.of("America/Los_Angeles")` |
| `Period` | **Date-based** amount: years, months, days | "2 months 3 days" |
| `Duration` | **Time-based** amount: hours, minutes, seconds, nanos | "PT2H30M" |
| `Year`, `YearMonth`, `MonthDay`, `DayOfWeek`, `Month` | Convenience types | `Year.of(2024).isLeap()` |
| `DateTimeFormatter` | Format / parse | `ofPattern("dd-MM-yyyy")` |
| `ChronoUnit` | Units for `between` | `ChronoUnit.DAYS.between(a, b)` |
| `TemporalAdjusters` | Smart date adjustments | `next(DayOfWeek.TUESDAY)` |

### Q100. Common `java.time` operations. 🟢

```java
LocalDate today = LocalDate.now();
LocalTime now   = LocalTime.now();
LocalDateTime dt = LocalDateTime.now();

LocalDate d = LocalDate.of(1995, Month.APRIL, 28);          // or LocalDate.of(1995, 4, 28)
int dd = d.getDayOfMonth(), mm = d.getMonthValue(), yy = d.getYear();

LocalDateTime dt1 = LocalDateTime.of(1995, Month.APRIL, 28, 12, 45);
dt.plusMonths(6);  dt.minusMonths(6);  today.plusWeeks(1);  today.plusYears(10);

today.with(TemporalAdjusters.next(DayOfWeek.TUESDAY));           // next Tuesday
today.with(TemporalAdjusters.firstDayOfMonth());
today.isBefore(d);  today.isAfter(d);  today.isLeapYear();

ZoneId la = ZoneId.of("America/Los_Angeles");
ZonedDateTime zt = ZonedDateTime.now(la);
ZonedDateTime ist = zt.withZoneSameInstant(ZoneId.of("Asia/Kolkata"));   // same moment, other zone
ZoneId.systemDefault();

Period p = Period.between(LocalDate.of(1989, 6, 15), today);
System.out.printf("age is %d years %d months %d days", p.getYears(), p.getMonths(), p.getDays());
long days = ChronoUnit.DAYS.between(d, today);
Duration du = Duration.between(LocalTime.of(9, 0), LocalTime.of(17, 30));   // du.toMinutes() = 510

Year.of(2024).isLeap();     // true

DateTimeFormatter f = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");
String s = dt.format(f);   LocalDateTime parsed = LocalDateTime.parse("10-11-2026 09:30", f);
```

### Q101. `Period` vs `Duration`. 🟢

`Period` works with **dates** (years/months/days; `Period.between(LocalDate, LocalDate)`). `Duration` works with **time** (seconds/nanos; `Duration.between(Instant/LocalTime/LocalDateTime)`). Using `Duration` between two dates throws `UnsupportedTemporalTypeException` for `LocalDate`.

### Q102. `LocalDateTime` vs `ZonedDateTime` vs `Instant`: which for what? ⭐

- **`Instant`**: store/transmit **exact moments** (DB timestamps in UTC, logs, event times, Kafka event time).
- **`ZonedDateTime`**: show/calculate for a **user's region** (meeting at 10:00 in Kolkata, DST-aware).
- **`LocalDateTime`**: a **calendar reading with no zone** (a birthday, "store opens at 09:00"). Never use it to represent a moment: it is ambiguous.

### Q103. How do I convert between old `Date` and new types? 🟢

```java
Instant i = new Date().toInstant();                 Date d = Date.from(instant);
LocalDateTime ldt = LocalDateTime.ofInstant(i, ZoneId.systemDefault());
Instant back = ldt.atZone(ZoneId.systemDefault()).toInstant();
java.sql.Date sd = java.sql.Date.valueOf(localDate); LocalDate ld = sd.toLocalDate();
Instant now = Instant.now();                        // current time (millis/nanos), not new Date()
```

### Q104. What are the common `java.time` pitfalls? ⭐

1. **Integer literals with a leading zero are octal**: `LocalDate.of(1989, 06, 15)` compiles (06 = 6) but `LocalDate.of(2024, 08, 15)` is a **compile error** (`08` is not a valid octal). Write `8` or `Month.AUGUST`.
2. Invalid dates throw `DateTimeException` (`LocalDate.of(2023, 2, 30)`).
3. **Month-end arithmetic** clamps: `LocalDate.of(2024, 1, 31).plusMonths(1)` → `2024-02-29`.
4. Everything is **immutable**: `date.plusDays(1);` alone does nothing; assign the result.
5. `LocalDateTime` has **no zone**: do not convert it to an `Instant` without choosing a zone.
6. Prefer `Clock` injection (`LocalDate.now(clock)`) for **testable** time code.
7. Leap year check: `Year.of(n).isLeap()` or `LocalDate.isLeapYear()`.

* * *

## 11. Other Java 8 Changes

### Q105. What are repeatable annotations? 🟢

Java 8 lets you apply the **same annotation more than once**. Declare the annotation with `@Repeatable(Container.class)` and a **container annotation** with a `value()` array.

```java
@Repeatable(Schedulers.class)
@interface Scheduler { String birthday() default "Jan 8 2000"; }
@interface Schedulers { Scheduler[] value(); }

@Scheduler(birthday = "Jan 1") @Scheduler(birthday = "Feb 2")
class Demo {}
```

### Q106. What are type annotations? 🟢

Annotations can be written **wherever a type is used** (`@NonNull String`, `List<@NonNull String>`, `new @Interned Object()`, casts, `throws`), enabling stronger static checking (e.g. the Checker Framework).

### Q107. What is the `Base64` class? 🟢

`java.util.Base64` (thread-safe; RFC 4648 / 2045) with encoders/decoders: **basic** (`getEncoder/getDecoder`), **URL-safe** (`getUrlEncoder/getUrlDecoder`), **MIME** (`getMimeEncoder/getMimeDecoder`).

```java
String b64 = Base64.getEncoder().encodeToString("input".getBytes(StandardCharsets.UTF_8));   // aW5wdXQ=
String txt = new String(Base64.getDecoder().decode(b64), StandardCharsets.UTF_8);            // input
```

### Q108. What is Nashorn and `jjs`? 🟢

**Nashorn** was Java 8's JavaScript engine (replaced Rhino; compiled JS to bytecode in memory; call Java from JS). `jjs` was the command-line tool. Nashorn was **deprecated in Java 11 and removed in Java 15**; use GraalVM JS if you need it today.

### Q109. What is `PermGen` removal / Metaspace? 🟢

Java 8 removed the **Permanent Generation** (fixed-size heap area for class metadata, source of `OutOfMemoryError: PermGen space`) and introduced **Metaspace** in **native memory**, which grows dynamically (cap with `-XX:MaxMetaspaceSize`).

### Q110. Other small but useful Java 8 additions? 🟢

- `Arrays.parallelSort`, `Arrays.setAll`, `Arrays.parallelPrefix`.
- `String.join(delim, ...)`, `StringJoiner`.
- `Integer.sum/max/min`, `Math.addExact/multiplyExact/toIntExact`, unsigned integer methods (`Integer.parseUnsignedInt`, `compareUnsigned`).
- `Objects.requireNonNull`, `Objects.isNull/nonNull`.
- `Files.lines`, `Files.list`, `Files.walk` (return streams; close them).
- Concurrency: `CompletableFuture`, `ConcurrentHashMap` bulk operations (`forEach`, `reduce`, `search`) and `mappingCount`, **`LongAdder`/`LongAccumulator`** (better than `AtomicLong` under contention), **`StampedLock`**.
- `Map` methods: `getOrDefault`, `putIfAbsent`, `computeIfAbsent`, `computeIfPresent`, `compute`, `merge`, `replaceAll`, `forEach` (see the [Collections page](collections.md)).
- Reflection: method parameter names (`-parameters`), `java.lang.reflect.Executable`.
- `HashMap` internals changed (tree bins).

* * *
## 12. Stream Problem-Solving Playbook

> Hundreds of Stream interview questions exist online, but almost all of them are **the same ~15 patterns in different clothes**. Learn to recognise the pattern and you can solve questions you have never seen. This section is the method; the next section is practice.

### 12.1 The 5-step method for any unseen Stream question 🧩

```
STEP 1  What is my SOURCE?           list / array / String chars / Map entries / numeric range / file lines
STEP 2  What is the SHAPE of the OUTPUT?   one value · Optional · boolean · count · List · Set · Map · String
STEP 3  Pick the TERMINAL operation from the output shape   (table 12.2)
STEP 4  Fill the MIDDLE: what must happen to the elements before that?   (table 12.3)
STEP 5  Check the EDGES: empty input, nulls, duplicates, ties, ordering of Map results, primitive vs boxed
```

> **Work backwards from the output.** Beginners start at the source and get lost. Decide the final type first, the terminal operation almost writes itself.

### 12.2 Output shape → terminal operation

| The answer should be... | Terminal operation |
|-------------------------|--------------------|
| true / false ("is there...", "are all...", "none...") | `anyMatch`, `allMatch`, `noneMatch` |
| a number of elements ("how many") | `count()` |
| one element (the oldest, the highest, the first) | `max/min(cmp)`, `findFirst()` (→ `Optional`) |
| a sum / average / min / max of numbers | `mapToInt/Double(...).sum()/average()/max()` or `summaryStatistics()` |
| one combined value (product, concatenation, custom fold) | `reduce(identity, op)` |
| a List / Set | `collect(toList())`, `toSet()`, `toCollection(...)` (or `.toList()` Java 16) |
| a Map (lookup table, groups, counts) | `groupingBy`, `partitioningBy`, `toMap` |
| a String | `collect(joining(...))` |
| an array | `toArray(Type[]::new)` |
| nothing (side effect: print/save) | `forEach` |

### 12.3 What goes in the middle? (intermediate operations)

| I need to... | Use |
|--------------|-----|
| **keep** only some elements | `filter(predicate)` |
| **change** each element into something else | `map(function)` (`mapToInt` for numbers) |
| **flatten** nested collections / split into pieces | `flatMap` |
| **remove duplicates** | `distinct()` |
| **order** | `sorted(...)` |
| take the **first N** / skip the first N | `limit(N)` / `skip(N)` |
| take **while** a condition holds (Java 9) | `takeWhile` |
| **debug** what is flowing | `peek` |
| go **numeric** (avoid boxing) | `mapToInt`, `IntStream.range` |
| go back to **objects** | `boxed()`, `mapToObj` |

**Golden order:** `filter` first (shrinks data), then `map`, then `sorted`/`distinct`, then `limit`. Filtering before sorting sorts fewer elements.

### 12.4 Pattern recognition table: "If the question says... think..." 🧩 ⭐

| # | The question sounds like... | Pattern | Skeleton |
|---|-----------------------------|---------|----------|
| 1 | "count of each ...", "frequency of ..." | **Frequency map** | `collect(groupingBy(identity(), counting()))` |
| 2 | "group by X", "X-wise report" | **Group** | `groupingBy(classifier)` (+ downstream) |
| 3 | "per X, find the max / min / average / sum / names" | **Group + downstream collector** | `groupingBy(X, maxBy/averagingX/summingX/mapping(...))` |
| 4 | "split into two groups (even/odd, pass/fail, male/female)" | **Partition** | `partitioningBy(predicate)` |
| 5 | "N-th highest / lowest" | **Distinct, sort, skip** | `distinct().sorted(reverseOrder()).skip(N-1).findFirst()` |
| 6 | "top N / bottom N / first N" | **Sort + limit** | `sorted(cmp).limit(N)` |
| 7 | "highest / oldest / longest / cheapest" (one element) | **Max/min by key** | `max(Comparator.comparing...)` |
| 8 | "list of lists", "all X of all Y" | **Flatten** | `flatMap(x -> x.getYs().stream())` |
| 9 | "find duplicates" | **Count > 1** or set-add trick | `groupingBy(identity(), counting())` + `filter(v > 1)` or `filter(x -> !seen.add(x))` |
| 10 | "unique / distinct values" | **Distinct** | `distinct()` or `collect(toSet())` |
| 11 | "first non-repeating / first repeating" | **Ordered frequency** | `groupingBy(identity(), LinkedHashMap::new, counting())` → `filter` → `findFirst` |
| 12 | "convert list to map" | **toMap** | `toMap(key, value, mergeFn)` |
| 13 | "join into a comma separated string" | **Joining** | `map(String::valueOf).collect(joining(", "))` |
| 14 | "does any / do all / is there none" | **Match** | `anyMatch / allMatch / noneMatch` |
| 15 | "sum / average / min / max / statistics" | **Numeric stream** | `mapToInt(...).sum()` / `summaryStatistics()` |
| 16 | "generate a sequence (1..n, powers, Fibonacci, primes)" | **Generator** | `IntStream.rangeClosed`, `Stream.iterate`, `filter` |
| 17 | "characters of a string" | **chars()** | `s.chars().mapToObj(c -> (char) c)` |
| 18 | "words of a sentence" | **split + stream** | `Arrays.stream(s.split(" "))` |
| 19 | "sort by A then B (desc)" | **Comparator chain** | `comparing(A).thenComparing(B, reverseOrder())` |
| 20 | "compare with an aggregate of its own group (above average...)" | **Two-phase**: compute the lookup first, then stream again | `Map avg = ...; filter(e -> e.x > avg.get(e.group))` |
| 21 | "pair every X with every Y" | **Cartesian product** | `flatMap(x -> ys.stream().map(y -> ...))` |
| 22 | "split into chunks / sliding windows" | **Index range** | `IntStream.range(0, n).mapToObj(i -> list.subList(...))` |
| 23 | "map keys/values sorted" | **Entry stream** | `map.entrySet().stream().sorted(Map.Entry.comparingByValue())` |

### 12.5 The "types on paper" technique 🧩

When a pipeline will not compile or you are stuck, **write the type after each step**. Most stream bugs are a **type mismatch** you can see on paper.

```
Goal: department with the highest average salary

employees                          List<Employee>
 .stream()                         Stream<Employee>
 .collect(groupingBy(dept, averagingDouble(salary)))     Map<String, Double>     ← one step turned objects into a lookup
 .entrySet().stream()              Stream<Map.Entry<String, Double>>
 .max(Map.Entry.comparingByValue())     Optional<Map.Entry<String, Double>>
 .map(Map.Entry::getKey)           Optional<String>
 .orElse(null)                     String   → "IT"
```

### 12.6 Three worked "unseen" questions: how to think 🧩

**Q-A: "Find the department with the highest average salary."**

1. *Output:* one `String` (a department).
2. *What do I need first?* an **average per department** → pattern 3 (`groupingBy` + `averagingDouble`) → `Map<String, Double>`.
3. *Then?* find the **max entry by value** (pattern 7 on the entry stream) → take the key.

```java
String dept = emps.stream()
        .collect(groupingBy(Employee::getDept, averagingDouble(Employee::getSalary)))
        .entrySet().stream()
        .max(Map.Entry.comparingByValue())
        .map(Map.Entry::getKey)
        .orElse(null);          // IT   (IT=80000, Finance=67500, Sales=65000, HR=60000)
```

**Q-B: "For each department, print the name of the youngest employee."**

1. *Output:* `Map<dept, name>` → grouping with a downstream collector.
2. *Per group I need the min by age* → `minBy(comparingInt(age))` → returns `Optional` → unwrap with `collectingAndThen`.

```java
Map<String, String> youngest = emps.stream().collect(groupingBy(Employee::getDept,
        collectingAndThen(minBy(Comparator.comparingInt(Employee::getAge)), o -> o.get().getName())));
// {Finance=Divya, HR=Meena, IT=Asha, Sales=Vikram}
```

**Q-C: "Names of employees earning more than their department's average."**

1. A single pipeline cannot compare an element with an aggregate of **its own group** while streaming. This is the **two-phase pattern (#20)**.
2. *Phase 1:* build the lookup `dept → average`. *Phase 2:* stream again and `filter` using the lookup.

```java
Map<String, Double> avg = emps.stream()
        .collect(groupingBy(Employee::getDept, averagingDouble(Employee::getSalary)));   // IT=80000 HR=60000 Finance=67500 Sales=65000

List<String> above = emps.stream()
        .filter(e -> e.getSalary() > avg.get(e.getDept()))
        .map(Employee::getName)
        .collect(toList());                // [Ravi, Karan, Arun, Neha]   (Vikram = Sales average, not above)
```

### 12.7 Ten idioms to memorize 🧩

```java
// 1. Frequency map                        2. Second highest
.collect(groupingBy(identity(), counting()))    .distinct().sorted(reverseOrder()).skip(1).findFirst()
// 3. Max by field                          4. Sum of a field
.max(Comparator.comparingInt(Emp::getAge))      .mapToDouble(Emp::getSalary).sum()
// 5. Group + count                         6. Names joined
.collect(groupingBy(Emp::getDept, counting()))  .map(Emp::getName).collect(joining(", "))
// 7. Partition                             8. Flatten
.collect(partitioningBy(e -> e.getAge() > 30))  .flatMap(x -> x.getItems().stream())
// 9. List → Map                            10. Sort by two fields
.collect(toMap(Emp::getId, Function.identity())) .sorted(comparing(Emp::getDept).thenComparing(Emp::getName))
```

> **Comparator inference tip:** `Comparator.comparing(Employee::getSalary).reversed()` works with a **method reference**, but with a **lambda** you must give the type: `Comparator.comparing((Employee e) -> e.getSalary()).reversed()`. Otherwise `e` is inferred as `Object` and the compile fails.

* * *

## 13. Solved Stream Problems by Pattern

Data used below. `nums = Arrays.asList(5, 3, 8, 1, 9, 2, 8, 5)`; `emps` is the 8-employee table from the [Collectors](#8-collectors-deep-dive) section; imports are `java.util.*`, `java.util.function.*`, `java.util.stream.*`, `static java.util.stream.Collectors.*`.

### A. Numbers (arrays and lists of integers)

**P1. Even numbers.** *Pattern: filter.*

```java
nums.stream().filter(n -> n % 2 == 0).collect(toList());     // [8, 2, 8]
```

**P2. Sum, average, max, min.** *Pattern: numeric stream.*

```java
nums.stream().mapToInt(Integer::intValue).sum();                       // 41
nums.stream().mapToInt(Integer::intValue).average().orElse(0);         // 5.125
nums.stream().max(Integer::compare).get();                             // 9
nums.stream().mapToInt(i -> i).min().getAsInt();                       // 1
nums.stream().mapToInt(i -> i).summaryStatistics();                    // count=8, sum=41, min=1, avg=5.125, max=9
```

**P3. Distinct and sorted ascending / descending.** *Pattern: distinct + sorted.*

```java
nums.stream().distinct().sorted().collect(toList());                        // [1, 2, 3, 5, 8, 9]
nums.stream().sorted(Comparator.reverseOrder()).collect(toList());          // [9, 8, 8, 5, 5, 3, 2, 1]
```

**P4. Squares of the distinct numbers greater than 20.** *Pattern: distinct → map → filter.*

```java
nums.stream().distinct().map(n -> n * n).filter(n -> n > 20).collect(toList());   // [25, 64, 81]
```

**P5. N-th highest number (second highest).** *Pattern 5: distinct → sort desc → skip(n-1) → findFirst.*

```java
int n = 2;
nums.stream().distinct().sorted(Comparator.reverseOrder()).skip(n - 1).findFirst().get();   // 8
// 3 highest distinct:
nums.stream().distinct().sorted(Comparator.reverseOrder()).limit(3).collect(toList());      // [9, 8, 5]
```

> `distinct()` matters: without it the second highest of `[9, 9, 8]` would be `9`.

**P6. Find duplicate numbers.** *Pattern 9.*

```java
// (a) Stateless and safe (also works in parallel)
nums.stream().collect(groupingBy(Function.identity(), counting()))
    .entrySet().stream().filter(e -> e.getValue() > 1).map(Map.Entry::getKey).collect(toList());   // [5, 8]

// (b) "Set.add returns false for an existing element" trick (sequential only, stateful lambda)
Set<Integer> seen = new HashSet<>();
nums.stream().filter(x -> !seen.add(x)).collect(toSet());                                          // [5, 8]
```

**P7. Frequency of each number.** *Pattern 1.*

```java
nums.stream().collect(groupingBy(Function.identity(), counting()));   // {1=1, 2=1, 3=1, 5=2, 8=2, 9=1}
```

**P8. Numbers that start with the digit 1.** *Pattern: convert to String.*

```java
Arrays.asList(10, 15, 8, 49, 25, 98, 32).stream()
      .map(String::valueOf).filter(s -> s.startsWith("1")).collect(toList());   // [10, 15]
```

**P9. Separate odd and even numbers.** *Pattern 4.*

```java
nums.stream().collect(partitioningBy(n -> n % 2 == 0));    // {false=[5, 3, 1, 9, 5], true=[8, 2, 8]}
```

**P10. Generate sequences.** *Pattern 16.*

```java
IntStream.rangeClosed(1, 100).sum();                                              // 5050
LongStream.rangeClosed(1, 5).reduce(1, (a, b) -> a * b);                          // 120  (5!)
Stream.iterate(1, n -> n * 2).limit(5).collect(toList());                         // [1, 2, 4, 8, 16]
Stream.iterate(new int[]{0, 1}, f -> new int[]{f[1], f[0] + f[1]})
      .limit(10).map(f -> f[0]).collect(toList());                                // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
IntStream.rangeClosed(2, 30)
         .filter(n -> IntStream.rangeClosed(2, (int) Math.sqrt(n)).noneMatch(d -> n % d == 0))
         .boxed().collect(toList());                                              // [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
```

**P11. Checks over a list.** *Pattern 14.*

```java
nums.stream().allMatch(n -> n > 0);       // true
nums.stream().anyMatch(n -> n % 2 == 0);  // true
nums.stream().noneMatch(n -> n < 0);      // true
```

**P12. Merge two arrays, sorted and without duplicates; common elements.** *Pattern: `IntStream.concat`, set lookup.*

```java
int[] a1 = {3, 4, 1, 6, 7, 0}, a2 = {8, 4, 3, 9, 5, 1, 6, 7, 2};
IntStream.concat(Arrays.stream(a1), Arrays.stream(a2)).distinct().sorted().boxed().collect(toList());
// [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

Set<Integer> s2 = Arrays.stream(a2).boxed().collect(toSet());
Arrays.stream(a1).filter(s2::contains).sorted().boxed().collect(toList());           // [1, 3, 4, 6, 7]
```

**P13. Sum of the digits of a number.** *Pattern 17: treat a number as a string of chars.*

```java
String.valueOf(12345).chars().map(Character::getNumericValue).sum();    // 15
```

### B. Strings and characters

**S1. Character frequency (keeping first-appearance order).** *Pattern 1 + ordered map.*

```java
Map<Character, Long> freq = "programming".chars().mapToObj(c -> (char) c)
        .collect(groupingBy(Function.identity(), LinkedHashMap::new, counting()));
// {p=1, r=2, o=1, g=2, a=1, m=2, i=1, n=1}
```

**S2. First non-repeating and first repeating character.** *Pattern 11.*

```java
Character firstUnique = freq.entrySet().stream().filter(e -> e.getValue() == 1).map(Map.Entry::getKey).findFirst().orElse(null);   // 'p'
Character firstRepeat = freq.entrySet().stream().filter(e -> e.getValue() > 1).map(Map.Entry::getKey).findFirst().orElse(null);   // 'r'
```

> The `LinkedHashMap` is the whole trick: a plain `HashMap` would lose the "first" order.

**S3. Reverse each word / reverse the order of words.**

```java
String s = "java is fun";
Arrays.stream(s.split(" ")).map(w -> new StringBuilder(w).reverse()).collect(joining(" "));   // "avaj si nuf"

String[] w = s.split(" ");
IntStream.range(0, w.length).mapToObj(i -> w[w.length - 1 - i]).collect(joining(" "));        // "fun is java"
```

(Reversing a whole string is simply `new StringBuilder(s).reverse().toString()`: streams add nothing there.)

**S4. Palindrome and anagram checks.** *Pattern 14.*

```java
String p = "madam";
boolean pal = IntStream.range(0, p.length() / 2).allMatch(i -> p.charAt(i) == p.charAt(p.length() - 1 - i));  // true

boolean anagram = Arrays.equals("listen".chars().sorted().toArray(), "silent".chars().sorted().toArray());   // true
```

**S5. Count vowels.**

```java
"programming".chars().filter(c -> "aeiou".indexOf(c) >= 0).count();    // 3   (o, a, i)
```

**S6. Longest word.** *Pattern 7.*

```java
Arrays.asList("java", "stream", "functional", "lambda").stream()
      .max(Comparator.comparingInt(String::length)).get();                // "functional"
```

**S7. Remove duplicate characters from a string.** *Pattern 10.*

```java
"banana".chars().distinct().mapToObj(c -> String.valueOf((char) c)).collect(joining());   // "ban"
```

**S8. Word count in a sentence.** *Pattern 1 on words.*

```java
Arrays.stream("java is fun and java is fast".split(" "))
      .collect(groupingBy(Function.identity(), counting()));      // {java=2, is=2, fun=1, and=1, fast=1}  (order unspecified)
```

**S9. Group words by length.** *Pattern 2.*

```java
Arrays.asList("cat", "dog", "fish", "elephant").stream().collect(groupingBy(String::length));
// {3=[cat, dog], 4=[fish], 8=[elephant]}
```

**S10. Capitalize the first letter of every word.**

```java
Arrays.stream("java is fun".split(" "))
      .map(x -> Character.toUpperCase(x.charAt(0)) + x.substring(1)).collect(joining(" "));   // "Java Is Fun"
```

**S11. Sort words by length, then alphabetically.** *Pattern 19.*

```java
words.stream().sorted(Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder())).collect(toList());
```

**S12. Is the string numeric?**

```java
!s.isEmpty() && s.chars().allMatch(Character::isDigit);
```

### C. Objects (the `Employee` table)

**E1. Head-count per department.** *Pattern 2.*

```java
emps.stream().collect(groupingBy(Employee::getDept, counting()));    // {Finance=2, HR=2, IT=3, Sales=1}
```

**E2. Average salary per department, and the department with the highest average.** *Pattern 3.*

```java
emps.stream().collect(groupingBy(Employee::getDept, averagingDouble(Employee::getSalary)));
// {Finance=67500.0, HR=60000.0, IT=80000.0, Sales=65000.0}      → highest average: IT (see worked example Q-A)
```

**E3. Highest-paid employee; second-highest salary and who earns it.** *Pattern 7 and 5.*

```java
emps.stream().max(Comparator.comparingDouble(Employee::getSalary)).get();     // Ravi  (tie with Neha at 90000: max keeps the FIRST)

double second = emps.stream().map(Employee::getSalary).distinct()
        .sorted(Comparator.reverseOrder()).skip(1).findFirst().orElseThrow(IllegalStateException::new);   // 80000.0
emps.stream().filter(e -> e.getSalary() == second).map(Employee::getName).collect(toList());              // [Arun]
```

> **Ties:** "second highest *employee*" is ambiguous when two people share the top salary. Ask the interviewer: *second distinct salary* (Arun) or *second row in sorted order* (Neha)? Say it out loud, interviewers like that.

**E4. Top 3 highest paid; names sorted by salary desc then name.** *Pattern 6 and 19.*

```java
emps.stream().sorted(Comparator.comparingDouble(Employee::getSalary).reversed()).limit(3)
    .map(Employee::getName).collect(toList());                                  // [Ravi, Neha, Arun]   (stable sort keeps Ravi before Neha)

emps.stream().filter(e -> e.getSalary() > 60000)
    .sorted(Comparator.comparingDouble(Employee::getSalary).reversed().thenComparing(Employee::getName))
    .map(Employee::getName).collect(toList());                                  // [Neha, Ravi, Arun, Karan, Vikram]
```

**E5. Male/female split, average salary and average age by gender.** *Pattern 4 and 3.*

```java
emps.stream().collect(partitioningBy(e -> e.getGender().equals("F")));                          // {false=[Ravi, Karan, Arun, Vikram], true=[Asha, Meena, Divya, Neha]}
emps.stream().collect(groupingBy(Employee::getGender, averagingDouble(Employee::getSalary)));   // {F=63750.0, M=76250.0}
emps.stream().collect(groupingBy(Employee::getGender, averagingInt(Employee::getAge)));         // {F=29.0, M=39.75}
```

**E6. Employees who joined after 2015; youngest and oldest.**

```java
emps.stream().filter(e -> e.getYearOfJoining() > 2015).map(Employee::getName).collect(toList());   // [Asha, Meena, Divya, Neha]
emps.stream().min(Comparator.comparingInt(Employee::getAge)).get();                                  // Divya (26)
emps.stream().max(Comparator.comparingInt(Employee::getAge)).get();                                  // Vikram (45)
```

**E7. Salary statistics and totals.** *Pattern 15.*

```java
DoubleSummaryStatistics st = emps.stream().mapToDouble(Employee::getSalary).summaryStatistics();
// count=8, sum=560000.0, min=50000.0, average=70000.0, max=90000.0

emps.stream().collect(toMap(Employee::getDept, Employee::getSalary, Double::sum));   // {Finance=135000.0, HR=120000.0, IT=240000.0, Sales=65000.0}
```

**E8. Names per department; nested group (department → gender → count).** *Pattern 3.*

```java
emps.stream().collect(groupingBy(Employee::getDept, mapping(Employee::getName, toList())));
// {Finance=[Divya, Arun], HR=[Meena, Karan], IT=[Asha, Ravi, Neha], Sales=[Vikram]}

emps.stream().collect(groupingBy(Employee::getDept, groupingBy(Employee::getGender, counting())));
// {Finance={F=1, M=1}, HR={F=1, M=1}, IT={F=2, M=1}, Sales={M=1}}
```

**E9. Highest-paid employee in each department; youngest in each.** *Pattern 3 with `maxBy`/`minBy`.*

```java
emps.stream().collect(groupingBy(Employee::getDept,
        collectingAndThen(maxBy(Comparator.comparingDouble(Employee::getSalary)), Optional::get)));
// {Finance=Arun, HR=Karan, IT=Ravi, Sales=Vikram}
```

**E10. Employees earning above their department average.** *Pattern 20: two phases (see worked example Q-C).* Result `[Ravi, Karan, Arun, Neha]`.

**E11. Department with the most employees.**

```java
emps.stream().collect(groupingBy(Employee::getDept, counting()))
    .entrySet().stream().max(Map.Entry.comparingByValue()).get().getKey();     // IT
```

**E12. Distinct departments; sort employees by dept, salary desc, name.**

```java
emps.stream().map(Employee::getDept).distinct().collect(toList());      // [IT, HR, Finance, Sales]

emps.stream().sorted(Comparator.comparing(Employee::getDept)
        .thenComparing(Employee::getSalary, Comparator.reverseOrder())
        .thenComparing(Employee::getName)).map(Employee::getName).collect(toList());
// [Arun, Divya, Karan, Meena, Neha, Ravi, Asha, Vikram]
```

**E13. Quick checks.**

```java
emps.stream().anyMatch(e -> e.getDept().equals("HR"));      // true
emps.stream().allMatch(e -> e.getSalary() > 40000);          // true
emps.stream().noneMatch(e -> e.getAge() > 60);               // true
```

### D. Collections, maps and "construction" problems

**M1. Flatten a list of lists; all words of all sentences.** *Pattern 8.*

```java
List.of(List.of(1, 2), List.of(3, 4), List.of(5)).stream().flatMap(List::stream).collect(toList());   // [1, 2, 3, 4, 5]
sentences.stream().flatMap(x -> Arrays.stream(x.split(" "))).distinct().collect(toList());
```

**M2. Cartesian product.** *Pattern 21.*

```java
List<Integer> a = List.of(1, 2), b = List.of(3, 4);
a.stream().flatMap(x -> b.stream().map(y -> List.of(x, y))).collect(toList());   // [[1, 3], [1, 4], [2, 3], [2, 4]]
```

**M3. List to Map (id → object, word → length).** *Pattern 12.*

```java
emps.stream().collect(toMap(Employee::getId, Function.identity()));
words.stream().distinct().collect(toMap(Function.identity(), String::length));
```

**M4. Sort a Map by value (descending), keep order.** *Pattern 23.*

```java
map.entrySet().stream()
   .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
   .collect(toMap(Map.Entry::getKey, Map.Entry::getValue, (x, y) -> x, LinkedHashMap::new));
```

**M5. Key with the maximum value in a map.**

```java
Collections.max(map.entrySet(), Map.Entry.comparingByValue()).getKey();
map.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
```

**M6. Common elements / difference of two lists.**

```java
Set<Integer> set2 = new HashSet<>(list2);                      // O(1) lookups: do NOT call list2.contains inside the stream for big lists
list1.stream().filter(set2::contains).collect(toList());       // intersection
list1.stream().filter(x -> !set2.contains(x)).collect(toList());   // difference
```

**M7. Remove nulls; null-safe mapping.**

```java
list.stream().filter(Objects::nonNull).map(String::trim).collect(toList());
```

**M8. Split a list into chunks of size n.** *Pattern 22.*

```java
int n = 3;
IntStream.range(0, (list.size() + n - 1) / n)
         .mapToObj(i -> list.subList(i * n, Math.min(list.size(), (i + 1) * n)))
         .collect(toList());                                    // [1..7] → [[1, 2, 3], [4, 5, 6], [7]]
```

**M9. Zip two lists by index.**

```java
IntStream.range(0, Math.min(a.size(), b.size())).mapToObj(i -> a.get(i) + "-" + b.get(i)).collect(toList());
```

**M10. Count lines/words in a file (close the stream!).**

```java
try (Stream<String> lines = Files.lines(Paths.get("input.txt"))) {
    long words = lines.flatMap(l -> Arrays.stream(l.split("\\s+"))).filter(w -> !w.isEmpty()).count();
}
```

**M11. Parallel sum of a big range.**

```java
LongStream.rangeClosed(1, 10_000_000).parallel().sum();      // associative + stateless = safe to parallelize
```

* * *
## 14. Pitfalls and When NOT to Use Streams

### Q111. What are the most common Stream mistakes? ⭐

| # | Mistake | What happens | Fix |
|---|---------|--------------|-----|
| 1 | **Reusing a stream** | `IllegalStateException: stream has already been operated upon or closed` | Create a new stream (or use a `Supplier<Stream<T>>`) |
| 2 | **Forgetting the terminal operation** | Nothing runs (lazy) | End with `collect/forEach/count/...` |
| 3 | `Collectors.toMap` with **duplicate keys** | `IllegalStateException: Duplicate key` | Add a merge function `(a, b) -> a` |
| 4 | `toMap` with a **null value** | `NullPointerException` | Filter nulls or use `groupingBy`/a loop |
| 5 | **Modifying the source** while streaming | `ConcurrentModificationException` / undefined | Collect to a new list; or `removeIf` on the source |
| 6 | **Side effects in lambdas** (add to outside list, increment counter) | Wrong in parallel, hard to reason about | Use `collect`, `reduce`, `count` |
| 7 | **Assigning to a local variable inside a lambda** | Compile error (not effectively final) | `AtomicInteger`, or restructure |
| 8 | `sorted()` on **non-`Comparable`** objects | `ClassCastException` | Pass a `Comparator` |
| 9 | `distinct()` on objects without `equals/hashCode` | Duplicates not removed | Implement `equals`/`hashCode` (or use `record`) |
| 10 | `Optional.get()` on empty | `NoSuchElementException` | `orElse`, `orElseThrow`, `ifPresent` |
| 11 | **Infinite stream without `limit`** | Hangs / OOM | `limit`, `takeWhile`, short-circuit |
| 12 | `Stream.of(intArray)` | `Stream<int[]>` with one element | `Arrays.stream(intArray)` / `IntStream.of` |
| 13 | `Collectors.counting()` assigned to `Map<K,Integer>` | Compile error: it is `Long` | `Map<K, Long>` |
| 14 | `groupingBy` result **order assumed** | It is a `HashMap` | `TreeMap::new` / `LinkedHashMap::new` factory |
| 15 | **Parallel stream on I/O or tiny data** | Slower, starves the common pool | Sequential, or own executor/CompletableFuture |
| 16 | `peek` used for logic; `count()` after `peek` (Java 9+) | `peek` skipped | Use `map`/`forEach` for logic |
| 17 | **`list.stream().forEach(...)`** just to loop | Fine but pointless | `list.forEach(...)` |
| 18 | `ArrayList<Integer> l = ...collect(toList())` | Compile error: `toList()` returns `List` | Declare as `List<Integer>` (the PDF example has this bug) |
| 19 | `Files.lines` not closed | File handle leak | try-with-resources |
| 20 | Comparator **lambda + `.reversed()`** | Inference fails (`e` is `Object`) | `Comparator.comparing((Emp e) -> e.getX()).reversed()` or a method reference |

### Q112. When should I NOT use streams? ⭐

Use a plain loop when:

- You need **index access** or to look at **neighbours** (`i-1`, `i+1`).
- You need **complex early exits** (`break`/`continue`/`return` in the middle, multiple exit conditions).
- You must **modify local state** heavily, or the logic is inherently **stateful** (running balance, state machines).
- You must **throw checked exceptions** inside the body (wrapping makes it uglier than the loop).
- The pipeline needs **several lines of lambda** with nested pipelines: extract a **named method** or use a loop.
- Performance on **tiny collections or primitive hot loops** matters (streams add overhead and boxing).
- It would be harder to **debug** than the loop version (readability beats cleverness).

> **Interview-safe answer:** *Streams for declarative transformations, filtering, grouping and aggregation; loops for index-based, stateful or heavily branching logic.*

### Q113. How do I debug a stream pipeline? 🟢

- Insert `.peek(x -> System.out.println("after filter: " + x))` between stages.
- Break a long chain into **named intermediate variables** (`Stream<Employee> highPaid = ...`) and inspect types.
- Extract lambdas into **named methods** so you can set breakpoints.
- IDEs (IntelliJ *Stream Trace*) show every element through each stage.

### Q114. Do streams perform better than loops? 🟢

Not automatically. For small data a simple loop is usually **as fast or faster** (no pipeline objects, no boxing). Streams win on **readability** and on **free parallelism** for large CPU-bound data. Use `IntStream`/`LongStream`/`DoubleStream` to avoid boxing. Measure with JMH before claiming a speedup.

### Q115. What is the difference between functional and object-oriented programming? 🟢

| OOP | Functional |
|-----|-----------|
| Models the world as **objects** holding state and behaviour | Models computation as **functions** transforming data |
| **Mutable state** is common | Prefers **immutability** |
| Imperative: *how* (loops, assignments) | Declarative: *what* (filter, map, reduce) |
| Polymorphism via inheritance/interfaces | Behaviour passed as **function values** (lambdas) |
| Side effects are normal | **Pure functions** (same input → same output, no side effects) |

Java 8 is **still object-oriented** but borrows the functional style where it helps.

* * *

## 15. How Did You Use Java 8 in Your Project? and Cheat Sheet

### Q116. "How have you used Java 8 features in your project?": model answer ⭐

> *In our services I used **lambdas and the Stream API** to replace verbose loops: filtering, mapping and grouping collections of domain objects (for example grouping incoming events by type, or building lookup maps with `toMap`/`groupingBy`). I used **Optional** as the return type of repository/lookup methods so callers must handle "not found" instead of null-checking, and chained `map`/`orElseThrow` for clean error handling. **Method references** and the **built-in functional interfaces** (`Predicate`, `Function`, `Supplier`) made validation and mapping rules reusable and composable (`and`/`or`). **Default methods** let us evolve shared interfaces without breaking implementers. For time handling we moved from `Date`/`SimpleDateFormat` to **`java.time`** (`Instant` for stored timestamps, `ZonedDateTime` for user-facing times) which is immutable and thread-safe. For independent remote calls we used **`CompletableFuture`** with a dedicated executor and `thenCombine`/`allOf` to cut latency, and I'm careful to use **parallel streams** only for large CPU-bound work, never for blocking I/O.*

Back it up with **one concrete example** you can code live (e.g. group-and-count, or `thenCombine` of two service calls) and **one trade-off** you hit (laziness, parallel stream pool starvation, `toMap` duplicate keys).

### Q117. Typical "project style" questions with one-line answers 🟢

| Question | Short answer |
|----------|--------------|
| How did lambdas help? | Removed anonymous-class boilerplate; enabled passing behaviour (comparators, callbacks, predicates) |
| How did you use Streams? | `filter/map/collect/groupingBy` for transformations and reports on collections |
| How did you use `Optional`? | Return type for "may be absent"; `map/orElseThrow` instead of null checks |
| Why default methods? | Add behaviour to interfaces without breaking implementers |
| How did you use `removeIf`, `replaceAll`, `forEach`? | In-place filtering/transformation of collections with lambdas |
| How did you use `Collectors`? | `groupingBy`, `partitioningBy`, `toMap`, `joining`, `summarizingX` |
| How did you use `CompletableFuture`? | Parallel independent service calls; chain with `thenApply/thenCompose/thenCombine`; `exceptionally` for fallbacks |
| Why new date API? | Immutable, thread-safe, zone-aware, readable |
| Are parallel streams always faster? | No: only for large CPU-bound stateless work; shared common pool; measure |

### Q118. Predict the output: warm-up traps ⭐

```java
// 1. Does this print anything?
Stream.of(1, 2, 3).filter(n -> { System.out.println("f" + n); return true; });
// → NOTHING (no terminal operation)

// 2. Order of output?
Stream.of("a", "b", "c").peek(x -> System.out.print("P" + x + " ")).map(String::toUpperCase)
      .forEach(x -> System.out.print("F" + x + " "));
// → Pa FA Pb FB Pc FC     (element-by-element, not all P's first)

// 3. Reuse?
Stream<Integer> s = Stream.of(1, 2);  s.count();  s.count();
// → IllegalStateException on the second count()

// 4. Empty-stream matches
Stream.<Integer>empty().allMatch(n -> n > 100);    // true  (vacuous truth)
Stream.<Integer>empty().anyMatch(n -> n > 100);    // false
Stream.<Integer>empty().noneMatch(n -> n > 100);   // true

// 5. map does not change the source
List<String> names = List.of("a", "b");  names.stream().map(String::toUpperCase).collect(toList());
// names is still [a, b]

// 6. sorted is a barrier
Stream.of(3, 1, 2).peek(x -> System.out.print("p" + x + " ")).sorted().forEach(x -> System.out.print("e" + x + " "));
// → p3 p1 p2 e1 e2 e3     (all peeks first, because sorted needs everything)

// 7. Optional.of(null)
Optional.of(null);          // NullPointerException ;  Optional.ofNullable(null) → Optional.empty

// 8. Arrays.asList(int[]) trap
Arrays.asList(new int[]{1, 2, 3}).size();   // 1 (a List<int[]>)
```

### Q119. One-page cheat sheet ⭐

| Topic | Remember |
|-------|----------|
| Lambda | `(params) -> body`; implements a functional interface; `this` = enclosing class; locals must be effectively final |
| Functional interface | One abstract method; default/static/Object methods allowed; `@FunctionalInterface` is a compile-time check |
| Core interfaces | `Predicate` (test→boolean), `Function` (apply→R), `Consumer` (accept→void), `Supplier` (get→T) |
| `andThen` / `compose` | `f.andThen(g)` = g(f(x)); `f.compose(g)` = f(g(x)) |
| Method references | static `C::m`, bound `obj::m`, unbound `C::instM`, constructor `C::new` |
| Default method | Class wins; else more specific interface; else override and call `X.super.m()` |
| Interface static | Called via interface name only; not inherited |
| Optional | `ofNullable`, `map`, `flatMap`, `orElse` (eager) vs `orElseGet` (lazy), no `Optional` fields/params |
| Stream | Not storage; lazy; once only; pipeline = source → intermediate → terminal |
| Lazy trace | Elements flow one by one through all stages; `sorted` is a barrier; `findFirst` stops early |
| `map` vs `flatMap` | 1→1 vs 1→many then flatten |
| `reduce` vs `collect` | Immutable fold into one value vs mutable accumulation into a container |
| `findFirst` vs `findAny` | Deterministic first vs any (faster in parallel) |
| Empty-stream matches | `any`=false, `all`=true, `none`=true |
| Collectors | `toList/Set/Map`, `joining`, `counting`, `summingX`, `averagingX`, `groupingBy`, `partitioningBy`, `mapping`, `collectingAndThen`, `teeing` |
| `toMap` | Duplicate key → exception; give a merge function; null value → NPE |
| `groupingBy` | `HashMap` unless you pass a factory; downstream collector for per-group work |
| Parallel | Common ForkJoinPool; large CPU-bound stateless only; no shared state; never block it |
| CompletableFuture | `supplyAsync`, `thenApply`, `thenCompose` (flatMap), `thenCombine`, `allOf`, `exceptionally/handle`, own executor for I/O |
| java.time | Immutable, thread-safe; `Instant` (moment), `LocalDateTime` (no zone), `ZonedDateTime` (zone); `Period` dates vs `Duration` time |
| `LocalDate.of(…, 08, …)` | Leading zero = octal → compile error |

* * *

## 16. Where Older Sources Are Outdated

The Durga PDF (about 2015–2016) and some blogs contain statements that are inaccurate or no longer true. Know the corrections.

| Older statement | Reality |
|-----------------|---------|
| Java 9 released **22 Sep 2016** | Java 9 shipped **21 Sep 2017**; Java 10 in March 2018; since then a **6-month** cadence |
| `java.time` is the **"Joda-Time API"** | `java.time` (JSR-310) is **inspired by** Joda-Time (same author) but is a separate, standard API |
| Lambda locals are **implicitly final** | They must be **effectively final** (never reassigned); you do not need the `final` keyword |
| Lambdas "reside in permanent memory / Method Area" | Lambda bodies compile to a **private synthetic method**; the implementing class is **generated at runtime** with `invokedynamic`; non-capturing lambdas are typically reused singletons. (PermGen no longer exists anyway: Java 8 uses Metaspace) |
| Lambda "converts into a private method of the outer class" | Correct in spirit; the **instance** is produced via `LambdaMetafactory` |
| PDF `Test1` example: `ArrayList<Integer> l2 = l1.stream()...collect(Collectors.toList());` | Does **not compile**: `toList()` returns `List`. Declare `List<Integer>` |
| PDF `LeapYear` example has statements directly in the class body | Must be inside a `main` method |
| PDF `Stream s = c.stream();` raw types | Use generics: `Stream<Integer> s = c.stream();` |
| Date example prints time as `12:39:26:587` | `LocalTime.toString()` prints `12:39:26.587` (dot before fraction) |
| harp-lab: `System.out::println` is a **static** method reference | It is a **bound instance** method reference on the object `System.out` |
| harp-lab: `Stream.of("Hello","world!").flatMap(p -> Arrays.stream(p.split(","))` gives characters | `split(",")` returns the whole word; to get characters use `p.chars().mapToObj(c -> (char) c)` or `split("")` |
| harp-lab: `Stream.of(...).mapToInt().sum()` | `mapToInt` needs a mapper: `mapToInt(a -> a)` / `mapToInt(Integer::intValue)` |
| harp-lab: `new Date().toInstant()` for "current time in milliseconds" | Use `Instant.now()` / `Clock` |
| harp-lab: "Maps are not supported by streams" | Correct for `Map` itself; stream `entrySet()`, `keySet()` or `values()` |
| Method references "may be more efficient than lambdas" | Same runtime mechanism (both use `invokedynamic`); pick whichever is clearer |
| Nashorn listed as a Java 8 feature to use | **Deprecated in 11, removed in 15** |
| "`Function` interface name in PDF: `interface function(T,R)`" | Actual: `interface Function<T, R> { R apply(T t); }` |
| PDF `Predicate<collection> p = c -> c.isEmpty();` | Type is `Predicate<Collection<?>>` (case-sensitive, generics) |
| PDF `predicate`, `string`, `Interfi` typos | Real names: `Predicate`, `String`, `Interf i` (OCR/formatting artifacts in the PDF) |

> **Where to read more in your repo:** collections, HashMap internals, Comparable/Comparator → [Java Collections Framework](collections.md); threads, executors, locks → [Java Multithreading & Concurrency](https://pkpunit.github.io/Software-Dev-Interview-Prep/core-java/multithreading/java-multithreading-concurrency).

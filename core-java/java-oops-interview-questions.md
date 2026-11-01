---
layout: docs
title: Java OOPs Interview Questions and Answers
description: 50 detailed OOPs questions for Java interviews, covering encapsulation, inheritance, polymorphism, constructors, initialization order, casting and more.
---

# Java OOPs Interview Questions and Answers (Detailed)

> 50 most-asked OOPs questions for Java interviews. Each answer follows the same flow: **What → Why → How → Pitfalls → Interview one-liner**. Source concepts are based on the Durgasoft Core Java OOPs chapter, cross-checked and updated for modern Java.

## 1. The Pillars: Data Hiding, Abstraction, Encapsulation

### Q1. What is OOP and what are its main pillars?

**What?** Object-Oriented Programming organizes software as **objects** that combine data (fields) and behaviour (methods).

**The 3 classic pillars (and what each one buys you):**

```
                 Inheritance  → Reusability
                      │
                    OOPs
                   /     \
  Polymorphism → Flexibility   Encapsulation → Security
```

| Pillar        | Talks about  | Java tool                                  |
|---------------|--------------|--------------------------------------------|
| Inheritance   | Reusability  | `extends`, `implements`                    |
| Polymorphism  | Flexibility  | Overloading, overriding, parent references |
| Encapsulation | Security     | `private` fields + getters/setters         |

Many interviewers add **Abstraction** as the 4th pillar (abstract classes and interfaces).

> **Interview one-liner:** Inheritance gives reusability, polymorphism gives flexibility, encapsulation gives security.

### Q2. What is Data Hiding?

**What?** Our internal data should not go out directly. An outside person must not be able to access it directly.

**How?** Declare the data members `private`.

```java
class Account {
    private double balance;     // hidden from the outside world
}
```

**Why?** **Security.** The data is reachable only through code that can validate the caller (for example, after username and password checks).

> **Rule:** the recommended modifier for data members is `private`.

### Q3. What is Abstraction? How do you achieve it in Java?

**What?** **Hide the internal implementation and just highlight the set of services offered.**

**Example:** An ATM screen shows "withdraw", "balance", "deposit" (the services) without showing how the bank's internal systems work.

**How?** By using **abstract classes** and **interfaces**.

```java
interface PaymentService {              // what the user sees
    void pay(double amount);
}
class UpiPayment implements PaymentService {   // how it is done is hidden
    public void pay(double amount) { /* internal steps */ }
}
```

**Advantages:**

1. **Security:** the internal implementation is not exposed.
2. **Easy enhancement:** internals can change without affecting the end user.
3. More flexibility and ease of use for the end user.
4. Better **maintainability** and **modularity**.

### Q4. What is Encapsulation?

**What?** Binding **data and the methods that work on it into a single unit** (a class). A class that follows data hiding and abstraction is an encapsulated class.

```
Encapsulation = Data Hiding + Abstraction
```

```
   GUI                       class Account
 ┌──────────┐              ┌──────────────────────────────┐
 │getBalance│ ───────────► │ private double balance;      │
 │setBalance│ ───────────► │ public double getBalance()   │
 └──────────┘              │ public void setBalance(...)  │
                           └──────────────────────────────┘
```

```java
class Account {
    private double balance;

    public double getBalance() {
        // validate user
        return balance;
    }

    public void setBalance(double balance) {
        // validate user
        this.balance = balance;
    }
}
```

**Rule:** every data member `private`, with getter and setter methods for each member that must be exposed.

| Advantages                                          | Disadvantage                                         |
|-----------------------------------------------------|------------------------------------------------------|
| Security                                            | Increases code length                                |
| Easy enhancement                                    | Slightly slows execution (extra method calls)        |
| Better maintainability and modularity               |                                                      |
| Flexibility for the user                            |                                                      |

> **Tip:** do not auto-generate setters blindly. Expose only what is needed, and make fields immutable where possible.

### Q5. What is a Tightly Encapsulated class?

A class is **tightly encapsulated if and only if every variable of that class is declared `private`**. It does **not** matter whether getters and setters exist or whether they are public.

```java
class A { private int x = 10; }                 // tightly encapsulated
class B extends A { int y = 20; }               // NOT (y is not private)
class C extends A { private int z = 30; }       // tightly encapsulated
```

```java
class A { int x = 10; }                         // NOT
class B extends A { private int y = 20; }       // NOT (parent is not tightly encapsulated)
class C extends B { private int z = 30; }       // NOT
```

> **Rule:** if the parent class is not tightly encapsulated, **no child class** is tightly encapsulated.

### Q6. What is the difference between Abstraction and Encapsulation?

| Aspect        | Abstraction                                | Encapsulation                                  |
|---------------|--------------------------------------------|------------------------------------------------|
| Focus         | **What** the object does (services)        | **How** data is protected and bundled          |
| Achieved by   | Interfaces and abstract classes            | `private` fields + public methods              |
| Level         | Design level                               | Implementation level                           |
| Goal          | Hide complexity                            | Hide data, protect integrity                   |
| Example       | `List` interface                           | `ArrayList` keeping its array `private`        |

> **Interview one-liner:** Abstraction hides *complexity*; encapsulation hides *data*.

* * *

## 2. Relationships: IS-A, HAS-A

### Q7. What is an IS-A relationship (inheritance)? What reference rules apply?

**What?** Also called **inheritance**. Implemented using the `extends` keyword. **Main advantage: reusability.**

```java
class Parent { public void methodOne() { } }
class Child extends Parent { public void methodTwo() { } }
```

```java
Parent p  = new Parent();
p.methodOne();                 // OK
p.methodTwo();                 // CE: cannot find symbol (method methodTwo() in class Parent)

Child c = new Child();
c.methodOne();                 // OK
c.methodTwo();                 // OK

Parent p1 = new Child();       // OK: parent reference holds child object
p1.methodOne();                // OK
p1.methodTwo();                // CE: only parent methods visible through parent reference

Child c1 = new Parent();       // CE: incompatible types (found Parent, required Child)
```

**Conclusions:**

1. Whatever the parent has is available to the child, but not the reverse. So a **child reference** can call both parent and child methods.
2. A **parent reference** can hold a child object, but can call **only methods defined in the parent type**.
3. A **child reference cannot hold a parent object**.

**Real-world example:** common loan behaviour in `Loan`, specifics in `HousingLoan extends Loan`, `EducationLoan extends Loan`.

### Q8. Why does Java not support multiple inheritance with classes? How does Java still support it?

**What?** Multiple inheritance = a class having more than one parent class at the same level.

```java
class A {}
class B {}
class C extends A, B {}      // INVALID: a class can extend only one class
```

**Why not?** **Ambiguity.** If `Parent1.methodOne()` and `Parent2.methodOne()` both exist, then `child.methodOne()` does not know which one to call.

```
Parent1 ──► methodOne()
Parent2 ──► methodOne()      c.methodOne()  →  which one?  ← ambiguity problem
```

**Through interfaces it is allowed:**

```java
interface A {}
interface B {}
interface C extends A, B {}   // VALID
```

**Why no ambiguity in interfaces (classic answer)?** Interface methods are only declarations with no implementation. Even if two interfaces declare `methodOne()`, the implementing class provides **one** implementation.

```java
interface Inter1 { void methodOne(); }
interface Inter2 { void methodOne(); }
interface Inter3 extends Inter1, Inter2 {}

class Test implements Inter3 {
    public void methodOne() { System.out.println("This is methodOne()"); }
}
```

**More facts:**

- A class with no `extends` is a **direct child of `Object`**.
- A class that extends another class is an **indirect child of Object** (this forms **multilevel inheritance**).
- `class A extends B` and also directly `Object` is invalid (that would be multiple inheritance).

### Q9. What about default methods? Do interfaces still avoid the diamond problem? (modern follow-up)

Since **Java 8**, interfaces can have `default` method bodies, so the "interfaces have no implementation" argument is only the classic one. Java handles the conflict **explicitly**:

```java
interface A { default void hello() { System.out.println("A"); } }
interface B { default void hello() { System.out.println("B"); } }

class C implements A, B {
    @Override
    public void hello() {            // compiler FORCES you to resolve the conflict
        A.super.hello();             // choose one explicitly (or write your own)
    }
}
```

**Rules:** class wins over interface; more specific interface wins; otherwise the compiler error forces you to override.

### Q10. Is cyclic inheritance allowed in Java?

**No.** It gives a compile-time error.

```java
class A extends B {}
class B extends A {}      // CE: cyclic inheritance involving A

class A extends A {}      // CE: cyclic inheritance involving A
```

### Q11. What is the root of the class hierarchy? What is the root of the exception hierarchy?

- **`java.lang.Object`** is the root of every Java class. The most commonly required functionality (`equals`, `hashCode`, `toString`, `clone`, `wait`, `notify`...) is defined there.
- **`java.lang.Throwable`** is the root of all exceptions and errors.

```
Object
 ├── String
 ├── Number ── Byte, Short, Integer, Long, Float, Double
 └── Throwable
       ├── Exception
       └── Error
```

### Q12. What is a HAS-A relationship? Composition vs Aggregation?

**What?** Also called **composition or aggregation**. There is no special keyword; usually you use the **`new` operator**. **Main advantage: reusability.**

```java
class Engine { /* engine specific functionality */ }
class Car {
    Engine e = new Engine();     // Car HAS-A Engine
}
```

**Main disadvantage:** increases **dependency** between components and can create maintenance problems.

| Aspect            | **Composition**                                                    | **Aggregation**                                              |
|-------------------|--------------------------------------------------------------------|--------------------------------------------------------------|
| Association       | **Strong**                                                         | **Weak**                                                     |
| Lifetime          | Contained object cannot exist without the container                | Contained object can exist without the container             |
| Container holds   | The contained objects **directly** (owns them)                     | Just a **reference** to the contained objects                |
| Example           | University and its Departments (university destroyed ⇒ departments gone) | Department and Professors (department closed, professors still exist) |

```java
// Composition: container creates and owns the part
class University {
    private final List<Department> departments = new ArrayList<>();
    University() { departments.add(new Department("CSE")); }
}

// Aggregation: container receives existing objects
class Department {
    private final List<Professor> professors = new ArrayList<>();
    void add(Professor p) { professors.add(p); }       // professor lives independently
}
```

### Q13. When do you choose IS-A vs HAS-A?

| Use IS-A (inheritance) when                       | Use HAS-A (composition) when                          |
|---------------------------------------------------|-------------------------------------------------------|
| The child **really is a** specialized parent (`HousingLoan` is a `Loan`) | One class **uses** another (`Car` has an `Engine`) |
| You need polymorphic substitution                 | You only want to reuse behaviour                      |
| The relationship is permanent                     | The part can be swapped at runtime                    |

**Design guidance:** *prefer composition over inheritance.* Inheritance couples child to parent implementation (fragile base class problem); composition is more flexible and testable.

* * *

## 3. Polymorphism: Overloading, Overriding, Hiding

### Q14. What is polymorphism? What are its types?

**What?** "Same name, different forms."

- `abs(int)`, `abs(long)`, `abs(float)`: same method name, different argument types.
- `List l = new ArrayList();` / `new LinkedList()` / `new Vector()` / `new Stack()`: one parent reference holds many child objects.

```
Polymorphism
 ├── Compile-time / static / early binding
 │     ├── Overloading
 │     └── Method hiding
 └── Runtime / dynamic / late binding
       └── Overriding
```

| Type         | Resolved by | Based on          | Mechanism                         |
|--------------|-------------|-------------------|-----------------------------------|
| Compile-time | Compiler    | **Reference type**| Overloading, method hiding, variables |
| Runtime      | JVM         | **Runtime object**| Overriding (dynamic method dispatch) |

### Q15. What is a method signature?

**Method name followed by the argument types.** Return type is **not** part of the signature.

```java
public void methodOne(int i, float f);      // signature: methodOne(int, float)
```

- The compiler uses the signature to resolve method calls.
- Two methods with the same signature in one class give a compile-time error, even if return types differ:

```java
public void methodOne() { }
public int methodOne() { return 10; }       // CE: methodOne() is already defined in Test
```

### Q16. What is method overloading?

**What?** Two methods are overloaded **if and only if they have the same name but different argument types** (or number/order of arguments).

**Why?** In C you needed `abs()`, `labs()`, `fabs()` for different types. Java lets you reuse one name, which **reduces programming complexity**.

```java
class Test {
    public void methodOne()           { System.out.println("no-arg method"); }
    public void methodOne(int i)      { System.out.println("int-arg method"); }
    public void methodOne(double d)   { System.out.println("double-arg method"); }

    public static void main(String[] args) {
        Test t = new Test();
        t.methodOne();        // no-arg method
        t.methodOne(10);      // int-arg method
        t.methodOne(10.5);    // double-arg method
    }
}
```

> **Conclusion:** in overloading the **compiler** decides the method based on the **reference/argument types**, not the runtime object. So it is **compile-time / static polymorphism / early binding**.

### Q17. What is automatic promotion in overloading?

If the compiler cannot find an **exact match**, it does **not** fail immediately. It **promotes the argument to the next type** and tries again, continuing until all promotions are exhausted; then it gives a compile error.

```
byte → short → int → long → float → double
              char → int
```

```java
class Test {
    public void methodOne(int i)   { System.out.println("int-arg method"); }
    public void methodOne(float f) { System.out.println("float-arg method"); }

    public static void main(String[] args) {
        Test t = new Test();
        t.methodOne('a');     // int-arg method   (char → int)
        t.methodOne(10L);     // float-arg method (long → float)
        t.methodOne(10.5);    // CE: cannot find symbol (double cannot be narrowed to float)
    }
}
```

### Q18. How does Java resolve tricky overload cases (null, Object vs String, varargs, ambiguity)?

**General rules:** exact match wins; **more specific (child) type wins over parent type**; var-args get the **lowest priority**.

**Case 1: String vs Object**

```java
void methodOne(String s) { System.out.println("String version"); }
void methodOne(Object o) { System.out.println("Object version"); }

t.methodOne("arun");          // String version
t.methodOne(new Object());    // Object version
t.methodOne(null);            // String version (child is more specific)
```

**Case 2: unrelated types, `null` is ambiguous**

```java
void methodOne(String s)       { }
void methodOne(StringBuffer s) { }

t.methodOne(null);   // CE: reference to methodOne is ambiguous
```

**Case 3: argument order ambiguity**

```java
void methodOne(int i, float f) { System.out.println("int-float method"); }
void methodOne(float f, int i) { System.out.println("float-int method"); }

t.methodOne(10, 10.5f);     // int-float method
t.methodOne(10.5f, 10);     // float-int method
t.methodOne(10, 10);        // CE: ambiguous (both match via promotion)
t.methodOne(10.5f, 10.5f);  // CE: cannot find symbol
```

**Case 4: var-arg has least priority** (similar to `default` in a switch)

```java
void methodOne(int i)      { System.out.println("general method"); }
void methodOne(int... i)   { System.out.println("var-arg method"); }

t.methodOne();         // var-arg method
t.methodOne(10, 20);   // var-arg method
t.methodOne(10);       // general method
```

**Case 5: reference type decides, not the runtime object**

```java
class Animal {}  class Monkey extends Animal {}

void methodOne(Animal a) { System.out.println("Animal version"); }
void methodOne(Monkey m) { System.out.println("Monkey version"); }

Animal a1 = new Monkey();
t.methodOne(a1);             // Animal version  (reference type is Animal)
```

### Q19. What is method overriding? How does dynamic method dispatch work?

**What?** If the child is not satisfied with the parent's method implementation, it may **redefine** it in its own way. The parent method is the **overridden method**; the child method is the **overriding method**.

```java
class Parent {
    public void marry() { System.out.println("subbalakshmi"); }     // overridden
}
class Child extends Parent {
    @Override
    public void marry() { System.out.println("child's choice"); }   // overriding
}

Parent p  = new Parent();  p.marry();    // subbalakshmi    (parent method)
Child  c  = new Child();   c.marry();    // child's choice  (child method)
Parent p1 = new Child();   p1.marry();   // child's choice  (child method!)
```

> **Key point:** In overriding, the **JVM** picks the method based on the **runtime object**; the reference type is "dummy". This is **runtime polymorphism / dynamic / late binding**, also called **dynamic method dispatch**.

**How it works internally:** each class has a **vtable** (virtual method table). `invokevirtual` looks up the actual object's class at runtime.

### Q20. What are the rules for method overriding?

| #  | Rule                                                                                  | Example / Notes                                                                 |
|----|---------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| 1  | **Method name and arguments must be same** (same signature)                           | Otherwise it is overloading                                                     |
| 2  | **Return type: same, or covariant (from Java 1.5)**                                   | Parent `Object` → Child `String` is OK                                          |
| 3  | Covariance applies only to **object types, not primitives**                           | `double` → `int` is invalid                                                     |
| 4  | **Cannot reduce access:** `private < default < protected < public`                    | `public` parent → `protected` child is a CE                                     |
| 5  | **`final` methods cannot be overridden**                                              | CE: overridden method is final                                                  |
| 6  | **`private` methods are not inherited**, so overriding does not apply                 | Same-named private method in child is just a new method                         |
| 7  | **`static` methods cannot be overridden** (they can be *hidden*)                      | static→non-static or non-static→static is a CE                                  |
| 8  | Abstract parent methods **must** be overridden by concrete children                   | `abstract class Parent { abstract void m(); }`                                  |
| 9  | A non-abstract method can be overridden as `abstract`                                 | Stops the parent implementation reaching next-level children                    |
| 10 | Non-final can be overridden as `final`; `native`, `synchronized`, `strictfp` have no restriction | Only `final` and access are restricted                              |
| 11 | **Checked exceptions:** child cannot throw broader checked exceptions                 | See Q21                                                                         |

**Covariant return type example:**

```java
class Parent { public Object methodOne() { return null; } }
class Child extends Parent {
    @Override public String methodOne() { return null; }   // valid from 1.5, invalid in 1.4
}
```

```
Parent return type  →  Child return type
Object              →  String       ✓
Number              →  Integer      ✓
String              →  Object       ✗
double              →  int          ✗ (primitives: must match exactly)
```

**Access reduction (CE):**

```java
class Parent { public void methodOne() {} }
class Child extends Parent { protected void methodOne() {} }
// CE: attempting to assign weaker access privileges; was public
```

**Final method (CE):**

```java
class Parent { public final void methodOne() {} }
class Child extends Parent { public void methodOne() {} }
// CE: methodOne() in Child cannot override methodOne() in Parent; overridden method is final
```

### Q21. What are the rules for exceptions while overriding? (checked vs unchecked)

- **Checked exceptions** are checked by the compiler (everything except `RuntimeException`, `Error` and their children).
- **Unchecked exceptions** are `RuntimeException`, `Error` and their children.

```
Throwable
 ├── Exception
 │    ├── RuntimeException (unchecked): ArithmeticException, NullPointerException,
 │    │                     IndexOutOfBounds, IllegalArgument, ClassCast, IllegalState
 │    └── IOException, SQLException, ServletException ... (checked)
 └── Error (unchecked): StackOverflowError, OutOfMemoryError ...
```

> **Rule:** if the **child method throws a checked exception**, the **parent method must throw the same exception or its parent**. There are **no restrictions for unchecked** exceptions.
> (In other words, the overriding method can throw the same, a narrower, or fewer checked exceptions, never a broader or new one.)

| # | Parent                         | Child                                                | Result      |
|---|--------------------------------|------------------------------------------------------|-------------|
| 1 | `throws Exception`             | no throws                                            | valid       |
| 2 | no throws                      | `throws Exception`                                   | **invalid** |
| 3 | `throws Exception`             | `throws Exception`                                   | valid       |
| 4 | `throws IOException`           | `throws Exception`                                   | **invalid** |
| 5 | `throws IOException`           | `throws EOFException, FileNotFoundException`         | valid       |
| 6 | `throws IOException`           | `throws EOFException, InterruptedException`          | **invalid** (`InterruptedException` is not an `IOException`) |
| 7 | `throws IOException`           | `throws EOFException, ArithmeticException`           | valid (unchecked is free) |
| 8 | no throws                      | `throws ArithmeticException, NullPointerException, ClassCastException, RuntimeException` | valid |

### Q22. Can static methods be overridden? What is method hiding?

- A `static` method **cannot** be overridden as non-static, and a non-static **cannot** be overridden as static (both are compile errors).
- If both parent and child have the **same `static` method**, it is valid but it is **method hiding, not overriding**.

| Overriding                                         | Method hiding                                          |
|----------------------------------------------------|--------------------------------------------------------|
| Both methods must be **non-static**                | Both methods must be **static**                        |
| Resolved by **JVM** based on **runtime object**    | Resolved by **compiler** based on **reference type**   |
| Runtime / dynamic / late binding                   | Compile-time / static / early binding                  |

```java
class Parent { public static void methodOne() { System.out.println("parent class"); } }
class Child extends Parent { public static void methodOne() { System.out.println("child class"); } }

Parent p  = new Parent(); p.methodOne();    // parent class
Child  c  = new Child();  c.methodOne();    // child class
Parent p1 = new Child();  p1.methodOne();   // parent class  (reference type decides)
```

If both were non-static (overriding), the output would be: `Parent class`, `Child class`, `Child class`.

### Q23. How does overriding work with var-arg methods?

A var-arg method must be overridden **with a var-arg method**. If you override with a normal method, it becomes **overloading**.

```java
class Parent { public void methodOne(int... i) { System.out.println("parent class"); } }
class Child extends Parent {
    public void methodOne(int i) { System.out.println("child class"); }   // overloading, NOT overriding
}

Parent p1 = new Child();
p1.methodOne(10);           // parent class
```

Outputs for (`Parent`, `Child`, `Parent→Child`): `parent class`, `child class`, `parent class`. If the child also uses `int...`, it becomes overriding and the output is `parent class`, `child class`, `child class`.

### Q24. Can variables be overridden?

**No.** Overriding does not apply to variables. **Variable resolution is done by the compiler based on the reference type**, regardless of static/non-static.

```java
class Parent { int x = 888; }
class Child extends Parent { int x = 999; }

Parent p  = new Parent(); System.out.println(p.x);    // 888
Child  c  = new Child();  System.out.println(c.x);    // 999
Parent p1 = new Child();  System.out.println(p1.x);   // 888  (reference type)
```

### Q25. Difference between Overloading and Overriding?

| #  | Property                  | Overloading                               | Overriding                                                       |
|----|---------------------------|-------------------------------------------|------------------------------------------------------------------|
| 1  | Method names              | Same                                      | Same                                                             |
| 2  | Argument types            | Must be **different** (at least order)    | Must be **same** including order                                 |
| 3  | Method signature          | Different                                 | Same                                                             |
| 4  | Return types              | No restriction                            | Same (or covariant from 1.5)                                     |
| 5  | `private`, `static`, `final` | **Can be overloaded**                  | **Cannot be overridden**                                         |
| 6  | Access modifiers          | No restriction                            | Cannot be reduced                                                |
| 7  | `throws` clause           | No restriction                            | Checked exceptions restricted                                    |
| 8  | Method resolution         | Compiler, based on **reference type**     | JVM, based on **runtime object**                                 |
| 9  | Also known as             | Compile-time / static / early binding     | Runtime / dynamic / late binding                                 |

> **Tip:** for overloading only check name and arguments. For overriding check everything: name, arguments, return type, access, throws, modifiers.

### Q26. Given `Parent: public void methodOne(int i) throws IOException`, which child methods are valid?

| # | Child method                                    | Verdict                                                                 |
|---|-------------------------------------------------|-------------------------------------------------------------------------|
| 1 | `public void methodOne(int i)`                  | Valid (overriding)                                                      |
| 2 | `private void methodOne() throws Exception`     | Valid (overloading, different args)                                     |
| 3 | `public native void methodOne(int i);`          | Valid (overriding, `native` is allowed)                                 |
| 4 | `public static void methodOne(double d)`        | Valid (overloading)                                                     |
| 5 | `public static void methodOne(int i)`           | **CE:** overriding method is static                                     |
| 6 | `public static abstract void methodOne(float f)`| **CE:** illegal combination of modifiers `abstract` and `static`        |

* * *

## 4. Constructors

### Q27. What is a constructor? What are the rules to write one?

**What?** Creating an object is not enough; it must be **initialized** before it can respond properly. The piece of code that runs automatically at object creation to initialize it is the **constructor**.

```java
class Student {
    String name;
    int rollno;

    Student(String name, int rollno) {      // constructor
        this.name = name;
        this.rollno = rollno;
    }

    public static void main(String[] args) {
        Student s1 = new Student("vijayabhaskar", 101);
        Student s2 = new Student("bhaskar", 102);
    }
}
```

**Rules:**

1. Constructor name **must equal the class name**.
2. **No return type**, not even `void`. If you write one, the compiler silently treats it as a **method**, not a constructor.
3. Allowed modifiers: **`public`, default (package), `protected`, `private`** only. Anything else (e.g. `static`) is a compile error: "modifier static not allowed here".
4. A method with the same name as the class is legal (but a bad idea).

```java
class Test {
    void Test() { }        // NOT a constructor, just a method
    static Test() { }      // CE: modifier static not allowed here
}
```

### Q28. Constructor vs instance block?

| Aspect              | Constructor                                    | Instance block                                   |
|---------------------|------------------------------------------------|--------------------------------------------------|
| Runs                | For every object creation, **after** instance block | For every object creation, **before** constructor |
| Purpose             | **Initialize** the object                      | Any extra activity for **every** object creation (common code for all constructors) |
| Arguments           | Can take arguments                             | Cannot take arguments                            |
| Replaceable?        | No, serve different purposes                   | No                                               |

**Example: counting objects created**

```java
class Test {
    static int count = 0;
    {
        count++;               // instance block runs for every object, whichever constructor is used
    }
    Test() { }
    Test(int i) { }

    public static void main(String[] args) {
        new Test(); new Test(10); new Test();
        System.out.println(count);    // 3
    }
}
```

### Q29. What is a default constructor? What does it look like?

1. **Every class** (including abstract classes) has a constructor.
2. If you write **no constructor**, the **compiler generates a default constructor**.
3. If you write **at least one**, the compiler **does not** generate one. A class has either compiler-generated or programmer-written constructors, never both.

**Prototype of the default constructor:**

1. Always a **no-argument** constructor.
2. Its access modifier is **same as the class** (applies to `public` and default).
3. It contains exactly one line: **`super();`**

| Programmer code                        | Compiler-generated code                       |
|----------------------------------------|-----------------------------------------------|
| `class Test { }`                       | `class Test { Test() { super(); } }`          |
| `public class Test { }`                | `public class Test { public Test() { super(); } }` |
| `class Test { void Test(){} }`         | `Test() { super(); }` is added (the method is not a constructor) |
| `class Test { Test(int i){} }`         | `Test(int i) { super(); }`                    |
| `class Test { Test(int i){ this(); } Test(){} }` | `Test(int i){ this(); }` and `Test(){ super(); }` |

### Q30. What is the difference between `super()`/`this()` and `super`/`this`?

| `super()`, `this()`                                   | `super`, `this`                                              |
|-------------------------------------------------------|--------------------------------------------------------------|
| **Constructor calls**                                 | **Keywords**                                                 |
| Invoke parent / current-class constructors            | Refer to parent / current-class **instance members**         |
| Only inside a constructor, as the **first line**      | Anywhere in the **instance area**, not in static context     |

**Rules for `super()` / `this()`:**

```
1. Only in the 1st line of a constructor
2. Use only one of them, not both
3. Only inside a constructor (not in methods)
```

```java
class Test {
    Test() {
        System.out.println("constructor");
        super();               // CE: call to super must be first statement in constructor
    }
}
```

```java
Test() { super(); this(); }     // CE: can't use both
void m() { super(); }           // CE: only inside constructors
public static void main(String[] a) { System.out.println(super.hashCode()); }
// CE: non-static variable super cannot be referenced from a static context
```

> **Compiler rule:** if you write neither, the compiler always inserts `super();` as the first line.

> **Modern note (Java 25, JEP 513 "Flexible Constructor Bodies"):** statements that do **not** reference `this` are now allowed *before* `super(...)`/`this(...)` (for example argument validation). The classic exam answer above still holds for Java 24 and below.

### Q31. What are overloaded constructors? What is constructor chaining? What if it is recursive?

A class can have many constructors with the **same name and different arguments**. They are **overloaded constructors**. Use `this(...)` to call one from another (**constructor chaining**).

```java
class Test {
    Test(double d) { System.out.println("double-arg constructor"); }
    Test(int i)    { this(10.5); System.out.println("int-arg constructor"); }
    Test()         { this(10);   System.out.println("no-arg constructor"); }

    public static void main(String[] args) {
        new Test();      // double-arg → int-arg → no-arg
        new Test(10);    // double-arg → int-arg
        new Test(10.5);  // double-arg
    }
}
```

**Recursive method vs recursive constructor:**

| Case                                  | Result                                            |
|---------------------------------------|---------------------------------------------------|
| Recursive **method** call             | **Runtime** `StackOverflowError`                  |
| Recursive **constructor** invocation (`Test(int i){ this(); }  Test(){ this(10); }`) | **Compile-time error**: recursive constructor invocation |

### Q32. Can constructors be inherited or overridden? Can an abstract class or interface have a constructor?

- A parent constructor is **not inherited** by the child. So **inheritance and overriding do not apply to constructors**. But constructors **can be overloaded**.
- **Class**: yes. **Abstract class**: yes. **Interface**: **no** (compile error).

```java
class Test { Test() {} }                    // valid
abstract class Test { Test() {} }           // valid
interface Test1 { Test1() {} }              // invalid
```

**Why does an abstract class need a constructor if you cannot create its object?**
Because its constructor runs for **every child object creation** to initialize the parent-class part of that object.

### Q33. When a child object is created, is a parent object also created?

**No.** Only the **parent class constructor is executed**; there is **one object** (the child).

```java
abstract class Parent {
    Parent() { System.out.println(this.hashCode()); }    // same object as the child!
}
class Child extends Parent {
    Child() { System.out.println(this.hashCode()); }
    public static void main(String[] a) {
        Child c = new Child();
        System.out.println(c.hashCode());               // all three hash codes are identical
    }
}
```

> **Interview one-liner:** Creating a child object runs the parent constructor, but does **not** create a separate parent object.

### Q34. What if the parent class has only argument constructors? What if the parent constructor throws an exception?

**Case 1: no no-arg constructor in the parent**

```java
class Parent { Parent(int i) {} }
class Child extends Parent {
    Child() { super(); }       // CE: cannot find symbol: constructor Parent()
}
```

Also happens when the child has **no constructor at all** (the default `super();` call fails). **Fix:** call `super(10)` explicitly, or give the parent a no-arg constructor.

> **Rule:** whenever you write an argument constructor, also write a no-arg constructor.

**Case 2: parent constructor throws a checked exception**

```java
class Parent { Parent() throws java.io.IOException {} }
class Child extends Parent { }
// CE: unreported exception java.io.IOException in default constructor
```

```java
class Child extends Parent {
    Child() throws Exception { super(); }       // OK: same or broader checked exception
}
```

> **Rule:** if the parent constructor throws a checked exception, the child constructor must declare the **same checked exception or its parent**.

### Q35. Quick-fire: which of these constructor statements are true?

| #  | Statement                                                                                  | True? |
|----|--------------------------------------------------------------------------------------------|-------|
| 1  | Constructor name need not match the class name                                             | False |
| 2  | We can declare a return type for a constructor if it is `void`                              | False (it becomes a method) |
| 3  | Any modifier is allowed on a constructor                                                   | False (only public, default, protected, private) |
| 4  | Compiler **always** generates a default constructor                                        | False (only if none written) |
| 5  | Default constructor is always `default` access                                             | False (same as class access) |
| 6  | First line of every constructor must be `super()`                                          | False (`this()` also allowed) |
| 7  | If you write nothing, compiler places `this()`                                             | False (places `super()`) |
| 8  | Overloading is not applicable to constructors                                              | False |
| 9  | Inheritance and overriding apply to constructors                                           | False |
| 10 | Concrete class can have a constructor but abstract class cannot                            | False |
| 11 | Interface can contain a constructor                                                        | False |
| 12 | Recursive constructor call is always a runtime exception                                   | False (compile error) |
| 13 | If parent constructor throws an unchecked exception, child must declare it                 | False (unchecked is free) |
| 14 | A singleton class can be built without a private constructor                               | False |

* * *

## 5. Initialization Order: Static and Instance Control Flow

### Q36. Explain static control flow. What is RIWO?

When a class is loaded and run (e.g. `java Base`), the JVM does this in order:

1. **Identification of static members** from top to bottom (variables and blocks get default values).
2. **Execution of static variable assignments and static blocks** from top to bottom.
3. **Execution of `main()`**.

```java
class Base {
    static int i = 10;                         // (1)
    static {                                    // (2)
        methodOne();
        System.out.println("first static block");
    }
    public static void main(String[] args) {   // (3)
        methodOne();
        System.out.println("main method");
    }
    public static void methodOne() {           // (4)
        System.out.println(j);
    }
    static {                                    // (5)
        System.out.println("second static block");
    }
    static int j = 20;                         // (6)
}
```

```
Output:
0                       ← j is still 0 here
first static block
second static block
20
main method
```

**Why 0?** In step 1, `i = 0` and `j = 0` (default values), in a state called **RIWO (Read Indirectly, Write Only)**. Only after step 2 executes `i = 10` and `j = 20` do they become fully read-write (**R&W**).

**RIWO rules:**

- Reading a variable **directly** inside a static block, before its declaration line, is a **compile error: "illegal forward reference"**.
- Reading it **indirectly via a method call** is allowed and prints the default value.

```java
class Test {
    static { System.out.println(i); }      // CE: illegal forward reference (direct read)
    static int i = 10;
}
class Test {
    static { methodOne(); }                // OK: indirect read → prints 0
    public static void methodOne() { System.out.println(i); }
    static int i = 10;
}
```

(Writing before declaration is always allowed: `static { i = 5; }  static int i;`)

### Q37. How does static control flow work in a parent-child relationship?

When you run the **child class**:

1. Identify static members from **parent to child**.
2. Execute static variable assignments and static blocks from **parent to child**.
3. Execute the **child's `main()`**.

```
java Derived
0                           ← Base static block calls methodOne() → j = 0
Base static block
0                           ← Derived static block calls methodTwo() → y = 0
Derived first static block
Derived second static block
200
Derived main
```

> **Note:** loading the child class **automatically loads the parent**, but loading the parent does **not** load the child. (So `java Base` prints only Base's output: `0`, `Base static block`, `20`, `Base main`.)

### Q38. What is a static block used for? Can we print without `main()`?

Static blocks run at **class loading time**, and a class can have any number of them (executed top to bottom).

**Uses:**

- Load **native libraries**: `static { System.loadLibrary("lib"); }`
- Every **JDBC driver** registers itself with `DriverManager` in a static block.
- One-time heavy initialization.

**Can we print without `main()`?** Yes **up to Java 1.6**, using a static block, a static variable initializer calling a method, or a static `new` object:

```java
class Google {
    static {
        System.out.println("hello i can print");
        System.exit(0);               // exit so JVM doesn't complain about missing main()
    }
}
```

```java
class Test { static int i = methodOne();  static int methodOne() { System.out.println("hi"); System.exit(0); return 10; } }
class Test { static Test t = new Test();  Test() { System.out.println("hi"); System.exit(0); } }
class Test { static Test t = new Test();  { System.out.println("hi"); System.exit(0); } }
```

> **From Java 1.7 onwards, `main()` is mandatory** to run a class. Without it you get *"Main method not found"* before the static block can print. (Java 21+ preview "unnamed classes and instance main methods" changes how `main` may look, but a launchable entry point is still required.)

**Printing without `System.out.println`:** `System.err.println("hello");` also reaches the console.

### Q39. Explain instance control flow.

Whenever you **create an object** (`new`), the following runs **every time** (unlike static flow, which is one-time at class loading):

1. **Identification of instance members** from top to bottom.
2. **Execution of instance variable assignments and instance blocks** from top to bottom.
3. **Execution of the constructor.**

```java
class Parent {
    int i = 10;
    {                                              // instance block 1
        methodOne();
        System.out.println("first instance block");
    }
    Parent() { System.out.println("Parent class constructor"); }

    public static void main(String[] args) {
        Parent p = new Parent();
        System.out.println("main method");
    }
    public void methodOne() { System.out.println(j); }
    {                                              // instance block 2
        System.out.println("second instance block");
    }
    int j = 20;
}
```

```
Output:
0                           ← j is RIWO while instance block 1 runs
first instance block
second instance block
Parent class constructor
main method
```

> **Static flow = one-time activity at class loading. Instance flow = repeated for every object creation.**

### Q40. How does instance control flow work in a parent-child relationship?

When you create a **child object**:

1. Identify instance members **from parent to child**.
2. Execute instance variable assignments and instance blocks **only in the parent**.
3. Execute the **parent constructor**.
4. Execute instance variable assignments and instance blocks **in the child**.
5. Execute the **child constructor**.

```
java Child   (creating new Child())
0                              ← Parent block: methodOne() prints y (still 0)
Parent first instance block
parent class constructor
0                              ← Child block: methodTwo() prints j (still 0)
Child first instance block
Child second instance block
Child class constructor
Child class main method
```

**Initialization puzzle (very common):**

```java
public class Initilization {
    private static String methodOne(String msg) { System.out.println(msg); return msg; }

    public Initilization() { m = methodOne("1"); }
    {                       m = methodOne("2"); }
    String m = methodOne("3");

    public static void main(String[] args) { new Initilization(); }
}
// Output: 2, 3, 1   (instance block, then variable initializer, then constructor, in textual order)
```

```java
public class Initilization {
    static String m = methodOne("1");
    {                    m = methodOne("2"); }     // instance block (no `static`)
    static {             m = methodOne("3"); }
    public static void main(String[] args) { new Initilization(); }
}
// Output: 1, 3, 2   (static flow first at class load, then instance flow at new)
```

### Q41. Why can't static code access instance members directly?

Static members are identified at **class loading**; instance members only exist when an object is created. At static-area execution time, the JVM may not yet know about instance members.

```java
class Test {
    int i = 10;
    public static void main(String[] args) {
        System.out.println(i);     // CE: non-static variable i cannot be referenced from a static context
    }
}
```

- From the **instance area**, you can access both instance and static members directly.
- **Static members** can be accessed from **anywhere** directly, since they are identified at class loading.
- Tip: object creation is a costly operation, so do not create objects without a specific need.

* * *

## 6. Type Casting, Object Creation, Design Concepts

### Q42. What are the rules of object type casting? (compile-time and runtime checks)

**Syntax:** `A b = (C) d;` where `A` = class/interface, `b` = reference name, `C` = class/interface cast to, `d` = reference variable/object.

**Why cast?** A parent reference can hold a child object but cannot call child-specific methods. Casting gives a reference of another type to the **same object**.

```java
Object o = new String("ashok");
o.hashCode();          // valid
o.length();            // CE: cannot find symbol (method length() in class Object)
```

**Compile-time checks:**

| Rule | Description                                                                                       | Violation error        |
|------|---------------------------------------------------------------------------------------------------|------------------------|
| 1    | Type of `d` and `C` must be related (child to parent, parent to child, or same)                   | `inconvertible types`  |
| 2    | `C` must be the **same or a subtype of `A`**                                                       | `incompatible types`   |

```java
Object o = new String("bhaskar");
StringBuffer sb = (StringBuffer) o;     // compiles (Object ↔ StringBuffer are related)

String s = new String("bhaskar");
StringBuffer sb2 = (StringBuffer) s;    // CE: inconvertible types (String and StringBuffer unrelated)

Object o3 = new String("bhaskar");
StringBuffer sb3 = (String) o3;         // CE: incompatible types (String is not a StringBuffer)
```

**Runtime check:** the **actual object** referred to by `d` must be the same or a subtype of `C`, otherwise **`ClassCastException`**.

```java
Object o = new String("bhaskar");
StringBuffer sb = (StringBuffer) o;     // compiles fine, then RE: ClassCastException
```

**Practice with a hierarchy:**

```
          Object
         /      \
      Base1     Base2
      /   \      /   \
Derived1 Derived2 Derived3 Derived4
```

```java
Base1 b = new Derived2();
Object o  = (Base1) b;                    // valid
Object o1 = (Base2) o;                    // compiles, RE: ClassCastException (object is Derived2)
Object o2 = (Base2) b;                    // CE: inconvertible types (Base1 vs Base2 unrelated)
Base2 b1  = (Base1) (new Derived1());     // CE: incompatible types (Base1 is not a Base2)
Base2 b2  = (Base2) (new Derived3());     // valid
Base2 b3  = (Base2) (new Derived1());     // CE: inconvertible types
```

> **Casting changes the type of the reference, not the object.** No new object is created: `Object o = (Object) s; s == o` is `true`.

**Modern shortcut (Java 16+):** avoid manual cast + `instanceof` boilerplate:

```java
if (o instanceof String s) {              // pattern matching, no ClassCastException risk
    System.out.println(s.length());
}
```

### Q43. What happens to methods and variables after casting? (override vs hiding vs variables)

Given `A ← B ← C` where `C c = new C();`:

**Example 1: instance methods (overriding), resolved by runtime object**

```java
c.methodOne();                       // C
((B) c).methodOne();                 // C
((A) ((B) c)).methodOne();           // C
```

**Example 2: static methods (hiding), resolved by reference type**

```java
c.methodOne();                       // C
((B) c).methodOne();                 // B
((A) ((B) c)).methodOne();           // A
```

**Example 3: variables (`int x` = 777 in A, 888 in B, 999 in C), resolved by reference type**

```java
c.x;                                 // 999
((B) c).x;                           // 888
((A) ((B) c)).x;                     // 777
```

**Example 4: method only in the child**

```java
Child c = new Child();
((Parent) c).methodOne();            // OK (exists in Parent, runs child's override if overridden)
((Parent) c).methodTwo();            // CE: cannot find symbol (methodTwo not in Parent)
```

| Member kind        | Decided by            |
|--------------------|-----------------------|
| Instance method    | **Runtime object**    |
| Static method      | Reference type        |
| Variable (any)     | Reference type        |

### Q44. What is the difference between `ArrayList l = new ArrayList()` and `List l = new ArrayList()`?

| `ArrayList al = new ArrayList();` ( `Child c = new Child();` ) | `List l = new ArrayList();` ( `Parent p = new Child();` ) |
|-----------------------------------------------------------------|------------------------------------------------------------|
| Use when you **know the exact runtime type**                    | Use when you **don't know / don't care** about the runtime type |
| Can call **both** `List` and `ArrayList` methods                | Can call **only `List` interface** methods (not ArrayList-specific ones like `ensureCapacity()`) |
| Reference can hold **only** an `ArrayList` object               | Reference can hold **any `List` implementation** (`ArrayList`, `LinkedList`, `Vector`, `Stack`) |

> **Best practice:** "program to an interface" (`List<String> list = new ArrayList<>();`) so you can swap the implementation later without changing the callers.

### Q45. In how many ways can you create an object in Java?

| #  | Way                                  | Example                                                                          | Constructor called? |
|----|--------------------------------------|----------------------------------------------------------------------------------|---------------------|
| 1  | `new` operator                       | `Test t = new Test();`                                                           | Yes                 |
| 2  | Reflection (`newInstance`)           | `Test t = (Test) Class.forName("Test").getDeclaredConstructor().newInstance();`  | Yes                 |
| 3  | `clone()`                            | `Test t2 = (Test) t1.clone();`                                                   | **No**              |
| 4  | Factory methods                      | `Runtime r = Runtime.getRuntime();`  `DateFormat df = DateFormat.getInstance();` | (inside the factory)|
| 5  | Deserialization                      | `Test t = (Test) new ObjectInputStream(new FileInputStream("abc.ser")).readObject();` | **No** (for the Serializable class) |

> `Class.newInstance()` is **deprecated since Java 9**; use `getDeclaredConstructor().newInstance()`.
> Cloning and deserialization are exactly why singleton classes must guard against both (see Q46).

### Q46. What is a Singleton class? How do you create your own? What is a "doubleton"?

**What?** A class for which **only one object** is allowed. Examples: `Runtime`, `ActionServlet`, `ServiceLocator`, `BusinessDelegate`.

```java
Runtime r1 = Runtime.getRuntime();     // factory method
Runtime r2 = Runtime.getRuntime();
System.out.println(r1 == r2);          // true
```

**Advantage:** if the requirement is the same for every user, one shared object instead of one per user improves **performance** and **memory utilization**.

**Recipe:** **private constructor + private static variable + public static factory method.**

```java
class Test {
    private static Test t = null;
    private Test() { }
    public static Test getTest() {            // factory method
        if (t == null) {
            t = new Test();                   // NOT thread-safe, see below
        }
        return t;
    }
}
```

**"Xxxton" classes** (doubleton, tripleton...) simply keep N instances and hand them out (e.g. randomly or round-robin):

```java
class Test {
    private static Test t1 = null, t2 = null;
    private Test() { }
    public static Test getTest() {
        if (t1 == null) { t1 = new Test(); return t1; }
        else if (t2 == null) { t2 = new Test(); return t2; }
        else return Math.random() < 0.5 ? t1 : t2;
    }
}
```

> **Interview warning:** the lazy version above is **not thread-safe**. Use the **enum**, **Bill Pugh holder** or **double-checked locking with `volatile`** approach. All singleton variants, plus how reflection and serialization break them, are explained on the Singleton page of this site.

### Q47. How can a class not be extendable even though it is not `final`?

Declare **every constructor `private`**. A child constructor must call a parent constructor (`super()`), and it is inaccessible, so no subclass can compile.

```java
class Parent {
    private Parent() { }
}
class Child extends Parent { }      // CE: Parent() has private access in Parent
```

**Modern alternative (Java 17):** `sealed` classes restrict exactly which classes may extend.

```java
public sealed class Shape permits Circle, Square { }
```

### Q48. What is a Factory method?

**What?** A method that you call **using the class name** and that **returns an object of that class** (or a related type), instead of you calling `new` yourself.

```java
Runtime r = Runtime.getRuntime();
DateFormat df = DateFormat.getInstance();
```

**Why?** When object creation is subject to **constraints** (return the same object, choose a subclass based on input, cache, validate), implement it in a factory method.

```java
static Shape of(String type) {
    return switch (type) {
        case "circle" -> new Circle();
        case "square" -> new Square();
        default -> throw new IllegalArgumentException(type);
    };
}
```

**Benefits:** meaningful names (`List.of`, `Integer.valueOf`), can return cached/shared instances, can return a subtype, hides construction details.

### Q49. What are Coupling and Cohesion?

**Coupling** = the **degree of dependency between components**.

```java
class A { static int i = B.j; }
class B extends A { static int j = C.methodOne(); }
class C extends B { public static int methodOne() { return D.k; } }
class D extends C { static int k = 10; }
// All four classes depend on each other: TIGHTLY COUPLED
```

**Tight coupling is bad:**

1. You cannot modify one component without affecting others, so enhancement becomes difficult.
2. Maintainability suffers.
3. Reusability is poor.

**Cohesion** = how focused a component is. A component with **one clear, well-defined responsibility has high cohesion.**

```
Low cohesion:  TotalServlet.java  → login page + validation + inbox + compose + forward ...
High cohesion: login.jsp → validate servlet → inbox.jsp / compose.jsp / error.jsp
```

**High cohesion advantages:** easy enhancement, better maintainability, and **reuse** (the same validate servlet is reused everywhere).

> **Golden rule:** **loose coupling + high cohesion.** (Think: depend on interfaces, one class one responsibility. Spring's dependency injection is a practical way to achieve loose coupling.)

### Q50. Abstract class vs Interface (follow-up to abstraction)

| Aspect               | Abstract class                                    | Interface                                                        |
|----------------------|---------------------------------------------------|------------------------------------------------------------------|
| Methods              | Abstract + concrete                               | Abstract (public by default) + `default` / `static` / `private` (Java 8/9+) |
| Variables            | Any type, instance or static                      | Only `public static final` constants                             |
| Constructor          | **Yes**                                           | **No**                                                           |
| Inheritance          | A class extends **one** abstract class            | A class implements **many** interfaces; interface extends many   |
| Use when             | Sharing state/code among closely related classes  | Defining a **capability/contract** across unrelated classes      |

**Practical guide:** start with an interface for the contract; add an abstract base class only if you need to share state or partial implementation (`List` → `AbstractList` → `ArrayList`).

* * *

## 7. Interview Cheat Sheet

| Question                                    | Short Answer                                                                 |
|---------------------------------------------|------------------------------------------------------------------------------|
| Encapsulation = ?                           | Data hiding + abstraction                                                    |
| Data hiding is done by?                     | `private` fields                                                             |
| Tightly encapsulated class?                 | Every variable is `private` (parent must be too)                             |
| Multiple inheritance in Java?               | Not with classes (ambiguity); yes via interfaces                             |
| Cyclic inheritance?                         | Not allowed (compile error)                                                  |
| Composition vs aggregation?                 | Strong (part dies with whole) vs weak (part can live on its own)             |
| Child ref can hold parent object?           | No. Parent ref can hold child object                                         |
| Overloading resolved by?                    | Compiler, using reference/argument types                                     |
| Overriding resolved by?                     | JVM, using the runtime object                                                |
| Method signature includes return type?      | No                                                                           |
| Can `static`/`private`/`final` be overridden? | No (static is hidden, private not inherited, final forbidden)             |
| Overriding access rule?                     | Cannot reduce: `private < default < protected < public`                      |
| Overriding exception rule?                  | No new/broader checked exceptions; unchecked is free                         |
| Covariant return types?                     | Allowed for object types since 1.5; not for primitives                       |
| Variables overridden?                       | No, resolved by reference type                                               |
| Var-arg overload priority?                  | Lowest                                                                       |
| `overload(null)` with String and Object?    | String (most specific); with String and StringBuffer: ambiguous              |
| Default constructor contains?               | `super();` (access same as class)                                            |
| First line of a constructor?                | `super()` or `this()` (compiler adds `super()`), not both                    |
| Recursive constructor call?                 | Compile-time error (recursive method: `StackOverflowError`)                  |
| Is parent object created with child object? | No, only the parent constructor runs                                         |
| Static flow order?                          | Identify statics → run assignments/blocks top to bottom → `main`             |
| Instance flow order?                        | Identify → parent blocks/vars → parent ctor → child blocks/vars → child ctor |
| RIWO?                                       | Read-indirectly-write-only: default value before assignment; direct read is "illegal forward reference" |
| Static block use?                           | Load native libs, register JDBC drivers, one-time init                       |
| ClassCastException when?                    | Runtime object is not the same/subtype of the cast type                      |
| Ways to create an object?                   | `new`, reflection, `clone`, factory method, deserialization                  |
| Singleton recipe?                           | Private constructor + private static field + public static factory method    |
| Class not extendable but not final?         | All constructors private (or `sealed` in Java 17+)                           |
| Good design?                                | Loose coupling, high cohesion, composition over inheritance                  |

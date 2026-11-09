# Prototype Pattern

**Category:** Creational (it is about *how objects get created*)

---

## 1. In One Line (plain English)

> Instead of building a new object from scratch (slow or complicated), **make a copy of an object that already exists** and change only what is different.

**30-second interview answer:** "Prototype creates new objects by cloning an existing one. It's useful when creating an object is expensive or when many objects are almost the same. In Java I prefer a copy constructor over `Cloneable`, and I always deep-copy mutable fields so the copy and original don't share state."

---

## 2. The Real-Life Story

You run a small business and need **100 offer letters**. Each has the same company header, same terms, same footer. Only the *name*, *salary* and *joining date* change.

Do you retype the whole letter 100 times? No. You keep **one master letter**, photocopy it (or "Save As"), and edit the few fields.

| Office world | Code world |
|---|---|
| Master letter | **Prototype** (the original object) |
| Photocopy | `copy()` / clone |
| Editing name & salary | Changing fields on the copy |

Another example: **Word templates**, **cell biology (cell division)**, copying a **configured Postman request**.

---

## 3. The Problem (what hurts without it)

Creating an object is costly. For example, a `ReportTemplate` needs to load settings from DB, parse a big file, and build a layout:

```java
class ReportTemplate {
    ReportTemplate() {
        loadConfigFromDatabase();     // 300 ms
        parseLayoutFile();            // 200 ms
        loadFonts();                  // 100 ms
    }
}

// 1000 reports:
for (int i = 0; i < 1000; i++) {
    ReportTemplate t = new ReportTemplate();   // 1000 x 600 ms = 10 minutes wasted
    t.setTitle("Report " + i);
}
```

Another pain: you want a copy of an object but **only have its interface**, so you can't call `new ConcreteClass(...)` at all. And copying field by field from outside is long, error-prone, and breaks if private fields exist.

---

## 4. The Solution (step by step)

**Step 1.** Let the object **copy itself** (it knows its own private fields best).

**Step 2.** Do a **deep copy**: any mutable inside (lists, maps, other objects) must also be copied, not shared.

**Step 3.** Client creates the expensive original **once**, then calls `copy()` and tweaks the copy.

```
original ──copy()──▶ copy1 (change title)
         ──copy()──▶ copy2 (change recipient)
         ──copy()──▶ copy3 (add attachment)
```

---

## 5. Full Working Code (copy constructor, the recommended way in Java)

```java
import java.util.*;

class EmailTemplate {
    private String subject;
    private String body;
    private final List<String> attachments;       // MUTABLE, so we must deep copy it

    EmailTemplate(String subject, String body, List<String> attachments) {
        this.subject = subject;
        this.body = body;
        this.attachments = new ArrayList<>(attachments);
    }

    // Copy constructor: this is the "clone"
    EmailTemplate(EmailTemplate other) {
        this.subject = other.subject;                          // String is immutable, safe to share
        this.body = other.body;
        this.attachments = new ArrayList<>(other.attachments); // NEW list, not the same one
    }

    EmailTemplate copy() { return new EmailTemplate(this); }

    // Fluent changers so the usage reads nicely
    EmailTemplate subject(String s)       { this.subject = s; return this; }
    EmailTemplate body(String b)          { this.body = b; return this; }
    EmailTemplate addAttachment(String a) { this.attachments.add(a); return this; }

    @Override public String toString() {
        return "[" + subject + " | " + body + " | " + attachments + "]";
    }
}

public class Main {
    public static void main(String[] args) {
        EmailTemplate welcome = new EmailTemplate("Welcome!", "Glad to have you", List.of("terms.pdf"));

        EmailTemplate premium = welcome.copy().subject("Welcome, Premium!").addAttachment("perks.pdf");
        EmailTemplate trial   = welcome.copy().body("Enjoy your 14-day trial");

        System.out.println(welcome); // [Welcome! | Glad to have you | [terms.pdf]]            <- untouched
        System.out.println(premium); // [Welcome, Premium! | Glad to have you | [terms.pdf, perks.pdf]]
        System.out.println(trial);   // [Welcome! | Enjoy your 14-day trial | [terms.pdf]]
    }
}
```

**Notice:** `premium` got an extra attachment, but `welcome` and `trial` did not. That is because the list was **deep copied**.

---

## 6. Shallow Copy vs Deep Copy (the #1 thing to understand)

Imagine your object holds a **list**.

**Shallow copy** copies the *address* of the list. Both objects point to the **same** list.

```java
// BAD (shallow)
EmailTemplate(EmailTemplate other) {
    this.attachments = other.attachments;   // same list object!
}

EmailTemplate a = new EmailTemplate("Hi", "Body", List.of());
```
```
a.attachments ──┐
                ├──▶ [ same list in memory ]
copy.attachments ┘
```
Add to the copy's list and the **original changes too**. Silent, nasty bug.

**Deep copy** makes a *new* list with the same contents.

```
a.attachments    ──▶ [ list 1 ]
copy.attachments ──▶ [ list 2 ]   (separate)
```

Rule of thumb: **immutable things** (`String`, `Integer`, `LocalDate`, records of immutables) are safe to share. **Mutable things** (`List`, `Map`, `Date`, your own classes with setters) must be copied.

For nested objects, copy them recursively:
```java
this.address = new Address(other.address);   // Address also has a copy constructor
```

---

## 7. Prototype Registry (a "template shelf")

Keep ready-made prototypes in a map. Ask for a clone by name.

```java
class TemplateRegistry {
    private final Map<String, EmailTemplate> shelf = new HashMap<>();

    void register(String name, EmailTemplate template) { shelf.put(name, template); }

    EmailTemplate create(String name) {
        EmailTemplate proto = shelf.get(name);
        if (proto == null) throw new IllegalArgumentException("No template: " + name);
        return proto.copy();               // ALWAYS return a copy, never the original
    }
}

TemplateRegistry reg = new TemplateRegistry();
reg.register("welcome", new EmailTemplate("Welcome!", "Hello", List.of()));
reg.register("invoice", new EmailTemplate("Your invoice", "See attached", List.of("invoice.pdf")));

EmailTemplate mail = reg.create("invoice").subject("Invoice #4521");
```

This gives you the speed of cached expensive objects plus safety, since nobody can edit the master.

---

## 8. Why NOT `Cloneable` / `Object.clone()`

Java has a built-in way, but most experienced developers avoid it (Joshua Bloch, *Effective Java*, Item 13).

```java
class Bad implements Cloneable {
    int[] data = {1, 2, 3};
    @Override protected Bad clone() throws CloneNotSupportedException {
        return (Bad) super.clone();   // SHALLOW: data array is shared!
    }
}
```

Problems:
- `super.clone()` is **shallow by default**; you must fix every mutable field by hand.
- It **skips constructors**, so validation logic is bypassed.
- `final` fields can't be reassigned after cloning.
- `Cloneable` is an empty marker interface; `clone()` is `protected` in `Object`. A confusing design.
- Throws a checked `CloneNotSupportedException`.

**Use instead:** copy constructor or a static `copyOf(...)` method. Clear, type-safe, works with `final`.

---

## 9. Where You Have Already Seen It

| Place | How |
|---|---|
| `new ArrayList<>(otherList)` | copy constructor of a collection |
| `List.copyOf(list)`, `Map.copyOf(map)` | immutable copies |
| `array.clone()` | the one legit use of `clone()` in Java |
| Spring `@Scope("prototype")` | new bean instance each time. *Name is similar, but it is "give me a new one" rather than "copy this one"* |
| JavaScript `Object.create`, game engines spawning enemies from a template | same idea |

---

## 10. When to Use / When NOT to Use

**Use it when:**
- Creating an object is **expensive** (DB, network, big parsing, heavy computation) but copying is cheap.
- You have many objects that are **almost identical** (templates, game units, config presets, test data).
- You need to copy an object but only know its **interface/abstract type**.

**Do NOT use it when:**
- The object is cheap to create. Plain `new` is easier to read.
- The object holds **non-copyable resources** (open sockets, file handles, threads, DB connections). A "copy" would share or break them.
- The object graph has cycles and you have no plan for deep copying.

---

## 11. Anti-Patterns (mistakes people make)

| Mistake | What goes wrong | Fix |
|---|---|---|
| Shallow copying a list/map | Edits to the copy change the original | `new ArrayList<>(...)` / recursive copy |
| Registry returns the stored object | Everyone edits the shared master | Return `proto.copy()` |
| Using `Cloneable` | Shallow, skips constructors, awkward | Copy constructor |
| Cloning objects with sockets/threads | Invalid or shared resources | Re-open resources in the copy or don't clone |
| Cloning where `new` is cheap | Needless complexity | Just construct it |
| Forgetting to update `copy()` when adding a field | New field silently missing in copies | Add a unit test comparing fields; keep copy constructor next to fields |

---

## 12. Prototype vs Similar Patterns

| Compare | Difference in simple words |
|---|---|
| **Prototype vs Factory** | Factory builds new objects from scratch. Prototype duplicates an existing one. |
| **Prototype vs Builder** | Builder assembles a new object from parts. Prototype starts from a complete object and modifies it. They combine well: `original.toBuilder().changeX().build()`. |
| **Prototype vs Singleton** | Singleton: only ONE instance ever. Prototype: MANY instances, made by copying. |
| **Spring prototype scope vs Prototype pattern** | Spring scope = container creates a fresh instance per request (via constructor/config). Pattern = copying a configured object. |

---

## 13. Interview Questions & Easy Answers

**Q1. Shallow vs deep copy?**
Shallow copies references (both objects share inner objects). Deep copies the inner objects too (fully independent).

**Q2. Why avoid `Cloneable` in Java?**
It's shallow by default, bypasses constructors, doesn't work well with `final`, and has an awkward design. Prefer copy constructors.

**Q3. How do you deep copy a complex graph?**
Recursive copy constructors; serialization round-trip (slow, needs `Serializable`); or libraries (e.g. Jackson `readValue(writeValueAsString(obj))`, MapStruct).

**Q4. Is Spring's prototype scope the Prototype pattern?**
Not exactly. Spring creates a *new instance* each time from the bean definition. The pattern copies an *existing configured instance*.

**Q5. Give a project example.**
"We had a heavy pricing rules object loaded from the DB. We loaded it once, kept it as a prototype, and gave each request a deep copy so request-specific overrides didn't leak into others."

---

## 14. Cheat Sheet

- **Problem:** expensive creation or many near-identical objects.
- **Idea:** object copies itself, then you tweak the copy.
- **Win:** fast creation, no need to know concrete class.
- **Danger:** shallow copy bugs. Always deep-copy mutable fields.
- **Java tip:** copy constructor over `Cloneable`.
- **Remember:** photocopying a master form.

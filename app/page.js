"use client";

import { useEffect, useMemo, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, increment, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, firestore } from "@/firebase";
import styles from "./page.module.css";

const pantryCategories = ["Grains", "Cans & jars", "Oils", "Pasta", "Spices", "Snacks", "Condiments", "Baking", "Beverages", "Breakfast", "Other"];
const categoryLooks = {
  "Grains": { tone: "gold", icon: "rice" },
  "Cans & jars": { tone: "coral", icon: "can" },
  "Oils": { tone: "olive", icon: "bottle" },
  "Pasta": { tone: "wheat", icon: "pasta" },
  "Spices": { tone: "rust", icon: "jar" },
  "Snacks": { tone: "coral", icon: "rice" },
  "Condiments": { tone: "gold", icon: "bottle" },
  "Baking": { tone: "wheat", icon: "rice" },
  "Beverages": { tone: "blue", icon: "bottle" },
  "Breakfast": { tone: "olive", icon: "jar" },
  "Other": { tone: "blue", icon: "rice" },
};

function formatItem(snapshot) {
  const data = snapshot.data();
  const category = data.category?.trim() || "Other";
  const quantity = Math.max(0, Number(data.quantity) || 0);
  const unit = data.unit || "items";
  return {
    id: snapshot.id,
    name: data.name || snapshot.id,
    quantity,
    category,
    unit,
    detail: `${quantity} ${quantity === 1 ? unit.replace(/s$/, "") : unit}`,
    ...(categoryLooks[category] || categoryLooks.Other),
  };
}

function Icon({ name, size = 20 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>,
    pantry: <><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M3 21h18M8 7h8M8 12h8M8 17h8"/></>,
    basket: <><path d="m5 10 2-5m12 5-2-5M3 10h18l-2 10H5L3 10Z"/><path d="M9 14v2m6-2v2"/></>,
    rice: <><path d="M5 8h14l-1 12H6L5 8Z"/><path d="m7 8 1-4h8l1 4M8 12h8"/></>,
    can: <><ellipse cx="12" cy="5" rx="6" ry="2"/><path d="M6 5v14c0 1.1 2.7 2 6 2s6-.9 6-2V5M6 18c0 1.1 2.7 2 6 2s6-.9 6-2"/></>,
    bottle: <><path d="M10 3h4v4l2 3v10H8V10l2-3V3Z"/><path d="M9 12h6"/></>,
    pasta: <><path d="M6 4h12l-1 17H7L6 4Z"/><path d="M8 8h8M10 11v6m4-6v6"/></>,
    jar: <><path d="M7 7h10l1 13H6L7 7Z"/><path d="M7 4h10v3H7zM9 12h6"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    close: <path d="M6 6l12 12M18 6 6 18"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function authMessage(error) {
  const messages = {
    "auth/email-already-in-use": "An account already exists for that email.",
    "auth/invalid-credential": "That email or password doesn’t match.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Use a password with at least six characters.",
    "auth/operation-not-allowed": "Email/password login must be enabled in the Firebase console.",
    "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  };
  return messages[error?.code] || "We couldn’t sign you in. Please try again.";
}

function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email").trim();
    const password = data.get("password");
    setError("");
    setSubmitting(true);
    try {
      if (mode === "register") await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (authError) {
      setError(authMessage(authError));
      setSubmitting(false);
    }
  }

  return <main className={styles.authShell}>
    <section className={styles.authCard}>
      <div className={styles.authBrand}><span className={styles.brandMark}><Icon name="pantry" size={22} /></span><span>Larder</span></div>
      <p className={styles.kicker}>{mode === "signin" ? "Welcome back" : "Create your pantry"}</p>
      <h1>{mode === "signin" ? "Come see what’s in store." : "A calmer kitchen starts here."}</h1>
      <p className={styles.authIntro}>{mode === "signin" ? "Sign in to open your private pantry." : "Keep your pantry synced and available wherever you shop."}</p>
      <form onSubmit={submit}>
        <label>Email address<input type="email" name="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label>Password<input type="password" name="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="At least 6 characters" minLength="6" required /></label>
        {error && <div className={styles.authError} role="alert">{error}</div>}
        <button className={styles.authSubmit} disabled={submitting}>{submitting ? "Just a moment…" : mode === "signin" ? "Sign in" : "Create account"}</button>
      </form>
      <button className={styles.authSwitch} onClick={() => { setMode(mode === "signin" ? "register" : "signin"); setError(""); }}>
        {mode === "signin" ? "New to Larder? Create an account" : "Already have an account? Sign in"}
      </button>
    </section>
    <aside className={styles.authAside}><span>“</span><blockquote>A place for everything,<br />and everything accounted for.</blockquote><p>Your pantry, beautifully organized.</p></aside>
  </main>;
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All items");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const [showForm, setShowForm] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = onSnapshot(collection(firestore, "users", user.uid, "inventory"), (snapshot) => {
      setItems(snapshot.docs.map(formatItem).sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
      setDatabaseError("");
    }, (error) => {
      console.error("Unable to load pantry inventory", error);
      setDatabaseError("We couldn’t reach your pantry. Check your Firebase permissions and try again.");
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const visibleItems = useMemo(() => items.filter((item) =>
    (activeCategory === "All items" || item.category === activeCategory) &&
    item.name.toLowerCase().includes(query.toLowerCase())
  ), [items, activeCategory, query]);

  const categories = useMemo(() => {
    const custom = items.map((item) => item.category).filter((category) => !pantryCategories.includes(category));
    return ["All items", ...pantryCategories, ...Array.from(new Set(custom)).sort()];
  }, [items]);

  const lowItems = items.filter((item) => item.quantity <= 1);

  async function changeQuantity(id, amount) {
    setDatabaseError("");
    try {
      const itemRef = doc(firestore, "users", user.uid, "inventory", id);
      await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(itemRef);
        if (!snapshot.exists()) return;
        const quantity = Math.max(0, (Number(snapshot.data().quantity) || 0) + amount);
        transaction.update(itemRef, { quantity, updatedAt: serverTimestamp() });
      });
    } catch (error) {
      console.error("Unable to update pantry item", error);
      setDatabaseError("That change couldn’t be saved. Please try again.");
    }
  }

  async function addItem(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get("name").trim();
    if (!name) return;
    const category = data.get("category").trim() || "Other";
    const quantity = Math.max(1, Number(data.get("quantity")) || 1);
    const unit = data.get("unit");
    const itemId = name.toLowerCase().replaceAll("/", "-");
    try {
      await setDoc(doc(firestore, "users", user.uid, "inventory", itemId), {
        name,
        category,
        unit,
        quantity: increment(quantity),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setShowForm(false);
      setActiveCategory("All items");
      event.currentTarget.reset();
    } catch (error) {
      console.error("Unable to add pantry item", error);
      setDatabaseError("That item couldn’t be added. Please try again.");
    }
  }

  if (authLoading) return <main className={styles.authLoading}><span /><p>Opening Larder…</p></main>;
  if (!user) return <AuthScreen />;

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="#top" aria-label="Larder home">
          <span className={styles.brandMark}><Icon name="pantry" size={22} /></span>
          <span>Larder</span>
        </a>
        <div className={styles.headerActions}>
          <label className={styles.search}>
            <Icon name="search" size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your pantry" aria-label="Search your pantry" />
            <kbd>⌘ K</kbd>
          </label>
          <button className={styles.addButton} onClick={() => setShowForm(true)}><Icon name="plus" size={18} /> Add item</button>
          <button className={styles.avatar} onClick={() => signOut(auth)} aria-label="Sign out" title="Sign out">{user.email?.slice(0, 2).toUpperCase() || "ME"}</button>
        </div>
      </header>

      <div className={styles.appBody} id="top">
        <aside className={styles.sidebar}>
          <nav aria-label="Pantry categories">
            <p className={styles.eyebrow}>My pantry</p>
            {categories.map((category) => (
              <button key={category} onClick={() => setActiveCategory(category)} className={activeCategory === category ? styles.navActive : ""}>
                <span>{category}</span><span className={styles.count}>{category === "All items" ? items.length : items.filter((item) => item.category === category).length}</span>
              </button>
            ))}
          </nav>
          <button className={styles.sidebarNote} onClick={() => setShowReview(true)}>
            <span className={styles.noteIcon}><Icon name="basket" /></span>
            <div><strong>Shopping list</strong><p>{lowItems.length} items running low</p></div>
            <Icon name="chevron" size={16} />
          </button>
        </aside>

        <section className={styles.content}>
          <div className={styles.hero}>
            <div><p className={styles.kicker}>Tuesday, July 21</p><h1>Your pantry, at a glance.</h1><p>Keep track of what you have and what you’ll need next.</p></div>
            <div className={styles.summary}><span><strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong> total items</span><i /><span><strong>{lowItems.length}</strong> running low</span></div>
          </div>

          {databaseError && <div className={styles.databaseError} role="alert">{databaseError}</div>}

          {lowItems.length > 0 && (
            <div className={styles.lowStock}>
              <div className={styles.lowIcon}>!</div>
              <div><strong>A few things are running low</strong><p>{lowItems.slice(0, 3).map((item) => item.name).join(", ")} {lowItems.length > 3 ? `and ${lowItems.length - 3} more` : ""}</p></div>
              <button onClick={() => setShowReview(true)}>Review list <Icon name="chevron" size={14} /></button>
            </div>
          )}

          <div className={styles.sectionHeader}>
            <div><h2>{activeCategory}</h2><span>{visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}</span></div>
            <div className={styles.viewToggle}>
              <button aria-label="Grid view" onClick={() => setView("grid")} className={view === "grid" ? styles.toggleActive : ""}><Icon name="grid" size={17} /></button>
              <button aria-label="List view" onClick={() => setView("list")} className={view === "list" ? styles.toggleActive : ""}><Icon name="list" size={17} /></button>
            </div>
          </div>

          {loading ? <div className={styles.loading}><span /><p>Opening your pantry…</p></div> : <div className={view === "grid" ? styles.itemGrid : styles.itemList}>
            {visibleItems.map((item) => (
              <article className={styles.itemCard} key={item.id}>
                <div className={`${styles.itemArt} ${styles[item.tone]}`}><Icon name={item.icon} size={38} /></div>
                <div className={styles.itemInfo}><span>{item.category}</span><h3>{item.name}</h3><p>{item.detail}</p></div>
                <div className={styles.quantity} aria-label={`${item.name} quantity`}>
                  <button onClick={() => changeQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button>
                  <strong>{item.quantity}</strong>
                  <button onClick={() => changeQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button>
                </div>
              </article>
            ))}
          </div>}
          {!loading && visibleItems.length === 0 && <div className={styles.empty}><Icon name="search" size={24} /><h3>No pantry items found</h3><p>{items.length === 0 ? "Add your first item to get started." : "Try a different search or category."}</p></div>}
        </section>
      </div>

      {showForm && <div className={styles.backdrop} onMouseDown={() => setShowForm(false)}>
        <form className={styles.modal} onSubmit={addItem} onMouseDown={(e) => e.stopPropagation()}>
          <button type="button" className={styles.close} onClick={() => setShowForm(false)} aria-label="Close"><Icon name="close" /></button>
          <p className={styles.kicker}>New pantry item</p><h2>What did you bring home?</h2>
          <label>Item name<input name="name" autoFocus placeholder="e.g. Tortilla chips" required /></label>
          <label>Category<input name="category" list="pantry-categories" placeholder="Choose or type a category" required /><datalist id="pantry-categories">{categories.slice(1).map((category) => <option key={category} value={category} />)}</datalist></label>
          <div className={styles.formRow}>
            <label>Starting quantity<input name="quantity" type="number" min="1" max="999" defaultValue="1" required /></label>
            <label>Package type<select name="unit" defaultValue="items"><option>items</option><option>bags</option><option>boxes</option><option>cans</option><option>jars</option><option>bottles</option><option>packs</option></select></label>
          </div>
          <button className={styles.modalSubmit} type="submit"><Icon name="plus" size={18} /> Add to pantry</button>
        </form>
      </div>}

      {showReview && <div className={styles.backdrop} onMouseDown={() => setShowReview(false)}>
        <section className={styles.modal} onMouseDown={(e) => e.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="review-title">
          <button type="button" className={styles.close} onClick={() => setShowReview(false)} aria-label="Close"><Icon name="close" /></button>
          <p className={styles.kicker}>Shopping list</p><h2 id="review-title">Time to restock.</h2>
          <p className={styles.reviewIntro}>These items have one or none left in your pantry.</p>
          <div className={styles.reviewList}>
            {lowItems.map((item) => <div className={styles.reviewItem} key={item.id}>
              <span className={`${styles.reviewArt} ${styles[item.tone]}`}><Icon name={item.icon} size={22} /></span>
              <div><strong>{item.name}</strong><p>{item.quantity === 0 ? "Out of stock" : "1 remaining"}</p></div>
              <button onClick={() => changeQuantity(item.id, 1)} aria-label={`Restock ${item.name}`}><Icon name="plus" size={15} /> Restock</button>
            </div>)}
          </div>
          {lowItems.length === 0 && <div className={styles.reviewEmpty}><span>✓</span><strong>You’re all stocked up</strong><p>Nothing needs your attention right now.</p></div>}
        </section>
      </div>}
    </main>
  );
}

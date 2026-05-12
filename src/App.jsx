import React, { useState, useEffect, useCallback } from "react";
import {
  Coffee,
  Heart,
  MapPin,
  Calendar as CalendarIcon,
  Sparkles,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  Phone,
  BookOpen,
  Trash2,
  LogOut,
} from "lucide-react";
import { COFFEES, SHOPS } from "./data.js";
import { supabase, hasSupabase } from "./supabase.js";
import Login from "./Login.jsx";

// ---------- helpers ----------

const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const todayKey = () => dateKey(new Date());

// ---------- data layer ----------
// All queries hit Supabase tables with RLS. user_id is auth.uid() (uuid).
// RLS in supabase-schema.sql enforces user_id = auth.uid() on every row.

async function loadFavorites() {
  const { data, error } = await supabase
    .from("favorites")
    .select("name, emoji, color")
    .order("created_at", { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

async function addFavorite(userId, coffee) {
  await supabase.from("favorites").insert({
    user_id: userId,
    name: coffee.name,
    emoji: coffee.emoji,
    color: coffee.color,
  });
}

async function removeFavorite(name) {
  await supabase.from("favorites").delete().eq("name", name);
}

async function loadOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("date, name, emoji, color");
  if (error) {
    console.error(error);
    return {};
  }
  const map = {};
  (data || []).forEach((o) => {
    map[o.date] = { name: o.name, emoji: o.emoji, color: o.color };
  });
  return map;
}

async function upsertOrder(userId, date, coffee) {
  await supabase.from("orders").upsert(
    {
      user_id: userId,
      date,
      name: coffee.name,
      emoji: coffee.emoji,
      color: coffee.color,
    },
    { onConflict: "user_id,date" }
  );
}

async function deleteOrderRow(date) {
  await supabase.from("orders").delete().eq("date", date);
}

// ---------- App ----------

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState("brew");
  const [current, setCurrent] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [orderLog, setOrderLog] = useState({});
  const [viewMonth, setViewMonth] = useState(new Date());
  const [toast, setToast] = useState(null);

  // Initialize auth state + subscribe to changes
  useEffect(() => {
    if (!hasSupabase()) {
      // Local dev without Supabase configured — skip auth.
      setAuthReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load user data when signed in
  useEffect(() => {
    if (!session && hasSupabase()) return;
    (async () => {
      if (!hasSupabase()) {
        // Local dev: read from localStorage
        const f = JSON.parse(localStorage.getItem("favorites") || "[]");
        const o = JSON.parse(localStorage.getItem("orderLog") || "{}");
        setFavorites(f);
        setOrderLog(o);
        return;
      }
      const [favs, orders] = await Promise.all([loadFavorites(), loadOrders()]);
      setFavorites(favs);
      setOrderLog(orders);
    })();
  }, [session]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const spin = () => {
    setSpinning(true);
    setShowRecipe(false);
    let count = 0;
    const interval = setInterval(() => {
      setCurrent(COFFEES[Math.floor(Math.random() * COFFEES.length)]);
      count++;
      if (count > 14) {
        clearInterval(interval);
        setCurrent(COFFEES[Math.floor(Math.random() * COFFEES.length)]);
        setSpinning(false);
      }
    }, 80);
  };

  const userId = session?.user?.id;
  const username =
    session?.user?.email?.split("@")[0] ||
    (hasSupabase() ? "" : "guest");

  const recordBuy = async () => {
    if (!current) return;
    const key = todayKey();
    const entry = { name: current.name, emoji: current.emoji, color: current.color };
    setOrderLog((prev) => ({ ...prev, [key]: entry }));
    if (hasSupabase() && userId) {
      await upsertOrder(userId, key, current);
    } else {
      const cur = JSON.parse(localStorage.getItem("orderLog") || "{}");
      cur[key] = entry;
      localStorage.setItem("orderLog", JSON.stringify(cur));
    }
    showToast(`✓ Logged ${current.name}`);
  };

  const passOnIt = () => showToast("No worries — try again");

  const toggleFavorite = async (coffee) => {
    const exists = favorites.find((f) => f.name === coffee.name);
    if (exists) {
      setFavorites((p) => p.filter((f) => f.name !== coffee.name));
      if (hasSupabase() && userId) {
        await removeFavorite(coffee.name);
      } else {
        const cur = JSON.parse(localStorage.getItem("favorites") || "[]");
        localStorage.setItem(
          "favorites",
          JSON.stringify(cur.filter((f) => f.name !== coffee.name))
        );
      }
      showToast("Removed");
    } else {
      const entry = { name: coffee.name, emoji: coffee.emoji, color: coffee.color };
      setFavorites((p) => [...p, entry]);
      if (hasSupabase() && userId) {
        await addFavorite(userId, coffee);
      } else {
        const cur = JSON.parse(localStorage.getItem("favorites") || "[]");
        if (!cur.find((f) => f.name === coffee.name)) {
          cur.push(entry);
          localStorage.setItem("favorites", JSON.stringify(cur));
        }
      }
      showToast("★ Added");
    }
  };

  const clearDay = async (key) => {
    setOrderLog((prev) => {
      const c = { ...prev };
      delete c[key];
      return c;
    });
    if (hasSupabase() && userId) {
      await deleteOrderRow(key);
    } else {
      const cur = JSON.parse(localStorage.getItem("orderLog") || "{}");
      delete cur[key];
      localStorage.setItem("orderLog", JSON.stringify(cur));
    }
    showToast("Cleared");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setFavorites([]);
    setOrderLog({});
    setCurrent(null);
    setTab("brew");
  };

  const isFav = current && favorites.find((f) => f.name === current.name);

  // ---------- gated states ----------

  if (!authReady) {
    return (
      <div className="fullscreen">
        <div className="loader-dot" />
        <div className="fullscreen-title" style={{ fontSize: 32 }}>
          one moment
        </div>
        <div className="fullscreen-text">brewing your session</div>
      </div>
    );
  }

  if (hasSupabase() && !session) {
    return <Login onAuthed={() => {}} />;
  }

  // ---------- main ----------

  return (
    <>
      <div className="app">
        <header className="header">
          <div className="header-logo">
            <span className="header-logo-line" />
            <span>The Daily Pour</span>
            <span className="header-logo-line" />
          </div>
          <h1 className="header-title">coffee, considered</h1>
          {username && (
            <div className="header-user">
              <span>hi, {username}</span>
              {hasSupabase() && (
                <button onClick={signOut} className="header-signout" aria-label="Sign out">
                  <LogOut size={12} strokeWidth={1.7} />
                  <span>sign out</span>
                </button>
              )}
            </div>
          )}
        </header>

        <main className="main">
          {tab === "brew" && (
            <BrewTab
              current={current}
              spinning={spinning}
              showRecipe={showRecipe}
              isFav={!!isFav}
              spin={spin}
              recordBuy={recordBuy}
              passOnIt={passOnIt}
              toggleFavorite={toggleFavorite}
              setShowRecipe={setShowRecipe}
            />
          )}
          {tab === "favs" && (
            <FavoritesTab favorites={favorites} toggleFavorite={toggleFavorite} />
          )}
          {tab === "shops" && <ShopsTab />}
          {tab === "cal" && (
            <CalendarTab
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
              orderLog={orderLog}
              clearDay={clearDay}
            />
          )}
        </main>
      </div>

      <nav className="tabbar">
        {[
          { id: "brew", label: "Brew", Icon: Sparkles },
          { id: "favs", label: "Saved", Icon: Heart },
          { id: "shops", label: "Shops", Icon: MapPin },
          { id: "cal", label: "Journal", Icon: CalendarIcon },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`tab ${tab === id ? "active" : ""}`}
          >
            <span className="tab-icon">
              <Icon size={18} strokeWidth={1.6} />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// ---------- Brew tab ----------

function BrewTab({
  current,
  spinning,
  showRecipe,
  isFav,
  spin,
  recordBuy,
  passOnIt,
  toggleFavorite,
  setShowRecipe,
}) {
  return (
    <div className="brew-wrap">
      <div className="section-eyebrow">— today's selection —</div>
      <h2 className="section-title">what shall it be?</h2>
      <p className="section-sub">let the universe decide your caffeine fate.</p>

      <button onClick={spin} disabled={spinning} className="spin-btn">
        <Sparkles size={16} strokeWidth={1.7} />
        <span>
          {spinning
            ? "brewing…"
            : current
            ? "spin again"
            : "pour me something"}
        </span>
      </button>

      {current && (
        <div className="coffee-card">
          <div className="coffee-emoji">{current.emoji}</div>
          <div className="coffee-name-row">
            <h3 className="coffee-name" style={{ color: current.color }}>
              {current.name}
            </h3>
            <button
              onClick={() => toggleFavorite(current)}
              className="fav-heart"
              aria-label="Favorite"
            >
              <Heart
                size={22}
                fill={isFav ? "var(--terracotta)" : "none"}
                color={isFav ? "var(--terracotta)" : "var(--mocha)"}
                strokeWidth={1.5}
              />
            </button>
          </div>
          <p className="coffee-desc">{current.description}</p>

          {!spinning && (
            <>
              <div className="divider">
                <span className="divider-text">did you order it?</span>
              </div>
              <div className="actions">
                <button onClick={recordBuy} className="btn-yes">
                  <Check size={14} strokeWidth={2.2} />
                  <span>yes, log it</span>
                </button>
                <button onClick={passOnIt} className="btn-no">
                  <X size={14} strokeWidth={2.2} />
                  <span>pass</span>
                </button>
              </div>

              <button
                onClick={() => setShowRecipe(!showRecipe)}
                className="recipe-toggle"
              >
                <BookOpen size={13} strokeWidth={1.7} />
                <span>{showRecipe ? "hide" : "or"} make it at home</span>
              </button>

              {showRecipe && (
                <div className="recipe">
                  <div className="recipe-title">
                    home brew · {current.name}
                  </div>
                  <ol className="recipe-list">
                    {current.recipe.map((step, i) => (
                      <li key={i} className="recipe-step">
                        <span
                          className="recipe-num"
                          style={{ color: current.color }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Favorites tab ----------

function FavoritesTab({ favorites, toggleFavorite }) {
  return (
    <div>
      <div className="section-eyebrow">— your favorites —</div>
      <h2 className="section-title">the shortlist</h2>
      {favorites.length === 0 ? (
        <div className="empty">
          <Heart size={32} strokeWidth={1.2} color="var(--taupe)" />
          <p className="empty-text">
            no favorites yet. spin a coffee and tap the heart to save it here.
          </p>
        </div>
      ) : (
        <div className="fav-grid">
          {favorites.map((f) => (
            <div
              key={f.name}
              className="fav-card"
              style={{ borderColor: f.color + "40" }}
            >
              <div className="fav-emoji">{f.emoji}</div>
              <div className="fav-name" style={{ color: f.color }}>
                {f.name}
              </div>
              <button
                onClick={() => toggleFavorite(f)}
                className="fav-remove"
                aria-label="Remove"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Shops tab ----------

function ShopsTab() {
  return (
    <div>
      <div className="section-eyebrow">— local roasters —</div>
      <h2 className="section-title">around the falls</h2>
      <p className="section-sub">spots worth a stop, ranked by the locals.</p>
      <div className="shop-list">
        {SHOPS.map((s, i) => (
          <div key={s.name} className="shop-card">
            <div className="shop-number">{String(i + 1).padStart(2, "0")}</div>
            <div className="shop-body">
              <div className="shop-header">
                <h3 className="shop-name">{s.name}</h3>
                <div className="shop-rating">
                  <Star size={11} fill="var(--terracotta)" color="var(--terracotta)" strokeWidth={0} />
                  <span>{s.rating}</span>
                </div>
              </div>
              <div className="shop-meta">
                <div className="shop-row">
                  <MapPin size={11} strokeWidth={1.6} />
                  <span>{s.address}</span>
                </div>
                <div className="shop-row">
                  <Clock size={11} strokeWidth={1.6} />
                  <span>{s.hours}</span>
                </div>
                {s.phone && (
                  <div className="shop-row">
                    <Phone size={11} strokeWidth={1.6} />
                    <span>{s.phone}</span>
                  </div>
                )}
              </div>
              <p className="shop-note">"{s.note}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Calendar tab ----------

function CalendarTab({ viewMonth, setViewMonth, orderLog, clearDay }) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startWeekday = first.getDay();
  const days = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  const monthName = viewMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="section-eyebrow">— the coffee journal —</div>
      <h2 className="section-title">sip by sip</h2>

      <div className="cal-nav">
        <button
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          className="cal-nav-btn"
          aria-label="Previous"
        >
          <ChevronLeft size={18} strokeWidth={1.7} />
        </button>
        <div className="cal-month">{monthName}</div>
        <button
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          className="cal-nav-btn"
          aria-label="Next"
        >
          <ChevronRight size={18} strokeWidth={1.7} />
        </button>
      </div>

      <div className="cal-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="cal-day-name">
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={i} className="cal-blank" />;
          const key = dateKey(d);
          const entry = orderLog[key];
          const isToday = key === todayKey();
          return (
            <div
              key={i}
              className={`cal-cell ${isToday ? "cal-cell-today" : ""}`}
              style={
                entry
                  ? {
                      background: entry.color + "12",
                      borderColor: entry.color + "50",
                    }
                  : undefined
              }
            >
              <div className="cal-date">{d.getDate()}</div>
              {entry && (
                <div className="cal-entry" title={entry.name}>
                  <div className="cal-emoji">{entry.emoji}</div>
                  <div className="cal-label" style={{ color: entry.color }}>
                    {entry.name}
                  </div>
                  <button
                    onClick={() => clearDay(key)}
                    className="cal-clear"
                    aria-label="Clear"
                  >
                    <Trash2 size={9} strokeWidth={1.7} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="cal-legend">
        tap "yes, log it" on the brew tab to fill in today.
      </div>
    </div>
  );
}

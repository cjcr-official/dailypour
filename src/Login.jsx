import React, { useState } from "react";
import { Coffee, LogIn, UserPlus } from "lucide-react";
import { supabase } from "./supabase.js";

// Supabase Auth requires email addresses, not raw usernames. To support a
// "username" field without forcing the user to think about email, we map
// username → username@<USERNAME_DOMAIN>. Set VITE_USERNAME_DOMAIN in your
// env to a domain you control (or just use a placeholder like
// "users.dailypour.app" — Supabase doesn't verify it unless you enable
// email confirmation).
const USERNAME_DOMAIN =
  import.meta.env.VITE_USERNAME_DOMAIN || "users.dailypour.local";

const usernameToEmail = (u) =>
  u.includes("@") ? u.trim().toLowerCase() : `${u.trim().toLowerCase()}@${USERNAME_DOMAIN}`;

export default function Login({ onAuthed }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    const u = username.trim();
    if (!u) return setError("Please enter a username.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");

    setBusy(true);
    const email = usernameToEmail(u);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          onAuthed(data.session.user);
        } else {
          // Email confirmation is on in Supabase settings — the user can't
          // sign in until they click a link. Tell them.
          setError(
            "Account created. If email confirmation is enabled in your Supabase project, check your inbox; otherwise, try signing in."
          );
          setMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthed(data.session.user);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <Coffee size={28} strokeWidth={1.4} color="var(--charcoal)" />
        </div>
        <div className="header-logo" style={{ justifyContent: "center" }}>
          <span className="header-logo-line" />
          <span>The Daily Pour</span>
          <span className="header-logo-line" />
        </div>
        <h1 className="auth-title">
          {mode === "signup" ? "create an account" : "welcome back"}
        </h1>
        <p className="auth-sub">
          {mode === "signup"
            ? "pick a username and password to start your coffee journal."
            : "sign in to see your favorites and journal."}
        </p>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-label">
            <span className="auth-label-text">username</span>
            <input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
              placeholder="your.handle"
              disabled={busy}
            />
          </label>

          <label className="auth-label">
            <span className="auth-label-text">password</span>
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              disabled={busy}
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={busy} className="auth-submit">
            {mode === "signup" ? (
              <UserPlus size={15} strokeWidth={1.7} />
            ) : (
              <LogIn size={15} strokeWidth={1.7} />
            )}
            <span>
              {busy
                ? "one moment…"
                : mode === "signup"
                ? "create account"
                : "sign in"}
            </span>
          </button>
        </form>

        <div className="auth-switch">
          {mode === "signup" ? (
            <>
              already have one?{" "}
              <button
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className="auth-link"
              >
                sign in
              </button>
            </>
          ) : (
            <>
              new here?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className="auth-link"
              >
                create an account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

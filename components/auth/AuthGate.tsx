"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import "./auth.css";

const OWNER_EMAIL = "starlitebusinessgh@gmail.com";

export function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const email = data.session?.user.email?.toLowerCase();
      if (email && email !== OWNER_EMAIL) {
        await supabase.auth.signOut();
      }
      if (alive) {
        setAuthorized(email === OWNER_EMAIL);
        setReady(true);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive || event === "INITIAL_SESSION") return;
      const email = session?.user.email?.toLowerCase();
      if (email && email !== OWNER_EMAIL) {
        queueMicrotask(() => void supabase.auth.signOut());
        setAuthorized(false);
        setError("This account is not authorized for this LifeOS workspace.");
        return;
      }
      setAuthorized(email === OWNER_EMAIL);
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: OWNER_EMAIL,
      options: {
        emailRedirectTo: typeof window === "undefined" ? undefined : window.location.origin,
      },
    });
    setSending(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  }

  if (authorized) return <>{children}</>;
  if (!ready) {
    return (
      <div className="auth-loading" role="status" aria-label="Checking sign-in">
        <LoaderCircle size={22} className="auth-spin" />
      </div>
    );
  }

  return (
    <main className="auth-screen">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand-row">
          <div className="auth-brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className="auth-brand-name">LifeOS</span>
          <div className="auth-secure"><ShieldCheck size={14} /> Private workspace</div>
        </div>

        <div className="auth-card-content">
          <div className="auth-eyebrow"><KeyRound size={14} /> YOUR PERSONAL SPACE</div>
          <h1 id="auth-title">Pick up where<br />your life happens.</h1>
          <p className="auth-description">
            Sign in securely to open your plans, finances, reading, and daily rhythms.
          </p>

          {sent ? (
            <div className="auth-sent" role="status">
              <span className="auth-sent-icon"><Check size={18} /></span>
              <div>
                <strong>Check your inbox</strong>
                <p>Your sign-in link is on its way to <b>{OWNER_EMAIL}</b>.</p>
              </div>
            </div>
          ) : (
            <form className="auth-form" onSubmit={requestLink}>
              <label htmlFor="owner-email">Sign-in email</label>
              <input id="owner-email" type="email" value={OWNER_EMAIL} readOnly />
              <button type="submit" disabled={sending}>
                {sending ? <><LoaderCircle size={17} className="auth-spin" /> Sending link…</> : <>Email me a sign-in link <ArrowRight size={17} /></>}
              </button>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <p className="auth-form-note">Only your verified email can access this workspace.</p>
            </form>
          )}
        </div>
        <div className="auth-card-foot">
          <span>Private by design</span>
          <span className="auth-foot-dot" />
          <span>Encrypted sign-in</span>
        </div>
      </section>
      <p className="auth-caption">A quieter way to keep your whole life in view.</p>
    </main>
  );
}

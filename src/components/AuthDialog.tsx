"use client";

import { useShop } from "@/lib/shop";
import { useState } from "react";
import { BoltIcon, CloseIcon, ScooterIcon } from "./Icons";

export default function AuthDialog() {
  const { state, actions } = useShop();
  const [signingUp, setSigningUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  if (!state.authOpen) return null;

  const submit = () =>
    signingUp ? actions.signUp(name, email, mobile, password, confirm) : actions.signIn(identifier, password);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={actions.hideAuth}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="max-h-[92vh] w-full max-w-md space-y-3.5 overflow-y-auto rounded-t-2xl bg-background p-6 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between">
          <div className="relative flex size-16 items-center justify-center rounded-full bg-primary-container text-primary">
            <ScooterIcon className="size-9" />
            <BoltIcon className="absolute right-2 top-2 size-4 text-[#c6922e]" />
          </div>
          <button type="button" onClick={actions.hideAuth} className="rounded-full p-2 hover:bg-surface-variant" aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{signingUp ? "Create your account" : "Welcome back"}</h2>
          <p className="text-sm text-muted">Devbhoomi Electrics — electric scooty showroom</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`btn ${signingUp ? "btn-outline" : "btn-primary"}`} onClick={() => setSigningUp(false)} disabled={state.busy}>
            Log in
          </button>
          <button type="button" className={`btn ${signingUp ? "btn-primary" : "btn-outline"}`} onClick={() => setSigningUp(true)} disabled={state.busy}>
            Sign up
          </button>
        </div>

        {signingUp ? (
          <>
            <div className="space-y-2 rounded-2xl bg-primary-container p-4">
              <p className="text-xs font-bold text-primary">Recommended</p>
              <p className="text-sm">Sign up with Google in one click. No password to remember.</p>
              <button type="button" className="btn btn-primary w-full" onClick={actions.signInWithGoogle} disabled={state.busy}>
                Continue with Google
              </button>
            </div>
            <p className="text-xs font-medium">or create an account with email</p>
            <input className="field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <input className="field" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <input className="field" placeholder="Mobile (optional)" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel" />
          </>
        ) : (
          <>
            <button type="button" className="btn btn-outline w-full" onClick={actions.signInWithGoogle} disabled={state.busy}>
              Continue with Google
            </button>
            <input className="field" placeholder="Email or mobile" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" />
          </>
        )}
        <div className="relative">
          <input
            className="field pr-16"
            placeholder="Password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signingUp ? "new-password" : "current-password"}
          />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary">
            {show ? "Hide" : "Show"}
          </button>
        </div>
        {signingUp && (
          <input
            className="field"
            placeholder="Confirm password"
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        )}
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <button type="submit" className="btn btn-primary h-12 w-full" disabled={state.busy}>
          {state.busy ? "Please wait…" : signingUp ? "Create account" : "Log in"}
        </button>
        <button type="button" className="block w-full text-center text-sm text-primary" onClick={() => setSigningUp((v) => !v)}>
          {signingUp ? "Already have an account? Log in" : "New here? Create an account"}
        </button>
        <p className="text-center text-xs text-muted">
          By continuing you agree to our{" "}
          <a href="/privacy" target="_blank" className="text-primary hover:underline">
            Privacy policy
          </a>
          .
        </p>
      </form>
    </div>
  );
}

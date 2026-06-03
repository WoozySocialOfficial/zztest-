"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn("password", { email, password, flow });
      router.push("/app");
    } catch {
      setError(
        flow === "signIn"
          ? "Invalid email or password."
          : "Could not create that account. Use a valid email and a stronger password.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-5">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div
            className="grid place-items-center text-white font-extrabold"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg,var(--brand),#ffb088)",
              fontFamily: "var(--font-display)",
            }}
          >
            C
          </div>
          <div>
            <div className="display text-[18px] font-bold">Post Studio</div>
            <div className="text-[10.5px] tracking-widest uppercase text-[var(--muted)]">
              Creative Crew
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="card">
          <h1 className="text-[20px] mb-1">
            {flow === "signIn" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="hint mb-2">
            {flow === "signIn"
              ? "Sign in to your studio."
              : "Set up access to the studio."}
          </p>

          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            autoComplete={flow === "signIn" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="mt-3 text-[12.5px]" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}

          <button className="btn w-full mt-5" type="submit" disabled={busy}>
            {busy ? "Please wait…" : flow === "signIn" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            className="w-full mt-3 text-[12.5px] text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={() => {
              setFlow(flow === "signIn" ? "signUp" : "signIn");
              setError(null);
            }}
          >
            {flow === "signIn"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

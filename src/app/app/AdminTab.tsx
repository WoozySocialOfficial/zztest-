"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

export function AdminTab() {
  const users = useQuery(api.admin.listUsers);
  const createUser = useAction(api.admin.createUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await createUser({ email, password });
      setMsg(`Account created for ${res.email}. Share these credentials with them.`);
      setEmail("");
      setPassword("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="text-[26px]">Admin</h1>
        <p className="hint mt-1">
          Manage who can access the studio. Sign-up is invite-only — accounts
          only exist if you create them here.
        </p>
      </header>

      <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(320px,420px) 1fr" }}>
        <div className="card h-fit">
          <h3 className="text-[15px] mb-1">Create a team member</h3>
          <p className="hint mb-2">
            Set an email and a temporary password, then share them. They can sign
            in immediately.
          </p>

          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="zaneta@creativecrewstudio.co.uk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label">Temporary password (min 8 chars)</label>
          <input
            className="input"
            type="text"
            placeholder="give them something they can change later"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn w-full mt-4" onClick={submit} disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
          {msg && (
            <p className="mt-3 text-[12.5px]" style={{ color: "var(--ok)" }}>
              {msg}
            </p>
          )}
          {err && (
            <p className="mt-3 text-[12.5px]" style={{ color: "#dc2626" }}>
              {err}
            </p>
          )}
        </div>

        <div className="card">
          <h3 className="text-[15px] mb-3">
            Team members {users ? `(${users.length})` : ""}
          </h3>
          <div className="flex flex-col gap-1.5">
            {users?.length ? (
              users.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px]"
                  style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
                >
                  <span className="flex-1">{u.email}</span>
                  {u.isSelf && <span className="pill">you</span>}
                  <span className="hint">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="hint">No team members yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

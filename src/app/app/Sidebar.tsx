"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

type ClientRow = { _id: Id<"clients">; name: string };

export function Sidebar({
  clients,
  selectedId,
  onSelect,
}: {
  clients: ClientRow[];
  selectedId: Id<"clients"> | null;
  onSelect: (id: Id<"clients">) => void;
}) {
  const create = useMutation(api.clients.create);
  const { signOut } = useAuthActions();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  async function addClient() {
    const n = name.trim();
    if (!n) return;
    const id = await create({ name: n });
    setName("");
    setAdding(false);
    onSelect(id);
  }

  return (
    <aside
      className="flex flex-col gap-5 p-5 sticky top-0 h-screen"
      style={{
        background: "var(--panel)",
        borderRight: "1px solid var(--line)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="grid place-items-center text-white font-extrabold"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg,var(--brand),#ffb088)",
            fontFamily: "var(--font-display)",
            boxShadow: "0 6px 16px rgba(255,122,51,.35)",
          }}
        >
          C
        </div>
        <div>
          <div className="display text-[17px] font-bold">Post Studio</div>
          <div className="text-[10px] tracking-widest uppercase text-[var(--muted)]">
            Creative Crew
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="text-[10.5px] tracking-widest uppercase text-[var(--muted)] px-1 mb-2">
          Clients
        </div>
        <div className="flex flex-col gap-1.5 overflow-auto">
          {clients.map((c) => {
            const active = c._id === selectedId;
            return (
              <button
                key={c._id}
                onClick={() => onSelect(c._id)}
                className="flex items-center gap-3 p-2.5 rounded-xl text-left w-full transition"
                style={{
                  background: active ? "var(--panel-2)" : "transparent",
                  border: active
                    ? "1px solid var(--line)"
                    : "1px solid transparent",
                }}
              >
                <span
                  className="grid place-items-center text-white font-bold flex-none"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    fontSize: 12,
                    background: "linear-gradient(135deg,var(--brand),#ffb088)",
                  }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-[13.5px] font-semibold truncate">
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>

        {adding ? (
          <div className="mt-2 flex flex-col gap-2">
            <input
              autoFocus
              className="input"
              placeholder="New client name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addClient();
                if (e.key === "Escape") setAdding(false);
              }}
            />
            <div className="flex gap-2">
              <button className="btn flex-1 py-2" onClick={addClient}>
                Add
              </button>
              <button
                className="btn btn-ghost py-2"
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="mt-2 p-2.5 rounded-xl text-[12.5px] w-full text-[var(--muted)] hover:text-[var(--ink)]"
            style={{ border: "1px dashed var(--line)" }}
            onClick={() => setAdding(true)}
          >
            + Add client
          </button>
        )}
      </div>

      <button
        className="text-[12px] text-[var(--muted)] hover:text-[var(--ink)] text-left pt-3"
        style={{ borderTop: "1px solid var(--line)" }}
        onClick={() => signOut()}
      >
        Sign out
      </button>
    </aside>
  );
}

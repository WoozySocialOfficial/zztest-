"use client";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
} from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { StudioTab } from "./StudioTab";
import { BrandTab } from "./BrandTab";

export default function AppPage() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen grid place-items-center text-[var(--muted)]">
          Loading your studio…
        </div>
      </AuthLoading>
      <Unauthenticated>
        <RedirectToLogin />
      </Unauthenticated>
      <Authenticated>
        <Workspace />
      </Authenticated>
    </>
  );
}

function RedirectToLogin() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}

type Tab = "studio" | "brand";

function Workspace() {
  const clients = useQuery(api.clients.list);
  const [selected, setSelected] = useState<Id<"clients"> | null>(null);
  const [tab, setTab] = useState<Tab>("studio");

  useEffect(() => {
    if (clients && clients.length && !selected) setSelected(clients[0]._id);
  }, [clients, selected]);

  const current = clients?.find((c) => c._id === selected) ?? null;

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "256px 1fr", minHeight: "100vh" }}
    >
      <Sidebar
        clients={clients ?? []}
        selectedId={selected}
        onSelect={(id) => {
          setSelected(id);
          setTab("studio");
        }}
      />

      <main className="px-7 py-6 w-full" style={{ maxWidth: 1200 }}>
        {current ? (
          <>
            <header className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <h1 className="text-[26px]">{current.name}</h1>
                <p className="hint mt-1">
                  Brand workspace · designs stay on this client&apos;s style only
                </p>
              </div>
              <div
                className="flex gap-1 p-1 rounded-xl"
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--line)",
                }}
              >
                <TabButton active={tab === "studio"} onClick={() => setTab("studio")}>
                  Design Studio
                </TabButton>
                <TabButton active={tab === "brand"} onClick={() => setTab("brand")}>
                  Brand Gallery
                </TabButton>
              </div>
            </header>

            {tab === "studio" ? (
              <StudioTab clientId={current._id} clientName={current.name} />
            ) : (
              <BrandTab clientId={current._id} />
            )}
          </>
        ) : (
          <EmptyState hasClients={(clients?.length ?? 0) > 0} />
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-[13px] font-semibold transition"
      style={{
        background: active ? "var(--brand)" : "transparent",
        color: active ? "#fff" : "var(--muted)",
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ hasClients }: { hasClients: boolean }) {
  return (
    <div className="grid place-items-center h-[60vh] text-center">
      <div>
        <div className="text-[40px] opacity-40 mb-3">✦</div>
        <h2 className="text-[20px] mb-1">
          {hasClients ? "Select a client" : "Create your first client"}
        </h2>
        <p className="hint">
          {hasClients
            ? "Pick a client from the left to open their workspace."
            : "Use “+ Add client” on the left to start a walled-off brand workspace."}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMemo, useState } from "react";

type Format = "square" | "story" | "land";
const FORMATS: { key: Format; label: string; icon: string }[] = [
  { key: "square", label: "Post 1:1", icon: "▢" },
  { key: "story", label: "Story 9:16", icon: "▯" },
  { key: "land", label: "Banner 16:9", icon: "▭" },
];

export function StudioTab({
  clientId,
  clientName,
}: {
  clientId: Id<"clients">;
  clientName: string;
}) {
  const run = useAction(api.generate.run);
  const approve = useMutation(api.designs.approve);
  const updateCaption = useMutation(api.designs.updateCaption);
  const designs = useQuery(api.designs.list, { clientId });

  const [headline, setHeadline] = useState("");
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<Format>("square");
  const [captionOn, setCaptionOn] = useState(true);
  const [draft, setDraft] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  const alternatives = useMemo(
    () => (designs ?? []).filter((d) => d.batchId === batchId),
    [designs, batchId],
  );
  const history = useMemo(
    () => (designs ?? []).filter((d) => d.batchId !== batchId),
    [designs, batchId],
  );
  const batchCost = alternatives.reduce((s, d) => s + (d.costEstimate ?? 0), 0);
  const totalCost = (designs ?? []).reduce((s, d) => s + (d.costEstimate ?? 0), 0);

  async function generate() {
    if (!headline.trim() && !url.trim()) {
      setError("Add a headline or a URL first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await run({
        clientId,
        format,
        headline: headline.trim() || undefined,
        productUrl: url.trim() || undefined,
        captionOn,
        imageCount: 3,
        draft,
      });
      setBatchId(res.batchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="banner mb-5">
        Tip: load this client&apos;s gallery first (Brand Gallery tab) so the
        studio matches their colours and rules. Everything is a draft until you
        approve it — nothing is posted automatically.
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(320px,420px) 1fr" }}>
        {/* INPUT */}
        <div className="card h-fit">
          <h3 className="text-[15px] mb-1">Create a post</h3>
          <p className="hint mb-2">Give it a headline, a URL, or both.</p>

          <label className="label">Headline / what it&apos;s about</label>
          <input
            className="input"
            placeholder="e.g. New summer tyre deal — 20% off fitting"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />

          <label className="label">Product URL (optional)</label>
          <input
            className="input"
            type="url"
            placeholder="https://… product or page link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <label className="label">Format</label>
          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            {FORMATS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFormat(f.key)}
                className="rounded-lg px-2 py-2.5 text-center text-[11.5px] font-semibold transition"
                style={{
                  border:
                    format === f.key
                      ? "1px solid var(--brand)"
                      : "1px solid var(--line)",
                  background:
                    format === f.key ? "rgba(255,122,51,.1)" : "var(--bg)",
                  color: format === f.key ? "var(--ink)" : "var(--muted)",
                }}
              >
                <span className="block text-[16px] mb-0.5">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          <ToggleRow
            label="Write a caption"
            on={captionOn}
            onToggle={() => setCaptionOn((v) => !v)}
          />
          <ToggleRow
            label={draft ? "Draft quality (cheap)" : "Final quality (flagship)"}
            on={!draft}
            onToggle={() => setDraft((v) => !v)}
          />

          <button className="btn w-full mt-4" onClick={generate} disabled={busy}>
            {busy ? "Generating…" : "Generate 3 options"}
          </button>
          {error && (
            <p className="mt-3 text-[12.5px]" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}
        </div>

        {/* RESULTS */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px]">Options</h3>
            {!!alternatives.length && (
              <span className="hint">
                est. ${batchCost.toFixed(3)} this run · ${totalCost.toFixed(2)}{" "}
                total for {clientName}
              </span>
            )}
          </div>

          {alternatives.length ? (
            <div
              className="grid gap-4 mt-3"
              style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}
            >
              {alternatives.map((d) => (
                <AlternativeCard
                  key={d._id}
                  design={d}
                  onApprove={() => approve({ designId: d._id })}
                  onSaveCaption={(caption) =>
                    updateCaption({ designId: d._id, caption })
                  }
                />
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl mt-3 py-12 text-center"
              style={{ border: "1.5px dashed var(--line)", color: "var(--muted)" }}
            >
              <div className="text-[28px] opacity-50 mb-2">✦</div>
              Your options appear here. Fill in the left and generate.
            </div>
          )}
        </div>
      </div>

      {/* HISTORY */}
      <div className="card mt-5">
        <h3 className="text-[15px] mb-1">History for {clientName}</h3>
        <p className="hint mb-3">
          Kept separate per client. Approved posts feed back into the brand
          gallery so generations keep improving.
        </p>
        {history.length ? (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))" }}
          >
            {history.map((d) => (
              <div
                key={d._id}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--line)", background: "var(--bg)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {d.url && (
                  <img
                    src={d.url}
                    alt=""
                    style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
                  />
                )}
                <div className="p-2 text-[11px] text-[var(--muted)]">
                  {d.status === "approved" ? "✓ approved" : "draft"} · {d.format}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="hint">Nothing yet.</p>
        )}
      </div>
    </>
  );
}

function ToggleRow({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2.5 mt-2.5"
      style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
    >
      <span className="text-[13px]">{label}</span>
      <button
        onClick={onToggle}
        className="relative transition"
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          background: on ? "var(--brand)" : "var(--line)",
        }}
      >
        <span
          className="absolute bg-white transition"
          style={{
            top: 3,
            left: on ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
          }}
        />
      </button>
    </div>
  );
}

function AlternativeCard({
  design,
  onApprove,
  onSaveCaption,
}: {
  design: {
    _id: Id<"generatedDesigns">;
    url: string | null;
    caption?: string;
    status: "draft" | "approved";
    format: string;
  };
  onApprove: () => void;
  onSaveCaption: (caption: string) => void;
}) {
  const [caption, setCaption] = useState(design.caption ?? "");
  const [copied, setCopied] = useState(false);

  async function download() {
    if (!design.url) return;
    const res = await fetch(design.url);
    const blob = await res.blob();
    const ext = blob.type.includes("svg") ? "svg" : "png";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${design.format}-${design._id}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ border: "1px solid var(--line)", background: "var(--bg)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {design.url && (
        <img
          src={design.url}
          alt=""
          style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
        />
      )}
      <div className="p-2.5 flex flex-col gap-2">
        {design.caption !== undefined && (
          <textarea
            className="textarea text-[12px]"
            style={{ minHeight: 56 }}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={() => caption !== design.caption && onSaveCaption(caption)}
          />
        )}
        <div className="flex gap-1.5">
          <button
            className="btn py-2 flex-1 text-[12px]"
            onClick={onApprove}
            disabled={design.status === "approved"}
          >
            {design.status === "approved" ? "✓ Approved" : "Approve"}
          </button>
          <button
            className="btn btn-ghost py-2 text-[12px]"
            onClick={download}
          >
            ⤓
          </button>
          {design.caption !== undefined && (
            <button
              className="btn btn-ghost py-2 text-[12px]"
              onClick={async () => {
                await navigator.clipboard.writeText(caption);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "✓" : "copy"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMemo, useState } from "react";

type Format = "square" | "story" | "land";

export function BulkTab({
  clientId,
  clientName,
}: {
  clientId: Id<"clients">;
  clientName: string;
}) {
  const bulkRun = useAction(api.generate.bulkRun);
  const designs = useQuery(api.designs.list, { clientId });

  const [text, setText] = useState("");
  const [format, setFormat] = useState<Format>("square");
  const [captionOn, setCaptionOn] = useState(true);
  const [draft, setDraft] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  const lineCount = text.split("\n").map((l) => l.trim()).filter(Boolean).length;
  const results = useMemo(
    () => (designs ?? []).filter((d) => d.batchId === batchId),
    [designs, batchId],
  );

  async function generate() {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) {
      setError("Add at least one line.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await bulkRun({ clientId, format, lines, captionOn, draft });
      setBatchId(res.batchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h3 className="text-[15px] mb-1">Bulk design — {clientName}</h3>
      <p className="hint mb-3">
        One headline or URL per line (up to 25). Each becomes a post on this
        client&apos;s brand. Everything stays a draft until you approve it in the
        Studio tab.
      </p>

      <textarea
        className="textarea"
        style={{ minHeight: 140 }}
        placeholder={"New all-season tyre — 15% off\nFree safety check this week\nhttps://example.com/race-day-offer"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-3 mt-3">
        <select
          className="select"
          style={{ maxWidth: 150 }}
          value={format}
          onChange={(e) => setFormat(e.target.value as Format)}
        >
          <option value="square">Post 1:1</option>
          <option value="story">Story 9:16</option>
          <option value="land">Banner 16:9</option>
        </select>
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={captionOn}
            onChange={(e) => setCaptionOn(e.target.checked)}
          />
          Write captions
        </label>
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={draft}
            onChange={(e) => setDraft(e.target.checked)}
          />
          Draft quality (cheap)
        </label>
        <button className="btn ml-auto" onClick={generate} disabled={busy}>
          {busy ? "Generating…" : `Generate ${lineCount || ""} ${lineCount === 1 ? "post" : "posts"}`}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-[12.5px]" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}

      {!!results.length && (
        <div
          className="grid gap-3 mt-5"
          style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}
        >
          {results.map((d) => (
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
              <div className="p-2 text-[11px] text-[var(--muted)] line-clamp-3">
                {d.caption || "No caption"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

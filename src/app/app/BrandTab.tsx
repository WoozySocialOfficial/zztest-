"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useRef, useState } from "react";
import { useUpload } from "../../../lib/upload";
import { extractPalette, fileToImage } from "../../../lib/palette";

type Scope = "design" | "caption" | "video";

export function BrandTab({ clientId }: { clientId: Id<"clients"> }) {
  const profile = useQuery(api.brand.getProfile, { clientId });
  const gallery = useQuery(api.gallery.list, { clientId });
  const rules = useQuery(api.rules.list, { clientId });

  const upload = useUpload();
  const addItem = useMutation(api.gallery.addItem);
  const removeItem = useMutation(api.gallery.remove);
  const updateProfile = useMutation(api.brand.updateProfile);
  const addRule = useMutation(api.rules.add);
  const removeRule = useMutation(api.rules.remove);

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [styleNotes, setStyleNotes] = useState<string | null>(null);
  const [ruleText, setRuleText] = useState("");
  const [scope, setScope] = useState<Scope>("design");

  const notes = styleNotes ?? profile?.styleNotes ?? "";

  async function onUpload(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const swatches: string[] = [];
      for (const file of Array.from(files)) {
        const storageId = await upload(file);
        await addItem({ clientId, storageId, source: "uploaded" });
        try {
          const img = await fileToImage(file);
          swatches.push(...extractPalette(img));
        } catch {
          /* palette is best-effort */
        }
      }
      if (swatches.length) {
        // keep the most common up to 5
        const top = Array.from(new Set(swatches)).slice(0, 5);
        await updateProfile({ clientId, palette: top });
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
      {/* Teach the brand */}
      <div className="card">
        <h3 className="text-[15px] mb-1">Teach the brand</h3>
        <p className="hint mb-3">
          Upload this client&apos;s past posts. We learn their colours and you
          can describe their style. The more it sees, the tighter the match.
        </p>

        <button
          className="w-full rounded-xl px-4 py-6 text-center transition"
          style={{
            border: "1.5px dashed var(--line)",
            background: "var(--bg)",
            color: "var(--muted)",
          }}
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            "Uploading…"
          ) : (
            <>
              <b style={{ color: "var(--ink)" }}>Upload past posts</b>
              <br />
              <small>select several at once · jpg / png</small>
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
        />

        <div className="flex gap-2 mt-3 flex-wrap items-center">
          {(profile?.palette ?? []).map((c, i) => (
            <span key={i} className="chip" style={{ background: c }} />
          ))}
          <small className="hint">
            {gallery?.length ?? 0} post{(gallery?.length ?? 0) === 1 ? "" : "s"}{" "}
            learned
          </small>
        </div>

        {!!gallery?.length && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {gallery.map((g) => (
              <div
                key={g._id}
                className="relative"
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 9,
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {g.url && (
                  <img
                    src={g.url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
                <button
                  onClick={() => removeItem({ itemId: g._id })}
                  className="absolute top-1 right-1 grid place-items-center text-white"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    background: "rgba(0,0,0,.6)",
                    fontSize: 12,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="label">Style notes</label>
        <textarea
          className="textarea"
          placeholder="e.g. Warm, homely, hand-drawn touches. Bold headline, lots of whitespace."
          value={notes}
          onChange={(e) => setStyleNotes(e.target.value)}
        />
        <button
          className="btn btn-ghost mt-2"
          onClick={() => updateProfile({ clientId, styleNotes: notes })}
        >
          Save style notes
        </button>
      </div>

      {/* Learn rules */}
      <div className="card">
        <h3 className="text-[15px] mb-1">Learn Mode rules</h3>
        <p className="hint mb-3">
          Plain-English rules that stack up and steer every generation for this
          client. Cumulative — it gets smarter the more you add.
        </p>

        <div className="flex gap-2">
          <select
            className="select"
            style={{ maxWidth: 130 }}
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
          >
            <option value="design">Design</option>
            <option value="caption">Caption</option>
            <option value="video">Video</option>
          </select>
          <input
            className="input"
            placeholder="e.g. Always end captions with ‘Drive safe.’"
            value={ruleText}
            onChange={(e) => setRuleText(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && ruleText.trim()) {
                await addRule({ clientId, scope, rule: ruleText });
                setRuleText("");
              }
            }}
          />
        </div>
        <button
          className="btn btn-ghost mt-2"
          onClick={async () => {
            if (!ruleText.trim()) return;
            await addRule({ clientId, scope, rule: ruleText });
            setRuleText("");
          }}
        >
          Add rule
        </button>

        <div className="flex flex-col gap-1.5 mt-3">
          {rules?.length ? (
            rules.map((r) => (
              <div
                key={r._id}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12.5px]"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                }}
              >
                <span className="pill">{r.scope}</span>
                <span className="flex-1">{r.rule}</span>
                <button
                  onClick={() => removeRule({ ruleId: r._id })}
                  className="text-[var(--muted)] hover:text-red-500 text-[15px]"
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <p className="hint">No rules yet — add one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}

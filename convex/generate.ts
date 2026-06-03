import { action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireClientOwnership } from "./lib/access";
import { openaiProvider } from "./ai/openai";
import { ideogramProvider } from "./ai/ideogram";
import { writeCaptions } from "./ai/caption";
import { FORMAT_SIZE, type ImageProvider, type ImageQuality } from "./ai/types";

// Ownership-checked context for a generation. Actions have no DB access, so the
// action calls this query first — isolation still goes through the guard.
export const getContext = internalQuery({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const { client } = await requireClientOwnership(ctx, clientId);
    const profile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .unique();
    const rules = await ctx.db
      .query("learnRules")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .collect();
    return {
      clientName: client.name,
      palette: profile?.palette ?? [],
      styleNotes: profile?.styleNotes ?? "",
      designRules: rules.filter((r) => r.scope === "design").map((r) => r.rule),
      captionRules: rules.filter((r) => r.scope === "caption").map((r) => r.rule),
    };
  },
});

function getProvider(name: string): ImageProvider {
  return name === "ideogram" ? ideogramProvider : openaiProvider;
}

// Builds the image prompt. Brand-locked and explicitly anti-hallucination —
// this is client-facing work.
function buildImagePrompt(
  c: { clientName: string; palette: string[]; styleNotes: string; designRules: string[] },
  headline: string | undefined,
  format: string,
): string {
  const parts = [
    `Professional, on-brand social media post graphic for "${c.clientName}".`,
    headline ? `Subject / message: ${headline}.` : "",
    c.palette.length ? `Use this brand colour palette: ${c.palette.join(", ")}.` : "",
    c.styleNotes ? `Brand visual style: ${c.styleNotes}.` : "",
    c.designRules.length ? `Design rules (follow all): ${c.designRules.join("; ")}.` : "",
    `Clean, polished, ${format} composition. Leave tasteful space for an editable headline and logo to be added on top.`,
    `Do not invent logos, prices, or text claims. Keep any rendered text minimal and correctly spelled.`,
  ];
  return parts.filter(Boolean).join(" ");
}

// A lightweight, $0 placeholder image (SVG) used when MOCK_AI=true so the whole
// UI loop can be exercised without spending on real generation.
function mockSvg(c: { clientName: string; palette: string[] }, headline: string, size: string): string {
  const [w, h] = size.split("x").map(Number);
  const base = c.palette.find((x) => /^#[0-9a-f]{6}$/i.test(x)) ?? "#FF7A33";
  const accent = c.palette[1] ?? "#1a1611";
  const title = (headline || c.clientName).replace(/[<&>]/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="100%" height="100%" fill="#FBFAF8"/>
<circle cx="${w * 0.85}" cy="${h * 0.12}" r="${w * 0.28}" fill="${base}" opacity="0.18"/>
<circle cx="${w * 0.1}" cy="${h * 0.92}" r="${w * 0.2}" fill="${accent}" opacity="0.14"/>
<rect x="${w * 0.06}" y="${h * 0.06}" width="${w * 0.18}" height="14" rx="7" fill="${base}"/>
<text x="${w * 0.06}" y="${h * 0.55}" font-family="sans-serif" font-size="${w * 0.06}" font-weight="700" fill="#16120d">${title}</text>
<text x="${w * 0.06}" y="${h * 0.92}" font-family="sans-serif" font-size="${w * 0.03}" fill="${base}">${c.clientName.toUpperCase()} · MOCK PREVIEW</text>
</svg>`;
}

export const run = action({
  args: {
    clientId: v.id("clients"),
    format: v.string(), // "square" | "story" | "land"
    headline: v.optional(v.string()),
    productUrl: v.optional(v.string()),
    captionOn: v.boolean(),
    imageCount: v.optional(v.number()),
    draft: v.optional(v.boolean()), // cheap tiers for drafts/tests
  },
  handler: async (ctx, args) => {
    const c = await ctx.runQuery(internal.generate.getContext, {
      clientId: args.clientId,
    });
    const n = Math.min(Math.max(args.imageCount ?? 3, 1), 4);
    const size = FORMAT_SIZE[args.format] ?? FORMAT_SIZE.square;
    const quality: ImageQuality = args.draft ? "low" : "medium";
    const batchId = crypto.randomUUID();
    const mock = process.env.MOCK_AI === "true";

    const imagePrompt = buildImagePrompt(c, args.headline, args.format);

    // ---- Captions ----
    let captions: string[] = [];
    if (args.captionOn) {
      if (mock) {
        captions = Array.from(
          { length: n },
          (_, i) =>
            `${args.headline || c.clientName} — on-brand caption option ${i + 1}. (mock)`,
        );
      } else {
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) throw new Error("ANTHROPIC_API_KEY not set in Convex env");
        const model =
          (args.draft
            ? process.env.DRAFT_CAPTION_MODEL
            : process.env.FINAL_CAPTION_MODEL) ?? "claude-sonnet-4-6";
        captions = await writeCaptions(
          {
            clientName: c.clientName,
            styleNotes: c.styleNotes,
            captionRules: c.captionRules,
            headline: args.headline,
            productUrl: args.productUrl,
          },
          key,
          model,
          n,
        );
      }
    }

    // ---- Images ----
    let images: { storageId: string; cost: number; provider: string; model: string }[] = [];
    if (mock) {
      const stored = await Promise.all(
        Array.from({ length: n }, async () => {
          const svg = mockSvg(c, args.headline || "", size);
          const id = await ctx.storage.store(
            new Blob([svg], { type: "image/svg+xml" }),
          );
          return { storageId: id as string, cost: 0, provider: "mock", model: "mock" };
        }),
      );
      images = stored;
    } else {
      const providerName = process.env.IMAGE_PROVIDER ?? "openai";
      const provider = getProvider(providerName);
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY not set in Convex env");
      const model =
        (args.draft
          ? process.env.DRAFT_IMAGE_MODEL
          : process.env.FINAL_IMAGE_MODEL) ?? "gpt-image-1.5";
      const results = await provider.generate(
        { prompt: imagePrompt, size, quality, n },
        apiKey,
        model,
      );
      const perImageCost = provider.estimateCost(quality, size, 1);
      images = await Promise.all(
        results.map(async (img) => {
          const bytes = Uint8Array.from(atob(img.b64), (ch) => ch.charCodeAt(0));
          const id = await ctx.storage.store(
            new Blob([bytes], { type: "image/png" }),
          );
          return {
            storageId: id as string,
            cost: perImageCost,
            provider: provider.name,
            model,
          };
        }),
      );
    }

    // ---- Persist each alternative as a draft (pairs image[i] with caption[i]) ----
    await Promise.all(
      images.map((img, i) =>
        ctx.runMutation(internal.designs.insertDraft, {
          clientId: args.clientId,
          storageId: img.storageId as any,
          caption: args.captionOn ? captions[i] ?? captions[0] : undefined,
          format: args.format,
          prompt: imagePrompt,
          provider: img.provider,
          model: img.model,
          costEstimate: img.cost,
          batchId,
        }),
      ),
    );

    return { batchId, count: images.length, mock };
  },
});

import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireClientOwnership } from "./lib/access";

// History for a client (newest first), with resolved image URLs.
export const list = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    await requireClientOwnership(ctx, clientId);
    const rows = await ctx.db
      .query("generatedDesigns")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .order("desc")
      .take(60);
    return await Promise.all(
      rows.map(async (d) => ({
        ...d,
        url: d.storageId ? await ctx.storage.getUrl(d.storageId) : null,
      })),
    );
  },
});

// Used internally by the generate action to persist each alternative.
export const insertDraft = internalMutation({
  args: {
    clientId: v.id("clients"),
    storageId: v.optional(v.id("_storage")),
    caption: v.optional(v.string()),
    format: v.string(),
    prompt: v.string(),
    provider: v.string(),
    model: v.string(),
    costEstimate: v.number(),
    batchId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generatedDesigns", { ...args, status: "draft" });
  },
});

// Approving a design feeds it back into the gallery so future generations
// learn from it — the core improvement loop.
export const approve = mutation({
  args: { designId: v.id("generatedDesigns") },
  handler: async (ctx, { designId }) => {
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");
    await requireClientOwnership(ctx, design.clientId);
    await ctx.db.patch(designId, { status: "approved" });
    if (design.storageId) {
      await ctx.db.insert("galleryItems", {
        clientId: design.clientId,
        storageId: design.storageId,
        caption: design.caption,
        source: "approved",
      });
    }
  },
});

export const updateCaption = mutation({
  args: { designId: v.id("generatedDesigns"), caption: v.string() },
  handler: async (ctx, { designId, caption }) => {
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");
    await requireClientOwnership(ctx, design.clientId);
    await ctx.db.patch(designId, { caption });
  },
});

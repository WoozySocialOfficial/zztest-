import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireClientOwnership } from "./lib/access";

export const getProfile = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    await requireClientOwnership(ctx, clientId);
    return await ctx.db
      .query("brandProfiles")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .unique();
  },
});

// Save palette + style notes learned from the gallery / set by hand.
export const updateProfile = mutation({
  args: {
    clientId: v.id("clients"),
    palette: v.optional(v.array(v.string())),
    styleNotes: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { clientId, palette, styleNotes, logoStorageId }) => {
    await requireClientOwnership(ctx, clientId);
    const existing = await ctx.db
      .query("brandProfiles")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .unique();
    const patch: Record<string, unknown> = {};
    if (palette !== undefined) patch.palette = palette;
    if (styleNotes !== undefined) patch.styleNotes = styleNotes;
    if (logoStorageId !== undefined) patch.logoStorageId = logoStorageId;
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("brandProfiles", {
      clientId,
      palette: palette ?? [],
      styleNotes: styleNotes ?? "",
      logoStorageId,
    });
  },
});

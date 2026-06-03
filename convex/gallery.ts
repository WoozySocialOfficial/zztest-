import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId, requireClientOwnership } from "./lib/access";

// Step 1 of upload: hand the browser a short-lived signed upload URL.
// Must be authenticated; the file is bound to a client in addItem (step 2).
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Step 2: record the uploaded file against a client.
export const addItem = mutation({
  args: {
    clientId: v.id("clients"),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
    source: v.optional(v.union(v.literal("uploaded"), v.literal("approved"))),
  },
  handler: async (ctx, { clientId, storageId, caption, source }) => {
    await requireClientOwnership(ctx, clientId);
    return await ctx.db.insert("galleryItems", {
      clientId,
      storageId,
      caption,
      source: source ?? "uploaded",
    });
  },
});

export const list = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    await requireClientOwnership(ctx, clientId);
    const items = await ctx.db
      .query("galleryItems")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .order("desc")
      .collect();
    return await Promise.all(
      items.map(async (item) => ({
        ...item,
        url: await ctx.storage.getUrl(item.storageId),
      })),
    );
  },
});

export const remove = mutation({
  args: { itemId: v.id("galleryItems") },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.db.get(itemId);
    if (!item) return;
    await requireClientOwnership(ctx, item.clientId);
    await ctx.storage.delete(item.storageId);
    await ctx.db.delete(itemId);
  },
});

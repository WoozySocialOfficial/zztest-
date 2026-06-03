import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireUserId, requireClientOwnership } from "./lib/access";

// All clients owned by the signed-in user. Empty list when logged out.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("clients")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const { client } = await requireClientOwnership(ctx, clientId);
    const profile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .unique();
    return { ...client, profile };
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await requireUserId(ctx);
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Client name required");
    const clientId = await ctx.db.insert("clients", {
      name: trimmed,
      ownerId: userId,
    });
    // Seed an empty brand profile so the workspace has somewhere to learn into.
    await ctx.db.insert("brandProfiles", {
      clientId,
      palette: [],
      styleNotes: "",
    });
    return clientId;
  },
});

export const rename = mutation({
  args: { clientId: v.id("clients"), name: v.string() },
  handler: async (ctx, { clientId, name }) => {
    await requireClientOwnership(ctx, clientId);
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Client name required");
    await ctx.db.patch(clientId, { name: trimmed });
  },
});

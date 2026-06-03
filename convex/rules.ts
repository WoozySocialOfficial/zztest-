import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireClientOwnership } from "./lib/access";

const scopeValidator = v.union(
  v.literal("design"),
  v.literal("caption"),
  v.literal("video"),
);

export const list = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    await requireClientOwnership(ctx, clientId);
    return await ctx.db
      .query("learnRules")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: { clientId: v.id("clients"), scope: scopeValidator, rule: v.string() },
  handler: async (ctx, { clientId, scope, rule }) => {
    await requireClientOwnership(ctx, clientId);
    const trimmed = rule.trim();
    if (!trimmed) throw new Error("Rule text required");
    return await ctx.db.insert("learnRules", { clientId, scope, rule: trimmed });
  },
});

export const remove = mutation({
  args: { ruleId: v.id("learnRules") },
  handler: async (ctx, { ruleId }) => {
    const rule = await ctx.db.get(ruleId);
    if (!rule) return;
    await requireClientOwnership(ctx, rule.clientId);
    await ctx.db.delete(ruleId);
  },
});

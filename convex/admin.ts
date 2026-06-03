import { query, internalMutation, internalQuery, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId, createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// Admin = listed in ADMIN_EMAILS, or the bootstrap first user (earliest created).
async function isAdminUser(ctx: QueryCtx, userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (!user) return false;
  if (user.email && adminEmails().includes(user.email.toLowerCase())) return true;
  const first = await ctx.db.query("users").order("asc").first();
  return first?._id === userId;
}

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    return await isAdminUser(ctx, userId);
  },
});

// For actions: returns the caller's id + admin status (auth propagates to runQuery).
export const whoAmI = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { userId: null, isAdmin: false };
    return { userId, isAdmin: await isAdminUser(ctx, userId) };
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthUserId(ctx);
    if (!me || !(await isAdminUser(ctx, me))) return [];
    const users = await ctx.db.query("users").order("asc").collect();
    return users.map((u) => ({
      _id: u._id,
      email: u.email ?? "(no email)",
      createdAt: u._creationTime,
      isSelf: u._id === me,
    }));
  },
});

// Internal: approve an email so the auth gate will allow its account creation.
export const allowEmail = internalMutation({
  args: { email: v.string(), addedBy: v.optional(v.id("users")) },
  handler: async (ctx, { email, addedBy }) => {
    const existing = await ctx.db
      .query("allowedEmails")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("allowedEmails", { email, addedBy });
  },
});

// Admin creates a user account directly (email + temporary password).
export const createUser = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    const me = await ctx.runQuery(internal.admin.whoAmI, {});
    if (!me.isAdmin) throw new Error("Admins only.");

    const e = email.trim().toLowerCase();
    if (!e.includes("@") || e.length < 3) throw new Error("Enter a valid email.");
    if (password.length < 8)
      throw new Error("Password must be at least 8 characters.");

    // Approve the email first so the auth gate permits creation, then create.
    await ctx.runMutation(internal.admin.allowEmail, {
      email: e,
      addedBy: me.userId ?? undefined,
    });
    await createAccount(ctx, {
      provider: "password",
      account: { id: e, secret: password },
      profile: { email: e },
    });
    return { ok: true, email: e };
  },
});

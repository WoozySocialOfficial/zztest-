import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

// Comma-separated admin emails (Convex env). Admins may always register.
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// Email + password auth. Passwords are hashed by Convex Auth.
// Sign-up is INVITE-ONLY: createOrUpdateUser (called only on account creation
// for credentials) refuses any email that isn't the bootstrap first user, an
// admin, or pre-approved in allowedEmails (admins approve via the admin panel).
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      // Sign-in to an existing account — never gated here.
      if (existingUserId) return existingUserId;

      const email = String(profile.email ?? "").toLowerCase();
      if (!email) throw new Error("An email address is required.");

      const isBootstrap = (await ctx.db.query("users").take(1)).length === 0;
      const isAdmin = adminEmails().includes(email);
      let invited = false;
      if (!isBootstrap && !isAdmin) {
        // ctx here is typed with a generic data model (no custom indexes), so
        // filter rather than withIndex. allowedEmails is tiny — a scan is fine.
        const allow = await ctx.db
          .query("allowedEmails")
          .filter((q) => q.eq(q.field("email"), email))
          .first();
        invited = allow !== null;
      }
      if (!isBootstrap && !isAdmin && !invited) {
        throw new Error(
          "Registration is by invitation only. Ask an admin to create your account.",
        );
      }

      return await ctx.db.insert("users", {
        email: profile.email as string,
        name: profile.name as string | undefined,
      });
    },
  },
});

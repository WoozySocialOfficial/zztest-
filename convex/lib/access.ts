import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";

/**
 * The single chokepoint for tenant isolation. Every client-scoped function
 * MUST go through requireClientOwnership before reading or writing client data.
 * Because the browser can only call our functions (never the DB directly),
 * consistent use of these guards = airtight per-client isolation.
 */

export async function requireUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function requireClientOwnership(
  ctx: QueryCtx | MutationCtx,
  clientId: Id<"clients">,
): Promise<{ userId: Id<"users">; client: Doc<"clients"> }> {
  const userId = await requireUserId(ctx);
  const client = await ctx.db.get(clientId);
  if (!client) throw new Error("Client not found");
  if (client.ownerId !== userId) throw new Error("Forbidden: not your client");
  return { userId, client };
}

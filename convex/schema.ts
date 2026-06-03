import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Multi-tenant model. Isolation is enforced in every function via
// requireClientOwnership (see convex/lib/access.ts) — clients can only reach
// data through these functions, never the DB directly.
export default defineSchema({
  // Convex Auth tables (users, authSessions, authAccounts, ...)
  ...authTables,

  // A walled-off brand workspace. Everything else hangs off a clientId.
  clients: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
  }).index("by_owner", ["ownerId"]),

  // One per client. Learned visual identity.
  brandProfiles: defineTable({
    clientId: v.id("clients"),
    palette: v.array(v.string()), // hex colours, e.g. "#1d4ed8"
    styleNotes: v.string(),
    logoStorageId: v.optional(v.id("_storage")),
  }).index("by_client", ["clientId"]),

  // Past posts (uploaded) + approved generations (the learning loop).
  galleryItems: defineTable({
    clientId: v.id("clients"),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
    source: v.union(v.literal("uploaded"), v.literal("approved")),
  }).index("by_client", ["clientId"]),

  // Cumulative plain-English rules. scope picks which generations they steer.
  learnRules: defineTable({
    clientId: v.id("clients"),
    scope: v.union(
      v.literal("design"),
      v.literal("caption"),
      v.literal("video"),
    ),
    rule: v.string(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_scope", ["clientId", "scope"]),

  // Every generation output. Cost tracked per row from day one.
  generatedDesigns: defineTable({
    clientId: v.id("clients"),
    storageId: v.optional(v.id("_storage")),
    caption: v.optional(v.string()),
    format: v.string(), // "square" | "story" | "land"
    prompt: v.string(),
    provider: v.string(), // "openai" | "ideogram" | "mock"
    model: v.string(),
    costEstimate: v.number(), // USD
    status: v.union(v.literal("draft"), v.literal("approved")),
    batchId: v.string(), // groups alternatives from one generate run
  })
    .index("by_client", ["clientId"])
    .index("by_client_status", ["clientId", "status"])
    .index("by_batch", ["batchId"]),
});

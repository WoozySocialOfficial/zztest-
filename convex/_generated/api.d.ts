/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai_caption from "../ai/caption.js";
import type * as ai_ideogram from "../ai/ideogram.js";
import type * as ai_openai from "../ai/openai.js";
import type * as ai_types from "../ai/types.js";
import type * as auth from "../auth.js";
import type * as brand from "../brand.js";
import type * as clients from "../clients.js";
import type * as designs from "../designs.js";
import type * as gallery from "../gallery.js";
import type * as generate from "../generate.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as rules from "../rules.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  "ai/caption": typeof ai_caption;
  "ai/ideogram": typeof ai_ideogram;
  "ai/openai": typeof ai_openai;
  "ai/types": typeof ai_types;
  auth: typeof auth;
  brand: typeof brand;
  clients: typeof clients;
  designs: typeof designs;
  gallery: typeof gallery;
  generate: typeof generate;
  http: typeof http;
  "lib/access": typeof lib_access;
  rules: typeof rules;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

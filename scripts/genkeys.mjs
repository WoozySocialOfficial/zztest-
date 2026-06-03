// One-time helper: generate the RS256 keypair Convex Auth needs.
// Writes the two secret values to a temp dir OUTSIDE the repo (never committed);
// the caller pipes them into `npx convex env set`. Mirrors @convex-dev/auth's
// own generateKeys (PKCS8 PEM with newlines->spaces; public JWK set as JSON).
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = (await exportPKCS8(keys.privateKey)).trimEnd().replace(/\n/g, " ");
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

const dir = join(homedir(), ".convex-tmp");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "ccs_jwtpk.txt"), privateKey);
writeFileSync(join(dir, "ccs_jwks.txt"), jwks);
console.log("ok: wrote keys to", dir);

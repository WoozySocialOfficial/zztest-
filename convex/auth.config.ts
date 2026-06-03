// Convex Auth provider config. CONVEX_SITE_URL is set automatically in the
// Convex deployment env when `npx @convex-dev/auth` is run during provisioning.
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};

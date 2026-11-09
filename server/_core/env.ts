export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  neonAuthBaseUrl: process.env.NEON_AUTH_BASE_URL ?? "",
  neonAuthJwksUrl: process.env.NEON_AUTH_JWKS_URL ?? "",
  neonRealtimeUrl: process.env.NEON_REALTIME_URL ?? "",
  neonRealtimeSecret: process.env.NEON_REALTIME_SECRET ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

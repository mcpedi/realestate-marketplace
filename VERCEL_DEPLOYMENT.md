# Deploy Nyumba 360 to Vercel

## Before deploying

This repository is a full-stack Express + React/Vite app. The production build succeeds with the checked-in `pnpm-lock.yaml`. The frontend is built into `dist/public`; the Express entrypoint is the root `index.ts`, and it serves the SPA plus `/api/*` routes.

If using the ZIP archive, extract it first. In Vercel, set **Root Directory** to the inner `realestate-marketplace-main` directory—the one containing `package.json`, `vercel.json`, and `index.ts`—not the outer archive folder.

## Vercel project settings

Use these settings (the repository's `vercel.json` already supplies the commands):

- **Framework Preset:** Express
- **Install Command:** `pnpm install --frozen-lockfile`
- **Build Command:** `pnpm build`
- **Output Directory:** leave unset / use the framework default; do not set `dist/public` as the only output because API routes also need the Express function.
- **Node.js version:** 20 or newer

For a local CLI deployment, open a terminal at the project root and run:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm dlx vercel login
pnpm dlx vercel
```

Follow the prompts to create/link a Vercel project. When the preview deployment is verified, publish production with:

```sh
pnpm dlx vercel --prod
```

Alternatively, connect the project to a Git repository in Vercel and deploy from the same project root.

## Environment variables

Add variables in **Vercel → Project → Settings → Environment Variables**. Set them for the environments where you deploy (Production and Preview as needed); then redeploy after changing them. Do not commit real credentials.

Core values:

- `VITE_APP_ID` — application/project identifier expected by the OAuth integration.
- `JWT_SECRET` — long, random secret used to sign session cookies. Generate one with `openssl rand -base64 48` and keep it private.
- `OAUTH_SERVER_URL` — base URL of the OAuth service used by this project. The source does not include a standalone identity provider; without this value, login will not work.
- `DATABASE_URL` **or** `SUPABASE_DATABASE_URL` — PostgreSQL connection string for a Neon-compatible serverless PostgreSQL database. If both are present, `SUPABASE_DATABASE_URL` is used first. Apply the project's Drizzle migrations/schema to the database before relying on data-backed features.
- `OWNER_OPEN_ID` — optional account identifier that should receive the app's owner/admin role.

Optional Manus-backed integrations use `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`; these enable related AI, map, notification, and storage features where supported. They are not needed just to compile the frontend.

A placeholder template is in [`.env.example`](.env.example). Never use the example values as real credentials.

## OAuth callback

When configuring the OAuth provider, register this exact callback URL for the production domain:

```text
https://YOUR-VERCEL-DOMAIN/api/oauth/callback
```

Replace the domain with the Vercel production domain (or your custom domain). For Preview deployments, register a matching preview callback only if your OAuth provider supports it.

## Verify the deployment

After the deployment is ready:

1. Open `/` and confirm the page and styles load.
2. Open a nested page such as `/properties`; it should return the SPA rather than a Vercel 404.
3. Check that `/api/trpc/...` requests reach the Express function. A request to `/api/trpc/` without a procedure can correctly return a JSON 404.
4. Check Vercel **Runtime Logs** for missing `OAUTH_SERVER_URL`, database connectivity, or function errors.
5. Test login and data-backed actions only after OAuth and database variables have been configured.

## Build check

Run this from the project root before pushing or deploying:

```sh
pnpm install --frozen-lockfile
pnpm build
```

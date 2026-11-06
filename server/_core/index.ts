import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { applySecurityHeaders, enforceRequestRateLimit, enforceSameOriginForMutations } from "./security";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(applySecurityHeaders);
  // Upload procedures apply smaller per-file limits; this is the outer API ceiling.
  app.use(express.json({ limit: "36mb" }));
  app.use(express.urlencoded({ limit: "36mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    enforceRequestRateLimit,
    enforceSameOriginForMutations,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Vercel imports this Express app as a serverless function. Local development
  // attaches Vite separately so its HMR server can share the HTTP server.
  if (process.env.NODE_ENV !== "development") {
    serveStatic(app);
  }
  return app;
}

const app = createApp();
export default app;

async function startServer() {
  const server = createServer(app);
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// Vercel manages the function request lifecycle; do not start a listener there.
if (process.env.VERCEL !== "1") {
  startServer().catch(console.error);
}

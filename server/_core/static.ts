import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const publicPath = path.resolve(process.cwd(), "public");
  const builtDistPath = path.resolve(process.cwd(), "dist", "public");
  const distPath = fs.existsSync(path.join(publicPath, "index.html")) ? publicPath : builtDistPath;
  // Vite places the HTML entry at dist/public/client/index.html but emits
  // hashed assets at dist/public/assets. Serve from the output root so /assets
  // URLs resolve, and use the nested HTML file for SPA fallback.
  const clientIndexPath = path.join(distPath, "client", "index.html");
  const indexPath = fs.existsSync(clientIndexPath) ? clientIndexPath : path.join(distPath, "index.html");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));
  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(indexPath);
  });
}

import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.basename(currentDir) === "_core" ? path.resolve(currentDir, "../..") : path.resolve(currentDir, "..");
const publicDir = path.join(root, "dist", "public");

app.disable("x-powered-by");
app.get("/api/health", (_request, response) => response.json({ ready: true }));
app.use(express.static(publicDir));
app.get("*", (_request, response) => response.sendFile(path.join(publicDir, "index.html")));

app.listen(port, () => {
  console.log(`Nyumba 360 server running on http://localhost:${port}`);
});

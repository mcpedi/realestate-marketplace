import express from "express";
import app from "./server/_core/index";

// Vercel's Express adapter requires the entrypoint to instantiate Express.
const handler = express();
handler.use(app);
export default handler;

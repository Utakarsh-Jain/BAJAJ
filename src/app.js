import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { identity } from "./config/identity.js";
import { bfhlRouter } from "./routes/bfhlRoute.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(publicDir));
  app.get("/health", (request, response) => {
    response.status(200).json({
      status: "ok"
    });
  });
  app.use(bfhlRouter);

  app.use((error, request, response, next) => {
    if (error instanceof SyntaxError) {
      response.status(400).json({
        ...identity,
        error: "Invalid JSON payload."
      });
      return;
    }

    next(error);
  });

  app.use((error, request, response, next) => {
    response.status(500).json({
      ...identity,
      error: "Internal server error."
    });
  });

  app.use((request, response) => {
    response.status(404).json({
      error: "Not found"
    });
  });

  return app;
}

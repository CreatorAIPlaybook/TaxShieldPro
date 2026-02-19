import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

const __filename = fileURLToPath(import.meta.url);
const isMainModule =
  process.argv[1] != null &&
  resolve(process.argv[1]) === resolve(__filename);

const app = express();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Development server with Vite HMR
// Production API is handled by native Vercel serverless function at api/subscribe.ts
const httpServer = createServer(app);

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV !== "production") {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  } else {
    const { serveStatic } = await import("./static");
    serveStatic(app);
  }

  if (process.env.NODE_ENV !== "production" && isMainModule) {
    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(port, () => {
      log(`serving on port ${port}`);
    });
  }
})();

export default app;

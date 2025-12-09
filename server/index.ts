import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

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

// Production (Vercel serverless): Register routes directly without httpServer
// Routes are registered synchronously since they don't need async initialization
if (process.env.NODE_ENV === "production") {
  // Register the subscribe route directly on the app
  app.post("/api/subscribe", async (req, res) => {
    try {
      const { email, firstName } = req.body;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }

      const apiKey = process.env.BEEHIIV_API_KEY;
      const pubId = process.env.BEEHIIV_PUB_ID;

      if (!apiKey || !pubId) {
        console.error("Beehiiv credentials not configured");
        return res.status(500).json({ error: "Newsletter service not configured" });
      }

      const requestBody: Record<string, unknown> = {
        email,
        reactivate_existing: false,
        send_welcome_email: true,
        utm_source: "Tax_Shield_Tool",
      };
      
      if (firstName && typeof firstName === "string" && firstName.trim()) {
        requestBody.custom_fields = [{ name: "first_name", value: firstName.trim() }];
      }

      const response = await fetch(
        `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Beehiiv API error:", response.status, errorData);
        if (response.status === 409) {
          return res.status(200).json({ success: true, message: "Already subscribed" });
        }
        return res.status(response.status).json({ error: "Failed to subscribe" });
      }

      const data = await response.json();
      console.log("Successfully subscribed:", email);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Subscription error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Error handler for production
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
}

// Development server with Vite HMR
if (process.env.NODE_ENV !== "production") {
  const httpServer = createServer(app);
  
  (async () => {
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);

    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
      },
    );
  })();
}

export default app;

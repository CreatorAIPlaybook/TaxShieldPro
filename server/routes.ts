import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  return httpServer;
}

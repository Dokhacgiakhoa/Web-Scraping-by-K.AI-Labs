import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { decryptSecret } from "../lib/crypto";
import { buildProvider } from "../providers";

export const aiRouter = Router();

aiRouter.post("/api/ai/analyze", requireAuth, async (req, res) => {
  const { prompt, pageUrl, pageTitle, isLoggedIn, provider } = req.body ?? {};
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({ error: "prompt is required" });
  }
  if (typeof pageUrl !== "string") {
    return res.status(400).json({ error: "pageUrl is required" });
  }

  const providerName = typeof provider === "string" ? provider.toUpperCase() : undefined;

  const apiKeyRow = providerName
    ? await prisma.apiKey.findUnique({
        where: { userId_provider: { userId: req.user!.userId, provider: providerName as any } },
      })
    : await prisma.apiKey.findFirst({ where: { userId: req.user!.userId } });

  if (!apiKeyRow) {
    return res.status(400).json({
      error: "No AI API key configured. Add one in Settings before running a check.",
    });
  }

  try {
    const decryptedKey = decryptSecret(apiKeyRow.encryptedKey);
    const client = buildProvider(apiKeyRow.provider as any, decryptedKey);
    const plan = await client.classify(prompt, {
      url: pageUrl,
      title: typeof pageTitle === "string" ? pageTitle : undefined,
      isLoggedIn: typeof isLoggedIn === "boolean" ? isLoggedIn : undefined,
    });
    res.json({ plan });
  } catch (err) {
    console.error("AI classify failed", err);
    res.status(502).json({ error: "AI provider request failed. Check your API key and try again." });
  }
});

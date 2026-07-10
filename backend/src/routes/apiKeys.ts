import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { encryptSecret, maskKey } from "../lib/crypto";

export const apiKeysRouter = Router();

const VALID_PROVIDERS = ["OPENAI", "ANTHROPIC", "GOOGLE"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

function isValidProvider(value: unknown): value is Provider {
  return typeof value === "string" && (VALID_PROVIDERS as readonly string[]).includes(value);
}

apiKeysRouter.get("/api/keys", requireAuth, async (req, res) => {
  const keys = await prisma.apiKey.findMany({
    where: { userId: req.user!.userId },
    select: { id: true, provider: true, createdAt: true },
  });
  res.json({ keys });
});

apiKeysRouter.post("/api/keys", requireAuth, async (req, res) => {
  const { provider, apiKey } = req.body ?? {};
  if (!isValidProvider(provider)) {
    return res.status(400).json({ error: `provider must be one of ${VALID_PROVIDERS.join(", ")}` });
  }
  if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return res.status(400).json({ error: "apiKey is required" });
  }
  if (apiKey.trim().length < 8) {
    return res.status(400).json({ error: "apiKey must be at least 8 characters long" });
  }

  const encryptedKey = encryptSecret(apiKey.trim());
  const saved = await prisma.apiKey.upsert({
    where: { userId_provider: { userId: req.user!.userId, provider } },
    update: { encryptedKey },
    create: { userId: req.user!.userId, provider, encryptedKey },
  });

  res.json({
    id: saved.id,
    provider: saved.provider,
    masked: maskKey(apiKey.trim()),
  });
});

apiKeysRouter.delete("/api/keys/:provider", requireAuth, async (req, res) => {
  const provider = req.params.provider.toUpperCase();
  if (!isValidProvider(provider)) {
    return res.status(400).json({ error: `provider must be one of ${VALID_PROVIDERS.join(", ")}` });
  }
  await prisma.apiKey.deleteMany({ where: { userId: req.user!.userId, provider } });
  res.json({ ok: true });
});

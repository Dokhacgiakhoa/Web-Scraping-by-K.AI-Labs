import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const resultsRouter = Router();

resultsRouter.post("/api/results", requireAuth, async (req, res) => {
  const { type, url, result } = req.body ?? {};
  if (typeof type !== "string" || typeof url !== "string" || result === undefined) {
    return res.status(400).json({ error: "type, url and result are required" });
  }

  const saved = await prisma.scrapeResult.create({
    data: {
      userId: req.user!.userId,
      type,
      url,
      resultJson: JSON.stringify(result),
    },
  });

  res.json({ id: saved.id, createdAt: saved.createdAt });
});

resultsRouter.get("/api/results", requireAuth, async (req, res) => {
  const results = await prisma.scrapeResult.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  res.json({
    results: results.map((r) => ({
      id: r.id,
      type: r.type,
      url: r.url,
      result: JSON.parse(r.resultJson),
      createdAt: r.createdAt,
    })),
  });
});

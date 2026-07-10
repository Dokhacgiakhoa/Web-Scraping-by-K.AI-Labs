import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuthPage } from "../middleware/auth";

export const pagesRouter = Router();

pagesRouter.get("/", (req, res) => {
  res.redirect(req.cookies?.token ? "/dashboard" : "/login");
});

pagesRouter.get("/login", (_req, res) => {
  res.render("login", { error: null });
});

pagesRouter.get("/signup", (_req, res) => {
  res.render("signup", { error: null });
});

pagesRouter.get("/privacy", (_req, res) => {
  res.render("privacy");
});

pagesRouter.get("/dashboard", requireAuthPage, async (req, res) => {
  const [keys, results] = await Promise.all([
    prisma.apiKey.findMany({ where: { userId: req.user!.userId } }),
    prisma.scrapeResult.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  res.render("dashboard", {
    email: req.user!.email,
    keys,
    results: results.map((r) => ({ ...r, result: JSON.parse(r.resultJson) })),
  });
});

// The extension's auth-relay content script only runs on this exact page and reads
// the token embedded below to hand it to the extension background worker.
pagesRouter.get("/extension/connect", requireAuthPage, (req, res) => {
  res.render("connect", { token: req.cookies.token, email: req.user!.email });
});

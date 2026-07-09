import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";

export const authRouter = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// JSON API used by both the web UI forms and the extension.
authRouter.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || !isValidEmail(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  const token = signToken({ userId: user.id, email: user.email });

  res.cookie("token", token, COOKIE_OPTIONS);
  res.json({ token, user: { id: user.id, email: user.email } });
});

authRouter.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const token = signToken({ userId: user.id, email: user.email });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.json({ token, user: { id: user.id, email: user.email } });
});

authRouter.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

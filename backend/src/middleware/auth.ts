import { NextFunction, Request, Response } from "express";
import { JwtPayload, verifyToken } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return req.cookies?.token;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Same as requireAuth but redirects to /login for browser page routes instead of returning JSON.
export function requireAuthPage(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.redirect("/login");
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.redirect("/login");
  }
}

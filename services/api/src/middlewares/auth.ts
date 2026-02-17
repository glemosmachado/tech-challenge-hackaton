import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../utils/jwt.js";

export type AuthUser = JwtPayload;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

export function requireRole(role: AuthUser["role"]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "UNAUTHENTICATED" });
    if (req.user.role !== role) return res.status(403).json({ error: "FORBIDDEN" });
    return next();
  };
}
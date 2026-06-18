import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "lexis-lms-dev-secret-change-in-production";

export interface AuthPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" as const });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "未登录或令牌已过期" });
  }
  try {
    const payload = verifyToken(header.slice(7));
    (req as Request & { user: AuthPayload }).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "未登录或令牌已过期" });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      (req as Request & { user: AuthPayload }).user = verifyToken(header.slice(7));
    } catch { /* ignore */ }
  }
  next();
}

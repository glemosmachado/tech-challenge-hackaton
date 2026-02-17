import jwt from "jsonwebtoken";

export type JwtRole = "TEACHER" | "STUDENT" | "ADMIN";

export interface JwtPayload {
  sub: string;
  role: JwtRole;
  email: string;
  name: string;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
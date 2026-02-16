import jwt, { type SignOptions } from "jsonwebtoken";

export type JwtPayload = {
  sub: string;
  role: "TEACHER" | "STUDENT";
  email: string;
  name: string;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 16) {
    throw new Error("Missing env var: JWT_SECRET");
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}
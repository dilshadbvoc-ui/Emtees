import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.APP_SECRET || "emtees-academy-secret-key-2024"
);

export type TrpcContext = {
  req: any;
  res: any;
  user: { id: number; role: string; name: string; sessionToken: string } | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const token = opts.req.headers.authorization?.replace("Bearer ", "");
  let user = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        clockTolerance: 60,
      });
      user = {
        id: payload.sub ? parseInt(payload.sub) : 0,
        role: (payload.role as string) || "student",
        name: (payload.name as string) || "",
        sessionToken: (payload.sessionToken as string) || "",
      };
    } catch {
      user = null;
    }
  }

  return { req: opts.req, res: opts.res, user };
}

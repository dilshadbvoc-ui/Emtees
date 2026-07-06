import * as trpcExpress from "@trpc/server/adapters/express";
import { jwtVerify } from "jose";
import { jwtSecret } from "./lib/env";

export type TrpcContext = {
  req: trpcExpress.CreateExpressContextOptions["req"];
  res: trpcExpress.CreateExpressContextOptions["res"];
  user: { id: number; role: string; name: string; sessionToken: string } | null;
};

export async function createContext({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions): Promise<TrpcContext> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  let user = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, jwtSecret, {
        clockTolerance: 60,
      });
      user = {
        id: payload.sub ? parseInt(payload.sub) : 0,
        role: (payload.role as string) || "student",
        name: (payload.name as string) || "",
        sessionToken: (payload.sessionToken as string) || "",
      };
    } catch (err: any) {
      console.error("[tRPC Context] Token verification failed:", err?.message || err);
      user = null;
    }
  }
  return { req, res, user };
}


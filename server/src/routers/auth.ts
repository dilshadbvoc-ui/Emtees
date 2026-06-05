import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { eq, and, gte } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, otpCodes } from "@db/schema";

const JWT_SECRET = new TextEncoder().encode(
  process.env.APP_SECRET || "emtees-academy-secret-key-2024"
);

const generateToken = async (user: {
  id: number;
  role: string;
  name: string;
  deviceToken: string;
}) => {
  return new SignJWT({
    role: user.role,
    name: user.name,
    sessionToken: user.deviceToken,
  })
    .setSubject(String(user.id))
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
};

export const authRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(2),
        phone: z.string().min(10),
        username: z.string().min(3),
        password: z.string().min(6),
        role: z
          .enum(["student", "teacher", "admin", "academic_head", "super_admin"])
          .default("student"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.query.users.findFirst({
        where: eq(users.username, input.username),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists",
        });
      }

      const existingPhone = await db.query.users.findFirst({
        where: eq(users.phone, input.phone),
      });
      if (existingPhone) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Phone already registered",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const result = await db
        .insert(users)
        .values({
          unionId: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: input.name,
          phone: input.phone,
          username: input.username,
          password: hashedPassword,
          role: input.role,
        })
        .returning({ id: users.id });

      const userId = result[0]?.id;
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const token = await generateToken({
        id: user.id,
        role: user.role,
        name: user.name,
        deviceToken: "",
      });
      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone,
        },
      };
    }),

  login: publicQuery
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
        deviceToken: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.username, input.username),
      });
      if (!user || !user.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      if (user.status === "suspended") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account suspended",
        });
      }
      if (user.status === "on_hold") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Account on hold" });
      }

      // Single device login: update device token
      const deviceToken = input.deviceToken ?? crypto.randomUUID();
      await db
        .update(users)
        .set({ deviceToken, lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      const token = await generateToken({
        id: user.id,
        role: user.role,
        name: user.name,
        deviceToken,
      });
      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone,
        },
      };
    }),

  sendOtp: publicQuery
    .input(z.object({ phone: z.string().min(10) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await db.insert(otpCodes).values({
        phone: input.phone,
        code,
        expiresAt,
      });

      // In production, send actual SMS
      return { success: true, message: "OTP sent", code }; // code returned for demo
    }),

  verifyOtp: publicQuery
    .input(
      z.object({
        phone: z.string().min(10),
        code: z.string().length(6),
        deviceToken: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const otp = await db.query.otpCodes.findFirst({
        where: and(
          eq(otpCodes.phone, input.phone),
          eq(otpCodes.code, input.code),
          eq(otpCodes.used, false),
          gte(otpCodes.expiresAt, new Date())
        ),
      });

      if (!otp) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired OTP",
        });
      }

      await db
        .update(otpCodes)
        .set({ used: true })
        .where(eq(otpCodes.id, otp.id));

      let user = await db.query.users.findFirst({
        where: eq(users.phone, input.phone),
      });
      if (!user) {
        // Auto-register
        const result = await db
          .insert(users)
          .values({
            unionId: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            name: `User ${input.phone.slice(-4)}`,
            phone: input.phone,
            role: "student",
          })
          .returning({ id: users.id });
        const userId = result[0]?.id;
        user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      }

      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (user.status === "suspended") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account suspended",
        });
      }
      if (user.status === "on_hold") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Account on hold" });
      }

      const deviceToken = input.deviceToken ?? crypto.randomUUID();
      await db
        .update(users)
        .set({ deviceToken, lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      const token = await generateToken({
        id: user.id,
        role: user.role,
        name: user.name,
        deviceToken,
      });
      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      username: user.username,
      status: user.status,
    };
  }),
});

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import {
  salesClosures,
  salesPointsRules,
  salesGroups,
  salesExecutives,
  reportTemplates,
  users
} from "@db/schema";

// Sales Executive middleware: checks if user is super_admin, admin, or sales_executive
const salesExecQuery = authedQuery.use(async ({ ctx, next }) => {
  const allowedRoles = ["super_admin", "admin", "sales_executive"];
  if (!allowedRoles.includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sales Executive or Admin access required" });
  }
  return next({ ctx });
});

export const salesRouter = createRouter({
  // ----------------------------------------------------
  // GROUPS / TEAMS
  // ----------------------------------------------------
  listGroups: salesExecQuery.query(async () => {
    const db = getDb();
    return db.query.salesGroups.findMany({
      with: {
        // We'll just return the basics for now
      },
      orderBy: asc(salesGroups.name),
    });
  }),

  createGroup: adminQuery
    .input(z.object({ name: z.string().min(1), asmId: z.number().optional(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.insert(salesGroups).values({
        name: input.name,
        asmId: input.asmId,
        description: input.description,
      }).returning();
    }),

  updateGroup: adminQuery
    .input(z.object({ id: z.number(), name: z.string(), asmId: z.number().nullable().optional(), description: z.string().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.update(salesGroups)
        .set({
          name: input.name,
          asmId: input.asmId,
          description: input.description,
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(eq(salesGroups.id, input.id))
        .returning();
    }),

  // ----------------------------------------------------
  // POINTS RULES
  // ----------------------------------------------------
  listPointsRules: adminQuery.query(async () => {
    const db = getDb();
    return db.query.salesPointsRules.findMany({
      orderBy: desc(salesPointsRules.priority),
    });
  }),

  createPointsRule: adminQuery
    .input(z.object({
      name: z.string().min(1),
      caCategoryMatch: z.string().nullable().optional(),
      courseMatch: z.string().nullable().optional(),
      minTotalFee: z.number().nullable().optional(),
      maxTotalFee: z.number().nullable().optional(),
      minPaymentPercent: z.number().nullable().optional(),
      fixedPointsAward: z.number().nullable().optional(),
      formula: z.string().nullable().optional(),
      priority: z.number().default(0),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.insert(salesPointsRules).values({
        name: input.name,
        caCategoryMatch: input.caCategoryMatch,
        courseMatch: input.courseMatch,
        minTotalFee: input.minTotalFee?.toString(),
        maxTotalFee: input.maxTotalFee?.toString(),
        minPaymentPercent: input.minPaymentPercent?.toString(),
        fixedPointsAward: input.fixedPointsAward?.toString(),
        formula: input.formula,
        priority: input.priority,
        isActive: input.isActive,
      }).returning();
    }),

  updatePointsRule: adminQuery
    .input(z.object({
      id: z.number(),
      name: z.string().min(1),
      caCategoryMatch: z.string().nullable().optional(),
      courseMatch: z.string().nullable().optional(),
      minTotalFee: z.number().nullable().optional(),
      maxTotalFee: z.number().nullable().optional(),
      minPaymentPercent: z.number().nullable().optional(),
      fixedPointsAward: z.number().nullable().optional(),
      formula: z.string().nullable().optional(),
      priority: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.update(salesPointsRules)
        .set({
          name: input.name,
          caCategoryMatch: input.caCategoryMatch,
          courseMatch: input.courseMatch,
          minTotalFee: input.minTotalFee?.toString(),
          maxTotalFee: input.maxTotalFee?.toString(),
          minPaymentPercent: input.minPaymentPercent?.toString(),
          fixedPointsAward: input.fixedPointsAward?.toString(),
          formula: input.formula,
          priority: input.priority,
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(eq(salesPointsRules.id, input.id))
        .returning();
    }),

  deletePointsRule: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(salesPointsRules).where(eq(salesPointsRules.id, input.id));
      return { success: true };
    }),

  // ----------------------------------------------------
  // CLOSURES
  // ----------------------------------------------------
  listClosures: salesExecQuery
    .input(z.object({
      monthStr: z.string().optional(),
      caId: z.number().optional(),
      asmId: z.number().optional(),
      groupId: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const filters = [eq(salesClosures.isDeleted, false)];

      // Apply CA / Role restrictions
      if (ctx.user.role === "sales_executive") {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, ctx.user.id)
        });
        if (!dbUser?.salesExecutiveId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sales profile missing" });
        }
        
        // Find if user is ASM
        const profile = await db.query.salesExecutives.findFirst({
          where: eq(salesExecutives.id, dbUser.salesExecutiveId)
        });

        if (profile?.isASM && profile?.groupId) {
          // ASM sees their group
          filters.push(eq(salesClosures.groupId, profile.groupId));
        } else {
          // CA sees only their own
          filters.push(eq(salesClosures.caId, dbUser.salesExecutiveId));
        }
      }

      if (input?.monthStr) filters.push(eq(salesClosures.monthStr, input.monthStr));
      if (input?.caId) filters.push(eq(salesClosures.caId, input.caId));
      if (input?.asmId) filters.push(eq(salesClosures.asmId, input.asmId));
      if (input?.groupId) filters.push(eq(salesClosures.groupId, input.groupId));

      return db.query.salesClosures.findMany({
        where: and(...filters),
        orderBy: desc(salesClosures.closingDate),
      });
    }),

  createClosure: salesExecQuery
    .input(z.object({
      closingDate: z.string().or(z.date()),
      caId: z.number().optional(),
      courseName: z.string().min(1),
      type: z.string().min(1), // New Closure, Old Balance, etc
      admNo: z.string().optional(),
      studentName: z.string().optional(),
      totalFee: z.number(),
      firstInst: z.number().default(0),
      secondInst: z.number().default(0),
      thirdInst: z.number().default(0),
      bank: z.string().optional(),
      verificationStatus: z.string().optional(),
      obNumber: z.string().optional(),
      leadStatus: z.string().optional(),
      remarks: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      let finalCaId = input.caId;
      if (ctx.user.role === "sales_executive") {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, ctx.user.id)
        });
        finalCaId = dbUser?.salesExecutiveId || undefined;
      }

      if (!finalCaId) throw new TRPCError({ code: "BAD_REQUEST", message: "CA ID required" });

      const caProfile = await db.query.salesExecutives.findFirst({
        where: eq(salesExecutives.id, finalCaId)
      });
      if (!caProfile) throw new TRPCError({ code: "NOT_FOUND", message: "CA not found" });

      // Calculate totals
      const totalPaid = input.firstInst + input.secondInst + input.thirdInst;
      const balance = input.totalFee - totalPaid;

      // Ensure closingDate is Date
      const dateObj = typeof input.closingDate === 'string' ? new Date(input.closingDate) : input.closingDate;

      // Month strings
      const monthStr = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const cleanMonthStr = dateObj.toLocaleDateString("en-US", { month: "long" });

      // Run points engine
      const baseAmountForPoints = input.firstInst; // Simple assumption, you might need to adjust based on rules
      const points = await calculatePoints(db, {
        totalFee: input.totalFee,
        totalPaid,
        courseName: input.courseName,
        caCategory: "CORE_STRENGTH" // You would pull this from caProfile if added
      });

      return db.insert(salesClosures).values({
        closingDate: dateObj,
        monthStr,
        cleanMonthStr,
        caCategory: "CORE_STRENGTH",
        caId: finalCaId,
        groupId: caProfile.groupId,
        asmId: null, // You'd need to look up who the ASM is for this group
        courseName: input.courseName,
        admNo: input.admNo,
        studentName: input.studentName,
        type: input.type,
        totalFee: input.totalFee.toString(),
        firstInst: input.firstInst.toString(),
        secondInst: input.secondInst.toString(),
        thirdInst: input.thirdInst.toString(),
        balance: balance.toString(),
        points: points.toString(),
        baseAmountForPoints: baseAmountForPoints.toString(),
        bank: input.bank,
        verificationStatus: input.verificationStatus,
        obNumber: input.obNumber,
        leadStatus: input.leadStatus,
        remarks: input.remarks,
        createdBy: ctx.user.id,
      }).returning();
    }),

  // ----------------------------------------------------
  // REPORTS
  // ----------------------------------------------------
  generateReport: salesExecQuery
    .input(z.object({
      monthStr: z.string().optional(),
      groupBy: z.enum(["ca", "asm", "group", "week"]).default("ca"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const filters = [eq(salesClosures.isDeleted, false)];

      // Apply CA / Role restrictions
      if (ctx.user.role === "sales_executive") {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, ctx.user.id)
        });
        if (!dbUser?.salesExecutiveId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sales profile missing" });
        }
        const profile = await db.query.salesExecutives.findFirst({
          where: eq(salesExecutives.id, dbUser.salesExecutiveId)
        });
        if (profile?.isASM && profile?.groupId) {
          filters.push(eq(salesClosures.groupId, profile.groupId));
        } else {
          filters.push(eq(salesClosures.caId, dbUser.salesExecutiveId));
        }
      }

      if (input.monthStr) {
        filters.push(eq(salesClosures.monthStr, input.monthStr));
      }
      
      const allClosures = await db.query.salesClosures.findMany({
        where: and(...filters),
        with: {
          // We'd ideally join to get CA names, etc.
        }
      });

      // Simple aggregation in memory for now
      const report: Record<string, { totalClosures: number, totalFee: number, totalPoints: number, collected: number }> = {};

      for (const closure of allClosures) {
        let key = "Unknown";
        if (input.groupBy === "ca") key = closure.caId?.toString() || "Unassigned";
        if (input.groupBy === "asm") key = closure.asmId?.toString() || "Unassigned";
        if (input.groupBy === "group") key = closure.groupId?.toString() || "Unassigned";

        if (!report[key]) {
          report[key] = { totalClosures: 0, totalFee: 0, totalPoints: 0, collected: 0 };
        }
        report[key].totalClosures += 1;
        report[key].totalFee += parseFloat(closure.totalFee || "0");
        report[key].totalPoints += parseFloat(closure.points || "0");
        const collected = parseFloat(closure.firstInst || "0") + parseFloat(closure.secondInst || "0") + parseFloat(closure.thirdInst || "0");
        report[key].collected += collected;
      }

      return report;
    }),
});

// Points Engine Utility Function
async function calculatePoints(db: any, params: { totalFee: number, totalPaid: number, courseName: string, caCategory: string }) {
  const rules = await db.query.salesPointsRules.findMany({
    where: eq(salesPointsRules.isActive, true),
    orderBy: desc(salesPointsRules.priority),
  });

  const paymentPercent = params.totalFee > 0 ? (params.totalPaid / params.totalFee) * 100 : 0;

  for (const rule of rules) {
    // Check match conditions
    if (rule.caCategoryMatch && rule.caCategoryMatch !== params.caCategory) continue;
    if (rule.courseMatch && !params.courseName.includes(rule.courseMatch)) continue;
    if (rule.minTotalFee && params.totalFee < parseFloat(rule.minTotalFee)) continue;
    if (rule.maxTotalFee && params.totalFee > parseFloat(rule.maxTotalFee)) continue;
    if (rule.minPaymentPercent && paymentPercent < parseFloat(rule.minPaymentPercent)) continue;

    // Rule matches! Calculate points
    if (rule.fixedPointsAward) {
      return parseFloat(rule.fixedPointsAward);
    }
    if (rule.formula) {
      // Very basic formula eval: replacing variables
      try {
        const evalString = rule.formula
          .replace(/paymentAmount/g, params.totalPaid.toString())
          .replace(/totalFee/g, params.totalFee.toString());
        
        // DANGEROUS in prod without sandbox, but acceptable if admin-only configured simple math
        return new Function('return ' + evalString)();
      } catch (e) {
        console.error("Points formula error:", e);
      }
    }
  }

  return 0; // default no points if no rules matched
}

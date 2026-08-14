import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, or, and, gte, lte, desc, sql, asc, inArray } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import {
  salesClosures,
  salesGroups,
  salesExecutives,
  salesPointsRules,
  leadCampaigns,
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
    .input(z.object({ name: z.string().min(1), asmId: z.number().optional(), managerId: z.number().optional(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.insert(salesGroups).values({
        name: input.name,
        asmId: input.asmId,
        managerId: input.managerId,
        description: input.description,
      }).returning();
    }),

  updateGroup: adminQuery
    .input(z.object({ id: z.number(), name: z.string(), asmId: z.number().nullable().optional(), managerId: z.number().nullable().optional(), description: z.string().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      return db.update(salesGroups)
        .set({
          name: input.name,
          asmId: input.asmId,
          managerId: input.managerId,
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
  // LEAD CAMPAIGNS
  // ----------------------------------------------------
  listLeadCampaigns: salesExecQuery
    .query(async ({ ctx }) => {
      const db = getDb();

      const allCampaigns = await db.query.leadCampaigns.findMany({
        with: {
          courseAdvisor: true,
          asm: true,
        },
        orderBy: (c, { desc }) => [desc(c.createdAt)]
      });

      // Filter in memory for simplicity to respect CA/ASM hierarchy
      if (ctx.user.role === "sales_executive") {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, ctx.user.id)
        });
        if (dbUser?.salesExecutiveId) {
          const profile = await db.query.salesExecutives.findFirst({
            where: eq(salesExecutives.id, dbUser.salesExecutiveId)
          });
          
          if (profile?.designation === "Manager" || profile?.isASM) {
            // Managers see their own and their group's campaigns
            if (profile.groupId) {
              const caInGroup = await db.query.salesExecutives.findMany({
                where: eq(salesExecutives.groupId, profile.groupId)
              });
              const caIds = caInGroup.map(ca => ca.id);
              return allCampaigns.filter(c => caIds.includes(c.caId || 0) || c.caId === dbUser.salesExecutiveId || c.asmId === dbUser.salesExecutiveId);
            }
          }
          // Normal CA sees only their own
          return allCampaigns.filter(c => c.caId === dbUser.salesExecutiveId);
        }
        return [];
      }

      return allCampaigns;
    }),

  createLeadCampaign: salesExecQuery
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      month: z.string(),
      caId: z.number().optional(),
      asmId: z.number().optional().nullable(),
      course: z.string(),
      noOfLeads: z.number(),
      amountSpent: z.number(),
      dailyBudget: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      let assignedCaId = input.caId;
      
      if (!assignedCaId && ctx.user.role === "sales_executive") {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, ctx.user.id)
        });
        assignedCaId = dbUser?.salesExecutiveId || undefined;
      }

      if (!assignedCaId) {
         throw new TRPCError({ code: "BAD_REQUEST", message: "Sales Executive ID is required" });
      }
      
      const [campaign] = await db.insert(leadCampaigns).values({
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        month: input.month,
        caId: assignedCaId,
        asmId: input.asmId || null,
        course: input.course,
        noOfLeads: input.noOfLeads,
        amountSpent: input.amountSpent.toString(),
        dailyBudget: input.dailyBudget.toString(),
        isActive: input.isActive,
      }).returning();
      
      return campaign;
    }),
    
  updateLeadCampaignStatus: salesExecQuery
    .input(z.object({
      id: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(leadCampaigns).set({ isActive: input.isActive, updatedAt: new Date() }).where(eq(leadCampaigns.id, input.id));
      return { success: true };
    }),

  getSalesPerformanceReport: salesExecQuery
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      
      const execs = await db.query.salesExecutives.findMany({
        where: eq(salesExecutives.status, "active")
      });
      const execMap = new Map();
      execs.forEach(e => execMap.set(e.id, { id: e.id, name: e.name, leads: 0, closures: 0, campaignsList: [], closuresList: [] }));

      const leadFilters = [];
      if (input.startDate) leadFilters.push(gte(leadCampaigns.createdAt, new Date(input.startDate)));
      if (input.endDate) leadFilters.push(lte(leadCampaigns.createdAt, new Date(input.endDate)));
      
      const campaigns = await db.query.leadCampaigns.findMany({
        where: leadFilters.length > 0 ? and(...leadFilters) : undefined,
      });

      campaigns.forEach(c => {
        if (c.caId && execMap.has(c.caId)) {
          const exec = execMap.get(c.caId);
          exec.leads += c.noOfLeads;
          exec.campaignsList.push(c);
        }
      });

      const closureFilters = [eq(salesClosures.isDeleted, false)];
      if (input.startDate) closureFilters.push(gte(salesClosures.closingDate, new Date(input.startDate)));
      if (input.endDate) closureFilters.push(lte(salesClosures.closingDate, new Date(input.endDate)));

      const closures = await db.query.salesClosures.findMany({
        where: and(...closureFilters)
      });

      closures.forEach(c => {
        if (c.caId && execMap.has(c.caId)) {
          const exec = execMap.get(c.caId);
          exec.closures += 1;
          exec.closuresList.push(c);
        }
      });

      const report = Array.from(execMap.values()).map(e => ({
        ...e,
        percentage: e.leads > 0 ? Number(((e.closures / e.leads) * 100).toFixed(2)) : 0
      }));
      
      return report.filter(e => e.leads > 0 || e.closures > 0).sort((a, b) => b.closures - a.closures);
    }),

  compareIqedData: adminQuery
    .input(z.array(z.object({
      admNo: z.string().optional(),
      studentName: z.string().optional(),
      totalFee: z.number().optional(),
      paid: z.number().optional(),
      rawRow: z.any().optional()
    })))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Fetch all closures for comparison
      // Ideally, we'd limit this to a date range, but since we don't know the date of the IQED data easily, 
      // we'll fetch recent closures or all non-deleted ones to check against.
      const dbClosures = await db.query.salesClosures.findMany({
        where: eq(salesClosures.isDeleted, false)
      });

      const matched: any[] = [];
      const mismatched: any[] = [];
      const missingInDb: any[] = [];
      
      for (const item of input) {
        // Try to match by admNo first, then studentName
        let match = dbClosures.find(c => c.admNo && item.admNo && String(c.admNo).trim() === String(item.admNo).trim());
        if (!match && item.studentName) {
          match = dbClosures.find(c => c.studentName && String(c.studentName).trim().toLowerCase() === String(item.studentName).trim().toLowerCase());
        }

        if (!match) {
          missingInDb.push(item);
        } else {
          // Compare amounts
          const dbTotal = Number(match.totalFee || 0);
          const dbPaid = Number(match.firstInst || 0);
          const iqedTotal = Number(item.totalFee || 0);
          const iqedPaid = Number(item.paid || 0);
          
          if (Math.abs(dbTotal - iqedTotal) > 1 || Math.abs(dbPaid - iqedPaid) > 1) {
            mismatched.push({
              dbRecord: match,
              iqedRecord: item,
              diffs: {
                totalFee: dbTotal !== iqedTotal,
                paid: dbPaid !== iqedPaid
              }
            });
          } else {
            matched.push({ dbRecord: match, iqedRecord: item });
          }
        }
      }

      return {
        totalProcessed: input.length,
        matchedCount: matched.length,
        mismatchedCount: mismatched.length,
        missingCount: missingInDb.length,
        matched,
        mismatched,
        missingInDb
      };
    }),

  // ----------------------------------------------------
  // DASHBOARD
  // ----------------------------------------------------
  getDashboardStats: salesExecQuery.query(async ({ ctx }) => {
    const db = getDb();
    const allClosures = await db.query.salesClosures.findMany({
      where: eq(salesClosures.isDeleted, false)
    });

    let filteredClosures = allClosures;
    
    // Apply CA / Role restrictions
    if (ctx.user.role === "sales_executive") {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id)
      });
      if (dbUser?.salesExecutiveId) {
        const profile = await db.query.salesExecutives.findFirst({
          where: eq(salesExecutives.id, dbUser.salesExecutiveId)
        });

        if (profile?.designation === "Manager") {
          const managedGroups = await db.query.salesGroups.findMany({
            where: eq(salesGroups.managerId, profile.id)
          });
          const groupIds = managedGroups.map(g => g.id);
          filteredClosures = allClosures.filter(c => c.groupId && groupIds.includes(c.groupId));
        } else if (profile?.isASM && profile?.groupId) {
          filteredClosures = allClosures.filter(c => c.groupId === profile.groupId);
        } else {
          filteredClosures = allClosures.filter(c => c.caId === dbUser.salesExecutiveId);
        }
      }
    }

    const currentMonth = new Date().toISOString().substring(0, 7);
    const thisMonthClosures = filteredClosures.filter(c => c.closingDate && c.closingDate.toISOString().startsWith(currentMonth));

    const totalRevenue = thisMonthClosures.reduce((acc, curr) => acc + Number(curr.firstInst || 0), 0);
    const totalPipeline = thisMonthClosures.reduce((acc, curr) => acc + Number(curr.totalFee || 0), 0);
    const outstanding = totalPipeline - totalRevenue;

    // Group by month for graph
    const monthlyData: Record<string, { month: string; closures: number; revenue: number }> = {};
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = d.toISOString().substring(0, 7);
      monthlyData[mStr] = { month: mStr, closures: 0, revenue: 0 };
    }

    filteredClosures.forEach(c => {
      if (!c.closingDate) return;
      const mStr = c.closingDate.toISOString().substring(0, 7);
      if (monthlyData[mStr]) {
        monthlyData[mStr].closures += 1;
        monthlyData[mStr].revenue += Number(c.firstInst || 0);
      }
    });

    return {
      totalClosures: thisMonthClosures.length,
      totalRevenue,
      totalPipeline,
      outstanding,
      trendData: Object.values(monthlyData)
    };
  }),

  // ----------------------------------------------------
  // WEEKLY LEADERBOARD (Points Engine)
  // ----------------------------------------------------
  getWeeklyLeaderboard: salesExecQuery
    .input(z.object({
      weekStart: z.string(), // YYYY-MM-DD
      weekEnd: z.string(),   // YYYY-MM-DD
    }))
    .query(async ({ input }) => {
      const db = getDb();
      
      const start = new Date(input.weekStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(input.weekEnd);
      end.setHours(23, 59, 59, 999);

      // 1. Fetch closures for this date range
      const closures = await db.query.salesClosures.findMany({
        where: and(
          eq(salesClosures.isDeleted, false),
          gte(salesClosures.closingDate, start),
          lte(salesClosures.closingDate, end)
        ),
        with: {
          salesExecutive: true,
          asm: true,
          group: true,
        }
      });

      // 2. Fetch active rules
      const rules = await db.query.salesPointsRules.findMany({
        where: eq(salesPointsRules.isActive, true),
        orderBy: (p, { desc }) => [desc(p.priority)]
      });

      // 3. Group by CA and calculate points
      const leaderboard: Record<number, any> = {};

      closures.forEach(c => {
        const caId = c.caId;
        if (!caId) return;

        if (!leaderboard[caId]) {
          leaderboard[caId] = {
            caId,
            caName: c.salesExecutive?.name || "Unknown",
            asmName: c.asm?.name || "N/A",
            groupName: c.group?.name || "Unassigned",
            closures: 0,
            revenue: 0,
            points: 0,
          };
        }

        leaderboard[caId].closures += 1;
        
        const firstInst = Number(c.firstInst || 0);
        const totalFee = Number(c.totalFee || 0);
        leaderboard[caId].revenue += firstInst;

        // Apply rules engine
        let pointsAwarded = 0;
        for (const rule of rules) {
          // Check conditions
          let match = true;
          if (rule.courseMatch && rule.courseMatch !== c.courseName) {
            match = false;
          }
          if (rule.minPaymentPercent) {
            const percentPaid = (firstInst / totalFee) * 100;
            if (percentPaid < Number(rule.minPaymentPercent)) {
              match = false;
            }
          }
          
          if (match) {
            if (rule.fixedPointsAward) {
              pointsAwarded = Number(rule.fixedPointsAward);
            } else if (rule.formula) {
              try {
                // Safe basic evaluation replacing variables
                let evalString = rule.formula
                  .replace(/received_amount/g, firstInst.toString())
                  .replace(/total_fee/g, totalFee.toString());
                
                // Allow simple math
                pointsAwarded = new Function(`return ${evalString}`)();
              } catch (e) {
                console.error("Formula eval failed", e);
              }
            }
            break; // Stop after highest priority matching rule
          }
        }
        
        leaderboard[caId].points += pointsAwarded;
      });

      // Sort by points descending
      return Object.values(leaderboard).sort((a, b) => b.points - a.points);
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

        if (profile?.designation === "Manager") {
          const managedGroups = await db.query.salesGroups.findMany({
            where: eq(salesGroups.managerId, profile.id)
          });
          const groupIds = managedGroups.map(g => g.id);
          if (groupIds.length > 0) {
            filters.push(inArray(salesClosures.groupId, groupIds));
          } else {
            filters.push(eq(salesClosures.id, -1)); // impossible condition to return nothing
          }
        } else if (profile?.isASM && profile?.groupId) {
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
        if (profile?.designation === "Manager") {
          const managedGroups = await db.query.salesGroups.findMany({
            where: eq(salesGroups.managerId, profile.id)
          });
          const groupIds = managedGroups.map(g => g.id);
          if (groupIds.length > 0) {
            filters.push(inArray(salesClosures.groupId, groupIds));
          } else {
            filters.push(eq(salesClosures.id, -1));
          }
        } else if (profile?.isASM && profile?.groupId) {
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
      });

      const allExecs = await db.query.salesExecutives.findMany();
      const allGroups = await db.query.salesGroups.findMany();

      const execMap = new Map(allExecs.map(e => [e.id?.toString(), e.name]));
      const groupMap = new Map(allGroups.map(g => [g.id?.toString(), g.name]));

      // Simple aggregation in memory for now
      const report: Record<string, { totalClosures: number, totalFee: number, totalPoints: number, collected: number }> = {};

      for (const closure of allClosures) {
        let key = "Unknown";
        if (input.groupBy === "ca") {
          const id = closure.caId?.toString();
          key = id ? (execMap.get(id) || `CA #${id}`) : "Unassigned";
        }
        if (input.groupBy === "asm") {
          const id = closure.asmId?.toString();
          key = id ? (execMap.get(id) || `ASM #${id}`) : "Unassigned";
        }
        if (input.groupBy === "group") {
          const id = closure.groupId?.toString();
          key = id ? (groupMap.get(id) || `Group #${id}`) : "Unassigned";
        }

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

  getAsmPerformance: salesExecQuery
    .input(z.object({
      monthStr: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const filters = [eq(salesClosures.isDeleted, false)];

      if (input.monthStr) {
        filters.push(eq(salesClosures.monthStr, input.monthStr));
      }

      // 1. Fetch all closures for the given month
      const allClosures = await db.query.salesClosures.findMany({
        where: and(...filters),
      });

      // 2. Fetch required entities for mapping
      const allExecs = await db.query.salesExecutives.findMany();
      const execMap = new Map(allExecs.map(e => [e.id?.toString(), e.name]));

      const allGroups = await db.query.salesGroups.findMany();

      // 3. Group by GroupId
      // Result structure: map of groupId -> data
      const groupStats = new Map<string, {
        caSet: Set<string>;
        groupName: string;
        managerName: string | null;
        asmName: string;
        firstPayment: number;
        oldBalance: number;
        renewal: number;
        closures: number;
      }>();

      for (const group of allGroups) {
        if (!group.id) continue;
        groupStats.set(group.id.toString(), {
          caSet: new Set<string>(),
          groupName: group.name,
          managerName: group.managerId ? (execMap.get(group.managerId.toString()) || null) : null,
          asmName: group.asmId ? (execMap.get(group.asmId.toString()) || "N/A") : "N/A",
          firstPayment: 0,
          oldBalance: 0,
          renewal: 0,
          closures: 0,
        });
      }

      // Add a fallback group for unassigned closures
      groupStats.set("unassigned", {
        caSet: new Set<string>(),
        groupName: "Unassigned",
        managerName: null,
        asmName: "N/A",
        firstPayment: 0,
        oldBalance: 0,
        renewal: 0,
        closures: 0,
      });

      // 4. Process closures
      for (const closure of allClosures) {
        const groupId = closure.groupId?.toString() || "unassigned";
        let stats = groupStats.get(groupId);
        if (!stats) {
          stats = {
            caSet: new Set<string>(),
            groupName: `Group #${groupId}`,
            managerName: null,
            asmName: "N/A",
            firstPayment: 0,
            oldBalance: 0,
            renewal: 0,
            closures: 0,
          };
          groupStats.set(groupId, stats);
        }

        if (closure.caId) {
          const caName = execMap.get(closure.caId.toString());
          if (caName) stats.caSet.add(caName);
        }

        const collected = parseFloat(closure.firstInst || "0") + parseFloat(closure.secondInst || "0") + parseFloat(closure.thirdInst || "0");
        const type = closure.type || "New Closure";

        if (type === "New Closure") {
          stats.firstPayment += collected;
          stats.closures += 1;
        } else if (type === "Old Balance") {
          stats.oldBalance += collected;
        } else if (type === "Renewal") {
          stats.renewal += collected;
        } else {
          // fallback to firstPayment if unknown
          stats.firstPayment += collected;
        }
      }

      // 5. Convert to array and format caList
      const result = Array.from(groupStats.values())
        .filter(s => s.firstPayment > 0 || s.oldBalance > 0 || s.renewal > 0 || s.closures > 0)
        .map(s => ({
          ...s,
          caList: s.caSet.size > 0 ? Array.from(s.caSet).join(", ") : "—",
        }))
        // Filter out the Set so it's clean for tRPC
        .map(({ caSet, ...rest }) => rest);

      return result;
    }),

  generateDetailedReport: salesExecQuery
    .input(z.object({
      monthStr: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const filters = [eq(salesClosures.isDeleted, false)];

      // if not admin, strict visibility
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
        if (profile?.designation === "Manager") {
          const managedGroups = await db.query.salesGroups.findMany({
            where: eq(salesGroups.managerId, profile.id)
          });
          const groupIds = managedGroups.map(g => g.id);
          if (groupIds.length > 0) {
            filters.push(inArray(salesClosures.groupId, groupIds));
          } else {
            filters.push(eq(salesClosures.id, -1));
          }
        } else if (profile?.isASM && profile?.groupId) {
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
        orderBy: (salesClosures: any, { asc }: any) => [asc(salesClosures.closingDate)],
      });

      const allExecs = await db.query.salesExecutives.findMany();
      const execMap = new Map(allExecs.map((e: any) => [e.id?.toString(), e.name]));

      const allGroups = await db.query.salesGroups.findMany();
      const groupMap = new Map(allGroups.map((g: any) => [g.id?.toString(), g]));

      const detailedReport = allClosures.map((c: any) => {
        const caName = c.caId ? (execMap.get(c.caId.toString()) || "Unknown") : "Unknown";
        const group = c.groupId ? groupMap.get(c.groupId.toString()) : null;
        const teamName = group ? group.name : "Unassigned";
        const asmName = group?.asmId ? (execMap.get(group.asmId.toString()) || "N/A") : "N/A";
        const managerName = group?.managerId ? (execMap.get(group.managerId.toString()) || "N/A") : "N/A";
        
        return {
          id: c.id,
          closingDate: c.closingDate,
          monthStr: c.monthStr || "",
          managerName: managerName,
          asmName: asmName,
          teamName: teamName,
          caCategory: c.caCategory || "",
          caName: caName,
          courseName: c.courseName || "",
          admNo: c.admNo || "",
          closure: 1, // typically 1 per row
          studentName: c.studentName || "",
          totalFee: parseFloat(c.totalFee || "0"),
          firstInst: parseFloat(c.firstInst || "0"),
          secondInst: parseFloat(c.secondInst || "0"),
          thirdInst: parseFloat(c.thirdInst || "0"),
          balance: parseFloat(c.balance || "0"),
          bank: c.bank || "",
          isVerified: c.isVerified,
          verificationStatus: c.verificationStatus || "",
        };
      });

      return detailedReport;
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

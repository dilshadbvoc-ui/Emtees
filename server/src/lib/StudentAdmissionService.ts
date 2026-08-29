import bcrypt from "bcryptjs";
import { eq, and, sql } from "drizzle-orm";
import { users, profiles, studentClassAllocations, modules, batches, qualifications } from "@db/schema";
import { generateNextEnrollmentId } from "./studentIdGenerator";
import { getNextUniqueId } from "./idGenerator";
import { EnrollmentPaymentService } from "./EnrollmentPaymentService";
import { recalculateStudentFees } from "./feeHelper";
import { validatePhoneNumber, getCountryISOFromDialCode, parseFullPhone } from "@contracts/validation";

export interface AdmitStudentInput {
  name: string;
  countryCode: string;
  countryISO?: string;
  phoneNumber: string;
  email?: string | null;
  username: string;
  password?: string | null;
  enrollmentId?: string | null;
  courseId: number;
  batchId?: number | null;
  preferredClassTime?: string | null;
  sessionType?: "one_on_one" | "group" | "both";
  feesTotal?: number | null;
  allocatedOneToOneSessions?: number;
  allocatedGroupSessions?: number;
  paymentType?: "FULL_PAYMENT" | "INSTALLMENT";
  installments?: { installmentNumber: number; amount: number; dueDate?: string | Date | null }[];
  gender?: string | null;
  dob?: string | Date | null;
  address?: string | null;
  postalCode?: string | null;
  qualificationId?: number | null;
  educationalQualification?: string | null;
  parentName?: string | null;
  parentCountryCode?: string | null;
  parentCountryISO?: string | null;
  parentPhoneNumber?: string | null;
  parentPhone?: string | null;
  notes?: string | null;
  salesExecutiveId?: number | null;
  referralCode?: string | null;
  registrationSource?: "direct" | "referral" | "self";
  isBulkImport?: boolean;
  bulkTotalClassAssigned?: number;
  bulkClassesCompleted?: number;
  bulkAssignedTeacherId?: number | null;
}

function parseSafeDate(dateInput: any): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) return d;

  const match = String(dateInput).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const parsed = new Date(year, month, day);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

export class StudentAdmissionService {
  static async admitStudent(
    tx: any,
    input: AdmitStudentInput,
    adminUserId?: number
  ) {
    // 1. Phone number validation
    let countryISO = input.countryISO;
    if (!countryISO) {
      countryISO = getCountryISOFromDialCode(input.countryCode) || "IN";
    }
    const valError = validatePhoneNumber(input.countryCode, input.phoneNumber, countryISO);
    if (valError) {
      throw new Error(valError);
    }
    const fullIntNum = `${input.countryCode}${input.phoneNumber}`.replace(/\s+/g, "");
    
    // Check duplicate phone in database
    const [existingPhone] = await tx
      .select()
      .from(users)
      .where(eq(users.fullInternationalNumber, fullIntNum))
      .limit(1);
    if (existingPhone) {
      throw new Error("Phone already registered");
    }

    // 2. Username uniqueness
    const [existingUsername] = await tx
      .select()
      .from(users)
      .where(eq(users.username, fullIntNum))
      .limit(1);
    if (existingUsername) {
      throw new Error("Username (Phone number) already exists");
    }

    // 3. Enrollment ID uniqueness
    let finalEnrollmentId: string;
    if (input.enrollmentId && input.enrollmentId.trim() !== "") {
      const trimmedId = input.enrollmentId.trim();
      
      const [existingProfile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.enrollmentId, trimmedId))
        .limit(1);
      if (existingProfile) {
        throw new Error(`Enrollment ID "${trimmedId}" is already taken.`);
      }

      const [existingUser] = await tx
        .select()
        .from(users)
        .where(and(eq(users.unionId, trimmedId), eq(users.role, "student")))
        .limit(1);
      if (existingUser) {
        throw new Error(`Enrollment ID "${trimmedId}" conflicts with an existing Student ID.`);
      }
      finalEnrollmentId = trimmedId;
    } else {
      finalEnrollmentId = await generateNextEnrollmentId();
    }

    // 4. Validate course (module)
    const [course] = await tx
      .select()
      .from(modules)
      .where(eq(modules.id, input.courseId))
      .limit(1);
    if (!course || course.status !== "active") {
      throw new Error("Selected course is invalid or inactive.");
    }

    // 5. Validate batch if provided
    let batch: any = null;
    if (input.batchId) {
      const [b] = await tx
        .select()
        .from(batches)
        .where(eq(batches.id, input.batchId))
        .limit(1);
      batch = b;
      if (!batch || batch.status !== "active" || Number(batch.moduleId) !== input.courseId) {
        throw new Error("Selected batch is invalid or does not match course.");
      }
    }

    // 6. Validate parent phone if provided
    let parentCountryCode = input.parentCountryCode || null;
    let parentCountryISO = input.parentCountryISO || null;
    let parentPhoneNumber = input.parentPhoneNumber || null;
    let parentFullInt = "";

    if (parentCountryCode && parentPhoneNumber) {
      if (!parentCountryISO) {
        parentCountryISO = getCountryISOFromDialCode(parentCountryCode) || "IN";
      }
      const parentValError = validatePhoneNumber(parentCountryCode, parentPhoneNumber, parentCountryISO);
      if (parentValError) {
        throw new Error(`Parent phone: ${parentValError}`);
      }
      parentFullInt = `${parentCountryCode}${parentPhoneNumber}`.replace(/\s+/g, "");
    } else if (input.parentPhone) {
      const parsedParent = parseFullPhone(input.parentPhone);
      if (parsedParent) {
        parentCountryCode = parsedParent.countryCode;
        parentCountryISO = parsedParent.countryISO;
        parentPhoneNumber = parsedParent.phoneNumber;
        parentFullInt = `${parentCountryCode}${parentPhoneNumber}`.replace(/\s+/g, "");
      }
    }

    // 7. Hash password
    const hashedPassword = await bcrypt.hash(input.password || "", 10);
    const uniqueId = await getNextUniqueId("student");
    const formattedPhone = `${input.countryCode}${input.phoneNumber}`.replace(/\s+/g, "");

    // 8. Insert User
    const result = await tx.insert(users).values({
      unionId: uniqueId,
      name: input.name,
      phone: formattedPhone,
      countryCode: input.countryCode,
      countryISO,
      phoneNumber: input.phoneNumber,
      fullInternationalNumber: fullIntNum,
      email: input.email || null,
      username: input.username,
      password: hashedPassword,
      rawPassword: input.password || "",
      role: "student",
      status: "active",
      mustChangePassword: false,
      address: input.address || null,
      postalCode: input.postalCode ? input.postalCode.trim() : null,
      qualificationId: input.qualificationId || null,
      educationalQualification: input.educationalQualification || null,
      salesExecutiveId: input.salesExecutiveId || null,
      referralCode: input.referralCode || null,
      registrationSource: input.registrationSource || "direct",
      gender: input.gender || null,
      dateOfBirth: parseSafeDate(input.dob),
    }).returning({ id: users.id });

    const userId = result[0]?.id;

    // 9. Call EnrollmentPaymentService
    const sessionTypeVal = input.sessionType || "group";
    const oneOnOneEnabled = sessionTypeVal === "one_on_one" || sessionTypeVal === "both";
    const groupSessionEnabled = sessionTypeVal === "group" || sessionTypeVal === "both";

    const finalFeesTotal = input.feesTotal !== undefined && input.feesTotal !== null ? input.feesTotal : (course.courseFee ? parseFloat(course.courseFee) : 0);
    const finalPaymentOption = input.paymentType || "FULL_PAYMENT";

    await EnrollmentPaymentService.processEnrollment(tx, {
      studentId: userId,
      batchId: input.batchId || null,
      moduleId: input.courseId,
      totalCourseFee: finalFeesTotal,
      paymentOption: finalPaymentOption === "INSTALLMENT" ? "installment" : "full_payment",
      paidAmount: 0, // Unpaid registration initially
      remainingBalance: finalFeesTotal,
      paymentStatus: "unpaid",
      registrationSource: input.registrationSource || "direct",
      installments: input.installments || undefined,
      extraProfileFields: {
        gender: input.gender || null,
        dob: parseSafeDate(input.dob),
        address: input.address || null,
        postalCode: input.postalCode ? input.postalCode.trim() : null,
        qualificationId: input.qualificationId || null,
        educationalQualification: input.educationalQualification || null,
        parentName: input.parentName || null,
        parentPhone: parentFullInt || null,
        parentCountryCode,
        parentCountryISO,
        parentPhoneNumber,
        parentFullInternationalNumber: parentFullInt || null,
        notes: input.notes || null,
        preferredClassTime: input.preferredClassTime || null,
        sessionType: sessionTypeVal,
        enrollmentStatus: input.batchId ? "enrolled" : "waiting_for_batch",
        oneOnOneEnabled,
        groupSessionEnabled,
        oneOnOne30Allocated: input.allocatedOneToOneSessions || 0,
        group30Allocated: input.allocatedGroupSessions || 0,
      }
    });

    // 10. Sync sessions / class allocation if not enrolled in batch
    // During bulk import, we skip the default allocation UNLESS explicit overrides were provided via spreadsheet
    const hasBulkOverrides = input.isBulkImport && (input.bulkTotalClassAssigned !== undefined || input.bulkClassesCompleted !== undefined || input.bulkAssignedTeacherId !== undefined);
    
    if (!input.batchId && (!input.isBulkImport || hasBulkOverrides)) {
      const isOneToOne = input.sessionType === "one_on_one" || input.sessionType === "both";
      const isGroup = input.sessionType === "group" || input.sessionType === "both";

      const tId = input.bulkAssignedTeacherId || null;
      const t30 = input.bulkTotalClassAssigned !== undefined ? input.bulkTotalClassAssigned : (input.allocatedOneToOneSessions || 0);
      const c30 = input.bulkClassesCompleted || 0;
      const r30 = Math.max(0, t30 - c30);

      const gt30 = input.bulkTotalClassAssigned !== undefined ? input.bulkTotalClassAssigned : (input.allocatedGroupSessions || 0);
      const gc30 = input.bulkClassesCompleted || 0;
      const gr30 = Math.max(0, gt30 - gc30);

      const newAllocationJson = {
        oneToOne: {
          teacherId: isOneToOne ? tId : null,
          sessions30: isOneToOne ? t30 : 0,
          sessions45: 0,
          sessions60: 0,
          completed30: isOneToOne ? c30 : 0,
          completed45: 0,
          completed60: 0,
          remaining30: isOneToOne ? r30 : 0,
          remaining45: 0,
          remaining60: 0
        },
        group: {
          teacherId: isGroup ? tId : null,
          batchId: null,
          sessions30: isGroup ? gt30 : 0,
          sessions45: 0,
          sessions60: 0,
          completed30: isGroup ? gc30 : 0,
          completed45: 0,
          completed60: 0,
          remaining30: isGroup ? gr30 : 0,
          remaining45: 0,
          remaining60: 0
        }
      };
      await tx.insert(studentClassAllocations).values({
        studentId: userId,
        allocation: newAllocationJson,
      }).onConflictDoUpdate({
        target: studentClassAllocations.studentId,
        set: {
          allocation: newAllocationJson,
          updatedAt: new Date(),
        },
      });
    }

    // 11. Recalculate fees
    await recalculateStudentFees(userId);

    return {
      id: userId,
      unionId: uniqueId,
    };
  }
}

import bcrypt from "bcryptjs";
import { getDb } from "../src/queries/connection";
import {
  users,
  profiles,
  modules,
  batches,
  batchEnrollments,
  classes,
  notifications,
} from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database with rich mockup datasets...");

  // Clear existing data to make seed idempotent
  try {
    await db.execute(
      `TRUNCATE TABLE users, profiles, modules, batches, batch_enrollments, classes, notifications, messages, attendance, payments, feedback, violations, learning_materials, one_to_one_sessions, teacher_salaries, flexibility_requests RESTART IDENTITY CASCADE`
    );
    console.log("Database tables truncated.");
  } catch (err) {
    console.log("Truncate warning (tables might not exist yet):", err);
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("password123", 10);

  // 1. Insert Admins
  const [adminUser] = await db
    .insert(users)
    .values({
      unionId: "admin_001",
      name: "Admin User",
      username: "admin",
      password: hashedPassword,
      role: "super_admin",
      status: "active",
    })
    .onConflictDoNothing()
    .returning();

  // 2. Insert Teachers
  const [teacher1, teacher2] = await db
    .insert(users)
    .values([
      {
        unionId: "teacher_001",
        name: "Basil Sir",
        username: "basil",
        password: userPassword,
        role: "teacher",
        status: "active",
      },
      {
        unionId: "teacher_002",
        name: "Sarah Khan",
        username: "sarah",
        password: userPassword,
        role: "teacher",
        status: "active",
      },
    ])
    .onConflictDoNothing()
    .returning();

  // 3. Insert Students
  const studentData = await db
    .insert(users)
    .values([
      {
        unionId: "student_001",
        name: "Dilshad Ashraf",
        username: "dilshad",
        password: userPassword,
        role: "student",
        status: "active",
      },
      {
        unionId: "student_002",
        name: "Rahul Dev",
        username: "rahul",
        password: userPassword,
        role: "student",
        status: "active",
      },
      {
        unionId: "student_003",
        name: "Anjali R",
        username: "anjali",
        password: userPassword,
        role: "student",
        status: "active",
      },
    ])
    .onConflictDoNothing()
    .returning();

  // 4. Insert Modules (Courses)
  const [course1, course2] = await db
    .insert(modules)
    .values([
      {
        name: "Spoken English Pro",
        description: "Comprehensive English communication mastery program",
        fees: "15000.00",
        maxStudents: 50,
        minStudents: 5,
        status: "active",
      },
      {
        name: "IELTS Exam Prep",
        description: "Intensive training for IELTS Academic and General tests",
        fees: "20000.00",
        maxStudents: 30,
        minStudents: 3,
        status: "active",
      },
    ])
    .returning();

  // 5. Insert Batches
  const [batch1, batch2] = await db
    .insert(batches)
    .values([
      {
        moduleId: course1.id,
        name: "Morning Batch A",
        timeSlot: "09:00 AM - 10:30 AM",
        teacherId: teacher1.id,
        maxStudents: 25,
        status: "active",
        isCommunityGroup: false,
      },
      {
        moduleId: course2.id,
        name: "Evening IELTS Fastrack",
        timeSlot: "06:00 PM - 07:30 PM",
        teacherId: teacher2.id,
        maxStudents: 20,
        status: "active",
        isCommunityGroup: false,
      },
    ])
    .returning();

  // 6. Insert Student Profiles
  if (studentData.length >= 3) {
    await db.insert(profiles).values([
      {
        userId: studentData[0].id,
        studentId: "STU001",
        enrollmentNumber: "ENR-2026-001",
        course: "Spoken English Pro",
        batch: "Morning Batch A",
        batchTime: "09:00 AM - 10:30 AM",
        feesTotal: "15000.00",
        feesPaid: "10000.00",
        discount: "0.00",
        feesBalance: "5000.00",
        paymentStatus: "partial",
      },
      {
        userId: studentData[1].id,
        studentId: "STU002",
        enrollmentNumber: "ENR-2026-002",
        course: "IELTS Exam Prep",
        batch: "Evening IELTS Fastrack",
        batchTime: "06:00 PM - 07:30 PM",
        feesTotal: "20000.00",
        feesPaid: "20000.00",
        discount: "0.00",
        feesBalance: "0.00",
        paymentStatus: "paid",
      },
      {
        userId: studentData[2].id,
        studentId: "STU003",
        enrollmentNumber: "ENR-2026-003",
        course: "Spoken English Pro",
        batch: "Morning Batch A",
        batchTime: "09:00 AM - 10:30 AM",
        feesTotal: "15000.00",
        feesPaid: "0.00",
        discount: "1000.00",
        feesBalance: "14000.00",
        paymentStatus: "unpaid",
      },
    ]);

    // 7. Batch Enrollments
    await db.insert(batchEnrollments).values([
      {
        batchId: batch1.id,
        studentId: studentData[0].id,
        status: "active",
      },
      {
        batchId: batch2.id,
        studentId: studentData[1].id,
        status: "active",
      },
      {
        batchId: batch1.id,
        studentId: studentData[2].id,
        status: "active",
      },
    ]);

    // 8. Live Classes
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.insert(classes).values([
      {
        batchId: batch1.id,
        moduleId: course1.id,
        teacherId: teacher1.id,
        title: "Introduction to Public Speaking",
        description: "Learn body language and pacing strategies.",
        classType: "group",
        status: "scheduled",
        scheduledAt: tomorrow,
      },
      {
        batchId: batch2.id,
        moduleId: course2.id,
        teacherId: teacher2.id,
        title: "IELTS Writing Task 2 Strategy",
        description: "Essay structures for Band 8+ scores.",
        classType: "group",
        status: "scheduled",
        scheduledAt: tomorrow,
      },
    ]);

    // 9. Notifications
    await db.insert(notifications).values([
      {
        userId: studentData[0].id,
        title: "Batch Assigned",
        message: "You have been successfully added to Morning Batch A.",
        type: "general",
        isRead: false,
      },
      {
        userId: studentData[1].id,
        title: "IELTS Class Scheduled",
        message: "Your upcoming class 'IELTS Writing Task 2 Strategy' is scheduled.",
        type: "general",
        isRead: false,
      },
    ]);
  }

  console.log("Seeding complete! Logins:");
  console.log(" - Admin: admin / admin123");
  console.log(" - Teacher: basil / password123");
  console.log(" - Student: dilshad / password123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});

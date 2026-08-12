"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
exports.getDurationCategory = getDurationCategory;
exports.fetchFullStudentReportData = fetchFullStudentReportData;
exports.calculateIncentiveForTeacherMonth = calculateIncentiveForTeacherMonth;
exports.recalculateSalaryInternal = recalculateSalaryInternal;
exports.fetchFullTeacherReportData = fetchFullTeacherReportData;
var zod_1 = require("zod");
var server_1 = require("@trpc/server");
var drizzle_orm_1 = require("drizzle-orm");
var middleware_1 = require("../middleware");
var connection_1 = require("../queries/connection");
var schema_1 = require("@db/schema");
var notificationEngine_1 = require("../lib/notificationEngine");
var sessionHelper_1 = require("../lib/sessionHelper");
var feeHelper_1 = require("../lib/feeHelper");
function getDurationCategory(duration) {
    if (duration >= 50 && duration <= 70)
        return 60;
    if (duration >= 35 && duration <= 55)
        return 45;
    if (duration >= 20 && duration <= 40)
        return 30;
    return null;
}
function fetchFullStudentReportData(db, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var studentUser, studentProfile, enrollments, teacherIds, teachersList, teachersMap, enrollmentsWithTeachers, groupClasses, oneToOnes, teachersSummaryMap, teachersSummary, paymentsList, lastPayment, lastPaymentDate, attendanceRecords, totalClassesConducted, classesAttended, classesMissed, attendancePercentage, pkg, oneToOneAllocated30, oneToOneAllocated45, oneToOneAllocated60, completedOneToOnes, oToOneAttended30, oToOneAttended45, oToOneAttended60, oneToOneTracking, groupAllocated30, groupAllocated45, groupAllocated60, completedGroupClassesAttended, groupAttended30, groupAttended45, groupAttended60, groupTracking, totalOneToOneAllocated, totalOneToOneAttended, totalOneToOneRemaining, totalGroupAllocated, totalGroupAttended, totalGroupRemaining, sessionUtilization, recentAttendance;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0: return [4 /*yield*/, db.query.users.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema_1.users.id, userId),
                    })];
                case 1:
                    studentUser = _h.sent();
                    if (!studentUser) {
                        throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Student user record not found" });
                    }
                    return [4 /*yield*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, userId),
                        })];
                case 2:
                    studentProfile = _h.sent();
                    return [4 /*yield*/, db
                            .select({
                            id: schema_1.batchEnrollments.id,
                            batchId: schema_1.batchEnrollments.batchId,
                            joinedAt: schema_1.batchEnrollments.joinedAt,
                            leftAt: schema_1.batchEnrollments.leftAt,
                            status: schema_1.batchEnrollments.status,
                            paymentType: schema_1.batchEnrollments.paymentType,
                            assignedTeachers: schema_1.batchEnrollments.assignedTeachers,
                            batchName: schema_1.batches.name,
                            batchStartDate: schema_1.batches.startDate,
                            batchDuration: schema_1.batches.duration,
                            batchCourseFee: schema_1.batches.courseFee,
                            moduleName: schema_1.modules.name,
                            teacherId: schema_1.batches.teacherId,
                        })
                            .from(schema_1.batchEnrollments)
                            .innerJoin(schema_1.batches, (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.batchId, schema_1.batches.id))
                            .innerJoin(schema_1.modules, (0, drizzle_orm_1.eq)(schema_1.batches.moduleId, schema_1.modules.id))
                            .where((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, userId))];
                case 3:
                    enrollments = _h.sent();
                    teacherIds = new Set();
                    enrollments.forEach(function (e) {
                        if (e.teacherId)
                            teacherIds.add(e.teacherId);
                        if (e.assignedTeachers && Array.isArray(e.assignedTeachers)) {
                            e.assignedTeachers.forEach(function (tId) {
                                var parsedId = Number(tId);
                                if (!isNaN(parsedId))
                                    teacherIds.add(parsedId);
                            });
                        }
                    });
                    teachersList = [];
                    if (!(teacherIds.size > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, db
                            .select({ id: schema_1.users.id, name: schema_1.users.name })
                            .from(schema_1.users)
                            .where((0, drizzle_orm_1.inArray)(schema_1.users.id, Array.from(teacherIds)))];
                case 4:
                    teachersList = _h.sent();
                    _h.label = 5;
                case 5:
                    teachersMap = new Map(teachersList.map(function (t) { return [t.id, t.name]; }));
                    enrollmentsWithTeachers = enrollments.map(function (e) {
                        var primaryTeacherName = e.teacherId ? teachersMap.get(e.teacherId) || "Unknown" : "None";
                        var assignedTeachersNames = Array.isArray(e.assignedTeachers)
                            ? e.assignedTeachers.map(function (tId) { return ({
                                id: Number(tId),
                                name: teachersMap.get(Number(tId)) || "Unknown",
                            }); })
                            : [];
                        return __assign(__assign({}, e), { primaryTeacherName: primaryTeacherName, assignedTeachersNames: assignedTeachersNames });
                    });
                    return [4 /*yield*/, db
                            .select({
                            teacherId: schema_1.classes.teacherId,
                            teacherName: schema_1.users.name,
                            count: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["count(*)"], ["count(*)"])))
                        })
                            .from(schema_1.attendance)
                            .innerJoin(schema_1.classes, (0, drizzle_orm_1.eq)(schema_1.attendance.classId, schema_1.classes.id))
                            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.classes.teacherId, schema_1.users.id))
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.studentId, userId), (0, drizzle_orm_1.eq)(schema_1.classes.status, "completed")))
                            .groupBy(schema_1.classes.teacherId, schema_1.users.name)];
                case 6:
                    groupClasses = _h.sent();
                    return [4 /*yield*/, db
                            .select({
                            teacherId: schema_1.oneToOneSessions.teacherId,
                            teacherName: schema_1.users.name,
                            count: (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["count(*)"], ["count(*)"])))
                        })
                            .from(schema_1.oneToOneSessions)
                            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.teacherId, schema_1.users.id))
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.studentId, userId), (0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.status, "completed")))
                            .groupBy(schema_1.oneToOneSessions.teacherId, schema_1.users.name)];
                case 7:
                    oneToOnes = _h.sent();
                    teachersSummaryMap = new Map();
                    groupClasses.forEach(function (gc) {
                        teachersSummaryMap.set(gc.teacherId, {
                            teacherId: gc.teacherId,
                            teacherName: gc.teacherName,
                            groupCount: Number(gc.count),
                            oneToOneCount: 0,
                        });
                    });
                    oneToOnes.forEach(function (oto) {
                        var existing = teachersSummaryMap.get(oto.teacherId);
                        if (existing) {
                            existing.oneToOneCount = Number(oto.count);
                        }
                        else {
                            teachersSummaryMap.set(oto.teacherId, {
                                teacherId: oto.teacherId,
                                teacherName: oto.teacherName,
                                groupCount: 0,
                                oneToOneCount: Number(oto.count),
                            });
                        }
                    });
                    teachersSummary = Array.from(teachersSummaryMap.values()).map(function (t) { return (__assign(__assign({}, t), { totalCount: t.groupCount + t.oneToOneCount })); });
                    return [4 /*yield*/, db.query.payments.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.payments.studentId, userId),
                            orderBy: (0, drizzle_orm_1.desc)(schema_1.payments.createdAt),
                        })];
                case 8:
                    paymentsList = _h.sent();
                    lastPayment = paymentsList.find(function (p) { return p.status === "paid"; });
                    lastPaymentDate = (lastPayment === null || lastPayment === void 0 ? void 0 : lastPayment.paidDate) || (lastPayment === null || lastPayment === void 0 ? void 0 : lastPayment.paidAt) || null;
                    return [4 /*yield*/, db.query.attendance.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.attendance.studentId, userId),
                        })];
                case 9:
                    attendanceRecords = _h.sent();
                    totalClassesConducted = attendanceRecords.length;
                    classesAttended = attendanceRecords.filter(function (a) { return a.status === "present" || a.status === "late"; }).length;
                    classesMissed = attendanceRecords.filter(function (a) { return a.status === "absent"; }).length;
                    attendancePercentage = totalClassesConducted > 0 ? Math.round((classesAttended / totalClassesConducted) * 100) : 0;
                    pkg = (studentProfile === null || studentProfile === void 0 ? void 0 : studentProfile.packageConfig) || {
                        oneToOne: { total: 0, min30: 0, min45: 0, min60: 0 },
                        group: { total: 0, min30: 0, min45: 0, min60: 0 },
                    };
                    oneToOneAllocated30 = Number(((_a = pkg.oneToOne) === null || _a === void 0 ? void 0 : _a.min30) || 0);
                    oneToOneAllocated45 = Number(((_b = pkg.oneToOne) === null || _b === void 0 ? void 0 : _b.min45) || 0);
                    oneToOneAllocated60 = Number(((_c = pkg.oneToOne) === null || _c === void 0 ? void 0 : _c.min60) || 0);
                    return [4 /*yield*/, db.query.oneToOneSessions.findMany({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.studentId, userId), (0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.status, "completed")),
                        })];
                case 10:
                    completedOneToOnes = _h.sent();
                    oToOneAttended30 = completedOneToOnes.filter(function (s) { return s.sessionLength === 30; }).length;
                    oToOneAttended45 = completedOneToOnes.filter(function (s) { return s.sessionLength === 45; }).length;
                    oToOneAttended60 = completedOneToOnes.filter(function (s) { return s.sessionLength === 60; }).length;
                    oneToOneTracking = {
                        min30: {
                            allocated: oneToOneAllocated30,
                            attended: oToOneAttended30,
                            remaining: Math.max(0, oneToOneAllocated30 - oToOneAttended30),
                        },
                        min45: {
                            allocated: oneToOneAllocated45,
                            attended: oToOneAttended45,
                            remaining: Math.max(0, oneToOneAllocated45 - oToOneAttended45),
                        },
                        min60: {
                            allocated: oneToOneAllocated60,
                            attended: oToOneAttended60,
                            remaining: Math.max(0, oneToOneAllocated60 - oToOneAttended60),
                        },
                    };
                    groupAllocated30 = Number(((_d = pkg.group) === null || _d === void 0 ? void 0 : _d.min30) || 0);
                    groupAllocated45 = Number(((_e = pkg.group) === null || _e === void 0 ? void 0 : _e.min45) || 0);
                    groupAllocated60 = Number(((_f = pkg.group) === null || _f === void 0 ? void 0 : _f.min60) || 0);
                    return [4 /*yield*/, db
                            .select({
                            duration: schema_1.classes.duration,
                        })
                            .from(schema_1.attendance)
                            .innerJoin(schema_1.classes, (0, drizzle_orm_1.eq)(schema_1.attendance.classId, schema_1.classes.id))
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.studentId, userId), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.attendance.status, "present"), (0, drizzle_orm_1.eq)(schema_1.attendance.status, "late")), (0, drizzle_orm_1.eq)(schema_1.classes.classType, "group"), (0, drizzle_orm_1.eq)(schema_1.classes.status, "completed")))];
                case 11:
                    completedGroupClassesAttended = _h.sent();
                    groupAttended30 = completedGroupClassesAttended.filter(function (c) { return c.duration === 30; }).length;
                    groupAttended45 = completedGroupClassesAttended.filter(function (c) { return c.duration === 45; }).length;
                    groupAttended60 = completedGroupClassesAttended.filter(function (c) { return c.duration === 60; }).length;
                    groupTracking = {
                        min30: {
                            allocated: groupAllocated30,
                            attended: groupAttended30,
                            remaining: Math.max(0, groupAllocated30 - groupAttended30),
                        },
                        min45: {
                            allocated: groupAllocated45,
                            attended: groupAttended45,
                            remaining: Math.max(0, groupAllocated45 - groupAttended45),
                        },
                        min60: {
                            allocated: groupAllocated60,
                            attended: groupAttended60,
                            remaining: Math.max(0, groupAllocated60 - groupAttended60),
                        },
                    };
                    totalOneToOneAllocated = oneToOneAllocated30 + oneToOneAllocated45 + oneToOneAllocated60;
                    totalOneToOneAttended = oToOneAttended30 + oToOneAttended45 + oToOneAttended60;
                    totalOneToOneRemaining = Math.max(0, totalOneToOneAllocated - totalOneToOneAttended);
                    totalGroupAllocated = groupAllocated30 + groupAllocated45 + groupAllocated60;
                    totalGroupAttended = groupAttended30 + groupAttended45 + groupAttended60;
                    totalGroupRemaining = Math.max(0, totalGroupAllocated - totalGroupAttended);
                    sessionUtilization = {
                        oneToOne: {
                            allocated: totalOneToOneAllocated,
                            attended: totalOneToOneAttended,
                            remaining: totalOneToOneRemaining,
                            percentageUsed: totalOneToOneAllocated > 0 ? Math.round((totalOneToOneAttended / totalOneToOneAllocated) * 100) : 0,
                        },
                        group: {
                            allocated: totalGroupAllocated,
                            attended: totalGroupAttended,
                            remaining: totalGroupRemaining,
                            percentageUsed: totalGroupAllocated > 0 ? Math.round((totalGroupAttended / totalGroupAllocated) * 100) : 0,
                        },
                    };
                    return [4 /*yield*/, db
                            .select({
                            id: schema_1.attendance.id,
                            recordedAt: schema_1.attendance.recordedAt,
                            status: schema_1.attendance.status,
                            classTitle: schema_1.classes.title,
                            classType: schema_1.classes.classType,
                            duration: schema_1.classes.duration,
                            teacherName: schema_1.users.name,
                            scheduledAt: schema_1.classes.scheduledAt,
                        })
                            .from(schema_1.attendance)
                            .innerJoin(schema_1.classes, (0, drizzle_orm_1.eq)(schema_1.attendance.classId, schema_1.classes.id))
                            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.classes.teacherId, schema_1.users.id))
                            .where((0, drizzle_orm_1.eq)(schema_1.attendance.studentId, userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.classes.scheduledAt))
                            .limit(20)];
                case 12:
                    recentAttendance = _h.sent();
                    return [2 /*return*/, {
                            student: {
                                id: studentUser.id,
                                name: studentUser.name,
                                unionId: studentUser.unionId,
                                email: studentUser.email,
                                phone: studentUser.phone,
                                status: studentUser.status,
                                createdAt: studentUser.createdAt,
                            },
                            profile: studentProfile,
                            enrollments: enrollmentsWithTeachers,
                            teachersSummary: teachersSummary,
                            payments: paymentsList,
                            lastPaymentDate: lastPaymentDate,
                            attendance: {
                                total: totalClassesConducted,
                                present: classesAttended,
                                missed: classesMissed,
                                percentage: attendancePercentage,
                            },
                            oneToOneTracking: oneToOneTracking,
                            groupTracking: groupTracking,
                            sessionUtilization: sessionUtilization,
                            recentAttendance: recentAttendance,
                            paymentType: ((_g = enrollments[0]) === null || _g === void 0 ? void 0 : _g.paymentType) || "FULL_PAYMENT",
                        }];
            }
        });
    });
}
function calculateIncentiveForTeacherMonth(db, teacherId, month) {
    return __awaiter(this, void 0, void 0, function () {
        var groupClassesList, oneToOneSessionsList, totalClassesConducted, scheduledGroupDays, scheduledOtoDays, uniqueDays, workingDays, absentOtoDays, absentDays, presentDays, teacherAttendancePct, totalStudentCount, presentStudentCount, _i, groupClassesList_1, cls, attendanceRecords, studentAttendancePct, feedbackRecords, avgFeedbackRating, score;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.query.classes.findMany({
                        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classes.teacherId, teacherId), (0, drizzle_orm_1.eq)(schema_1.classes.status, "completed"), (0, drizzle_orm_1.eq)(schema_1.classes.classType, "group"), (0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["TO_CHAR(", ", 'YYYY-MM') = ", ""], ["TO_CHAR(", ", 'YYYY-MM') = ", ""])), schema_1.classes.scheduledAt, month)),
                    })];
                case 1:
                    groupClassesList = _a.sent();
                    return [4 /*yield*/, db.query.oneToOneSessions.findMany({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.teacherId, teacherId), (0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.status, "completed"), (0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["TO_CHAR(", ", 'YYYY-MM') = ", ""], ["TO_CHAR(", ", 'YYYY-MM') = ", ""])), schema_1.oneToOneSessions.scheduledAt, month)),
                        })];
                case 2:
                    oneToOneSessionsList = _a.sent();
                    totalClassesConducted = groupClassesList.length + oneToOneSessionsList.length;
                    if (totalClassesConducted === 0)
                        return [2 /*return*/, 0];
                    return [4 /*yield*/, db.select({
                            day: (0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["TO_CHAR(", ", 'YYYY-MM-DD')"], ["TO_CHAR(", ", 'YYYY-MM-DD')"])), schema_1.classes.scheduledAt)
                        })
                            .from(schema_1.classes)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classes.teacherId, teacherId), (0, drizzle_orm_1.eq)(schema_1.classes.status, "completed"), (0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["TO_CHAR(", ", 'YYYY-MM') = ", ""], ["TO_CHAR(", ", 'YYYY-MM') = ", ""])), schema_1.classes.scheduledAt, month)))];
                case 3:
                    scheduledGroupDays = _a.sent();
                    return [4 /*yield*/, db.select({
                            day: (0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["TO_CHAR(", ", 'YYYY-MM-DD')"], ["TO_CHAR(", ", 'YYYY-MM-DD')"])), schema_1.oneToOneSessions.scheduledAt)
                        })
                            .from(schema_1.oneToOneSessions)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.teacherId, teacherId), (0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.status, "completed"), (0, drizzle_orm_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["TO_CHAR(", ", 'YYYY-MM') = ", ""], ["TO_CHAR(", ", 'YYYY-MM') = ", ""])), schema_1.oneToOneSessions.scheduledAt, month)))];
                case 4:
                    scheduledOtoDays = _a.sent();
                    uniqueDays = new Set();
                    scheduledGroupDays.forEach(function (d) { if (d.day)
                        uniqueDays.add(d.day); });
                    scheduledOtoDays.forEach(function (d) { if (d.day)
                        uniqueDays.add(d.day); });
                    workingDays = uniqueDays.size;
                    return [4 /*yield*/, db.select({
                            day: (0, drizzle_orm_1.sql)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["TO_CHAR(", ", 'YYYY-MM-DD')"], ["TO_CHAR(", ", 'YYYY-MM-DD')"])), schema_1.oneToOneSessions.scheduledAt)
                        })
                            .from(schema_1.oneToOneSessions)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.teacherId, teacherId), (0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.teacherAttendance, "absent"), (0, drizzle_orm_1.sql)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["TO_CHAR(", ", 'YYYY-MM') = ", ""], ["TO_CHAR(", ", 'YYYY-MM') = ", ""])), schema_1.oneToOneSessions.scheduledAt, month)))];
                case 5:
                    absentOtoDays = _a.sent();
                    absentDays = new Set(absentOtoDays.map(function (d) { return d.day; })).size;
                    presentDays = Math.max(0, workingDays - absentDays);
                    teacherAttendancePct = workingDays > 0 ? (presentDays / workingDays) * 100 : 100;
                    totalStudentCount = 0;
                    presentStudentCount = 0;
                    _i = 0, groupClassesList_1 = groupClassesList;
                    _a.label = 6;
                case 6:
                    if (!(_i < groupClassesList_1.length)) return [3 /*break*/, 9];
                    cls = groupClassesList_1[_i];
                    return [4 /*yield*/, db.query.attendance.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.attendance.classId, cls.id),
                        })];
                case 7:
                    attendanceRecords = _a.sent();
                    totalStudentCount += attendanceRecords.length;
                    presentStudentCount += attendanceRecords.filter(function (r) { return r.status === "present" || r.status === "late"; }).length;
                    _a.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 6];
                case 9:
                    studentAttendancePct = totalStudentCount > 0 ? (presentStudentCount / totalStudentCount) * 100 : 100;
                    return [4 /*yield*/, db.query.feedback.findMany({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feedback.teacherId, teacherId), (0, drizzle_orm_1.sql)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["TO_CHAR(", ", 'YYYY-MM') = ", ""], ["TO_CHAR(", ", 'YYYY-MM') = ", ""])), schema_1.feedback.createdAt, month)),
                        })];
                case 10:
                    feedbackRecords = _a.sent();
                    avgFeedbackRating = feedbackRecords.length > 0
                        ? feedbackRecords.reduce(function (sum, f) { return sum + f.rating; }, 0) / feedbackRecords.length
                        : 5.0;
                    score = (teacherAttendancePct * 0.4) + (studentAttendancePct * 0.3) + ((avgFeedbackRating / 5) * 100 * 0.3);
                    // 6. Incentives
                    return [2 /*return*/, score >= 90 ? 2000 : score >= 80 ? 1000 : 0];
            }
        });
    });
}
function recalculateSalaryInternal(db_1, teacherId_1, month_1) {
    return __awaiter(this, arguments, void 0, function (db, teacherId, month, forceInsert) {
        var groupClassesList, oneToOneSessionsList, newClassSessionsList, group30Count, group45Count, group60Count, _i, groupClassesList_2, cls, cat, oneToOne30Count, oneToOne45Count, oneToOne60Count, _a, oneToOneSessionsList_1, sess, cat, _b, newClassSessionsList_1, sess, cat, config, basicSalary, group30MinRate, group45MinRate, group60MinRate, oneToOne30MinRate, oneToOne45MinRate, oneToOne60MinRate, sessionEarnings, netSalary, existing, incentive, totalAmount, salaryValues, inserted;
        if (forceInsert === void 0) { forceInsert = false; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, db.select({
                        duration: schema_1.classes.duration
                    })
                        .from(schema_1.classes)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classes.teacherId, teacherId), (0, drizzle_orm_1.eq)(schema_1.classes.status, "completed"), (0, drizzle_orm_1.eq)(schema_1.classes.classType, "group"), (0, drizzle_orm_1.sql)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["TO_CHAR(", ", 'YYYY-MM') = ", ""], ["TO_CHAR(", ", 'YYYY-MM') = ", ""])), schema_1.classes.scheduledAt, month)))];
                case 1:
                    groupClassesList = _c.sent();
                    return [4 /*yield*/, db.select({
                            sessionLength: schema_1.oneToOneSessions.sessionLength
                        })
                            .from(schema_1.oneToOneSessions)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.teacherId, teacherId), (0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.status, "completed"), (0, drizzle_orm_1.sql)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["TO_CHAR(", ", 'YYYY-MM') = ", ""], ["TO_CHAR(", ", 'YYYY-MM') = ", ""])), schema_1.oneToOneSessions.scheduledAt, month)))];
                case 2:
                    oneToOneSessionsList = _c.sent();
                    newClassSessionsList = [];
                    group30Count = 0;
                    group45Count = 0;
                    group60Count = 0;
                    for (_i = 0, groupClassesList_2 = groupClassesList; _i < groupClassesList_2.length; _i++) {
                        cls = groupClassesList_2[_i];
                        cat = getDurationCategory(cls.duration || 0);
                        if (cat === 30)
                            group30Count++;
                        else if (cat === 45)
                            group45Count++;
                        else if (cat === 60)
                            group60Count++;
                    }
                    oneToOne30Count = 0;
                    oneToOne45Count = 0;
                    oneToOne60Count = 0;
                    for (_a = 0, oneToOneSessionsList_1 = oneToOneSessionsList; _a < oneToOneSessionsList_1.length; _a++) {
                        sess = oneToOneSessionsList_1[_a];
                        cat = getDurationCategory(sess.sessionLength || 0);
                        if (cat === 30)
                            oneToOne30Count++;
                        else if (cat === 45)
                            oneToOne45Count++;
                        else if (cat === 60)
                            oneToOne60Count++;
                    }
                    for (_b = 0, newClassSessionsList_1 = newClassSessionsList; _b < newClassSessionsList_1.length; _b++) {
                        sess = newClassSessionsList_1[_b];
                        cat = getDurationCategory(sess.duration || 0);
                        if (sess.sessionType === "group") {
                            if (cat === 30)
                                group30Count++;
                            else if (cat === 45)
                                group45Count++;
                            else if (cat === 60)
                                group60Count++;
                        }
                        else {
                            if (cat === 30)
                                oneToOne30Count++;
                            else if (cat === 45)
                                oneToOne45Count++;
                            else if (cat === 60)
                                oneToOne60Count++;
                        }
                    }
                    return [4 /*yield*/, db.query.teacherSalaryConfigs.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.teacherSalaryConfigs.teacherId, teacherId),
                        })];
                case 3:
                    config = _c.sent();
                    basicSalary = config ? parseFloat(config.basicSalary) : 0;
                    group30MinRate = config ? parseFloat(config.group30MinRate) : 0;
                    group45MinRate = config ? parseFloat(config.group45MinRate) : 0;
                    group60MinRate = config ? parseFloat(config.group60MinRate) : 0;
                    oneToOne30MinRate = config ? parseFloat(config.oneToOne30MinRate) : 0;
                    oneToOne45MinRate = config ? parseFloat(config.oneToOne45MinRate) : 0;
                    oneToOne60MinRate = config ? parseFloat(config.oneToOne60MinRate) : 0;
                    sessionEarnings = (group30Count * group30MinRate) +
                        (group45Count * group45MinRate) +
                        (group60Count * group60MinRate) +
                        (oneToOne30Count * oneToOne30MinRate) +
                        (oneToOne45Count * oneToOne45MinRate) +
                        (oneToOne60Count * oneToOne60MinRate);
                    netSalary = basicSalary + sessionEarnings;
                    return [4 /*yield*/, db.query.teacherSalaries.findFirst({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.teacherSalaries.teacherId, teacherId), (0, drizzle_orm_1.eq)(schema_1.teacherSalaries.month, month))
                        })];
                case 4:
                    existing = _c.sent();
                    return [4 /*yield*/, calculateIncentiveForTeacherMonth(db, teacherId, month)];
                case 5:
                    incentive = _c.sent();
                    totalAmount = netSalary + incentive;
                    salaryValues = {
                        teacherId: teacherId,
                        month: month,
                        basicSalary: String(basicSalary),
                        groupClassesCount: group30Count + group45Count + group60Count,
                        oneToOneCount: oneToOne30Count + oneToOne45Count + oneToOne60Count,
                        group30MinCount: group30Count,
                        group45MinCount: group45Count,
                        group60MinCount: group60Count,
                        oneToOne30MinCount: oneToOne30Count,
                        oneToOne45MinCount: oneToOne45Count,
                        oneToOne60MinCount: oneToOne60Count,
                        group30MinRate: String(group30MinRate),
                        group45MinRate: String(group45MinRate),
                        group60MinRate: String(group60MinRate),
                        oneToOne30MinRate: String(oneToOne30MinRate),
                        oneToOne45MinRate: String(oneToOne45MinRate),
                        oneToOne60MinRate: String(oneToOne60MinRate),
                        netSalary: String(netSalary),
                        totalAmount: String(totalAmount),
                    };
                    if (!existing) return [3 /*break*/, 7];
                    return [4 /*yield*/, db.update(schema_1.teacherSalaries)
                            .set(salaryValues)
                            .where((0, drizzle_orm_1.eq)(schema_1.teacherSalaries.id, existing.id))];
                case 6:
                    _c.sent();
                    return [2 /*return*/, db.query.teacherSalaries.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.teacherSalaries.id, existing.id) })];
                case 7:
                    if (!forceInsert) return [3 /*break*/, 9];
                    return [4 /*yield*/, db.insert(schema_1.teacherSalaries).values(salaryValues).returning({ id: schema_1.teacherSalaries.id })];
                case 8:
                    inserted = _c.sent();
                    return [2 /*return*/, db.query.teacherSalaries.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.teacherSalaries.id, inserted[0].id) })];
                case 9: return [2 /*return*/, null];
            }
        });
    });
}
function fetchFullTeacherReportData(db, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var teacherUser, teacherProfile, teacherBatches, batchesDetails, modulesMap, _i, teacherBatches_1, batch, enrollments, modulesDetails, _a, modulesDetails_1, mod, compClasses, remClasses, completed, remaining, otoClasses, groupClasses, otoStats, _b, otoClasses_1, session, len, cat, completed, cancelled, remaining, groupStats, _c, groupClasses_1, cls, len, cat, completed, cancelled, remaining, otoTotalAssigned, otoTotalCompleted, otoTotalRemaining, groupTotalAssigned, groupTotalCompleted, groupTotalRemaining, totalClassesAssigned, totalClassesConducted, totalClassesRemaining, totalMinutes, _d, otoClasses_2, session, _e, groupClasses_2, cls, totalTeachingHours, activeDays, _f, otoClasses_3, session, _g, groupClasses_3, cls, workingDays, absentDaysSet, _h, otoClasses_4, session, absentDays, presentDays, leaveDays, teacherAttendancePercentage, salaryConfig, salaryHistoryList, basicSalary, configGroup30Rate, configGroup45Rate, configGroup60Rate, configOto30Rate, configOto45Rate, configOto60Rate, currentMonthStr, group30CurrentMonth, group45CurrentMonth, group60CurrentMonth, _j, groupClasses_4, cls, cat, oto30CurrentMonth, oto45CurrentMonth, oto60CurrentMonth, _k, otoClasses_5, session, cat, otoEarnings, groupEarnings, currentNetSalary, teacherCompletedClassesIds, avgStudentAttendancePct, studentAttendanceRecords, totalStudentAtt, presentStudentAtt, feedbackList, avgFeedbackRating, performanceScore, enrolledStudentIds, _l, teacherBatches_2, batch, enrollments;
        var _m, _o, _p, _q;
        return __generator(this, function (_r) {
            switch (_r.label) {
                case 0: return [4 /*yield*/, db.query.users.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema_1.users.id, userId),
                    })];
                case 1:
                    teacherUser = _r.sent();
                    if (!teacherUser) {
                        throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Teacher not found" });
                    }
                    return [4 /*yield*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, userId),
                        })];
                case 2:
                    teacherProfile = _r.sent();
                    return [4 /*yield*/, db.query.batches.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.batches.teacherId, userId),
                            with: { module: true },
                        })];
                case 3:
                    teacherBatches = _r.sent();
                    batchesDetails = [];
                    modulesMap = new Map();
                    _i = 0, teacherBatches_1 = teacherBatches;
                    _r.label = 4;
                case 4:
                    if (!(_i < teacherBatches_1.length)) return [3 /*break*/, 7];
                    batch = teacherBatches_1[_i];
                    return [4 /*yield*/, db.query.batchEnrollments.findMany({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.batchId, batch.id), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.status, "active")),
                        })];
                case 5:
                    enrollments = _r.sent();
                    batchesDetails.push({
                        id: batch.id,
                        name: batch.name,
                        code: "B".concat(String(batch.id).padStart(3, "0")),
                        courseName: ((_m = batch.module) === null || _m === void 0 ? void 0 : _m.name) || "N/A",
                        moduleName: ((_o = batch.module) === null || _o === void 0 ? void 0 : _o.name) || "N/A",
                        studentsCount: enrollments.length,
                        startDate: batch.startDate,
                        duration: batch.duration || "N/A",
                        status: batch.status || "active",
                    });
                    if (batch.module) {
                        if (!modulesMap.has(batch.module.id)) {
                            modulesMap.set(batch.module.id, {
                                id: batch.module.id,
                                name: batch.module.name,
                                duration: batch.module.duration || "N/A",
                                totalClassesPlanned: 0,
                                completedClasses: 0,
                                remainingClasses: 0,
                                batchIds: [],
                            });
                        }
                        modulesMap.get(batch.module.id).batchIds.push(batch.id);
                    }
                    _r.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    modulesDetails = Array.from(modulesMap.values());
                    _a = 0, modulesDetails_1 = modulesDetails;
                    _r.label = 8;
                case 8:
                    if (!(_a < modulesDetails_1.length)) return [3 /*break*/, 12];
                    mod = modulesDetails_1[_a];
                    if (!(mod.batchIds.length > 0)) return [3 /*break*/, 11];
                    return [4 /*yield*/, db.select({ count: (0, drizzle_orm_1.sql)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["count(*)"], ["count(*)"]))) }).from(schema_1.classes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.classes.batchId, mod.batchIds), (0, drizzle_orm_1.eq)(schema_1.classes.status, "completed")))];
                case 9:
                    compClasses = _r.sent();
                    return [4 /*yield*/, db.select({ count: (0, drizzle_orm_1.sql)(templateObject_15 || (templateObject_15 = __makeTemplateObject(["count(*)"], ["count(*)"]))) }).from(schema_1.classes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.classes.batchId, mod.batchIds), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.classes.status, "scheduled"), (0, drizzle_orm_1.eq)(schema_1.classes.status, "ongoing"))))];
                case 10:
                    remClasses = _r.sent();
                    completed = Number(((_p = compClasses[0]) === null || _p === void 0 ? void 0 : _p.count) || 0);
                    remaining = Number(((_q = remClasses[0]) === null || _q === void 0 ? void 0 : _q.count) || 0);
                    mod.completedClasses = completed;
                    mod.remainingClasses = remaining;
                    mod.totalClassesPlanned = completed + remaining;
                    _r.label = 11;
                case 11:
                    _a++;
                    return [3 /*break*/, 8];
                case 12: return [4 /*yield*/, db.query.oneToOneSessions.findMany({
                        where: (0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.teacherId, userId),
                    })];
                case 13:
                    otoClasses = _r.sent();
                    return [4 /*yield*/, db.query.classes.findMany({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classes.teacherId, userId), (0, drizzle_orm_1.eq)(schema_1.classes.classType, "group")),
                        })];
                case 14:
                    groupClasses = _r.sent();
                    otoStats = {
                        min30: { total: 0, completed: 0, remaining: 0 },
                        min45: { total: 0, completed: 0, remaining: 0 },
                        min60: { total: 0, completed: 0, remaining: 0 },
                    };
                    for (_b = 0, otoClasses_1 = otoClasses; _b < otoClasses_1.length; _b++) {
                        session = otoClasses_1[_b];
                        len = session.sessionLength || 30;
                        cat = getDurationCategory(len);
                        completed = session.status === "completed";
                        cancelled = session.status === "cancelled";
                        remaining = !completed && !cancelled;
                        if (!cancelled) {
                            if (cat === 30) {
                                otoStats.min30.total++;
                                if (completed)
                                    otoStats.min30.completed++;
                                if (remaining)
                                    otoStats.min30.remaining++;
                            }
                            else if (cat === 45) {
                                otoStats.min45.total++;
                                if (completed)
                                    otoStats.min45.completed++;
                                if (remaining)
                                    otoStats.min45.remaining++;
                            }
                            else if (cat === 60) {
                                otoStats.min60.total++;
                                if (completed)
                                    otoStats.min60.completed++;
                                if (remaining)
                                    otoStats.min60.remaining++;
                            }
                        }
                    }
                    groupStats = {
                        min30: { total: 0, completed: 0, remaining: 0 },
                        min45: { total: 0, completed: 0, remaining: 0 },
                        min60: { total: 0, completed: 0, remaining: 0 },
                    };
                    for (_c = 0, groupClasses_1 = groupClasses; _c < groupClasses_1.length; _c++) {
                        cls = groupClasses_1[_c];
                        len = cls.duration || 30;
                        cat = getDurationCategory(len);
                        completed = cls.status === "completed";
                        cancelled = cls.status === "cancelled";
                        remaining = !completed && !cancelled;
                        if (!cancelled) {
                            if (cat === 30) {
                                groupStats.min30.total++;
                                if (completed)
                                    groupStats.min30.completed++;
                                if (remaining)
                                    groupStats.min30.remaining++;
                            }
                            else if (cat === 45) {
                                groupStats.min45.total++;
                                if (completed)
                                    groupStats.min45.completed++;
                                if (remaining)
                                    groupStats.min45.remaining++;
                            }
                            else if (cat === 60) {
                                groupStats.min60.total++;
                                if (completed)
                                    groupStats.min60.completed++;
                                if (remaining)
                                    groupStats.min60.remaining++;
                            }
                        }
                    }
                    otoTotalAssigned = otoStats.min30.total + otoStats.min45.total + otoStats.min60.total;
                    otoTotalCompleted = otoStats.min30.completed + otoStats.min45.completed + otoStats.min60.completed;
                    otoTotalRemaining = otoStats.min30.remaining + otoStats.min45.remaining + otoStats.min60.remaining;
                    groupTotalAssigned = groupStats.min30.total + groupStats.min45.total + groupStats.min60.total;
                    groupTotalCompleted = groupStats.min30.completed + groupStats.min45.completed + groupStats.min60.completed;
                    groupTotalRemaining = groupStats.min30.remaining + groupStats.min45.remaining + groupStats.min60.remaining;
                    totalClassesAssigned = otoTotalAssigned + groupTotalAssigned;
                    totalClassesConducted = otoTotalCompleted + groupTotalCompleted;
                    totalClassesRemaining = otoTotalRemaining + groupTotalRemaining;
                    totalMinutes = 0;
                    for (_d = 0, otoClasses_2 = otoClasses; _d < otoClasses_2.length; _d++) {
                        session = otoClasses_2[_d];
                        if (session.status === "completed")
                            totalMinutes += session.sessionLength || 30;
                    }
                    for (_e = 0, groupClasses_2 = groupClasses; _e < groupClasses_2.length; _e++) {
                        cls = groupClasses_2[_e];
                        if (cls.status === "completed")
                            totalMinutes += cls.duration || 30;
                    }
                    totalTeachingHours = Math.round((totalMinutes / 60) * 10) / 10;
                    activeDays = new Set();
                    for (_f = 0, otoClasses_3 = otoClasses; _f < otoClasses_3.length; _f++) {
                        session = otoClasses_3[_f];
                        if (session.status !== "cancelled") {
                            activeDays.add(new Date(session.scheduledAt).toISOString().split("T")[0]);
                        }
                    }
                    for (_g = 0, groupClasses_3 = groupClasses; _g < groupClasses_3.length; _g++) {
                        cls = groupClasses_3[_g];
                        if (cls.status !== "cancelled") {
                            activeDays.add(new Date(cls.scheduledAt).toISOString().split("T")[0]);
                        }
                    }
                    workingDays = activeDays.size;
                    absentDaysSet = new Set();
                    for (_h = 0, otoClasses_4 = otoClasses; _h < otoClasses_4.length; _h++) {
                        session = otoClasses_4[_h];
                        if (session.teacherAttendance === "absent") {
                            absentDaysSet.add(new Date(session.scheduledAt).toISOString().split("T")[0]);
                        }
                    }
                    absentDays = absentDaysSet.size;
                    presentDays = Math.max(0, workingDays - absentDays);
                    leaveDays = teacherUser.status === "on_hold" ? 5 : 0;
                    teacherAttendancePercentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 100;
                    return [4 /*yield*/, db.query.teacherSalaryConfigs.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.teacherSalaryConfigs.teacherId, userId),
                        })];
                case 15:
                    salaryConfig = _r.sent();
                    return [4 /*yield*/, db.query.teacherSalaries.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.teacherSalaries.teacherId, userId),
                            orderBy: (0, drizzle_orm_1.desc)(schema_1.teacherSalaries.month),
                        })];
                case 16:
                    salaryHistoryList = _r.sent();
                    basicSalary = salaryConfig ? parseFloat(salaryConfig.basicSalary) : 0;
                    configGroup30Rate = salaryConfig ? parseFloat(salaryConfig.group30MinRate) : 0;
                    configGroup45Rate = salaryConfig ? parseFloat(salaryConfig.group45MinRate) : 0;
                    configGroup60Rate = salaryConfig ? parseFloat(salaryConfig.group60MinRate) : 0;
                    configOto30Rate = salaryConfig ? parseFloat(salaryConfig.oneToOne30MinRate) : 0;
                    configOto45Rate = salaryConfig ? parseFloat(salaryConfig.oneToOne45MinRate) : 0;
                    configOto60Rate = salaryConfig ? parseFloat(salaryConfig.oneToOne60MinRate) : 0;
                    currentMonthStr = new Date().toISOString().slice(0, 7);
                    group30CurrentMonth = 0;
                    group45CurrentMonth = 0;
                    group60CurrentMonth = 0;
                    for (_j = 0, groupClasses_4 = groupClasses; _j < groupClasses_4.length; _j++) {
                        cls = groupClasses_4[_j];
                        if (cls.status === "completed" && new Date(cls.scheduledAt).toISOString().slice(0, 7) === currentMonthStr) {
                            cat = getDurationCategory(cls.duration || 0);
                            if (cat === 30)
                                group30CurrentMonth++;
                            else if (cat === 45)
                                group45CurrentMonth++;
                            else if (cat === 60)
                                group60CurrentMonth++;
                        }
                    }
                    oto30CurrentMonth = 0;
                    oto45CurrentMonth = 0;
                    oto60CurrentMonth = 0;
                    for (_k = 0, otoClasses_5 = otoClasses; _k < otoClasses_5.length; _k++) {
                        session = otoClasses_5[_k];
                        if (session.status === "completed" && new Date(session.scheduledAt).toISOString().slice(0, 7) === currentMonthStr) {
                            cat = getDurationCategory(session.sessionLength || 0);
                            if (cat === 30)
                                oto30CurrentMonth++;
                            else if (cat === 45)
                                oto45CurrentMonth++;
                            else if (cat === 60)
                                oto60CurrentMonth++;
                        }
                    }
                    otoEarnings = (oto30CurrentMonth * configOto30Rate) + (oto45CurrentMonth * configOto45Rate) + (oto60CurrentMonth * configOto60Rate);
                    groupEarnings = (group30CurrentMonth * configGroup30Rate) + (group45CurrentMonth * configGroup45Rate) + (group60CurrentMonth * configGroup60Rate);
                    currentNetSalary = basicSalary + otoEarnings + groupEarnings;
                    teacherCompletedClassesIds = groupClasses
                        .filter(function (cls) { return cls.status === "completed"; })
                        .map(function (cls) { return cls.id; });
                    avgStudentAttendancePct = 100;
                    if (!(teacherCompletedClassesIds.length > 0)) return [3 /*break*/, 18];
                    return [4 /*yield*/, db
                            .select({
                            status: schema_1.attendance.status,
                        })
                            .from(schema_1.attendance)
                            .where((0, drizzle_orm_1.inArray)(schema_1.attendance.classId, teacherCompletedClassesIds))];
                case 17:
                    studentAttendanceRecords = _r.sent();
                    if (studentAttendanceRecords.length > 0) {
                        totalStudentAtt = studentAttendanceRecords.length;
                        presentStudentAtt = studentAttendanceRecords.filter(function (r) { return r.status === "present" || r.status === "late"; }).length;
                        avgStudentAttendancePct = Math.round((presentStudentAtt / totalStudentAtt) * 100);
                    }
                    _r.label = 18;
                case 18: return [4 /*yield*/, db.query.feedback.findMany({
                        where: (0, drizzle_orm_1.eq)(schema_1.feedback.teacherId, userId),
                    })];
                case 19:
                    feedbackList = _r.sent();
                    avgFeedbackRating = feedbackList.length > 0
                        ? Math.round((feedbackList.reduce(function (sum, f) { return sum + f.rating; }, 0) / feedbackList.length) * 10) / 10
                        : 5.0;
                    performanceScore = Math.round((teacherAttendancePercentage * 0.4) +
                        (avgStudentAttendancePct * 0.3) +
                        ((avgFeedbackRating / 5) * 100 * 0.3));
                    enrolledStudentIds = new Set();
                    _l = 0, teacherBatches_2 = teacherBatches;
                    _r.label = 20;
                case 20:
                    if (!(_l < teacherBatches_2.length)) return [3 /*break*/, 23];
                    batch = teacherBatches_2[_l];
                    return [4 /*yield*/, db.query.batchEnrollments.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.batchId, batch.id),
                        })];
                case 21:
                    enrollments = _r.sent();
                    enrollments.forEach(function (e) { return enrolledStudentIds.add(e.studentId); });
                    _r.label = 22;
                case 22:
                    _l++;
                    return [3 /*break*/, 20];
                case 23: return [2 /*return*/, {
                        teacher: {
                            id: teacherUser.id,
                            unionId: teacherUser.unionId,
                            name: teacherUser.name,
                            email: teacherUser.email,
                            phone: teacherUser.phone,
                            status: teacherUser.status,
                            avatar: teacherUser.avatar,
                            createdAt: teacherUser.createdAt,
                        },
                        profile: teacherProfile ? {
                            gender: teacherProfile.gender,
                            dob: teacherProfile.dob,
                            educationalQualification: teacherProfile.educationalQualification,
                            specialization: teacherProfile.specialization || "",
                            experience: teacherProfile.experience || "",
                            address: teacherProfile.address || "",
                            photo: teacherProfile.photo,
                        } : null,
                        batches: batchesDetails,
                        modules: modulesDetails,
                        teachingSummary: {
                            totalClassesAssigned: totalClassesAssigned,
                            totalClassesConducted: totalClassesConducted,
                            totalClassesRemaining: totalClassesRemaining,
                            totalTeachingHours: totalTeachingHours,
                            teacherAttendancePercentage: teacherAttendancePercentage,
                        },
                        oneToOneStats: {
                            min30: otoStats.min30,
                            min45: otoStats.min45,
                            min60: otoStats.min60,
                            total: {
                                assigned: otoTotalAssigned,
                                completed: otoTotalCompleted,
                                remaining: otoTotalRemaining,
                                earnings: otoEarnings,
                            }
                        },
                        groupStats: {
                            min30: groupStats.min30,
                            min45: groupStats.min45,
                            min60: groupStats.min60,
                            total: {
                                assigned: groupTotalAssigned,
                                completed: groupTotalCompleted,
                                remaining: groupTotalRemaining,
                                earnings: groupEarnings,
                            }
                        },
                        attendanceReport: {
                            workingDays: workingDays,
                            presentDays: presentDays,
                            absentDays: absentDays,
                            leaveDays: leaveDays,
                            attendancePercentage: teacherAttendancePercentage,
                        },
                        salaryReport: {
                            config: {
                                basicSalary: basicSalary,
                                group30MinRate: configGroup30Rate,
                                group45MinRate: configGroup45Rate,
                                group60MinRate: configGroup60Rate,
                                oneToOne30MinRate: configOto30Rate,
                                oneToOne45MinRate: configOto45Rate,
                                oneToOne60MinRate: configOto60Rate,
                            },
                            currentMonthBreakdown: {
                                month: currentMonthStr,
                                oneToOne: {
                                    min30: { count: oto30CurrentMonth, earnings: oto30CurrentMonth * configOto30Rate },
                                    min45: { count: oto45CurrentMonth, earnings: oto45CurrentMonth * configOto45Rate },
                                    min60: { count: oto60CurrentMonth, earnings: oto60CurrentMonth * configOto60Rate },
                                    totalEarnings: otoEarnings,
                                },
                                group: {
                                    min30: { count: group30CurrentMonth, earnings: group30CurrentMonth * configGroup30Rate },
                                    min45: { count: group45CurrentMonth, earnings: group45CurrentMonth * configGroup45Rate },
                                    min60: { count: group60CurrentMonth, earnings: group60CurrentMonth * configGroup60Rate },
                                    totalEarnings: groupEarnings,
                                },
                                summary: {
                                    basicSalary: basicSalary,
                                    oneToOneEarnings: otoEarnings,
                                    groupEarnings: groupEarnings,
                                    netSalary: currentNetSalary,
                                }
                            },
                            history: salaryHistoryList.map(function (s) { return ({
                                id: s.id,
                                month: s.month,
                                classesConducted: (s.groupClassesCount || 0) + (s.oneToOneCount || 0),
                                salaryEarned: parseFloat(s.totalAmount || "0"),
                                paymentStatus: s.status || "pending",
                                paymentDate: s.paymentDate,
                            }); }),
                        },
                        salaries: salaryHistoryList.map(function (s) { return ({
                            id: s.id,
                            month: s.month,
                            classesConducted: (s.groupClassesCount || 0) + (s.oneToOneCount || 0),
                            salaryEarned: parseFloat(s.totalAmount || "0"),
                            paymentStatus: s.status || "pending",
                            paymentDate: s.paymentDate,
                        }); }),
                        performanceSummary: {
                            totalStudentsTaught: enrolledStudentIds.size,
                            totalBatchesManaged: teacherBatches.length,
                            totalClassesConducted: totalClassesConducted,
                            averageStudentAttendance: avgStudentAttendancePct,
                            studentFeedbackRating: avgFeedbackRating,
                            teacherPerformanceScore: performanceScore,
                        }
                    }];
            }
        });
    });
}
exports.adminRouter = (0, middleware_1.createRouter)({
    // ─── Payments / Fees ────────────────────────────────────────────────────────
    listPayments: middleware_1.adminQuery
        .input(zod_1.z.object({
        studentId: zod_1.z.number().optional(),
        status: zod_1.z.string().optional(),
        batchId: zod_1.z.number().optional(),
        dueDate: zod_1.z.date().optional(),
    }).optional())
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, filters, startOfDay, endOfDay, where;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            if (ctx.user.role === "academic_head") {
                throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
            }
            db = (0, connection_1.getDb)();
            filters = [];
            if (input === null || input === void 0 ? void 0 : input.studentId)
                filters.push((0, drizzle_orm_1.eq)(schema_1.payments.studentId, input.studentId));
            if (input === null || input === void 0 ? void 0 : input.status)
                filters.push((0, drizzle_orm_1.eq)(schema_1.payments.status, input.status));
            if (input === null || input === void 0 ? void 0 : input.batchId)
                filters.push((0, drizzle_orm_1.eq)(schema_1.payments.batchId, input.batchId));
            if (input === null || input === void 0 ? void 0 : input.dueDate) {
                startOfDay = new Date(input.dueDate);
                startOfDay.setHours(0, 0, 0, 0);
                endOfDay = new Date(input.dueDate);
                endOfDay.setHours(23, 59, 59, 999);
                filters.push((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.payments.dueDate, startOfDay), (0, drizzle_orm_1.lte)(schema_1.payments.dueDate, endOfDay)));
            }
            where = filters.length > 0 ? drizzle_orm_1.and.apply(void 0, filters) : undefined;
            return [2 /*return*/, db.query.payments.findMany({
                    where: where,
                    orderBy: (0, drizzle_orm_1.desc)(schema_1.payments.createdAt),
                    with: {
                        student: {
                            with: {
                                profile: true,
                                enrollments: true,
                                feeConfig: true,
                            },
                        },
                        batch: true,
                    },
                })];
        });
    }); }),
    createPayment: middleware_1.adminQuery
        .input(zod_1.z.object({
        studentId: zod_1.z.number(),
        amount: zod_1.z.number(),
        type: zod_1.z.string().default("tuition"),
        dueDate: zod_1.z.date().optional(),
        notes: zod_1.z.string().optional(),
        batchId: zod_1.z.number().optional(),
        installmentNumber: zod_1.z.number().optional(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, result;
        var _c;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (ctx.user.role === "academic_head") {
                        throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.insert(schema_1.payments).values({
                            studentId: input.studentId,
                            amount: String(input.amount),
                            type: input.type,
                            dueDate: input.dueDate,
                            notes: input.notes,
                            batchId: input.batchId,
                            installmentNumber: input.installmentNumber,
                            status: "unpaid",
                        }).returning({ id: schema_1.payments.id })];
                case 1:
                    result = _d.sent();
                    return [2 /*return*/, db.query.payments.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.payments.id, (_c = result[0]) === null || _c === void 0 ? void 0 : _c.id) })];
            }
        });
    }); }),
    // Task 9.4 — reactivate enrollments and update profile fees on payment
    recordPayment: middleware_1.adminQuery
        .input(zod_1.z.object({
        paymentId: zod_1.z.number(),
        amount: zod_1.z.number(),
        transactionId: zod_1.z.string().optional(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, payment, inactiveOrRestrictedEnrollments, _i, inactiveOrRestrictedEnrollments_1, enrollment, profile, feesPaid, feesTotal, feesBalance, nextPaymentStatus, paymentDueDate, activeEnrollment, nextUnpaid, timeline;
        var _c, _d;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (ctx.user.role === "academic_head") {
                        throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.payments.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.payments.id, input.paymentId),
                        })];
                case 1:
                    payment = _e.sent();
                    if (!payment)
                        throw new Error("Payment not found");
                    return [4 /*yield*/, db.update(schema_1.payments)
                            .set({
                            status: "paid",
                            paidAt: new Date(),
                            paidDate: new Date(),
                            transactionId: input.transactionId,
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.payments.id, input.paymentId))];
                case 2:
                    _e.sent();
                    return [4 /*yield*/, db.query.batchEnrollments.findMany({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, payment.studentId), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.status, "inactive"), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.status, "restricted"))),
                        })];
                case 3:
                    inactiveOrRestrictedEnrollments = _e.sent();
                    _i = 0, inactiveOrRestrictedEnrollments_1 = inactiveOrRestrictedEnrollments;
                    _e.label = 4;
                case 4:
                    if (!(_i < inactiveOrRestrictedEnrollments_1.length)) return [3 /*break*/, 7];
                    enrollment = inactiveOrRestrictedEnrollments_1[_i];
                    return [4 /*yield*/, db.update(schema_1.batchEnrollments)
                            .set({ status: "active" })
                            .where((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.id, enrollment.id))];
                case 5:
                    _e.sent();
                    _e.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: 
                // Reactivate user status
                return [4 /*yield*/, db.update(schema_1.users)
                        .set({ status: "active" })
                        .where((0, drizzle_orm_1.eq)(schema_1.users.id, payment.studentId))];
                case 8:
                    // Reactivate user status
                    _e.sent();
                    return [4 /*yield*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, payment.studentId),
                        })];
                case 9:
                    profile = _e.sent();
                    if (!profile) return [3 /*break*/, 15];
                    feesPaid = parseFloat((_c = profile.feesPaid) !== null && _c !== void 0 ? _c : "0") + input.amount;
                    feesTotal = parseFloat((_d = profile.feesTotal) !== null && _d !== void 0 ? _d : "0");
                    feesBalance = Math.max(0, feesTotal - feesPaid);
                    nextPaymentStatus = feesBalance <= 0 ? "paid" : "partial";
                    paymentDueDate = null;
                    return [4 /*yield*/, db.query.batchEnrollments.findFirst({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, payment.studentId), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.status, "active")),
                        })];
                case 10:
                    activeEnrollment = _e.sent();
                    if (!((activeEnrollment === null || activeEnrollment === void 0 ? void 0 : activeEnrollment.paymentType) === "INSTALLMENT" && feesBalance > 0)) return [3 /*break*/, 12];
                    return [4 /*yield*/, db.query.payments.findFirst({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.payments.studentId, payment.studentId), (0, drizzle_orm_1.eq)(schema_1.payments.status, "unpaid"), (0, drizzle_orm_1.isNotNull)(schema_1.payments.installmentNumber)),
                            orderBy: (0, drizzle_orm_1.asc)(schema_1.payments.installmentNumber),
                        })];
                case 11:
                    nextUnpaid = _e.sent();
                    if (nextUnpaid === null || nextUnpaid === void 0 ? void 0 : nextUnpaid.dueDate) {
                        paymentDueDate = nextUnpaid.dueDate;
                    }
                    _e.label = 12;
                case 12:
                    timeline = Array.isArray(profile.activityTimeline) ? profile.activityTimeline : [];
                    timeline.push({
                        type: "payment_recorded",
                        amount: input.amount,
                        feesPaid: feesPaid,
                        feesBalance: feesBalance,
                        timestamp: new Date().toISOString(),
                    });
                    return [4 /*yield*/, db.update(schema_1.profiles)
                            .set({
                            feesPaid: String(feesPaid),
                            feesBalance: String(feesBalance),
                            paymentStatus: nextPaymentStatus,
                            paymentDueDate: paymentDueDate,
                            activityTimeline: timeline,
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, payment.studentId))];
                case 13:
                    _e.sent();
                    return [4 /*yield*/, (0, feeHelper_1.recalculateStudentFees)(payment.studentId)];
                case 14:
                    _e.sent();
                    _e.label = 15;
                case 15: return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    listOverdueStudents: middleware_1.adminQuery.query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, overdue;
        var ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (ctx.user.role === "academic_head") {
                        throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.profiles.findMany({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.gt)(schema_1.profiles.feesBalance, "0"), (0, drizzle_orm_1.lt)(schema_1.profiles.paymentDueDate, new Date())),
                            with: {
                                user: true,
                            },
                        })];
                case 1:
                    overdue = _c.sent();
                    return [2 /*return*/, overdue.map(function (o) { return ({
                            id: o.id,
                            userId: o.userId,
                            user: o.user,
                            course: o.course,
                            batch: o.batch,
                            feesTotal: o.feesTotal,
                            feesPaid: o.feesPaid,
                            feesBalance: o.feesBalance,
                            paymentStatus: o.paymentStatus,
                            paymentDueDate: o.paymentDueDate,
                            gracePeriodDays: o.gracePeriodDays,
                            enrollmentId: o.enrollmentId,
                        }); })];
            }
        });
    }); }),
    adjustStudentFees: middleware_1.adminQuery
        .input(zod_1.z.object({
        studentId: zod_1.z.number(),
        feesTotal: zod_1.z.number().optional(),
        discount: zod_1.z.number().optional(),
        discountType: zod_1.z.enum(["flat", "percentage"]).optional(),
        paymentMode: zod_1.z.enum(["FULL_PAYMENT", "INSTALLMENT"]).optional(),
        feesPaid: zod_1.z.number().optional(),
        minInitialPayment: zod_1.z.number().optional(),
        paymentDueDate: zod_1.z.date().optional(),
        gracePeriodDays: zod_1.z.number().optional(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, profile, feeConfig, currentGross, currentDiscount, currentDiscountType, calculatedFinal, paymentMode, minInitialPayment, paymentDueDate, gracePeriodDays, timeline, updatedProfile;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (ctx.user.role === "academic_head") {
                        throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, input.studentId),
                        })];
                case 1:
                    profile = _c.sent();
                    if (!profile)
                        throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Student profile not found" });
                    return [4 /*yield*/, db.query.studentFeeConfigurations.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.studentFeeConfigurations.studentId, input.studentId),
                        })];
                case 2:
                    feeConfig = _c.sent();
                    currentGross = input.feesTotal !== undefined ? input.feesTotal : parseFloat((feeConfig === null || feeConfig === void 0 ? void 0 : feeConfig.totalCourseFee) || profile.totalCourseFee || "0");
                    currentDiscount = input.discount !== undefined ? input.discount : parseFloat((feeConfig === null || feeConfig === void 0 ? void 0 : feeConfig.discount) || "0");
                    currentDiscountType = input.discountType || (feeConfig === null || feeConfig === void 0 ? void 0 : feeConfig.discountType) || "flat";
                    calculatedFinal = currentGross;
                    if (currentDiscountType === "percentage") {
                        calculatedFinal = currentGross - (currentGross * currentDiscount / 100);
                    }
                    else {
                        calculatedFinal = Math.max(0, currentGross - currentDiscount);
                    }
                    paymentMode = input.paymentMode || (feeConfig === null || feeConfig === void 0 ? void 0 : feeConfig.paymentMode) || "FULL_PAYMENT";
                    if (!feeConfig) return [3 /*break*/, 4];
                    return [4 /*yield*/, db.update(schema_1.studentFeeConfigurations)
                            .set({
                            totalCourseFee: String(currentGross),
                            discount: String(currentDiscount),
                            discountType: currentDiscountType,
                            finalFee: String(calculatedFinal),
                            paymentMode: paymentMode,
                            updatedAt: new Date(),
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.studentFeeConfigurations.id, feeConfig.id))];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, db.insert(schema_1.studentFeeConfigurations).values({
                        studentId: input.studentId,
                        totalCourseFee: String(currentGross),
                        discount: String(currentDiscount),
                        discountType: currentDiscountType,
                        finalFee: String(calculatedFinal),
                        paymentMode: paymentMode,
                    })];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6:
                    minInitialPayment = input.minInitialPayment !== undefined ? String(input.minInitialPayment) : profile.minInitialPayment;
                    paymentDueDate = input.paymentDueDate !== undefined ? input.paymentDueDate : profile.paymentDueDate;
                    gracePeriodDays = input.gracePeriodDays !== undefined ? input.gracePeriodDays : profile.gracePeriodDays;
                    timeline = Array.isArray(profile.activityTimeline) ? profile.activityTimeline : [];
                    timeline.push({
                        type: "fee_adjustment",
                        feesTotal: String(calculatedFinal),
                        minInitialPayment: minInitialPayment,
                        paymentDueDate: paymentDueDate ? new Date(paymentDueDate).toISOString() : null,
                        gracePeriodDays: gracePeriodDays,
                        timestamp: new Date().toISOString(),
                    });
                    return [4 /*yield*/, db.update(schema_1.profiles)
                            .set({
                            minInitialPayment: minInitialPayment,
                            paymentDueDate: paymentDueDate,
                            gracePeriodDays: gracePeriodDays,
                            activityTimeline: timeline,
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, input.studentId))];
                case 7:
                    _c.sent();
                    return [4 /*yield*/, (0, feeHelper_1.recalculateStudentFees)(input.studentId)];
                case 8:
                    _c.sent();
                    return [4 /*yield*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, input.studentId),
                        })];
                case 9:
                    updatedProfile = _c.sent();
                    if (!(parseFloat((updatedProfile === null || updatedProfile === void 0 ? void 0 : updatedProfile.feesBalance) || "0") <= 0)) return [3 /*break*/, 12];
                    return [4 /*yield*/, db.update(schema_1.batchEnrollments)
                            .set({ status: "active" })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, input.studentId), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.status, "restricted")))];
                case 10:
                    _c.sent();
                    return [4 /*yield*/, db.update(schema_1.users)
                            .set({ status: "active" })
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, input.studentId))];
                case 11:
                    _c.sent();
                    _c.label = 12;
                case 12: return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    updateStudentFeeRules: middleware_1.adminQuery
        .input(zod_1.z.object({
        studentId: zod_1.z.number(),
        paymentType: zod_1.z.enum(["FULL_PAYMENT", "INSTALLMENT"]),
        totalCourseFee: zod_1.z.number(),
        initialPayment: zod_1.z.number().optional().nullable(),
        installments: zod_1.z.array(zod_1.z.object({
            installmentNumber: zod_1.z.number(),
            amount: zod_1.z.number(),
            dueDate: zod_1.z.date().optional().nullable(),
            status: zod_1.z.enum(["paid", "unpaid"]),
        })),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, studentId, profile, activeEnrollment, existingPaidPayments, sumPaid, inputPaid, inputUnpaid, sortedDbPaid, sortedInputPaid, i, sumInputPaid, sumInputUnpaid, sumAllInstallments, dueDates, uniqueDueDates, installmentNumbers, finalProfile;
        var _c;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (ctx.user.role === "academic_head") {
                        throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
                    }
                    db = (0, connection_1.getDb)();
                    studentId = input.studentId;
                    return [4 /*yield*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, studentId),
                        })];
                case 1:
                    profile = _d.sent();
                    if (!profile)
                        throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Student profile not found" });
                    return [4 /*yield*/, db.query.batchEnrollments.findFirst({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.status, "active")),
                        })];
                case 2:
                    activeEnrollment = _d.sent();
                    return [4 /*yield*/, db.query.payments.findMany({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.payments.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.payments.status, "paid"), (0, drizzle_orm_1.eq)(schema_1.payments.type, "tuition")),
                        })];
                case 3:
                    existingPaidPayments = _d.sent();
                    sumPaid = existingPaidPayments.reduce(function (sum, p) { return sum + parseFloat(p.amount); }, 0);
                    // Validate: Total fee cannot be less than already paid amount
                    if (input.totalCourseFee < sumPaid) {
                        throw new server_1.TRPCError({
                            code: "BAD_REQUEST",
                            message: "Total Course Fee (\u20B9".concat(input.totalCourseFee, ") cannot be less than the amount already paid (\u20B9").concat(sumPaid, ")."),
                        });
                    }
                    inputPaid = input.installments.filter(function (inst) { return inst.status === "paid"; });
                    inputUnpaid = input.installments.filter(function (inst) { return inst.status === "unpaid"; });
                    // Validate: Paid installments count cannot differ from database
                    if (existingPaidPayments.length !== inputPaid.length) {
                        throw new server_1.TRPCError({
                            code: "BAD_REQUEST",
                            message: "Paid installments count mismatch. Expected ".concat(existingPaidPayments.length, " paid installments, but input has ").concat(inputPaid.length, "."),
                        });
                    }
                    sortedDbPaid = __spreadArray([], existingPaidPayments, true).sort(function (a, b) { return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); });
                    sortedInputPaid = __spreadArray([], inputPaid, true).sort(function (a, b) { return a.installmentNumber - b.installmentNumber; });
                    for (i = 0; i < sortedDbPaid.length; i++) {
                        if (Math.abs(parseFloat(sortedDbPaid[i].amount) - sortedInputPaid[i].amount) > 0.01) {
                            throw new server_1.TRPCError({
                                code: "BAD_REQUEST",
                                message: "Amount for paid installment #".concat(sortedInputPaid[i].installmentNumber, " (\u20B9").concat(sortedInputPaid[i].amount, ") does not match paid record in database (\u20B9").concat(parseFloat(sortedDbPaid[i].amount), ")."),
                            });
                        }
                    }
                    sumInputPaid = inputPaid.reduce(function (sum, inst) { return sum + inst.amount; }, 0);
                    sumInputUnpaid = inputUnpaid.reduce(function (sum, inst) { return sum + inst.amount; }, 0);
                    sumAllInstallments = sumInputPaid + sumInputUnpaid;
                    if (Math.abs(sumAllInstallments - input.totalCourseFee) > 0.01) {
                        throw new server_1.TRPCError({
                            code: "BAD_REQUEST",
                            message: "Sum of all installments (\u20B9".concat(sumAllInstallments, ") must equal the total course fee (\u20B9").concat(input.totalCourseFee, ")."),
                        });
                    }
                    // Validate: Initial payment cannot exceed total fee
                    if (input.initialPayment && input.initialPayment > input.totalCourseFee) {
                        throw new server_1.TRPCError({
                            code: "BAD_REQUEST",
                            message: "Initial payment cannot exceed the total course fee.",
                        });
                    }
                    dueDates = input.installments
                        .map(function (inst) { return inst.dueDate; })
                        .filter(function (date) { return !!date; });
                    uniqueDueDates = new Set(dueDates.map(function (d) { return new Date(d).toDateString(); }));
                    if (uniqueDueDates.size !== dueDates.length) {
                        throw new server_1.TRPCError({
                            code: "BAD_REQUEST",
                            message: "Installment due dates cannot overlap.",
                        });
                    }
                    installmentNumbers = input.installments.map(function (inst) { return inst.installmentNumber; });
                    if (new Set(installmentNumbers).size !== installmentNumbers.length) {
                        throw new server_1.TRPCError({
                            code: "BAD_REQUEST",
                            message: "Installment numbers must be unique.",
                        });
                    }
                    // Perform updates in a transaction
                    return [4 /*yield*/, db.transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                            var paymentDueDate, _i, inputUnpaid_1, inst, unpaidWithDates, sortedUnpaid, unpaidAmount, feesTotal, feesPaid, feesBalance, nextPaymentStatus, minInitialPayment, downPayment, timeline;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (!activeEnrollment) return [3 /*break*/, 2];
                                        return [4 /*yield*/, tx.update(schema_1.batchEnrollments)
                                                .set({
                                                paymentType: input.paymentType,
                                            })
                                                .where((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.id, activeEnrollment.id))];
                                    case 1:
                                        _b.sent();
                                        _b.label = 2;
                                    case 2: 
                                    // 2. Delete all existing unpaid tuition payments
                                    return [4 /*yield*/, tx.delete(schema_1.payments)
                                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.payments.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.payments.status, "unpaid"), (0, drizzle_orm_1.eq)(schema_1.payments.type, "tuition")))];
                                    case 3:
                                        // 2. Delete all existing unpaid tuition payments
                                        _b.sent();
                                        paymentDueDate = null;
                                        if (!(input.paymentType === "INSTALLMENT")) return [3 /*break*/, 8];
                                        _i = 0, inputUnpaid_1 = inputUnpaid;
                                        _b.label = 4;
                                    case 4:
                                        if (!(_i < inputUnpaid_1.length)) return [3 /*break*/, 7];
                                        inst = inputUnpaid_1[_i];
                                        return [4 /*yield*/, tx.insert(schema_1.payments).values({
                                                studentId: studentId,
                                                amount: String(inst.amount),
                                                type: "tuition",
                                                status: "unpaid",
                                                dueDate: inst.dueDate ? new Date(inst.dueDate) : null,
                                                installmentNumber: inst.installmentNumber,
                                                batchId: (activeEnrollment === null || activeEnrollment === void 0 ? void 0 : activeEnrollment.batchId) || null,
                                                notes: "Installment #".concat(inst.installmentNumber, " (configured)"),
                                            })];
                                    case 5:
                                        _b.sent();
                                        _b.label = 6;
                                    case 6:
                                        _i++;
                                        return [3 /*break*/, 4];
                                    case 7:
                                        unpaidWithDates = inputUnpaid.filter(function (inst) { return !!inst.dueDate; });
                                        if (unpaidWithDates.length > 0) {
                                            sortedUnpaid = __spreadArray([], unpaidWithDates, true).sort(function (a, b) { return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); });
                                            paymentDueDate = sortedUnpaid[0].dueDate;
                                        }
                                        return [3 /*break*/, 10];
                                    case 8:
                                        unpaidAmount = input.totalCourseFee - sumPaid;
                                        if (!(unpaidAmount > 0)) return [3 /*break*/, 10];
                                        // Find earliest due date if specified in input installments, or default to profile's due date / today
                                        paymentDueDate = ((_a = input.installments.find(function (inst) { return inst.status === "unpaid"; })) === null || _a === void 0 ? void 0 : _a.dueDate) || profile.paymentDueDate || new Date();
                                        return [4 /*yield*/, tx.insert(schema_1.payments).values({
                                                studentId: studentId,
                                                amount: String(unpaidAmount),
                                                type: "tuition",
                                                status: "unpaid",
                                                dueDate: paymentDueDate,
                                                installmentNumber: null,
                                                batchId: (activeEnrollment === null || activeEnrollment === void 0 ? void 0 : activeEnrollment.batchId) || null,
                                                notes: "Unpaid balance (Full Payment)",
                                            })];
                                    case 9:
                                        _b.sent();
                                        _b.label = 10;
                                    case 10:
                                        feesTotal = String(input.totalCourseFee);
                                        feesPaid = String(sumPaid);
                                        feesBalance = String(input.totalCourseFee - sumPaid);
                                        nextPaymentStatus = (input.totalCourseFee - sumPaid <= 0) ? "paid" : (sumPaid > 0 ? "partial" : "unpaid");
                                        minInitialPayment = input.initialPayment !== undefined ? String(input.initialPayment) : profile.minInitialPayment;
                                        downPayment = input.initialPayment !== undefined ? String(input.initialPayment) : profile.downPayment;
                                        timeline = Array.isArray(profile.activityTimeline) ? profile.activityTimeline : [];
                                        timeline.push({
                                            type: "fee_rules_configuration",
                                            paymentType: input.paymentType,
                                            totalCourseFee: input.totalCourseFee,
                                            initialPayment: input.initialPayment,
                                            outstandingBalance: input.totalCourseFee - sumPaid,
                                            timestamp: new Date().toISOString(),
                                        });
                                        return [4 /*yield*/, tx.update(schema_1.profiles)
                                                .set({
                                                feesTotal: feesTotal,
                                                feesPaid: feesPaid,
                                                feesBalance: feesBalance,
                                                minInitialPayment: minInitialPayment,
                                                downPayment: downPayment,
                                                paymentStatus: nextPaymentStatus,
                                                paymentOption: input.paymentType === "INSTALLMENT" ? "installment" : "full_payment",
                                                paymentDueDate: paymentDueDate,
                                                activityTimeline: timeline,
                                                totalCourseFee: feesTotal,
                                                remainingBalance: feesBalance,
                                            })
                                                .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, studentId))];
                                    case 11:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 4:
                    // Perform updates in a transaction
                    _d.sent();
                    // Recalculate student fees
                    return [4 /*yield*/, (0, feeHelper_1.recalculateStudentFees)(studentId)];
                case 5:
                    // Recalculate student fees
                    _d.sent();
                    return [4 /*yield*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, studentId),
                        })];
                case 6:
                    finalProfile = _d.sent();
                    if (!(finalProfile && parseFloat((_c = finalProfile.feesBalance) !== null && _c !== void 0 ? _c : "0") <= 0)) return [3 /*break*/, 9];
                    return [4 /*yield*/, db.update(schema_1.batchEnrollments)
                            .set({ status: "active" })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.status, "restricted")))];
                case 7:
                    _d.sent();
                    return [4 /*yield*/, db.update(schema_1.users)
                            .set({ status: "active" })
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, studentId))];
                case 8:
                    _d.sent();
                    _d.label = 9;
                case 9: return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    sendManualReminder: middleware_1.adminQuery
        .input(zod_1.z.object({ studentId: zod_1.z.number() }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, profile, message, timeline;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (ctx.user.role === "academic_head") {
                        throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, input.studentId),
                        })];
                case 1:
                    profile = _c.sent();
                    if (!profile)
                        throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Student profile not found" });
                    message = "Manual Reminder: Your batch fee balance of \u20B9".concat(profile.feesBalance, " is outstanding. Please pay as soon as possible.");
                    return [4 /*yield*/, (0, notificationEngine_1.sendNotification)(input.studentId, "Fee Payment Reminder", message, "fee_reminder_manual")];
                case 2:
                    _c.sent();
                    timeline = Array.isArray(profile.activityTimeline) ? profile.activityTimeline : [];
                    timeline.push({
                        type: "manual_reminder_sent",
                        timestamp: new Date().toISOString(),
                    });
                    return [4 /*yield*/, db.update(schema_1.profiles)
                            .set({ activityTimeline: timeline })
                            .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, input.studentId))];
                case 3:
                    _c.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    exportPaymentReport: middleware_1.adminQuery
        .input(zod_1.z.object({
        batchId: zod_1.z.number().optional(),
        status: zod_1.z.string().optional(),
        format: zod_1.z.enum(["pdf", "excel"]).default("excel"),
    }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, filters, where, list;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (ctx.user.role === "academic_head") {
                        throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
                    }
                    db = (0, connection_1.getDb)();
                    filters = [];
                    if (input.batchId)
                        filters.push((0, drizzle_orm_1.eq)(schema_1.payments.batchId, input.batchId));
                    if (input.status)
                        filters.push((0, drizzle_orm_1.eq)(schema_1.payments.status, input.status));
                    where = filters.length > 0 ? drizzle_orm_1.and.apply(void 0, filters) : undefined;
                    return [4 /*yield*/, db.query.payments.findMany({
                            where: where,
                            orderBy: (0, drizzle_orm_1.desc)(schema_1.payments.createdAt),
                            with: {
                                student: {
                                    with: {
                                        profile: true,
                                        enrollments: true,
                                    },
                                },
                                batch: true,
                            },
                        })];
                case 1:
                    list = _c.sent();
                    return [2 /*return*/, {
                            format: input.format,
                            message: "Use this structured data for client-side report generation.",
                            data: list.map(function (l) {
                                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                                var activeEnrollment = (_b = (_a = l.student) === null || _a === void 0 ? void 0 : _a.enrollments) === null || _b === void 0 ? void 0 : _b.find(function (e) { return e.status === "active"; });
                                var paymentType = (activeEnrollment === null || activeEnrollment === void 0 ? void 0 : activeEnrollment.paymentType) || "FULL_PAYMENT";
                                return {
                                    id: l.id,
                                    studentName: (_c = l.student) === null || _c === void 0 ? void 0 : _c.name,
                                    studentId: (_d = l.student) === null || _d === void 0 ? void 0 : _d.unionId,
                                    batchName: (_e = l.batch) === null || _e === void 0 ? void 0 : _e.name,
                                    amount: l.amount,
                                    type: l.type,
                                    status: l.status,
                                    dueDate: l.dueDate,
                                    paidAt: l.paidAt,
                                    transactionId: l.transactionId,
                                    installmentNumber: l.installmentNumber,
                                    paidDate: l.paidDate,
                                    paymentType: paymentType,
                                    totalFee: ((_g = (_f = l.student) === null || _f === void 0 ? void 0 : _f.profile) === null || _g === void 0 ? void 0 : _g.feesTotal) || "0",
                                    amountPaid: ((_j = (_h = l.student) === null || _h === void 0 ? void 0 : _h.profile) === null || _j === void 0 ? void 0 : _j.feesPaid) || "0",
                                    outstandingBalance: ((_l = (_k = l.student) === null || _k === void 0 ? void 0 : _k.profile) === null || _l === void 0 ? void 0 : _l.feesBalance) || "0",
                                    paymentStatus: ((_o = (_m = l.student) === null || _m === void 0 ? void 0 : _m.profile) === null || _o === void 0 ? void 0 : _o.paymentStatus) || "unpaid",
                                };
                            }),
                        }];
            }
        });
    }); }),
    // ─── Flexibility Requests ────────────────────────────────────────────────────
    listRequests: middleware_1.adminQuery
        .input(zod_1.z.object({ status: zod_1.z.string().optional() }).optional())
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, where, list;
        var ctx = _b.ctx, input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!["super_admin", "admin"].includes(ctx.user.role)) {
                        throw new server_1.TRPCError({
                            code: "FORBIDDEN",
                            message: "Access Denied",
                        });
                    }
                    db = (0, connection_1.getDb)();
                    where = (input === null || input === void 0 ? void 0 : input.status)
                        ? (0, drizzle_orm_1.eq)(schema_1.flexibilityRequests.status, input.status)
                        : undefined;
                    return [4 /*yield*/, db.query.flexibilityRequests.findMany({
                            where: where,
                            orderBy: (0, drizzle_orm_1.desc)(schema_1.flexibilityRequests.requestedAt),
                            with: { student: { with: { profile: true } }, fromBatch: true, toBatch: true, resolver: true },
                        })];
                case 1:
                    list = _c.sent();
                    return [2 /*return*/, list.map(function (req) {
                            var _a, _b;
                            var fromFee = req.fromBatch ? parseFloat((_a = req.fromBatch.courseFee) !== null && _a !== void 0 ? _a : "0") : 0;
                            var toFee = req.toBatch ? parseFloat((_b = req.toBatch.courseFee) !== null && _b !== void 0 ? _b : "0") : 0;
                            return __assign(__assign({}, req), { fromBatchFee: fromFee, toBatchFee: toFee, feeDifference: toFee - fromFee });
                        })];
            }
        });
    }); }),
    // Tasks 10.1–10.3 — apply enrollment state changes, notify, append timeline
    resolveRequest: middleware_1.adminQuery
        .input(zod_1.z.object({
        requestId: zod_1.z.number(),
        status: zod_1.z.enum(["approved", "rejected"]),
        note: zod_1.z.string().optional(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, request, profile, requestType, fromBatchId, toBatchId, studentId, newBatch, oldBatch, oldFee, newFee, diff, currentTotal, currentPaid, nextTotal, nextBalance, nextPaymentStatus, statusLabel, timeline;
        var _c, _d, _e, _f, _g, _h;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    if (!["super_admin", "admin"].includes(ctx.user.role)) {
                        throw new server_1.TRPCError({
                            code: "FORBIDDEN",
                            message: "Access Denied",
                        });
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.flexibilityRequests.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.flexibilityRequests.id, input.requestId),
                        })];
                case 1:
                    request = _j.sent();
                    if (!request)
                        throw new Error("Request not found");
                    return [4 /*yield*/, db.update(schema_1.flexibilityRequests)
                            .set({
                            status: input.status,
                            adminNote: input.note,
                            resolvedAt: new Date(),
                            resolvedBy: ctx.user.id,
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.flexibilityRequests.id, input.requestId))];
                case 2:
                    _j.sent();
                    return [4 /*yield*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, request.studentId),
                        })];
                case 3:
                    profile = _j.sent();
                    if (!(input.status === "approved")) return [3 /*break*/, 17];
                    requestType = request.requestType, fromBatchId = request.fromBatchId, toBatchId = request.toBatchId, studentId = request.studentId;
                    if (!(requestType === "hold" && fromBatchId)) return [3 /*break*/, 5];
                    return [4 /*yield*/, db.update(schema_1.batchEnrollments)
                            .set({ status: "on_hold" })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.batchId, fromBatchId), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, studentId)))];
                case 4:
                    _j.sent();
                    return [3 /*break*/, 17];
                case 5:
                    if (!(requestType === "rejoin" && fromBatchId)) return [3 /*break*/, 7];
                    return [4 /*yield*/, db.update(schema_1.batchEnrollments)
                            .set({ status: "active" })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.batchId, fromBatchId), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, studentId)))];
                case 6:
                    _j.sent();
                    return [3 /*break*/, 17];
                case 7:
                    if (!(requestType === "batch_change" && fromBatchId && toBatchId)) return [3 /*break*/, 14];
                    return [4 /*yield*/, db.update(schema_1.batchEnrollments)
                            .set({ status: "inactive", leftAt: new Date() })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.batchId, fromBatchId), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, studentId)))];
                case 8:
                    _j.sent();
                    return [4 /*yield*/, db.insert(schema_1.batchEnrollments).values({
                            batchId: toBatchId,
                            studentId: studentId,
                            status: "active",
                        })];
                case 9:
                    _j.sent();
                    return [4 /*yield*/, db.query.batches.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.batches.id, toBatchId),
                            with: { module: true },
                        })];
                case 10:
                    newBatch = _j.sent();
                    return [4 /*yield*/, db.query.batches.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.batches.id, fromBatchId),
                        })];
                case 11:
                    oldBatch = _j.sent();
                    if (!(newBatch && profile)) return [3 /*break*/, 13];
                    oldFee = parseFloat((_c = oldBatch === null || oldBatch === void 0 ? void 0 : oldBatch.courseFee) !== null && _c !== void 0 ? _c : "0");
                    newFee = parseFloat((_d = newBatch.courseFee) !== null && _d !== void 0 ? _d : "0");
                    diff = newFee - oldFee;
                    currentTotal = parseFloat((_e = profile.feesTotal) !== null && _e !== void 0 ? _e : "0");
                    currentPaid = parseFloat((_f = profile.feesPaid) !== null && _f !== void 0 ? _f : "0");
                    nextTotal = Math.max(0, currentTotal + diff);
                    nextBalance = Math.max(0, nextTotal - currentPaid);
                    nextPaymentStatus = nextBalance <= 0 ? "paid" : (currentPaid > 0 ? "partial" : "unpaid");
                    return [4 /*yield*/, db.update(schema_1.profiles)
                            .set({
                            batch: newBatch.name,
                            batchTime: newBatch.timeSlot,
                            course: ((_g = newBatch.module) === null || _g === void 0 ? void 0 : _g.name) || null,
                            feesTotal: String(nextTotal),
                            feesBalance: String(nextBalance),
                            paymentStatus: nextPaymentStatus,
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, studentId))];
                case 12:
                    _j.sent();
                    _j.label = 13;
                case 13: return [3 /*break*/, 17];
                case 14:
                    if (!(requestType === "batch_removal" && fromBatchId)) return [3 /*break*/, 17];
                    return [4 /*yield*/, db.update(schema_1.batchEnrollments)
                            .set({ status: "inactive", leftAt: new Date() })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.batchId, fromBatchId), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, studentId)))];
                case 15:
                    _j.sent();
                    // Clear profile batch info
                    return [4 /*yield*/, db.update(schema_1.profiles)
                            .set({
                            batch: null,
                            batchTime: null,
                            course: null,
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, studentId))];
                case 16:
                    // Clear profile batch info
                    _j.sent();
                    _j.label = 17;
                case 17:
                    statusLabel = input.status === "approved" ? "approved" : "rejected";
                    return [4 /*yield*/, (0, notificationEngine_1.sendNotification)(request.studentId, "Flexibility Request Update", "Your ".concat(request.requestType.replace("_", " "), " request has been ").concat(statusLabel, ".").concat(input.note ? " Note: ".concat(input.note) : ""), "flexibility_request_resolved")];
                case 18:
                    _j.sent();
                    if (!profile) return [3 /*break*/, 20];
                    timeline = Array.isArray(profile.activityTimeline) ? profile.activityTimeline : [];
                    timeline.push({
                        type: request.requestType,
                        status: input.status,
                        timestamp: new Date().toISOString(),
                        adminNote: (_h = input.note) !== null && _h !== void 0 ? _h : null,
                    });
                    return [4 /*yield*/, db.update(schema_1.profiles)
                            .set({ activityTimeline: timeline })
                            .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, request.studentId))];
                case 19:
                    _j.sent();
                    _j.label = 20;
                case 20: return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    // ─── Teacher Salaries ────────────────────────────────────────────────────────
    listSalaries: middleware_1.adminQuery
        .input(zod_1.z.object({ teacherId: zod_1.z.number().optional(), month: zod_1.z.string().optional() }).optional())
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, filters, where;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            if (ctx.user.role === "academic_head") {
                throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
            }
            db = (0, connection_1.getDb)();
            filters = [];
            if (input === null || input === void 0 ? void 0 : input.teacherId)
                filters.push((0, drizzle_orm_1.eq)(schema_1.teacherSalaries.teacherId, input.teacherId));
            if (input === null || input === void 0 ? void 0 : input.month)
                filters.push((0, drizzle_orm_1.eq)(schema_1.teacherSalaries.month, input.month));
            where = filters.length > 0 ? drizzle_orm_1.and.apply(void 0, filters) : undefined;
            return [2 /*return*/, db.query.teacherSalaries.findMany({
                    where: where,
                    with: { teacher: true },
                })];
        });
    }); }),
    calculateSalary: middleware_1.adminQuery
        .input(zod_1.z.object({
        teacherId: zod_1.z.number(),
        month: zod_1.z.string(),
        groupClassRate: zod_1.z.number().optional(),
        oneToOneRate: zod_1.z.number().optional(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, res;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (ctx.user.role === "academic_head") {
                        throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, recalculateSalaryInternal(db, input.teacherId, input.month, true)];
                case 1:
                    res = _c.sent();
                    if (!res) {
                        throw new server_1.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to calculate salary" });
                    }
                    return [2 /*return*/, res];
            }
        });
    }); }),
    getSalaryConfig: middleware_1.adminQuery
        .input(zod_1.z.object({ teacherId: zod_1.z.number() }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, config;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (ctx.user.role === "academic_head") {
                        throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.teacherSalaryConfigs.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.teacherSalaryConfigs.teacherId, input.teacherId),
                        })];
                case 1:
                    config = _c.sent();
                    return [2 /*return*/, config !== null && config !== void 0 ? config : {
                            basicSalary: "0.00",
                            group30MinRate: "0.00",
                            group45MinRate: "0.00",
                            group60MinRate: "0.00",
                            oneToOne30MinRate: "0.00",
                            oneToOne45MinRate: "0.00",
                            oneToOne60MinRate: "0.00",
                        }];
            }
        });
    }); }),
    updateSalaryConfig: middleware_1.adminQuery
        .input(zod_1.z.object({
        teacherId: zod_1.z.number(),
        basicSalary: zod_1.z.number().nonnegative(),
        group30MinRate: zod_1.z.number().nonnegative(),
        group45MinRate: zod_1.z.number().nonnegative(),
        group60MinRate: zod_1.z.number().nonnegative(),
        oneToOne30MinRate: zod_1.z.number().nonnegative(),
        oneToOne45MinRate: zod_1.z.number().nonnegative(),
        oneToOne60MinRate: zod_1.z.number().nonnegative(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, existing, basicSalaryStr, group30MinRateStr, group45MinRateStr, group60MinRateStr, oneToOne30MinRateStr, oneToOne45MinRateStr, oneToOne60MinRateStr, prevBasic, prevGroup30, prevGroup45, prevGroup60, prevOneToOne30, prevOneToOne45, prevOneToOne60, auditEntries, addAuditLog, currentMonth;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (ctx.user.role !== "super_admin") {
                        throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Only Super Admin is allowed to modify salary configurations." });
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.teacherSalaryConfigs.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.teacherSalaryConfigs.teacherId, input.teacherId),
                        })];
                case 1:
                    existing = _c.sent();
                    basicSalaryStr = String(input.basicSalary);
                    group30MinRateStr = String(input.group30MinRate);
                    group45MinRateStr = String(input.group45MinRate);
                    group60MinRateStr = String(input.group60MinRate);
                    oneToOne30MinRateStr = String(input.oneToOne30MinRate);
                    oneToOne45MinRateStr = String(input.oneToOne45MinRate);
                    oneToOne60MinRateStr = String(input.oneToOne60MinRate);
                    prevBasic = existing ? parseFloat(existing.basicSalary) : 0;
                    prevGroup30 = existing ? parseFloat(existing.group30MinRate) : 0;
                    prevGroup45 = existing ? parseFloat(existing.group45MinRate) : 0;
                    prevGroup60 = existing ? parseFloat(existing.group60MinRate) : 0;
                    prevOneToOne30 = existing ? parseFloat(existing.oneToOne30MinRate) : 0;
                    prevOneToOne45 = existing ? parseFloat(existing.oneToOne45MinRate) : 0;
                    prevOneToOne60 = existing ? parseFloat(existing.oneToOne60MinRate) : 0;
                    if (!existing) return [3 /*break*/, 3];
                    return [4 /*yield*/, db.update(schema_1.teacherSalaryConfigs)
                            .set({
                            basicSalary: basicSalaryStr,
                            group30MinRate: group30MinRateStr,
                            group45MinRate: group45MinRateStr,
                            group60MinRate: group60MinRateStr,
                            oneToOne30MinRate: oneToOne30MinRateStr,
                            oneToOne45MinRate: oneToOne45MinRateStr,
                            oneToOne60MinRate: oneToOne60MinRateStr,
                            updatedAt: new Date(),
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.teacherSalaryConfigs.id, existing.id))];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, db.insert(schema_1.teacherSalaryConfigs).values({
                        teacherId: input.teacherId,
                        basicSalary: basicSalaryStr,
                        group30MinRate: group30MinRateStr,
                        group45MinRate: group45MinRateStr,
                        group60MinRate: group60MinRateStr,
                        oneToOne30MinRate: oneToOne30MinRateStr,
                        oneToOne45MinRate: oneToOne45MinRateStr,
                        oneToOne60MinRate: oneToOne60MinRateStr,
                    })];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    auditEntries = [];
                    addAuditLog = function (fieldName, prev, curr) {
                        if (parseFloat(curr) !== prev) {
                            auditEntries.push({
                                teacherId: input.teacherId,
                                fieldName: fieldName,
                                previousValue: String(prev),
                                newValue: curr,
                                changedBy: ctx.user.id,
                            });
                        }
                    };
                    addAuditLog("basicSalary", prevBasic, basicSalaryStr);
                    addAuditLog("group30MinRate", prevGroup30, group30MinRateStr);
                    addAuditLog("group45MinRate", prevGroup45, group45MinRateStr);
                    addAuditLog("group60MinRate", prevGroup60, group60MinRateStr);
                    addAuditLog("oneToOne30MinRate", prevOneToOne30, oneToOne30MinRateStr);
                    addAuditLog("oneToOne45MinRate", prevOneToOne45, oneToOne45MinRateStr);
                    addAuditLog("oneToOne60MinRate", prevOneToOne60, oneToOne60MinRateStr);
                    if (!(auditEntries.length > 0)) return [3 /*break*/, 7];
                    return [4 /*yield*/, db.insert(schema_1.teacherSalaryConfigAuditLogs).values(auditEntries)];
                case 6:
                    _c.sent();
                    _c.label = 7;
                case 7:
                    currentMonth = new Date().toISOString().substring(0, 7);
                    return [4 /*yield*/, recalculateSalaryInternal(db, input.teacherId, currentMonth)];
                case 8:
                    _c.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    listConfigAuditLogs: middleware_1.adminQuery
        .input(zod_1.z.object({ teacherId: zod_1.z.number().optional() }).optional())
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, filters, where;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            if (ctx.user.role === "academic_head") {
                throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
            }
            db = (0, connection_1.getDb)();
            filters = [];
            if (input === null || input === void 0 ? void 0 : input.teacherId)
                filters.push((0, drizzle_orm_1.eq)(schema_1.teacherSalaryConfigAuditLogs.teacherId, input.teacherId));
            where = filters.length > 0 ? drizzle_orm_1.and.apply(void 0, filters) : undefined;
            return [2 /*return*/, db.query.teacherSalaryConfigAuditLogs.findMany({
                    where: where,
                    orderBy: (0, drizzle_orm_1.desc)(schema_1.teacherSalaryConfigAuditLogs.changedAt),
                    with: {
                        teacher: true,
                        changedByUser: true,
                    },
                })];
        });
    }); }),
    markSalaryPaid: middleware_1.adminQuery
        .input(zod_1.z.object({
        salaryId: zod_1.z.number(),
        paymentDate: zod_1.z.date().optional(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, salary;
        var _c;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (ctx.user.role !== "super_admin") {
                        throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Only Super Admin is allowed to mark salaries as paid." });
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.teacherSalaries.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.teacherSalaries.id, input.salaryId),
                        })];
                case 1:
                    salary = _d.sent();
                    if (!salary) {
                        throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Salary record not found." });
                    }
                    return [4 /*yield*/, db.update(schema_1.teacherSalaries)
                            .set({
                            status: "paid",
                            paymentDate: (_c = input.paymentDate) !== null && _c !== void 0 ? _c : new Date(),
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.teacherSalaries.id, input.salaryId))];
                case 2:
                    _d.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    // Task 12.1 — salary report export (structured JSON for client-side generation)
    exportSalaryReport: middleware_1.adminQuery
        .input(zod_1.z.object({
        teacherId: zod_1.z.number(),
        month: zod_1.z.string(),
        format: zod_1.z.enum(["pdf", "excel"]).default("excel"),
    }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, teacher, salary;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (ctx.user.role === "academic_head") {
                        throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Access Denied" });
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.users.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.users.id, input.teacherId) })];
                case 1:
                    teacher = _c.sent();
                    return [4 /*yield*/, db.query.teacherSalaries.findFirst({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.teacherSalaries.teacherId, input.teacherId), (0, drizzle_orm_1.eq)(schema_1.teacherSalaries.month, input.month)),
                            with: { teacher: true },
                        })];
                case 2:
                    salary = _c.sent();
                    return [2 /*return*/, {
                            format: input.format,
                            message: "Use this structured data for client-side report generation.",
                            data: {
                                teacher: teacher ? { id: teacher.id, name: teacher.name, email: teacher.email } : null,
                                month: input.month,
                                salary: salary !== null && salary !== void 0 ? salary : null,
                            },
                        }];
            }
        });
    }); }),
    // ─── Feedback ────────────────────────────────────────────────────────────────
    listFeedback: middleware_1.adminQuery
        .input(zod_1.z.object({
        teacherId: zod_1.z.number().optional(),
        batchId: zod_1.z.number().optional(),
        courseName: zod_1.z.string().optional(),
        startDate: zod_1.z.date().optional(),
        endDate: zod_1.z.date().optional(),
    }).optional())
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, batchIdsWithCourse, matchingBatches, whereConditions, where;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    batchIdsWithCourse = undefined;
                    if (!(input === null || input === void 0 ? void 0 : input.courseName)) return [3 /*break*/, 2];
                    return [4 /*yield*/, db
                            .select({ id: schema_1.batches.id })
                            .from(schema_1.batches)
                            .innerJoin(schema_1.modules, (0, drizzle_orm_1.eq)(schema_1.batches.moduleId, schema_1.modules.id))
                            .where((0, drizzle_orm_1.ilike)(schema_1.modules.name, "%".concat(input.courseName, "%")))];
                case 1:
                    matchingBatches = _c.sent();
                    batchIdsWithCourse = matchingBatches.map(function (b) { return b.id; });
                    if (batchIdsWithCourse.length === 0) {
                        return [2 /*return*/, []];
                    }
                    _c.label = 2;
                case 2:
                    whereConditions = [];
                    if (input === null || input === void 0 ? void 0 : input.teacherId)
                        whereConditions.push((0, drizzle_orm_1.eq)(schema_1.feedback.teacherId, input.teacherId));
                    if (input === null || input === void 0 ? void 0 : input.batchId)
                        whereConditions.push((0, drizzle_orm_1.eq)(schema_1.feedback.batchId, input.batchId));
                    if (batchIdsWithCourse)
                        whereConditions.push((0, drizzle_orm_1.inArray)(schema_1.feedback.batchId, batchIdsWithCourse));
                    if (input === null || input === void 0 ? void 0 : input.startDate)
                        whereConditions.push((0, drizzle_orm_1.gte)(schema_1.feedback.createdAt, input.startDate));
                    if (input === null || input === void 0 ? void 0 : input.endDate)
                        whereConditions.push((0, drizzle_orm_1.lte)(schema_1.feedback.createdAt, input.endDate));
                    where = whereConditions.length > 0 ? drizzle_orm_1.and.apply(void 0, whereConditions) : undefined;
                    return [2 /*return*/, db.query.feedback.findMany({
                            where: where,
                            orderBy: (0, drizzle_orm_1.desc)(schema_1.feedback.createdAt),
                            with: {
                                student: true,
                                teacher: true,
                                batch: {
                                    with: {
                                        module: true
                                    }
                                },
                                class: true,
                            },
                        })];
            }
        });
    }); }),
    getFeedbackStats: middleware_1.adminQuery
        .input(zod_1.z.object({
        teacherId: zod_1.z.number().optional(),
        batchId: zod_1.z.number().optional(),
        courseName: zod_1.z.string().optional(),
        startDate: zod_1.z.date().optional(),
        endDate: zod_1.z.date().optional(),
    }).optional())
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, batchIdsWithCourse, matchingBatches, whereConditions, where, feedbacks, totalCount, sum, averageRating, distribution, _i, feedbacks_1, f, rating, recentComments;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    batchIdsWithCourse = undefined;
                    if (!(input === null || input === void 0 ? void 0 : input.courseName)) return [3 /*break*/, 2];
                    return [4 /*yield*/, db
                            .select({ id: schema_1.batches.id })
                            .from(schema_1.batches)
                            .innerJoin(schema_1.modules, (0, drizzle_orm_1.eq)(schema_1.batches.moduleId, schema_1.modules.id))
                            .where((0, drizzle_orm_1.ilike)(schema_1.modules.name, "%".concat(input.courseName, "%")))];
                case 1:
                    matchingBatches = _c.sent();
                    batchIdsWithCourse = matchingBatches.map(function (b) { return b.id; });
                    if (batchIdsWithCourse.length === 0) {
                        return [2 /*return*/, {
                                averageRating: 0,
                                totalCount: 0,
                                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                                recentComments: [],
                            }];
                    }
                    _c.label = 2;
                case 2:
                    whereConditions = [];
                    if (input === null || input === void 0 ? void 0 : input.teacherId)
                        whereConditions.push((0, drizzle_orm_1.eq)(schema_1.feedback.teacherId, input.teacherId));
                    if (input === null || input === void 0 ? void 0 : input.batchId)
                        whereConditions.push((0, drizzle_orm_1.eq)(schema_1.feedback.batchId, input.batchId));
                    if (batchIdsWithCourse)
                        whereConditions.push((0, drizzle_orm_1.inArray)(schema_1.feedback.batchId, batchIdsWithCourse));
                    if (input === null || input === void 0 ? void 0 : input.startDate)
                        whereConditions.push((0, drizzle_orm_1.gte)(schema_1.feedback.createdAt, input.startDate));
                    if (input === null || input === void 0 ? void 0 : input.endDate)
                        whereConditions.push((0, drizzle_orm_1.lte)(schema_1.feedback.createdAt, input.endDate));
                    where = whereConditions.length > 0 ? drizzle_orm_1.and.apply(void 0, whereConditions) : undefined;
                    return [4 /*yield*/, db.query.feedback.findMany({
                            where: where,
                            orderBy: (0, drizzle_orm_1.desc)(schema_1.feedback.createdAt),
                            with: {
                                student: true,
                                teacher: true,
                                batch: true,
                            }
                        })];
                case 3:
                    feedbacks = _c.sent();
                    totalCount = feedbacks.length;
                    if (totalCount === 0) {
                        return [2 /*return*/, {
                                averageRating: 0,
                                totalCount: 0,
                                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                                recentComments: [],
                            }];
                    }
                    sum = feedbacks.reduce(function (acc, f) { return acc + f.rating; }, 0);
                    averageRating = Math.round((sum / totalCount) * 100) / 100;
                    distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                    for (_i = 0, feedbacks_1 = feedbacks; _i < feedbacks_1.length; _i++) {
                        f = feedbacks_1[_i];
                        rating = f.rating;
                        if (distribution[rating] !== undefined) {
                            distribution[rating]++;
                        }
                    }
                    recentComments = feedbacks
                        .filter(function (f) { return f.comment && f.comment.trim() !== ""; })
                        .map(function (f) {
                        var _a;
                        return ({
                            studentName: f.student.name,
                            teacherName: f.teacher.name,
                            rating: f.rating,
                            comment: f.comment,
                            createdAt: f.createdAt,
                            batchName: ((_a = f.batch) === null || _a === void 0 ? void 0 : _a.name) || "N/A",
                        });
                    })
                        .slice(0, 10);
                    return [2 /*return*/, {
                            averageRating: averageRating,
                            totalCount: totalCount,
                            distribution: distribution,
                            recentComments: recentComments,
                        }];
            }
        });
    }); }),
    getFeedbackSettings: middleware_1.adminQuery.query(function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, settingsList, settingsMap;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.systemSettings.findMany()];
                case 1:
                    settingsList = _a.sent();
                    settingsMap = new Map(settingsList.map(function (s) { return [s.key, s.value]; }));
                    return [2 /*return*/, {
                            feedback_edit_period_minutes: parseInt(settingsMap.get("feedback_edit_period_minutes") || "60", 10),
                            feedback_limit_per_batch: settingsMap.has("feedback_limit_per_batch")
                                ? settingsMap.get("feedback_limit_per_batch") === "true"
                                : true,
                            feedback_teacher_stats_enabled: settingsMap.get("feedback_teacher_stats_enabled") === "true",
                        }];
            }
        });
    }); }),
    updateFeedbackSettings: middleware_1.adminQuery
        .input(zod_1.z.object({
        feedback_edit_period_minutes: zod_1.z.number().nonnegative(),
        feedback_limit_per_batch: zod_1.z.boolean(),
        feedback_teacher_stats_enabled: zod_1.z.boolean(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, upsertSetting;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!["super_admin", "admin"].includes(ctx.user.role)) {
                        throw new server_1.TRPCError({
                            code: "FORBIDDEN",
                            message: "Only Admins/Super Admins can update system settings.",
                        });
                    }
                    db = (0, connection_1.getDb)();
                    upsertSetting = function (key, value) { return __awaiter(void 0, void 0, void 0, function () {
                        var existing;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, db.query.systemSettings.findFirst({
                                        where: (0, drizzle_orm_1.eq)(schema_1.systemSettings.key, key),
                                    })];
                                case 1:
                                    existing = _a.sent();
                                    if (!existing) return [3 /*break*/, 3];
                                    return [4 /*yield*/, db.update(schema_1.systemSettings)
                                            .set({ value: value, updatedAt: new Date() })
                                            .where((0, drizzle_orm_1.eq)(schema_1.systemSettings.key, key))];
                                case 2:
                                    _a.sent();
                                    return [3 /*break*/, 5];
                                case 3: return [4 /*yield*/, db.insert(schema_1.systemSettings).values({ key: key, value: value })];
                                case 4:
                                    _a.sent();
                                    _a.label = 5;
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, upsertSetting("feedback_edit_period_minutes", String(input.feedback_edit_period_minutes))];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, upsertSetting("feedback_limit_per_batch", String(input.feedback_limit_per_batch))];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, upsertSetting("feedback_teacher_stats_enabled", String(input.feedback_teacher_stats_enabled))];
                case 3:
                    _c.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    getStudentIdConfig: middleware_1.adminQuery
        .query(function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, activePrefixRow, activePrefix, seq;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.systemSettings.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.systemSettings.key, "active_student_id_prefix"),
                        })];
                case 1:
                    activePrefixRow = _a.sent();
                    activePrefix = (activePrefixRow === null || activePrefixRow === void 0 ? void 0 : activePrefixRow.value) || "STU";
                    return [4 /*yield*/, db.query.studentIdSequence.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.studentIdSequence.prefix, activePrefix),
                        })];
                case 2:
                    seq = _a.sent();
                    return [2 /*return*/, {
                            prefix: activePrefix,
                            startingNumber: seq ? seq.lastNumber + 1 : 1,
                            numberLength: seq ? seq.numberLength : 4,
                        }];
            }
        });
    }); }),
    updateStudentIdConfig: middleware_1.adminQuery
        .input(zod_1.z.object({
        prefix: zod_1.z.string().min(1).max(50),
        startingNumber: zod_1.z.number().int().nonnegative(),
        numberLength: zod_1.z.number().int().nonnegative(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, existingPrefix, seq;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.systemSettings.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.systemSettings.key, "active_student_id_prefix"),
                        })];
                case 1:
                    existingPrefix = _c.sent();
                    if (!existingPrefix) return [3 /*break*/, 3];
                    return [4 /*yield*/, db.update(schema_1.systemSettings)
                            .set({ value: input.prefix, updatedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.systemSettings.key, "active_student_id_prefix"))];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, db.insert(schema_1.systemSettings).values({ key: "active_student_id_prefix", value: input.prefix })];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5: return [4 /*yield*/, db.query.studentIdSequence.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema_1.studentIdSequence.prefix, input.prefix),
                    })];
                case 6:
                    seq = _c.sent();
                    if (!seq) return [3 /*break*/, 8];
                    return [4 /*yield*/, db.update(schema_1.studentIdSequence)
                            .set({
                            lastNumber: input.startingNumber - 1,
                            numberLength: input.numberLength,
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.studentIdSequence.prefix, input.prefix))];
                case 7:
                    _c.sent();
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, db.insert(schema_1.studentIdSequence).values({
                        prefix: input.prefix,
                        lastNumber: input.startingNumber - 1,
                        numberLength: input.numberLength,
                    })];
                case 9:
                    _c.sent();
                    _c.label = 10;
                case 10: return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    getDefaultCountry: middleware_1.adminQuery
        .query(function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, codeRow, isoRow;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.systemSettings.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.systemSettings.key, "default_country_code"),
                        })];
                case 1:
                    codeRow = _a.sent();
                    return [4 /*yield*/, db.query.systemSettings.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.systemSettings.key, "default_country_iso"),
                        })];
                case 2:
                    isoRow = _a.sent();
                    return [2 /*return*/, {
                            code: (codeRow === null || codeRow === void 0 ? void 0 : codeRow.value) || "+91",
                            iso: (isoRow === null || isoRow === void 0 ? void 0 : isoRow.value) || "IN",
                        }];
            }
        });
    }); }),
    updateDefaultCountry: middleware_1.adminQuery
        .input(zod_1.z.object({
        code: zod_1.z.string(),
        iso: zod_1.z.string(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, upsert;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    upsert = function (key, value) { return __awaiter(void 0, void 0, void 0, function () {
                        var existing;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, db.query.systemSettings.findFirst({
                                        where: (0, drizzle_orm_1.eq)(schema_1.systemSettings.key, key),
                                    })];
                                case 1:
                                    existing = _a.sent();
                                    if (!existing) return [3 /*break*/, 3];
                                    return [4 /*yield*/, db.update(schema_1.systemSettings)
                                            .set({ value: value, updatedAt: new Date() })
                                            .where((0, drizzle_orm_1.eq)(schema_1.systemSettings.key, key))];
                                case 2:
                                    _a.sent();
                                    return [3 /*break*/, 5];
                                case 3: return [4 /*yield*/, db.insert(schema_1.systemSettings).values({ key: key, value: value })];
                                case 4:
                                    _a.sent();
                                    _a.label = 5;
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, upsert("default_country_code", input.code)];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, upsert("default_country_iso", input.iso)];
                case 2:
                    _c.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    getTeacherAggregatedStats: middleware_1.teacherQuery
        .input(zod_1.z.object({
        teacherId: zod_1.z.number().optional(),
    }).optional())
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, targetTeacherId, isPrivileged, statsEnabledRow, statsEnabled, feedbacks, totalCount, sum, averageRating, distribution, _i, feedbacks_2, f, rating;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    targetTeacherId = ctx.user.id;
                    isPrivileged = ["super_admin", "admin", "academic_head"].includes(ctx.user.role);
                    if ((input === null || input === void 0 ? void 0 : input.teacherId) && isPrivileged) {
                        targetTeacherId = input.teacherId;
                    }
                    if (ctx.user.role === "teacher" && targetTeacherId !== ctx.user.id) {
                        throw new server_1.TRPCError({
                            code: "FORBIDDEN",
                            message: "You can only view your own statistics.",
                        });
                    }
                    if (!(ctx.user.role === "teacher")) return [3 /*break*/, 2];
                    return [4 /*yield*/, db.query.systemSettings.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.systemSettings.key, "feedback_teacher_stats_enabled"),
                        })];
                case 1:
                    statsEnabledRow = _c.sent();
                    statsEnabled = statsEnabledRow ? statsEnabledRow.value === "true" : false;
                    if (!statsEnabled) {
                        throw new server_1.TRPCError({
                            code: "FORBIDDEN",
                            message: "Feedback statistics view is currently disabled by the Super Admin.",
                        });
                    }
                    _c.label = 2;
                case 2: return [4 /*yield*/, db.query.feedback.findMany({
                        where: (0, drizzle_orm_1.eq)(schema_1.feedback.teacherId, targetTeacherId),
                    })];
                case 3:
                    feedbacks = _c.sent();
                    totalCount = feedbacks.length;
                    if (totalCount === 0) {
                        return [2 /*return*/, {
                                averageRating: 0,
                                totalCount: 0,
                                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                            }];
                    }
                    sum = feedbacks.reduce(function (acc, f) { return acc + f.rating; }, 0);
                    averageRating = Math.round((sum / totalCount) * 100) / 100;
                    distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                    for (_i = 0, feedbacks_2 = feedbacks; _i < feedbacks_2.length; _i++) {
                        f = feedbacks_2[_i];
                        rating = f.rating;
                        if (distribution[rating] !== undefined) {
                            distribution[rating]++;
                        }
                    }
                    return [2 /*return*/, {
                            averageRating: averageRating,
                            totalCount: totalCount,
                            distribution: distribution,
                        }];
            }
        });
    }); }),
    // ─── Notifications ───────────────────────────────────────────────────────────
    listNotifications: middleware_1.adminQuery
        .input(zod_1.z.object({ userId: zod_1.z.number().optional() }).optional())
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, where;
        var input = _b.input;
        return __generator(this, function (_c) {
            db = (0, connection_1.getDb)();
            where = (input === null || input === void 0 ? void 0 : input.userId) ? (0, drizzle_orm_1.eq)(schema_1.notifications.userId, input.userId) : undefined;
            return [2 /*return*/, db.query.notifications.findMany({
                    where: where,
                    orderBy: (0, drizzle_orm_1.desc)(schema_1.notifications.createdAt),
                    with: { user: true },
                })];
        });
    }); }),
    sendNotification: middleware_1.adminQuery
        .input(zod_1.z.object({
        userId: zod_1.z.number(),
        title: zod_1.z.string(),
        message: zod_1.z.string(),
        type: zod_1.z.string(),
        data: zod_1.z.any().optional(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.insert(schema_1.notifications).values(input)];
                case 1:
                    _c.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    // ─── Violations / Discipline ─────────────────────────────────────────────────
    listViolations: middleware_1.adminQuery.query(function () { return __awaiter(void 0, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, connection_1.getDb)();
            return [2 /*return*/, db.query.violations.findMany({
                    orderBy: (0, drizzle_orm_1.desc)(schema_1.violations.createdAt),
                    with: { user: true, reporter: true },
                })];
        });
    }); }),
    // Task 14.1 — notify subject user after violation creation
    createViolation: middleware_1.adminQuery
        .input(zod_1.z.object({
        userId: zod_1.z.number(),
        type: zod_1.z.string(),
        description: zod_1.z.string(),
        action: zod_1.z.string().optional(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.insert(schema_1.violations).values(__assign(__assign({}, input), { reportedBy: ctx.user.id }))];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, notificationEngine_1.sendNotification)(input.userId, "Violation Recorded", "A ".concat(input.type, " violation has been recorded against your account. ").concat(input.description), "violation_created")];
                case 2:
                    _c.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    // Task 14.2 — resolve violation
    resolveViolation: middleware_1.adminQuery
        .input(zod_1.z.object({ violationId: zod_1.z.number() }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.update(schema_1.violations)
                            .set({ status: "resolved", resolvedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.violations.id, input.violationId))];
                case 1:
                    _c.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    // Task 14.3 — suspend user
    suspendUser: middleware_1.adminQuery
        .input(zod_1.z.object({ userId: zod_1.z.number() }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.update(schema_1.users)
                            .set({ status: "suspended" })
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, input.userId))];
                case 1:
                    _c.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); }),
    // ─── Reports & Analytics ─────────────────────────────────────────────────────
    getDashboardStats: middleware_1.adminQuery.query(function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, totalStudents, totalTeachers, totalBatches, totalGroupClasses, totalOneToOnes, totalClassesCount, pendingFees, startOfToday, endOfToday, todayAttendanceList, todayTotalAttendance, todayPresentCount, todayAbsentCount, todayAttendancePercentage;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.select({ count: (0, drizzle_orm_1.sql)(templateObject_16 || (templateObject_16 = __makeTemplateObject(["count(*)"], ["count(*)"]))) }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.role, "student"))];
                case 1:
                    totalStudents = _g.sent();
                    return [4 /*yield*/, db.select({ count: (0, drizzle_orm_1.sql)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["count(*)"], ["count(*)"]))) }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.role, "teacher"))];
                case 2:
                    totalTeachers = _g.sent();
                    return [4 /*yield*/, db.select({ count: (0, drizzle_orm_1.sql)(templateObject_18 || (templateObject_18 = __makeTemplateObject(["count(*)"], ["count(*)"]))) }).from(schema_1.batches)];
                case 3:
                    totalBatches = _g.sent();
                    return [4 /*yield*/, db.select({ count: (0, drizzle_orm_1.sql)(templateObject_19 || (templateObject_19 = __makeTemplateObject(["count(*)"], ["count(*)"]))) }).from(schema_1.classes).where((0, drizzle_orm_1.eq)(schema_1.classes.status, "completed"))];
                case 4:
                    totalGroupClasses = _g.sent();
                    return [4 /*yield*/, db.select({ count: (0, drizzle_orm_1.sql)(templateObject_20 || (templateObject_20 = __makeTemplateObject(["count(*)"], ["count(*)"]))) }).from(schema_1.oneToOneSessions).where((0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.status, "completed"))];
                case 5:
                    totalOneToOnes = _g.sent();
                    totalClassesCount = Number(((_a = totalGroupClasses[0]) === null || _a === void 0 ? void 0 : _a.count) || 0) + Number(((_b = totalOneToOnes[0]) === null || _b === void 0 ? void 0 : _b.count) || 0);
                    return [4 /*yield*/, db.select({ total: (0, drizzle_orm_1.sql)(templateObject_21 || (templateObject_21 = __makeTemplateObject(["COALESCE(SUM(amount), 0)"], ["COALESCE(SUM(amount), 0)"]))) }).from(schema_1.payments).where((0, drizzle_orm_1.eq)(schema_1.payments.status, "unpaid"))];
                case 6:
                    pendingFees = _g.sent();
                    startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);
                    endOfToday = new Date();
                    endOfToday.setHours(23, 59, 59, 999);
                    return [4 /*yield*/, db
                            .select({ status: schema_1.attendance.status })
                            .from(schema_1.attendance)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.attendance.attendanceDate, startOfToday), (0, drizzle_orm_1.lte)(schema_1.attendance.attendanceDate, endOfToday)))];
                case 7:
                    todayAttendanceList = _g.sent();
                    todayTotalAttendance = todayAttendanceList.length;
                    todayPresentCount = todayAttendanceList.filter(function (a) { return a.status === "present" || a.status === "late"; }).length;
                    todayAbsentCount = todayAttendanceList.filter(function (a) { return a.status === "absent"; }).length;
                    todayAttendancePercentage = todayTotalAttendance > 0
                        ? Math.round((todayPresentCount / todayTotalAttendance) * 100)
                        : 100;
                    return [2 /*return*/, {
                            totalStudents: Number(((_c = totalStudents[0]) === null || _c === void 0 ? void 0 : _c.count) || 0),
                            totalTeachers: Number(((_d = totalTeachers[0]) === null || _d === void 0 ? void 0 : _d.count) || 0),
                            totalBatches: Number(((_e = totalBatches[0]) === null || _e === void 0 ? void 0 : _e.count) || 0),
                            totalClasses: totalClassesCount,
                            pendingFees: Number(((_f = pendingFees[0]) === null || _f === void 0 ? void 0 : _f.total) || 0),
                            todayTotalAttendance: todayTotalAttendance,
                            todayPresentCount: todayPresentCount,
                            todayAbsentCount: todayAbsentCount,
                            todayAttendancePercentage: todayAttendancePercentage,
                        }];
            }
        });
    }); }),
    searchStudents: middleware_1.adminQuery
        .input(zod_1.z.object({ search: zod_1.z.string() }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, query, results;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    query = "%".concat(input.search.trim(), "%");
                    return [4 /*yield*/, db
                            .select({
                            id: schema_1.users.id,
                            name: schema_1.users.name,
                            unionId: schema_1.users.unionId,
                            enrollmentId: schema_1.profiles.enrollmentId,
                            course: schema_1.profiles.course,
                            batch: schema_1.profiles.batch,
                            oneOnOneEnabled: schema_1.profiles.oneOnOneEnabled,
                            groupSessionEnabled: schema_1.profiles.groupSessionEnabled,
                            preferredClassTime: schema_1.profiles.preferredClassTime,
                            paymentType: schema_1.profiles.paymentType,
                        })
                            .from(schema_1.users)
                            .leftJoin(schema_1.profiles, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.profiles.userId))
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.role, "student"), (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.users.name, query), (0, drizzle_orm_1.ilike)(schema_1.users.unionId, query), (0, drizzle_orm_1.ilike)(schema_1.profiles.enrollmentId, query), (0, drizzle_orm_1.ilike)(schema_1.profiles.preferredClassTime, query), (0, drizzle_orm_1.ilike)(schema_1.profiles.paymentType, query))))
                            .limit(20)];
                case 1:
                    results = _c.sent();
                    return [2 /*return*/, results];
            }
        });
    }); }),
    getStudentReport: middleware_1.adminQuery
        .input(zod_1.z.object({ studentId: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]) }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, userId, trimmed, parsed, userByUnion, profileByEnrollment, partialMatches;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    userId = null;
                    if (!(typeof input.studentId === "number")) return [3 /*break*/, 1];
                    userId = input.studentId;
                    return [3 /*break*/, 8];
                case 1:
                    trimmed = input.studentId.trim();
                    parsed = parseInt(trimmed, 10);
                    if (!(!isNaN(parsed) && String(parsed) === trimmed)) return [3 /*break*/, 2];
                    userId = parsed;
                    return [3 /*break*/, 8];
                case 2: return [4 /*yield*/, db.query.users.findFirst({
                        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.role, "student"), (0, drizzle_orm_1.eq)(schema_1.users.unionId, trimmed)),
                    })];
                case 3:
                    userByUnion = _c.sent();
                    if (!userByUnion) return [3 /*break*/, 4];
                    userId = userByUnion.id;
                    return [3 /*break*/, 8];
                case 4: return [4 /*yield*/, db.query.profiles.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema_1.profiles.enrollmentId, trimmed),
                    })];
                case 5:
                    profileByEnrollment = _c.sent();
                    if (!profileByEnrollment) return [3 /*break*/, 6];
                    userId = profileByEnrollment.userId;
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, db
                        .select({ id: schema_1.users.id })
                        .from(schema_1.users)
                        .leftJoin(schema_1.profiles, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.profiles.userId))
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.role, "student"), (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.users.unionId, "%".concat(trimmed, "%")), (0, drizzle_orm_1.ilike)(schema_1.profiles.enrollmentId, "%".concat(trimmed, "%")), (0, drizzle_orm_1.ilike)(schema_1.users.name, "%".concat(trimmed, "%")))))
                        .limit(1)];
                case 7:
                    partialMatches = _c.sent();
                    if (partialMatches.length > 0) {
                        userId = partialMatches[0].id;
                    }
                    _c.label = 8;
                case 8:
                    if (!userId) {
                        throw new server_1.TRPCError({ code: "NOT_FOUND", message: "No matching student found." });
                    }
                    return [4 /*yield*/, fetchFullStudentReportData(db, userId)];
                case 9: return [2 /*return*/, _c.sent()];
            }
        });
    }); }),
    // Tasks 13.1 + 13.2 — teacher report with performance classification
    searchTeachers: middleware_1.adminQuery
        .input(zod_1.z.object({
        search: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
        batchId: zod_1.z.number().optional()
    }).default({}))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, conditions, query, cond, mappedStatus, results;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    conditions = [(0, drizzle_orm_1.eq)(schema_1.users.role, "teacher")];
                    if (input.search && input.search.trim()) {
                        query = "%".concat(input.search.trim(), "%");
                        cond = (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.users.name, query), (0, drizzle_orm_1.ilike)(schema_1.users.unionId, query));
                        if (cond)
                            conditions.push(cond);
                    }
                    if (input.status && input.status !== "all") {
                        mappedStatus = (input.status === "on_leave" ? "on_hold" : input.status);
                        conditions.push((0, drizzle_orm_1.eq)(schema_1.users.status, mappedStatus));
                    }
                    if (!input.batchId) return [3 /*break*/, 2];
                    return [4 /*yield*/, db
                            .select({
                            id: schema_1.users.id,
                            name: schema_1.users.name,
                            unionId: schema_1.users.unionId,
                            status: schema_1.users.status,
                            email: schema_1.users.email,
                            phone: schema_1.users.phone,
                            avatar: schema_1.users.avatar,
                        })
                            .from(schema_1.users)
                            .innerJoin(schema_1.batches, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.batches.teacherId))
                            .where(drizzle_orm_1.and.apply(void 0, __spreadArray(__spreadArray([], conditions, false), [(0, drizzle_orm_1.eq)(schema_1.batches.id, input.batchId)], false)))
                            .limit(50)];
                case 1:
                    results = _c.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, db
                        .select({
                        id: schema_1.users.id,
                        name: schema_1.users.name,
                        unionId: schema_1.users.unionId,
                        status: schema_1.users.status,
                        email: schema_1.users.email,
                        phone: schema_1.users.phone,
                        avatar: schema_1.users.avatar,
                    })
                        .from(schema_1.users)
                        .where(drizzle_orm_1.and.apply(void 0, conditions))
                        .limit(50)];
                case 3:
                    results = _c.sent();
                    _c.label = 4;
                case 4: return [2 /*return*/, results];
            }
        });
    }); }),
    getTeacherReport: middleware_1.adminQuery
        .input(zod_1.z.object({ teacherId: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]) }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, userId, parsed, u, report;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    if (!(typeof input.teacherId === "string")) return [3 /*break*/, 4];
                    parsed = parseInt(input.teacherId, 10);
                    if (!(!isNaN(parsed) && String(parsed) === input.teacherId.trim())) return [3 /*break*/, 1];
                    userId = parsed;
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, db.query.users.findFirst({
                        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.role, "teacher"), (0, drizzle_orm_1.eq)(schema_1.users.unionId, input.teacherId)),
                    })];
                case 2:
                    u = _c.sent();
                    if (!u)
                        throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Teacher not found with this ID" });
                    userId = u.id;
                    _c.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    userId = input.teacherId;
                    _c.label = 5;
                case 5: return [4 /*yield*/, fetchFullTeacherReportData(db, userId)];
                case 6:
                    report = _c.sent();
                    if (ctx.user.role === "academic_head") {
                        report.salaries = [];
                        report.salaryReport = {
                            config: {
                                basicSalary: 0,
                                group30MinRate: 0,
                                group45MinRate: 0,
                                group60MinRate: 0,
                                oneToOne30MinRate: 0,
                                oneToOne45MinRate: 0,
                                oneToOne60MinRate: 0,
                            },
                            currentMonthBreakdown: {
                                month: "",
                                oneToOne: { min30: { count: 0, earnings: 0 }, min45: { count: 0, earnings: 0 }, min60: { count: 0, earnings: 0 }, totalEarnings: 0 },
                                group: { min30: { count: 0, earnings: 0 }, min45: { count: 0, earnings: 0 }, min60: { count: 0, earnings: 0 }, totalEarnings: 0 },
                                summary: { basicSalary: 0, oneToOneEarnings: 0, groupEarnings: 0, netSalary: 0 }
                            },
                            history: []
                        };
                    }
                    return [2 /*return*/, report];
            }
        });
    }); }),
    // Task 13.3 — ranked teacher list by studentCompletionRate
    listTeachersByPerformance: middleware_1.adminQuery.query(function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, teachers, results, _loop_1, _i, teachers_1, teacher;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.users.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.users.role, "teacher"),
                        })];
                case 1:
                    teachers = _a.sent();
                    results = [];
                    _loop_1 = function (teacher) {
                        var teacherBatches, enrolledStudentIds, _b, teacherBatches_3, batch, enrollments, totalStudents, completedStudents, _c, enrolledStudentIds_1, studentId, profile, studentCompletionRate, needsImprovement;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0: return [4 /*yield*/, db.query.batches.findMany({
                                        where: (0, drizzle_orm_1.eq)(schema_1.batches.teacherId, teacher.id),
                                    })];
                                case 1:
                                    teacherBatches = _d.sent();
                                    enrolledStudentIds = new Set();
                                    _b = 0, teacherBatches_3 = teacherBatches;
                                    _d.label = 2;
                                case 2:
                                    if (!(_b < teacherBatches_3.length)) return [3 /*break*/, 5];
                                    batch = teacherBatches_3[_b];
                                    return [4 /*yield*/, db.query.batchEnrollments.findMany({
                                            where: (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.batchId, batch.id),
                                        })];
                                case 3:
                                    enrollments = _d.sent();
                                    enrollments.forEach(function (e) { return enrolledStudentIds.add(e.studentId); });
                                    _d.label = 4;
                                case 4:
                                    _b++;
                                    return [3 /*break*/, 2];
                                case 5:
                                    totalStudents = enrolledStudentIds.size;
                                    completedStudents = 0;
                                    _c = 0, enrolledStudentIds_1 = enrolledStudentIds;
                                    _d.label = 6;
                                case 6:
                                    if (!(_c < enrolledStudentIds_1.length)) return [3 /*break*/, 9];
                                    studentId = enrolledStudentIds_1[_c];
                                    return [4 /*yield*/, db.query.profiles.findFirst({
                                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, studentId),
                                        })];
                                case 7:
                                    profile = _d.sent();
                                    if (profile === null || profile === void 0 ? void 0 : profile.completionDate)
                                        completedStudents++;
                                    _d.label = 8;
                                case 8:
                                    _c++;
                                    return [3 /*break*/, 6];
                                case 9:
                                    studentCompletionRate = totalStudents > 0
                                        ? Math.round((completedStudents / totalStudents) * 100)
                                        : 0;
                                    needsImprovement = process.env.FEATURE_AI_INSIGHTS === "true"
                                        ? studentCompletionRate < 60
                                        : undefined;
                                    results.push(__assign({ id: teacher.id, name: teacher.name, email: teacher.email, studentCompletionRate: studentCompletionRate }, (needsImprovement !== undefined ? { needsImprovement: needsImprovement } : {})));
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, teachers_1 = teachers;
                    _a.label = 2;
                case 2:
                    if (!(_i < teachers_1.length)) return [3 /*break*/, 5];
                    teacher = teachers_1[_i];
                    return [5 /*yield**/, _loop_1(teacher)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, results.sort(function (a, b) { return b.studentCompletionRate - a.studentCompletionRate; })];
            }
        });
    }); }),
    // Task 13.4 — student leaderboard with composite score
    getLeaderboard: middleware_1.adminQuery.query(function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, students, results, _i, students_1, student, attendanceRecords, total, present, attendancePct, chatActivity, compositeScore, atRisk;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.users.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.users.role, "student"),
                        })];
                case 1:
                    students = _a.sent();
                    results = [];
                    _i = 0, students_1 = students;
                    _a.label = 2;
                case 2:
                    if (!(_i < students_1.length)) return [3 /*break*/, 5];
                    student = students_1[_i];
                    return [4 /*yield*/, db.query.attendance.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.attendance.studentId, student.id),
                        })];
                case 3:
                    attendanceRecords = _a.sent();
                    total = attendanceRecords.length;
                    present = attendanceRecords.filter(function (a) { return a.status === "present"; }).length;
                    attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;
                    chatActivity = attendanceRecords.reduce(function (sum, r) { var _a; return sum + ((_a = r.chatCount) !== null && _a !== void 0 ? _a : 0); }, 0);
                    compositeScore = attendancePct + chatActivity;
                    atRisk = process.env.FEATURE_AI_INSIGHTS === "true"
                        ? attendancePct < 60
                        : undefined;
                    results.push(__assign({ id: student.id, name: student.name, attendancePct: attendancePct, chatActivity: chatActivity, compositeScore: compositeScore }, (atRisk !== undefined ? { atRisk: atRisk } : {})));
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, results.sort(function (a, b) { return b.compositeScore - a.compositeScore; })];
            }
        });
    }); }),
    // Task 13.5 — export student/teacher reports (structured JSON for client-side generation)
    exportStudentReport: middleware_1.adminQuery
        .input(zod_1.z.object({
        studentId: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]),
        format: zod_1.z.enum(["pdf", "excel"]).default("excel"),
    }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, userId, trimmed, parsed, userByUnion, profileByEnrollment, partialMatches, reportData;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    userId = null;
                    if (!(typeof input.studentId === "number")) return [3 /*break*/, 1];
                    userId = input.studentId;
                    return [3 /*break*/, 8];
                case 1:
                    trimmed = input.studentId.trim();
                    parsed = parseInt(trimmed, 10);
                    if (!(!isNaN(parsed) && String(parsed) === trimmed)) return [3 /*break*/, 2];
                    userId = parsed;
                    return [3 /*break*/, 8];
                case 2: return [4 /*yield*/, db.query.users.findFirst({
                        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.role, "student"), (0, drizzle_orm_1.eq)(schema_1.users.unionId, trimmed)),
                    })];
                case 3:
                    userByUnion = _c.sent();
                    if (!userByUnion) return [3 /*break*/, 4];
                    userId = userByUnion.id;
                    return [3 /*break*/, 8];
                case 4: return [4 /*yield*/, db.query.profiles.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema_1.profiles.enrollmentId, trimmed),
                    })];
                case 5:
                    profileByEnrollment = _c.sent();
                    if (!profileByEnrollment) return [3 /*break*/, 6];
                    userId = profileByEnrollment.userId;
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, db
                        .select({ id: schema_1.users.id })
                        .from(schema_1.users)
                        .leftJoin(schema_1.profiles, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.profiles.userId))
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.role, "student"), (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.users.unionId, "%".concat(trimmed, "%")), (0, drizzle_orm_1.ilike)(schema_1.profiles.enrollmentId, "%".concat(trimmed, "%")), (0, drizzle_orm_1.ilike)(schema_1.users.name, "%".concat(trimmed, "%")))))
                        .limit(1)];
                case 7:
                    partialMatches = _c.sent();
                    if (partialMatches.length > 0) {
                        userId = partialMatches[0].id;
                    }
                    _c.label = 8;
                case 8:
                    if (!userId) {
                        throw new server_1.TRPCError({ code: "NOT_FOUND", message: "No matching student found." });
                    }
                    return [4 /*yield*/, fetchFullStudentReportData(db, userId)];
                case 9:
                    reportData = _c.sent();
                    return [2 /*return*/, {
                            format: input.format,
                            message: "Use this structured data for client-side report generation.",
                            data: reportData,
                        }];
            }
        });
    }); }),
    exportTeacherReport: middleware_1.adminQuery
        .input(zod_1.z.object({
        teacherId: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]),
        format: zod_1.z.enum(["pdf", "excel"]).default("excel"),
    }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, userId, parsed, u, reportData;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    if (!(typeof input.teacherId === "string")) return [3 /*break*/, 4];
                    parsed = parseInt(input.teacherId, 10);
                    if (!(!isNaN(parsed) && String(parsed) === input.teacherId.trim())) return [3 /*break*/, 1];
                    userId = parsed;
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, db.query.users.findFirst({
                        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.role, "teacher"), (0, drizzle_orm_1.eq)(schema_1.users.unionId, input.teacherId)),
                    })];
                case 2:
                    u = _c.sent();
                    if (!u)
                        throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Teacher not found with this ID" });
                    userId = u.id;
                    _c.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    userId = input.teacherId;
                    _c.label = 5;
                case 5: return [4 /*yield*/, fetchFullTeacherReportData(db, userId)];
                case 6:
                    reportData = _c.sent();
                    if (ctx.user.role === "academic_head") {
                        reportData.salaries = [];
                        reportData.salaryReport = {
                            config: {
                                basicSalary: 0,
                                group30MinRate: 0,
                                group45MinRate: 0,
                                group60MinRate: 0,
                                oneToOne30MinRate: 0,
                                oneToOne45MinRate: 0,
                                oneToOne60MinRate: 0,
                            },
                            currentMonthBreakdown: {
                                month: "",
                                oneToOne: { min30: { count: 0, earnings: 0 }, min45: { count: 0, earnings: 0 }, min60: { count: 0, earnings: 0 }, totalEarnings: 0 },
                                group: { min30: { count: 0, earnings: 0 }, min45: { count: 0, earnings: 0 }, min60: { count: 0, earnings: 0 }, totalEarnings: 0 },
                                summary: { basicSalary: 0, oneToOneEarnings: 0, groupEarnings: 0, netSalary: 0 }
                            },
                            history: []
                        };
                    }
                    return [2 /*return*/, {
                            format: input.format,
                            message: "Use this structured data for client-side report generation.",
                            data: reportData,
                        }];
            }
        });
    }); }),
    getClassChatReport: middleware_1.adminQuery
        .input(zod_1.z.object({ classId: zod_1.z.number() }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, cls, filters, rows;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.classes.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.classes.id, input.classId) })];
                case 1:
                    cls = _c.sent();
                    if (!cls)
                        return [2 /*return*/, []];
                    filters = [(0, drizzle_orm_1.eq)(schema_1.messages.batchId, cls.batchId)];
                    if (cls.startedAt)
                        filters.push((0, drizzle_orm_1.sql)(templateObject_22 || (templateObject_22 = __makeTemplateObject(["", " >= ", ""], ["", " >= ", ""])), schema_1.messages.createdAt, cls.startedAt));
                    if (cls.endedAt)
                        filters.push((0, drizzle_orm_1.sql)(templateObject_23 || (templateObject_23 = __makeTemplateObject(["", " <= ", ""], ["", " <= ", ""])), schema_1.messages.createdAt, cls.endedAt));
                    return [4 /*yield*/, db
                            .select({
                            studentId: schema_1.messages.senderId,
                            studentName: schema_1.users.name,
                            messageCount: (0, drizzle_orm_1.sql)(templateObject_24 || (templateObject_24 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                        })
                            .from(schema_1.messages)
                            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.messages.senderId, schema_1.users.id))
                            .where(drizzle_orm_1.and.apply(void 0, filters))
                            .groupBy(schema_1.messages.senderId, schema_1.users.name)];
                case 2:
                    rows = _c.sent();
                    return [2 /*return*/, rows.map(function (r) { return ({
                            studentId: r.studentId,
                            studentName: r.studentName,
                            messageCount: Number(r.messageCount),
                        }); })];
            }
        });
    }); }),
    getTeacherChatReport: middleware_1.adminQuery
        .input(zod_1.z.object({ teacherId: zod_1.z.number() }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, teacherClasses, result, _i, teacherClasses_1, cls, filters, rows;
        var _c, _d;
        var input = _b.input;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.classes.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.classes.teacherId, input.teacherId),
                        })];
                case 1:
                    teacherClasses = _e.sent();
                    result = [];
                    _i = 0, teacherClasses_1 = teacherClasses;
                    _e.label = 2;
                case 2:
                    if (!(_i < teacherClasses_1.length)) return [3 /*break*/, 5];
                    cls = teacherClasses_1[_i];
                    filters = [
                        (0, drizzle_orm_1.eq)(schema_1.messages.batchId, cls.batchId),
                        (0, drizzle_orm_1.eq)(schema_1.messages.senderId, input.teacherId),
                    ];
                    if (cls.startedAt)
                        filters.push((0, drizzle_orm_1.sql)(templateObject_25 || (templateObject_25 = __makeTemplateObject(["", " >= ", ""], ["", " >= ", ""])), schema_1.messages.createdAt, cls.startedAt));
                    if (cls.endedAt)
                        filters.push((0, drizzle_orm_1.sql)(templateObject_26 || (templateObject_26 = __makeTemplateObject(["", " <= ", ""], ["", " <= ", ""])), schema_1.messages.createdAt, cls.endedAt));
                    return [4 /*yield*/, db
                            .select({ messageCount: (0, drizzle_orm_1.sql)(templateObject_27 || (templateObject_27 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                            .from(schema_1.messages)
                            .where(drizzle_orm_1.and.apply(void 0, filters))];
                case 3:
                    rows = _e.sent();
                    result.push({
                        classId: cls.id,
                        classTitle: cls.title,
                        messageCount: Number((_d = (_c = rows[0]) === null || _c === void 0 ? void 0 : _c.messageCount) !== null && _d !== void 0 ? _d : 0),
                    });
                    _e.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, result];
            }
        });
    }); }),
    adjustStudentSessions: middleware_1.adminQuery
        .input(zod_1.z.object({
        studentId: zod_1.z.number(),
        allocatedOneToOne: zod_1.z.number().nonnegative(),
        allocatedGroup: zod_1.z.number().nonnegative(),
        reason: zod_1.z.string().optional(),
    }))
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db, profile, prevOneToOne, prevGroup, attendedOneToOne, attendedGroup, totalAllocated, remainingOneToOne, remainingGroup, totalRemaining, activeEnrollment, currentAlloc, adjustDurationCounts, otoRes, grpRes;
        var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_x) {
            switch (_x.label) {
                case 0:
                    if (ctx.user.role !== "super_admin") {
                        throw new server_1.TRPCError({
                            code: "FORBIDDEN",
                            message: "Access Denied: Only Super Admin can adjust session allocations.",
                        });
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, input.studentId),
                        })];
                case 1:
                    profile = _x.sent();
                    if (!profile) {
                        throw new server_1.TRPCError({
                            code: "NOT_FOUND",
                            message: "Student profile not found.",
                        });
                    }
                    prevOneToOne = (_c = profile.allocatedOneToOneSessions) !== null && _c !== void 0 ? _c : 0;
                    prevGroup = (_d = profile.allocatedGroupSessions) !== null && _d !== void 0 ? _d : 0;
                    attendedOneToOne = (_e = profile.attendedOneToOneSessions) !== null && _e !== void 0 ? _e : 0;
                    attendedGroup = (_f = profile.attendedGroupSessions) !== null && _f !== void 0 ? _f : 0;
                    if (input.allocatedOneToOne < attendedOneToOne) {
                        throw new server_1.TRPCError({
                            code: "BAD_REQUEST",
                            message: "Cannot reduce One-to-One sessions below the attended count of ".concat(attendedOneToOne, "."),
                        });
                    }
                    if (input.allocatedGroup < attendedGroup) {
                        throw new server_1.TRPCError({
                            code: "BAD_REQUEST",
                            message: "Cannot reduce Group sessions below the attended count of ".concat(attendedGroup, "."),
                        });
                    }
                    totalAllocated = input.allocatedOneToOne + input.allocatedGroup;
                    remainingOneToOne = input.allocatedOneToOne - attendedOneToOne;
                    remainingGroup = input.allocatedGroup - attendedGroup;
                    totalRemaining = remainingOneToOne + remainingGroup;
                    return [4 /*yield*/, db.query.batchEnrollments.findFirst({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, input.studentId), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.status, "active"))
                        })];
                case 2:
                    activeEnrollment = _x.sent();
                    if (!activeEnrollment) {
                        throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Active enrollment not found for student." });
                    }
                    currentAlloc = {
                        oneToOne: {
                            teacherId: ((_g = activeEnrollment.assignedTeachers) === null || _g === void 0 ? void 0 : _g[0]) || null,
                            sessions30: activeEnrollment.oneOnOne30Allocated,
                            sessions45: activeEnrollment.oneOnOne45Allocated,
                            sessions60: activeEnrollment.oneOnOne60Allocated,
                            completed30: activeEnrollment.oneOnOne30Used,
                            completed45: activeEnrollment.oneOnOne45Used,
                            completed60: activeEnrollment.oneOnOne60Used,
                        },
                        group: {
                            teacherId: ((_h = activeEnrollment.assignedTeachers) === null || _h === void 0 ? void 0 : _h[1]) || ((_j = activeEnrollment.assignedTeachers) === null || _j === void 0 ? void 0 : _j[0]) || null,
                            batchId: activeEnrollment.batchId,
                            sessions30: activeEnrollment.group30Allocated,
                            sessions45: activeEnrollment.group45Allocated,
                            sessions60: activeEnrollment.group60Allocated,
                            completed30: activeEnrollment.group30Used,
                            completed45: activeEnrollment.group45Used,
                            completed60: activeEnrollment.group60Used,
                        }
                    };
                    adjustDurationCounts = function (current30, current45, current60, completed30, completed45, completed60, targetTotal) {
                        var currentTotal = current30 + current45 + current60;
                        var diff = targetTotal - currentTotal;
                        if (diff >= 0) {
                            return {
                                sessions30: current30 + diff,
                                sessions45: current45,
                                sessions60: current60
                            };
                        }
                        else {
                            var toReduce = Math.abs(diff);
                            var new30 = current30;
                            var new45 = current45;
                            var new60 = current60;
                            var maxReduce30 = Math.max(0, new30 - completed30);
                            var reduce30 = Math.min(toReduce, maxReduce30);
                            new30 -= reduce30;
                            toReduce -= reduce30;
                            if (toReduce > 0) {
                                var maxReduce45 = Math.max(0, new45 - completed45);
                                var reduce45 = Math.min(toReduce, maxReduce45);
                                new45 -= reduce45;
                                toReduce -= reduce45;
                            }
                            if (toReduce > 0) {
                                var maxReduce60 = Math.max(0, new60 - completed60);
                                var reduce60 = Math.min(toReduce, maxReduce60);
                                new60 -= reduce60;
                                toReduce -= reduce60;
                            }
                            return {
                                sessions30: new30,
                                sessions45: new45,
                                sessions60: new60
                            };
                        }
                    };
                    otoRes = adjustDurationCounts(((_k = currentAlloc.oneToOne) === null || _k === void 0 ? void 0 : _k.sessions30) || 0, ((_l = currentAlloc.oneToOne) === null || _l === void 0 ? void 0 : _l.sessions45) || 0, ((_m = currentAlloc.oneToOne) === null || _m === void 0 ? void 0 : _m.sessions60) || 0, ((_o = currentAlloc.oneToOne) === null || _o === void 0 ? void 0 : _o.completed30) || 0, ((_p = currentAlloc.oneToOne) === null || _p === void 0 ? void 0 : _p.completed45) || 0, ((_q = currentAlloc.oneToOne) === null || _q === void 0 ? void 0 : _q.completed60) || 0, input.allocatedOneToOne);
                    grpRes = adjustDurationCounts(((_r = currentAlloc.group) === null || _r === void 0 ? void 0 : _r.sessions30) || 0, ((_s = currentAlloc.group) === null || _s === void 0 ? void 0 : _s.sessions45) || 0, ((_t = currentAlloc.group) === null || _t === void 0 ? void 0 : _t.sessions60) || 0, ((_u = currentAlloc.group) === null || _u === void 0 ? void 0 : _u.completed30) || 0, ((_v = currentAlloc.group) === null || _v === void 0 ? void 0 : _v.completed45) || 0, ((_w = currentAlloc.group) === null || _w === void 0 ? void 0 : _w.completed60) || 0, input.allocatedGroup);
                    return [4 /*yield*/, db.transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx.update(schema_1.profiles)
                                            .set({
                                            allocatedOneToOneSessions: input.allocatedOneToOne,
                                            allocatedGroupSessions: input.allocatedGroup,
                                            totalAllocatedSessions: totalAllocated,
                                            remainingOneToOneSessions: remainingOneToOne,
                                            remainingGroupSessions: remainingGroup,
                                            totalRemainingSessions: totalRemaining,
                                            updatedAt: new Date(),
                                        })
                                            .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, input.studentId))];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, tx.update(schema_1.batchEnrollments)
                                                .set({
                                                oneOnOne30Allocated: otoRes.sessions30,
                                                oneOnOne45Allocated: otoRes.sessions45,
                                                oneOnOne60Allocated: otoRes.sessions60,
                                                group30Allocated: grpRes.sessions30,
                                                group45Allocated: grpRes.sessions45,
                                                group60Allocated: grpRes.sessions60,
                                            })
                                                .where((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.id, activeEnrollment.id))];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, tx.insert(schema_1.sessionAllocationLogs).values({
                                                studentId: input.studentId,
                                                changedBy: ctx.user.id,
                                                previousOneToOne: prevOneToOne,
                                                newOneToOne: input.allocatedOneToOne,
                                                previousGroup: prevGroup,
                                                newGroup: input.allocatedGroup,
                                                reason: input.reason || null,
                                            })];
                                    case 3:
                                        _a.sent();
                                        return [4 /*yield*/, (0, sessionHelper_1.updateStudentSessionBalances)(tx, input.studentId)];
                                    case 4:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 3:
                    _x.sent();
                    return [4 /*yield*/, (0, sessionHelper_1.updateStudentSessionBalances)(db, input.studentId)];
                case 4:
                    _x.sent();
                    return [2 /*return*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, input.studentId),
                        })];
            }
        });
    }); }),
    getSessionAllocationLogs: middleware_1.adminQuery
        .input(zod_1.z.object({ studentId: zod_1.z.number() }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var db;
        var input = _b.input;
        return __generator(this, function (_c) {
            db = (0, connection_1.getDb)();
            return [2 /*return*/, db.query.sessionAllocationLogs.findMany({
                    where: (0, drizzle_orm_1.eq)(schema_1.sessionAllocationLogs.studentId, input.studentId),
                    orderBy: (0, drizzle_orm_1.desc)(schema_1.sessionAllocationLogs.changedAt),
                    with: {
                        changedByUser: true,
                    },
                })];
        });
    }); }),
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27;

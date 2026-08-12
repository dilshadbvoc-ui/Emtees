"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentSessionBalances = updateStudentSessionBalances;
var schema_1 = require("@db/schema");
var drizzle_orm_1 = require("drizzle-orm");
var notificationEngine_1 = require("./notificationEngine");
function updateStudentSessionBalances(db, studentId) {
    return __awaiter(this, void 0, void 0, function () {
        var profile, enrollment, existingAlloc, completedO2OSessions, completedO2O30, completedO2O45, completedO2O60, _i, completedO2OSessions_1, item, completedGroupClasses, completedGroup30, completedGroup45, completedGroup60, _a, completedGroupClasses_1, item, sessionsO2O30, sessionsO2O45, sessionsO2O60, sessionsGroup30, sessionsGroup45, sessionsGroup60, alloc, pkg, remainingO2O30, remainingO2O45, remainingO2O60, remainingGroup30, remainingGroup45, remainingGroup60, newAllocationJson, totalAllocatedO2O, totalAllocatedGroup, totalAllocated, totalAttendedO2O, totalAttendedGroup, totalAttended, totalRemainingO2O, totalRemainingGroup, totalRemaining, STUDENT_THRESHOLD, oldRemainingOneToOne, oldRemainingGroup, oldTotalRemaining, adminIds, student, studentName;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
        return __generator(this, function (_z) {
            switch (_z.label) {
                case 0: return [4 /*yield*/, db.query.profiles.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, studentId),
                    })];
                case 1:
                    profile = _z.sent();
                    if (!profile)
                        return [2 /*return*/];
                    return [4 /*yield*/, db.query.batchEnrollments.findFirst({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.status, "active"))
                        })];
                case 2:
                    enrollment = _z.sent();
                    return [4 /*yield*/, db.query.studentClassAllocations.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.studentClassAllocations.studentId, studentId)
                        })];
                case 3:
                    existingAlloc = _z.sent();
                    return [4 /*yield*/, db
                            .select({
                            sessionLength: schema_1.oneToOneSessions.sessionLength,
                            count: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["count(*)"], ["count(*)"])))
                        })
                            .from(schema_1.oneToOneSessions)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.oneToOneSessions.status, "completed"), (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["(", " IS NULL OR ", " >= 25)"], ["(", " IS NULL OR ", " >= 25)"])), schema_1.oneToOneSessions.actualDuration, schema_1.oneToOneSessions.actualDuration)))
                            .groupBy(schema_1.oneToOneSessions.sessionLength)];
                case 4:
                    completedO2OSessions = _z.sent();
                    completedO2O30 = 0;
                    completedO2O45 = 0;
                    completedO2O60 = 0;
                    for (_i = 0, completedO2OSessions_1 = completedO2OSessions; _i < completedO2OSessions_1.length; _i++) {
                        item = completedO2OSessions_1[_i];
                        if (item.sessionLength === 30)
                            completedO2O30 = Number(item.count || 0);
                        else if (item.sessionLength === 45)
                            completedO2O45 = Number(item.count || 0);
                        else if (item.sessionLength === 60)
                            completedO2O60 = Number(item.count || 0);
                    }
                    return [4 /*yield*/, db
                            .select({
                            duration: schema_1.classes.duration,
                            count: (0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["count(*)"], ["count(*)"])))
                        })
                            .from(schema_1.attendance)
                            .innerJoin(schema_1.classes, (0, drizzle_orm_1.eq)(schema_1.attendance.classId, schema_1.classes.id))
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.attendance.status, "present"), (0, drizzle_orm_1.eq)(schema_1.classes.classType, "group")))
                            .groupBy(schema_1.classes.duration)];
                case 5:
                    completedGroupClasses = _z.sent();
                    completedGroup30 = 0;
                    completedGroup45 = 0;
                    completedGroup60 = 0;
                    for (_a = 0, completedGroupClasses_1 = completedGroupClasses; _a < completedGroupClasses_1.length; _a++) {
                        item = completedGroupClasses_1[_a];
                        if (item.duration === 30)
                            completedGroup30 = Number(item.count || 0);
                        else if (item.duration === 45)
                            completedGroup45 = Number(item.count || 0);
                        else if (item.duration === 60)
                            completedGroup60 = Number(item.count || 0);
                    }
                    sessionsO2O30 = 0;
                    sessionsO2O45 = 0;
                    sessionsO2O60 = 0;
                    sessionsGroup30 = 0;
                    sessionsGroup45 = 0;
                    sessionsGroup60 = 0;
                    if (enrollment) {
                        sessionsO2O30 = enrollment.oneOnOne30Allocated || 0;
                        sessionsO2O45 = enrollment.oneOnOne45Allocated || 0;
                        sessionsO2O60 = enrollment.oneOnOne60Allocated || 0;
                        sessionsGroup30 = enrollment.group30Allocated || 0;
                        sessionsGroup45 = enrollment.group45Allocated || 0;
                        sessionsGroup60 = enrollment.group60Allocated || 0;
                    }
                    else if (existingAlloc && existingAlloc.allocation) {
                        alloc = existingAlloc.allocation;
                        sessionsO2O30 = ((_b = alloc.oneToOne) === null || _b === void 0 ? void 0 : _b.sessions30) || 0;
                        sessionsO2O45 = ((_c = alloc.oneToOne) === null || _c === void 0 ? void 0 : _c.sessions45) || 0;
                        sessionsO2O60 = ((_d = alloc.oneToOne) === null || _d === void 0 ? void 0 : _d.sessions60) || 0;
                        sessionsGroup30 = ((_e = alloc.group) === null || _e === void 0 ? void 0 : _e.sessions30) || 0;
                        sessionsGroup45 = ((_f = alloc.group) === null || _f === void 0 ? void 0 : _f.sessions45) || 0;
                        sessionsGroup60 = ((_g = alloc.group) === null || _g === void 0 ? void 0 : _g.sessions60) || 0;
                    }
                    else {
                        pkg = profile.packageConfig || {};
                        sessionsO2O30 = ((_h = pkg.oneToOne) === null || _h === void 0 ? void 0 : _h.min30) || profile.allocatedOneToOneSessions || 0;
                        sessionsO2O45 = ((_j = pkg.oneToOne) === null || _j === void 0 ? void 0 : _j.min45) || 0;
                        sessionsO2O60 = ((_k = pkg.oneToOne) === null || _k === void 0 ? void 0 : _k.min60) || 0;
                        sessionsGroup30 = ((_l = pkg.group) === null || _l === void 0 ? void 0 : _l.min30) || profile.allocatedGroupSessions || 0;
                        sessionsGroup45 = ((_m = pkg.group) === null || _m === void 0 ? void 0 : _m.min45) || 0;
                        sessionsGroup60 = ((_o = pkg.group) === null || _o === void 0 ? void 0 : _o.min60) || 0;
                    }
                    remainingO2O30 = Math.max(0, sessionsO2O30 - completedO2O30);
                    remainingO2O45 = Math.max(0, sessionsO2O45 - completedO2O45);
                    remainingO2O60 = Math.max(0, sessionsO2O60 - completedO2O60);
                    remainingGroup30 = Math.max(0, sessionsGroup30 - completedGroup30);
                    remainingGroup45 = Math.max(0, sessionsGroup45 - completedGroup45);
                    remainingGroup60 = Math.max(0, sessionsGroup60 - completedGroup60);
                    if (!enrollment) return [3 /*break*/, 7];
                    // Update enrollment record
                    return [4 /*yield*/, db.update(schema_1.batchEnrollments)
                            .set({
                            oneOnOne30Used: completedO2O30,
                            oneOnOne45Used: completedO2O45,
                            oneOnOne60Used: completedO2O60,
                            group30Used: completedGroup30,
                            group45Used: completedGroup45,
                            group60Used: completedGroup60,
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.id, enrollment.id))];
                case 6:
                    // Update enrollment record
                    _z.sent();
                    _z.label = 7;
                case 7:
                    newAllocationJson = {
                        oneToOne: {
                            teacherId: enrollment ? (((_p = enrollment.assignedTeachers) === null || _p === void 0 ? void 0 : _p[0]) || null) : (existingAlloc ? (((_r = (_q = existingAlloc.allocation) === null || _q === void 0 ? void 0 : _q.oneToOne) === null || _r === void 0 ? void 0 : _r.teacherId) || null) : null),
                            sessions30: sessionsO2O30,
                            sessions45: sessionsO2O45,
                            sessions60: sessionsO2O60,
                            completed30: completedO2O30,
                            completed45: completedO2O45,
                            completed60: completedO2O60,
                            remaining30: remainingO2O30,
                            remaining45: remainingO2O45,
                            remaining60: remainingO2O60
                        },
                        group: {
                            teacherId: enrollment ? (((_s = enrollment.assignedTeachers) === null || _s === void 0 ? void 0 : _s[1]) || ((_t = enrollment.assignedTeachers) === null || _t === void 0 ? void 0 : _t[0]) || null) : (existingAlloc ? (((_v = (_u = existingAlloc.allocation) === null || _u === void 0 ? void 0 : _u.group) === null || _v === void 0 ? void 0 : _v.teacherId) || null) : null),
                            batchId: enrollment ? enrollment.batchId : null,
                            sessions30: sessionsGroup30,
                            sessions45: sessionsGroup45,
                            sessions60: sessionsGroup60,
                            completed30: completedGroup30,
                            completed45: completedGroup45,
                            completed60: completedGroup60,
                            remaining30: remainingGroup30,
                            remaining45: remainingGroup45,
                            remaining60: remainingGroup60
                        }
                    };
                    if (!existingAlloc) return [3 /*break*/, 9];
                    return [4 /*yield*/, db.update(schema_1.studentClassAllocations)
                            .set({ allocation: newAllocationJson, updatedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.studentClassAllocations.studentId, studentId))];
                case 8:
                    _z.sent();
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, db.insert(schema_1.studentClassAllocations).values({
                        studentId: studentId,
                        allocation: newAllocationJson,
                    })];
                case 10:
                    _z.sent();
                    _z.label = 11;
                case 11:
                    totalAllocatedO2O = sessionsO2O30 + sessionsO2O45 + sessionsO2O60;
                    totalAllocatedGroup = sessionsGroup30 + sessionsGroup45 + sessionsGroup60;
                    totalAllocated = totalAllocatedO2O + totalAllocatedGroup;
                    totalAttendedO2O = completedO2O30 + completedO2O45 + completedO2O60;
                    totalAttendedGroup = completedGroup30 + completedGroup45 + completedGroup60;
                    totalAttended = totalAttendedO2O + totalAttendedGroup;
                    totalRemainingO2O = remainingO2O30 + remainingO2O45 + remainingO2O60;
                    totalRemainingGroup = remainingGroup30 + remainingGroup45 + remainingGroup60;
                    totalRemaining = totalRemainingO2O + totalRemainingGroup;
                    STUDENT_THRESHOLD = 3;
                    oldRemainingOneToOne = (_w = profile.remainingOneToOneSessions) !== null && _w !== void 0 ? _w : 0;
                    oldRemainingGroup = (_x = profile.remainingGroupSessions) !== null && _x !== void 0 ? _x : 0;
                    oldTotalRemaining = (_y = profile.totalRemainingSessions) !== null && _y !== void 0 ? _y : 0;
                    return [4 /*yield*/, db.update(schema_1.profiles)
                            .set({
                            allocatedOneToOneSessions: totalAllocatedO2O,
                            allocatedGroupSessions: totalAllocatedGroup,
                            totalAllocatedSessions: totalAllocated,
                            attendedOneToOneSessions: totalAttendedO2O,
                            attendedGroupSessions: totalAttendedGroup,
                            totalAttendedSessions: totalAttended,
                            remainingOneToOneSessions: totalRemainingO2O,
                            remainingGroupSessions: totalRemainingGroup,
                            totalRemainingSessions: totalRemaining,
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, studentId))];
                case 12:
                    _z.sent();
                    if (!(totalRemainingO2O === STUDENT_THRESHOLD && oldRemainingOneToOne > STUDENT_THRESHOLD)) return [3 /*break*/, 14];
                    return [4 /*yield*/, (0, notificationEngine_1.sendNotification)(studentId, "Low One-to-One Session Balance", "You have only ".concat(totalRemainingO2O, " One-to-One sessions remaining."), "session_threshold")];
                case 13:
                    _z.sent();
                    return [3 /*break*/, 16];
                case 14:
                    if (!(totalRemainingO2O === 0 && oldRemainingOneToOne > 0)) return [3 /*break*/, 16];
                    return [4 /*yield*/, (0, notificationEngine_1.sendNotification)(studentId, "One-to-One Sessions Exhausted", "Your One-to-One session balance has been fully exhausted.", "session_exhausted")];
                case 15:
                    _z.sent();
                    _z.label = 16;
                case 16:
                    if (!(totalRemainingGroup === STUDENT_THRESHOLD && oldRemainingGroup > STUDENT_THRESHOLD)) return [3 /*break*/, 18];
                    return [4 /*yield*/, (0, notificationEngine_1.sendNotification)(studentId, "Low Group Session Balance", "You have only ".concat(totalRemainingGroup, " Group sessions remaining."), "session_threshold")];
                case 17:
                    _z.sent();
                    return [3 /*break*/, 20];
                case 18:
                    if (!(totalRemainingGroup === 0 && oldRemainingGroup > 0)) return [3 /*break*/, 20];
                    return [4 /*yield*/, (0, notificationEngine_1.sendNotification)(studentId, "Group Sessions Exhausted", "Your Group session balance has been fully exhausted.", "session_exhausted")];
                case 19:
                    _z.sent();
                    _z.label = 20;
                case 20: return [4 /*yield*/, (0, notificationEngine_1.getAdminUserIds)()];
                case 21:
                    adminIds = _z.sent();
                    if (!(adminIds.length > 0)) return [3 /*break*/, 26];
                    return [4 /*yield*/, db.query.users.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.users.id, studentId) })];
                case 22:
                    student = _z.sent();
                    studentName = (student === null || student === void 0 ? void 0 : student.name) || "Student";
                    if (!(totalRemaining === STUDENT_THRESHOLD && oldTotalRemaining > STUDENT_THRESHOLD)) return [3 /*break*/, 24];
                    return [4 /*yield*/, (0, notificationEngine_1.sendBulkNotification)(adminIds, "Low Session Balance Alert: ".concat(studentName), "Student ".concat(studentName, " has only ").concat(totalRemaining, " total sessions remaining."), "session_threshold_admin", { studentId: studentId })];
                case 23:
                    _z.sent();
                    return [3 /*break*/, 26];
                case 24:
                    if (!(totalRemaining === 0 && oldTotalRemaining > 0)) return [3 /*break*/, 26];
                    return [4 /*yield*/, (0, notificationEngine_1.sendBulkNotification)(adminIds, "Session Balance Exhausted: ".concat(studentName), "Student ".concat(studentName, " has exhausted all allocated sessions."), "session_exhausted_admin", { studentId: studentId })];
                case 25:
                    _z.sent();
                    _z.label = 26;
                case 26: return [2 /*return*/];
            }
        });
    });
}
var templateObject_1, templateObject_2, templateObject_3;

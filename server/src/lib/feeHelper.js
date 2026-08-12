"use strict";
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
exports.isStudentFeeRestricted = isStudentFeeRestricted;
exports.recalculateStudentFees = recalculateStudentFees;
var connection_1 = require("../queries/connection");
var schema_1 = require("@db/schema");
var drizzle_orm_1 = require("drizzle-orm");
function isStudentFeeRestricted(studentId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, restrictedEnrollment, profile, dueDate, gracePeriodDays, restrictionDate;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.batchEnrollments.findFirst({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.status, "restricted")),
                        })];
                case 1:
                    restrictedEnrollment = _c.sent();
                    if (restrictedEnrollment)
                        return [2 /*return*/, true];
                    return [4 /*yield*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, studentId),
                        })];
                case 2:
                    profile = _c.sent();
                    if (profile && parseFloat((_a = profile.feesBalance) !== null && _a !== void 0 ? _a : "0") > 0 && profile.paymentDueDate) {
                        dueDate = new Date(profile.paymentDueDate);
                        gracePeriodDays = (_b = profile.gracePeriodDays) !== null && _b !== void 0 ? _b : 7;
                        restrictionDate = new Date(dueDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
                        if (new Date() > restrictionDate) {
                            return [2 /*return*/, true];
                        }
                    }
                    return [2 /*return*/, false];
            }
        });
    });
}
function recalculateStudentFees(studentId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, profile, feeConfig, defaultTotal, inserted, paidPayments, feesPaid, finalFee, feesBalance, paymentStatus, paymentDueDate, activeEnrollment, nextUnpaid;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.profiles.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.profiles.userId, studentId),
                        })];
                case 1:
                    profile = _c.sent();
                    if (!profile)
                        return [2 /*return*/];
                    return [4 /*yield*/, db.query.studentFeeConfigurations.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.studentFeeConfigurations.studentId, studentId),
                        })];
                case 2:
                    feeConfig = _c.sent();
                    if (!!feeConfig) return [3 /*break*/, 4];
                    defaultTotal = parseFloat(profile.totalCourseFee || profile.feesTotal || "0");
                    return [4 /*yield*/, db.insert(schema_1.studentFeeConfigurations).values({
                            studentId: studentId,
                            totalCourseFee: String(defaultTotal),
                            discount: "0.00",
                            discountType: "flat",
                            finalFee: String(defaultTotal),
                            paymentMode: ((_a = profile.paymentOption) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === "INSTALLMENT" ? "INSTALLMENT" : "FULL_PAYMENT",
                            downPayment: profile.downPayment || "0.00",
                            numberOfInstallments: 1,
                        }).returning()];
                case 3:
                    inserted = (_c.sent())[0];
                    feeConfig = inserted;
                    _c.label = 4;
                case 4: return [4 /*yield*/, db.query.payments.findMany({
                        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.payments.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.payments.type, "tuition"), (0, drizzle_orm_1.eq)(schema_1.payments.status, "paid")),
                    })];
                case 5:
                    paidPayments = _c.sent();
                    feesPaid = paidPayments.reduce(function (sum, p) { return sum + parseFloat(p.amount); }, 0);
                    finalFee = parseFloat((_b = feeConfig.finalFee) !== null && _b !== void 0 ? _b : "0");
                    feesBalance = Math.max(0, finalFee - feesPaid);
                    paymentStatus = "unpaid";
                    if (feesBalance <= 0) {
                        paymentStatus = "paid";
                    }
                    else if (feesPaid > 0) {
                        paymentStatus = "partial";
                    }
                    paymentDueDate = null;
                    return [4 /*yield*/, db.query.batchEnrollments.findFirst({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.batchEnrollments.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.batchEnrollments.status, "active")),
                        })];
                case 6:
                    activeEnrollment = _c.sent();
                    if (!(activeEnrollment && feesBalance > 0)) return [3 /*break*/, 8];
                    return [4 /*yield*/, db.query.payments.findFirst({
                            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.payments.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.payments.status, "unpaid"), (0, drizzle_orm_1.isNotNull)(schema_1.payments.installmentNumber)),
                            orderBy: (0, drizzle_orm_1.asc)(schema_1.payments.installmentNumber),
                        })];
                case 7:
                    nextUnpaid = _c.sent();
                    if (nextUnpaid === null || nextUnpaid === void 0 ? void 0 : nextUnpaid.dueDate) {
                        paymentDueDate = nextUnpaid.dueDate;
                    }
                    _c.label = 8;
                case 8: 
                // 5. Update student profile for backward compatibility and quick querying
                return [4 /*yield*/, db.update(schema_1.profiles)
                        .set({
                        feesPaid: String(feesPaid),
                        feesBalance: String(feesBalance),
                        remainingBalance: String(feesBalance),
                        totalCourseFee: String(finalFee),
                        feesTotal: String(finalFee),
                        paymentStatus: paymentStatus,
                        paymentDueDate: paymentDueDate,
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, studentId))];
                case 9:
                    // 5. Update student profile for backward compatibility and quick querying
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}

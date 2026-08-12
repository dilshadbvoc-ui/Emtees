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
exports.isNotificationPausedForUser = isNotificationPausedForUser;
exports.sendNotification = sendNotification;
exports.sendBulkNotification = sendBulkNotification;
exports.getAdminUserIds = getAdminUserIds;
var drizzle_orm_1 = require("drizzle-orm");
var connection_1 = require("../queries/connection");
var schema_1 = require("@db/schema");
var socketInstance_1 = require("./socketInstance");
function isNotificationPausedForUser(userId, type) {
    return __awaiter(this, void 0, void 0, function () {
        var CRITICAL_TYPES, db, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    CRITICAL_TYPES = ["security", "password_change", "login_alert", "account_security"];
                    if (CRITICAL_TYPES.includes(type)) {
                        return [2 /*return*/, false];
                    }
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.users.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.users.id, userId),
                            columns: { notificationsPausedUntil: true },
                        })];
                case 1:
                    user = _a.sent();
                    if (user && user.notificationsPausedUntil) {
                        return [2 /*return*/, user.notificationsPausedUntil.getTime() > Date.now()];
                    }
                    return [2 /*return*/, false];
            }
        });
    });
}
function sendNotification(userId, title, message, type, data) {
    return __awaiter(this, void 0, void 0, function () {
        var db, inserted, isPaused, io;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db
                            .insert(schema_1.notifications)
                            .values({ userId: userId, title: title, message: message, type: type, data: data !== null && data !== void 0 ? data : null })
                            .returning()];
                case 1:
                    inserted = (_a.sent())[0];
                    if (!inserted) return [3 /*break*/, 3];
                    return [4 /*yield*/, isNotificationPausedForUser(userId, type)];
                case 2:
                    isPaused = _a.sent();
                    if (!isPaused) {
                        io = (0, socketInstance_1.getIo)();
                        if (io) {
                            io.to("user:".concat(userId)).emit("notification:new", inserted);
                        }
                    }
                    _a.label = 3;
                case 3: return [2 /*return*/, inserted];
            }
        });
    });
}
function sendBulkNotification(userIds, title, message, type, data) {
    return __awaiter(this, void 0, void 0, function () {
        var db, insertedRows, io, _i, insertedRows_1, row, isPaused;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (userIds.length === 0)
                        return [2 /*return*/, []];
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db
                            .insert(schema_1.notifications)
                            .values(userIds.map(function (userId) { return ({ userId: userId, title: title, message: message, type: type, data: data !== null && data !== void 0 ? data : null }); }))
                            .returning()];
                case 1:
                    insertedRows = _a.sent();
                    io = (0, socketInstance_1.getIo)();
                    if (!io) return [3 /*break*/, 5];
                    _i = 0, insertedRows_1 = insertedRows;
                    _a.label = 2;
                case 2:
                    if (!(_i < insertedRows_1.length)) return [3 /*break*/, 5];
                    row = insertedRows_1[_i];
                    return [4 /*yield*/, isNotificationPausedForUser(row.userId, type)];
                case 3:
                    isPaused = _a.sent();
                    if (!isPaused) {
                        io.to("user:".concat(row.userId)).emit("notification:new", row);
                    }
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, insertedRows];
            }
        });
    });
}
function getAdminUserIds() {
    return __awaiter(this, void 0, void 0, function () {
        var db, admins;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, connection_1.getDb)();
                    return [4 /*yield*/, db.query.users.findMany({
                            where: function (u, _a) {
                                var inArray = _a.inArray;
                                return inArray(u.role, ["super_admin", "admin"]);
                            },
                            columns: { id: true },
                        })];
                case 1:
                    admins = _a.sent();
                    return [2 /*return*/, admins.map(function (a) { return a.id; })];
            }
        });
    });
}

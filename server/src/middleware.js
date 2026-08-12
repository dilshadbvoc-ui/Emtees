"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherQuery = exports.adminQuery = exports.authedQuery = exports.publicQuery = exports.createRouter = void 0;
var server_1 = require("@trpc/server");
var superjson_1 = __importDefault(require("superjson"));
var drizzle_orm_1 = require("drizzle-orm");
var connection_1 = require("./queries/connection");
var schema_1 = require("@db/schema");
var t = server_1.initTRPC.context().create({
    transformer: superjson_1.default,
});
exports.createRouter = t.router;
exports.publicQuery = t.procedure;
exports.authedQuery = t.procedure.use(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var db, dbUser;
    var ctx = _b.ctx, next = _b.next;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!ctx.user) {
                    throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "Please sign in" });
                }
                if (!ctx.user.sessionToken) return [3 /*break*/, 2];
                db = (0, connection_1.getDb)();
                return [4 /*yield*/, db.query.users.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.users.id, ctx.user.id) })];
            case 1:
                dbUser = _c.sent();
                if (!dbUser || dbUser.deviceToken !== ctx.user.sessionToken) {
                    throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "Your account has been logged in from another device. You have been signed out." });
                }
                _c.label = 2;
            case 2: return [2 /*return*/, next({ ctx: __assign(__assign({}, ctx), { user: ctx.user }) })];
        }
    });
}); });
exports.adminQuery = exports.authedQuery.use(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var allowedRoles;
    var ctx = _b.ctx, next = _b.next;
    return __generator(this, function (_c) {
        allowedRoles = ["super_admin", "admin", "academic_head"];
        if (!allowedRoles.includes(ctx.user.role)) {
            throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return [2 /*return*/, next({ ctx: ctx })];
    });
}); });
exports.teacherQuery = exports.authedQuery.use(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var allowedRoles;
    var ctx = _b.ctx, next = _b.next;
    return __generator(this, function (_c) {
        allowedRoles = ["super_admin", "admin", "academic_head", "teacher"];
        if (!allowedRoles.includes(ctx.user.role)) {
            throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Teacher access required" });
        }
        return [2 /*return*/, next({ ctx: ctx })];
    });
}); });

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtSecret = exports.env = void 0;
require("dotenv/config");
function required(name) {
    var value = process.env[name];
    if (!value && process.env.NODE_ENV === "production") {
        throw new Error("Missing required environment variable: ".concat(name));
    }
    return value !== null && value !== void 0 ? value : "";
}
exports.env = {
    appId: required("APP_ID"),
    appSecret: required("APP_SECRET"),
    isProduction: process.env.NODE_ENV === "production",
    databaseUrl: required("DATABASE_URL"),
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mockkeyid12345",
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "mockkeysecret67890",
    studentIdPrefix: process.env.STUDENT_ID_PREFIX || "S",
};
exports.jwtSecret = new TextEncoder().encode(exports.env.appSecret || "emtees-academy-secret-key-2024");

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setIo = setIo;
exports.getIo = getIo;
/**
 * Store the socket.io Server instance globally.
 * Called once: in the Vite plugin (dev) or in boot.ts (production).
 */
function setIo(instance) {
    global.__io = instance;
}
/**
 * Retrieve the active socket.io Server instance.
 * Returns null before the server has been initialised.
 */
function getIo() {
    var _a;
    return (_a = global.__io) !== null && _a !== void 0 ? _a : null;
}

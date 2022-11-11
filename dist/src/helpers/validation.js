"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidationSchema = exports.guestValidationSchema = exports.userValidationSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.userValidationSchema = zod_1.default.object({
    name: zod_1.default.string().min(1).max(20),
    password: zod_1.default.string().min(1),
    email: zod_1.default.string().min(1),
});
exports.guestValidationSchema = zod_1.default.object({
    name: zod_1.default.string().min(1).max(20),
});
exports.loginValidationSchema = zod_1.default.object({
    email: zod_1.default.string().min(1),
    password: zod_1.default.string().min(1),
});

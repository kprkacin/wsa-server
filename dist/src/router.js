"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("./helpers/validation");
const User_1 = __importDefault(require("./models/User"));
const middleware_1 = require("./middleware");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    res.send("WSA-SERVER");
});
router.post("/api/auth/guest", async (req, res) => {
    console.log(req, res);
    const newUser = req.body;
    try {
        validation_1.userValidationSchema.parse(newUser);
        const user = await User_1.default.create(newUser);
        const token = (0, middleware_1.generateToken)(user.name, user._id);
        res.send({ user, token });
    }
    catch (error) {
        console.log("ERROR");
        res.send(error);
    }
});
router.get("/api/auth/users", middleware_1.verifyToken, async (req, res) => {
    console.log("in auth", res.locals.user);
    console.log(req, res);
    try {
        const users = await User_1.default.find({});
        res.send(users);
    }
    catch (error) {
        console.log("ERROR");
        res.send(error);
    }
});
exports.default = router;

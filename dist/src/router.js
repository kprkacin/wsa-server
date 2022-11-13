"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("./helpers/validation");
const User_1 = __importDefault(require("./models/User"));
const middleware_1 = require("./middleware");
const Result_1 = __importDefault(require("./models/Result"));
const bcryptjs_1 = require("bcryptjs");
const Rank_1 = __importDefault(require("./models/Rank"));
const Replay_1 = __importDefault(require("./models/Replay"));
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    res.send("WSA-SERVER");
});
router.post("/api/auth/register", async (req, res) => {
    const newUser = req.body;
    console.log(!newUser.email);
    if (!newUser.email) {
        try {
            validation_1.guestValidationSchema.parse(newUser);
            const user = await User_1.default.create(newUser);
            const token = (0, middleware_1.generateToken)(user.name, user._id);
            res.send({ user, token });
        }
        catch (error) {
            console.log(error);
            res.status(401).send(error);
        }
    }
    else {
        try {
            validation_1.userValidationSchema.parse(newUser);
            (0, bcryptjs_1.hash)(newUser.password, 10, async (err, hash) => {
                const user = await User_1.default.create(Object.assign(Object.assign({}, newUser), { password: hash }));
                const token = (0, middleware_1.generateToken)(user.name, user._id);
                res.send({ user, token });
            });
        }
        catch (error) {
            console.log("ERROR");
            res.status(401).send(error);
        }
    }
});
router.post("/api/auth/login", async (req, res) => {
    const newUser = req.body;
    try {
        validation_1.loginValidationSchema.parse(newUser);
        const user = await User_1.default.findOne({ email: newUser.email });
        console.log("user", user);
        if (!user) {
            res.status(401).send("User not found");
            return;
        }
        (0, bcryptjs_1.compare)(newUser.password, user.password, function (err, result) {
            if (result) {
                const token = (0, middleware_1.generateToken)(user.name, user._id);
                res.send({ user, token });
            }
            else {
                res.status(401).send("Wrong password");
            }
        });
    }
    catch (error) {
        console.log("ERROR");
        res.status(401).send(error);
    }
});
router.get("/api/auth/users", middleware_1.verifyToken, async (req, res) => {
    try {
        const users = await User_1.default.find({});
        res.send(users);
    }
    catch (error) {
        console.log("ERROR");
        res.send(error);
    }
});
router.get("/api/results", middleware_1.verifyToken, async (req, res) => {
    const limit = req.query.limit;
    console.log("limit", limit);
    try {
        const results = await Result_1.default.find({}).limit(Number(limit));
        res.send(results);
    }
    catch (error) {
        console.log("ERROR");
        res.send(error);
    }
});
router.get("/api/results/:id", middleware_1.verifyToken, async (req, res) => {
    const id = req.params.id;
    const limit = req.params.limit;
    try {
        const results = await Result_1.default.find({
            $or: [{ playerX: id }, { playerO: id }],
        });
        res.send(results);
    }
    catch (error) {
        console.log("ERROR");
        res.send(error);
    }
});
router.get("/api/auth/active", middleware_1.verifyToken, async (req, res) => {
    try {
        const user = await User_1.default.findOne({ _id: res.locals.user.id });
        res.send({ user: user });
    }
    catch (error) {
        console.log("ERROR");
        res.send(error);
    }
});
router.get("/api/user/:id", middleware_1.verifyToken, async (req, res) => {
    const id = req.params.id;
    try {
        const user = await User_1.default.findOne({ _id: id });
        res.send({ user: user });
    }
    catch (error) {
        console.log("ERROR");
        res.send(error);
    }
});
router.get("/api/users", middleware_1.verifyToken, async (req, res) => {
    const id = req.params.id;
    try {
        const users = await User_1.default.find({});
        res.send(users);
    }
    catch (error) {
        console.log("ERROR");
        res.send(error);
    }
});
router.get("/api/ranks", middleware_1.verifyToken, async (req, res) => {
    try {
        const ranks = await Rank_1.default.find();
        res.send({ ranks });
    }
    catch (error) {
        console.log("ERROR");
        res.send(error);
    }
});
router.get("/api/ranks/:id", middleware_1.verifyToken, async (req, res) => {
    const id = req.params.id;
    try {
        const rank = await Rank_1.default.findOne({ userId: id });
        res.send({ rank });
    }
    catch (error) {
        console.log("ERROR");
        res.send(error);
    }
});
router.get("/api/replay/:id", middleware_1.verifyToken, async (req, res) => {
    const id = req.params.id;
    try {
        const replay = await Replay_1.default.findOne({ resultId: id });
        res.send({ replay });
    }
    catch (error) {
        console.log("ERROR");
        res.send(error);
    }
});
exports.default = router;

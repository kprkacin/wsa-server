"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const mongoose_1 = __importDefault(require("mongoose"));
const router_1 = __importDefault(require("./src/router"));
const socketio_1 = __importDefault(require("./src/socketio"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
mongoose_1.default.connect("mongodb://mongo:27017/docker-db");
const app = (0, express_1.default)();
const port = process.env.PORT;
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: "http://localhost:5173" }));
app.use(express_1.default.urlencoded({ extended: true }));
const server = (0, http_1.createServer)(app);
server.listen(port);
socketio_1.default.attach(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
    },
});
app.use(router_1.default);

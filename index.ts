import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { Server, Socket } from "socket.io";
import http, { createServer } from "http";
import mongoose from "mongoose";
import router from "./src/router";
import io from "./src/socketio";
dotenv.config();
mongoose.connect("mongodb://mongo:27017/docker-db");
const app: Express = express();
const port = process.env.PORT;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = createServer(app);
server.listen(port);

io.attach(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

app.use(router);

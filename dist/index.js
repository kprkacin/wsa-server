"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const server = (0, http_1.createServer)(app);
const clients = {};
const addClient = (socket) => {
    console.log("New client connected", socket.id);
    clients[socket.id] = socket;
};
const removeClient = (socket) => {
    console.log("Client disconnected", socket.id);
    delete clients[socket.id];
};
server.listen(port);
const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
    },
});
app.get("/", (req, res) => {
    res.send("Express + TypeScript Serve r test");
});
io.on("connection", (socket) => {
    console.log("firstConnection");
    let id = socket.id;
    addClient(socket);
    socket.on("disconnect", () => {
        removeClient(socket);
        socket.broadcast.emit("clientdisconnect", id);
    });
});
var players = {};
var unmatched;
const joinGame = (socket) => {
    // Add the player to our object of players
    players[socket.id] = {
        // The opponent will either be the socket that is
        // currently unmatched, or it will be null if no
        // players are unmatched
        opponent: unmatched,
        // The symbol will become 'O' if the player is unmatched
        symbol: "X",
        // The socket that is associated with this player
        socket: socket,
    };
    // Every other player is marked as 'unmatched', which means
    // there is not another player to pair them with yet. As soon
    // as the next socket joins, the unmatched player is paired with
    // the new socket and the unmatched variable is set back to null
    if (unmatched) {
        players[socket.id].symbol = "O";
        players[unmatched].opponent = socket.id;
        unmatched = null;
    }
    else {
        unmatched = socket.id;
    }
};
// Returns the opponent socket
function getOpponent(socket) {
    if (!players[socket.id].opponent) {
        return;
    }
    return players[players[socket.id].opponent].socket;
}
io.on("connection", (socket) => {
    console.log("secondConnection");
    joinGame(socket);
    //  console.log(clients, players);
    // Once the socket has an opponent, we can begin the game
    if (getOpponent(socket)) {
        socket.emit("game.begin", {
            symbol: players[socket.id].symbol,
        });
        getOpponent(socket).emit("game.begin", {
            symbol: players[getOpponent(socket).id].symbol,
        });
    }
    // Listens for a move to be made and emits an event to both
    // players after the move is completed
    socket.on("make.move", function (data) {
        if (!getOpponent(socket)) {
            return;
        }
        console.log("data", data);
        socket.emit("move.made", data);
        getOpponent(socket).emit("move.made", data);
    });
    // Emit an event to the opponent when the player leaves
    socket.on("disconnect", function () {
        if (getOpponent(socket)) {
            getOpponent(socket).emit("opponent.left");
        }
    });
});

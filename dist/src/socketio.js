"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const Player_1 = require("./types/Player");
const helpers_1 = require("./helpers/helpers");
const Square_1 = require("./types/Square");
const Result_1 = __importDefault(require("./models/Result"));
const Rank_1 = __importDefault(require("./models/Rank"));
const Replay_1 = __importDefault(require("./models/Replay"));
const io = new socket_io_1.Server();
const clients = {};
const players = {};
const addClient = (socket) => {
    console.log("New client connected", socket.id);
    clients[socket.id] = socket;
};
const removeClient = (socket) => {
    console.log("Client disconnected", socket.id);
    delete clients[socket.id];
    delete players[socket.id];
};
setInterval(() => {
    console.log("Players", players);
    const queuedPlayers = Object.values(players).filter((p) => p.playerState === Player_1.PlayerStates.QUEUED);
    if (queuedPlayers.length < 2) {
        return;
    }
    for (let i = 0; i < queuedPlayers.length; i = i + 2) {
        const playerOne = queuedPlayers[i];
        const playerTwo = queuedPlayers[i + 1];
        if (!playerOne || !playerTwo) {
            break;
        }
        players[playerOne.socket.id] = Object.assign(Object.assign({}, playerOne), { opponent: playerTwo.socket.id, playerState: Player_1.PlayerStates.IN_GAME, turn: true, symbol: Square_1.SquareSymbol.X });
        players[playerTwo.socket.id] = Object.assign(Object.assign({}, playerTwo), { opponent: playerOne.socket.id, playerState: Player_1.PlayerStates.IN_GAME, turn: false, symbol: Square_1.SquareSymbol.O });
        console.log("emitting");
        playerOne.socket.emit("game.begin", {
            symbol: Square_1.SquareSymbol.X,
            turn: true,
        });
        playerTwo.socket.emit("game.begin", {
            symbol: Square_1.SquareSymbol.O,
            turn: false,
        });
    }
}, 10 * 1000);
const joinGame = (socket) => {
    // Add the player to our object of players
    players[socket.id] = {
        // The opponent will either be the socket that is
        // currently unmatched, or it will be null if no
        // players are unmatched
        opponent: null,
        // The symbol will become 'O' if the player is unmatched
        symbol: "X",
        // The socket that is associated with this player
        socket: socket,
        turn: false,
        playerState: Player_1.PlayerStates.ACTIVE,
        userId: null,
    };
};
// Returns the opponent socket
const getOpponent = (id) => {
    var _a;
    const opponentId = (_a = players[id]) === null || _a === void 0 ? void 0 : _a.opponent;
    if (!opponentId) {
        return null;
    }
    const opponent = players[opponentId];
    return opponent.socket;
};
io.on("connection", (socket) => {
    console.log("firstConnection");
    addClient(socket);
    joinGame(socket);
    socket.on("user.id", (userId) => {
        players[socket.id].userId = userId;
        Rank_1.default.findOne({ userId: userId }).then((rank) => {
            if (!rank) {
                const newRank = new Rank_1.default({
                    userId: userId,
                    wins: 0,
                    losses: 0,
                });
                newRank.save();
            }
        });
    });
    socket.on("disconnect", () => {
        removeClient(socket);
        socket.broadcast.emit("clientdisconnect", socket.id);
    });
});
io.on("connection", (socket) => {
    socket.on("queuing", (data) => {
        players[socket.id].playerState = data;
    });
    const data2 = [];
    socket.on("make.move", (data) => {
        const opponent = getOpponent(socket.id);
        if (!opponent) {
            return;
        }
        data2.push(data);
        opponent.on("make.move", (data) => {
            data2.push(data);
        });
        players[opponent.id].turn = !players[opponent.id].turn;
        players[socket.id].turn = !players[socket.id].turn;
        socket.emit("move.made", { squares: data, turn: players[socket.id].turn });
        opponent.emit("move.made", {
            squares: data,
            turn: players[opponent.id].turn,
        });
        const winner = (0, helpers_1.defineWinner)(data);
        if (winner) {
            console.log(data2);
            socket.emit("game.over", { winner });
            opponent.emit("game.over", { winner });
            try {
                Result_1.default.create({
                    winner: winner === Square_1.SquareSymbol.X
                        ? players[socket.id].userId
                        : players[opponent.id].userId,
                    playerX: players[socket.id].userId,
                    playerO: players[opponent.id].userId,
                }).then((result) => {
                    Replay_1.default.create({ replay: data2, resultId: result._id });
                });
                //find one and update with upsert
                Rank_1.default.findOneAndUpdate({ userId: players[socket.id].userId }, { $inc: { wins: 1 } }, { upsert: true, new: true }).exec();
                Rank_1.default.findOneAndUpdate({ userId: players[opponent.id].userId }, { $inc: { losses: 1 } }, { upsert: true, new: true }).exec();
            }
            catch (error) { }
        }
    });
    // Emit an event to the opponent when the player leaves
    socket.on("disconnect", function () {
        const opponent = getOpponent(socket.id);
        if (opponent) {
            opponent.emit("opponent.left");
        }
    });
});
// lobby chat
io.on("connection", (socket) => {
    socket.on("lobby.message.send", (data) => {
        console.log("lobby.message.send", data);
        socket.broadcast.emit("lobby.message.received", { data });
    });
});
// game chat
io.on("connection", (socket) => {
    socket.on("game.message.send", (data) => {
        const opponent = getOpponent(socket.id);
        if (!opponent) {
            return;
        }
        opponent.emit("game.message.received", {
            data,
        });
    });
});
exports.default = io;

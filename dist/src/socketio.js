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
console.log(players);
setInterval(() => {
    console.log("players", players);
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
    socket.on("disconnect", () => {
        removeClient(socket);
        socket.broadcast.emit("clientdisconnect", socket.id);
    });
});
io.on("connection", (socket) => {
    socket.on("queuing", (data) => {
        players[socket.id].playerState = data;
    });
    socket.on("make.move", (data) => {
        const opponent = getOpponent(socket.id);
        if (!opponent) {
            return;
        }
        players[opponent.id].turn = !players[opponent.id].turn;
        players[socket.id].turn = !players[socket.id].turn;
        socket.emit("move.made", { squares: data, turn: players[socket.id].turn });
        opponent.emit("move.made", {
            squares: data,
            turn: players[opponent.id].turn,
        });
        const winner = (0, helpers_1.defineWinner)(data);
        if (winner) {
            socket.emit("game.over", { winner });
            opponent.emit("game.over", { winner });
            try {
                Result_1.default.create({
                    winner: winner === Square_1.SquareSymbol.X ? socket.id : opponent.id,
                    playerX: socket.id,
                    playerO: opponent.id,
                });
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
exports.default = io;

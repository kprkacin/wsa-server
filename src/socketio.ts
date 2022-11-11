import { Server, Socket } from "socket.io";
import http, { createServer } from "http";
import { PlayerCollection, PlayerStates } from "./types/Player";
import { defineWinner } from "./helpers/helpers";
import { ClientCollection } from "./types/Client";
import { SquareSymbol } from "./types/Square";
import ResultModel from "./models/Result";

const io = new Server();

const clients: ClientCollection = {};
const players: PlayerCollection = {};

const addClient = (socket: Socket) => {
  console.log("New client connected", socket.id);
  clients[socket.id] = socket;
};
const removeClient = (socket: Socket) => {
  console.log("Client disconnected", socket.id);
  delete clients[socket.id];
  delete players[socket.id];
};

console.log(players);
setInterval(() => {
  console.log("players", players);
  const queuedPlayers = Object.values(players).filter(
    (p) => p.playerState === PlayerStates.QUEUED
  );
  if (queuedPlayers.length < 2) {
    return;
  }

  for (let i = 0; i < queuedPlayers.length; i = i + 2) {
    const playerOne = queuedPlayers[i];
    const playerTwo = queuedPlayers[i + 1];

    if (!playerOne || !playerTwo) {
      break;
    }
    players[playerOne.socket.id] = {
      ...playerOne,
      opponent: playerTwo.socket.id,
      playerState: PlayerStates.IN_GAME,
      turn: true,
      symbol: SquareSymbol.X,
    };
    players[playerTwo.socket.id] = {
      ...playerTwo,
      opponent: playerOne.socket.id,
      playerState: PlayerStates.IN_GAME,
      turn: false,
      symbol: SquareSymbol.O,
    };
    console.log("emitting");
    playerOne.socket.emit("game.begin", {
      symbol: SquareSymbol.X,
      turn: true,
    });

    playerTwo.socket.emit("game.begin", {
      symbol: SquareSymbol.O,
      turn: false,
    });
  }
}, 10 * 1000);

const joinGame = (socket: Socket) => {
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
    playerState: PlayerStates.ACTIVE,
  };
};

// Returns the opponent socket
const getOpponent = (id: string): Socket | null => {
  const opponentId = players[id]?.opponent;

  if (!opponentId) {
    return null;
  }

  const opponent = players[opponentId];

  return opponent.socket;
};

io.on("connection", (socket: Socket) => {
  console.log("firstConnection");

  addClient(socket);
  joinGame(socket);

  socket.on("disconnect", () => {
    removeClient(socket);
    socket.broadcast.emit("clientdisconnect", socket.id);
  });
});

io.on("connection", (socket: Socket) => {
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

    const winner = defineWinner(data);
    if (winner) {
      socket.emit("game.over", { winner });
      opponent.emit("game.over", { winner });

      try {
        ResultModel.create({
          winner: winner === SquareSymbol.X ? socket.id : opponent.id,
          playerX: socket.id,
          playerO: opponent.id,
        });
      } catch (error) {}
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

export default io;

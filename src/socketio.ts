import { Server, Socket } from "socket.io";
import http, { createServer } from "http";
import { PlayerCollection, PlayerStates } from "./types/Player";
import { defineWinner } from "./helpers/helpers";
import { ClientCollection } from "./types/Client";
import { Square, SquareSymbol } from "./types/Square";
import ResultModel from "./models/Result";
import RankModel from "./models/Rank";
import ReplayModel from "./models/Replay";

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

setInterval(() => {
  console.log("Players", players);
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
    userId: null,
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

  socket.on("user.id", (userId: string) => {
    players[socket.id].userId = userId;

    RankModel.findOne({ userId: userId }).then((rank) => {
      if (!rank) {
        const newRank = new RankModel({
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

io.on("connection", (socket: Socket) => {
  socket.on("queuing", (data) => {
    players[socket.id].playerState = data;
  });
  const data2: Square[][] = [];

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

    const winner = defineWinner(data);
    if (winner) {
      console.log(data2);
      socket.emit("game.over", { winner });
      opponent.emit("game.over", { winner });

      try {
        ResultModel.create({
          winner:
            winner === players[socket.id].symbol
              ? players[socket.id].userId
              : players[opponent.id].userId,
          playerX: players[socket.id].userId,
          playerO: players[opponent.id].userId,
        }).then((result) => {
          ReplayModel.create({ replay: data2, resultId: result._id });
        });
        //find one and update with upsert
        RankModel.findOneAndUpdate(
          { userId: players[socket.id].userId },
          { $inc: { wins: 1 } },
          { upsert: true, new: true }
        ).exec();
        RankModel.findOneAndUpdate(
          { userId: players[opponent.id].userId },
          { $inc: { losses: 1 } },
          { upsert: true, new: true }
        ).exec();
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

// lobby chat
io.on("connection", (socket: Socket) => {
  socket.on("lobby.message.send", (data) => {
    console.log("lobby.message.send", data);
    socket.broadcast.emit("lobby.message.received", { data });
  });
});

// game chat
io.on("connection", (socket: Socket) => {
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

export default io;

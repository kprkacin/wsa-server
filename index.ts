import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { Server, Socket } from "socket.io";
import http, { createServer } from "http";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

const server = createServer(app);

const clients: any = {};

const addClient = (socket: Socket) => {
  console.log("New client connected", socket.id);
  clients[socket.id] = socket;
};
const removeClient = (socket: Socket) => {
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

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Serve r test");
});

io.on("connection", (socket: Socket) => {
  console.log("firstConnection");
  let id = socket.id;

  addClient(socket);

  socket.on("disconnect", () => {
    removeClient(socket);
    socket.broadcast.emit("clientdisconnect", id);
  });
});

var players: any = {};
var unmatched: any;

const joinGame = (socket: Socket) => {
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
  } else {
    unmatched = socket.id;
  }
};

// Returns the opponent socket
function getOpponent(socket: Socket) {
  if (!players[socket.id].opponent) {
    return;
  }

  return players[players[socket.id].opponent].socket;
}

io.on("connection", (socket: Socket) => {
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

import { Socket } from "socket.io";

export enum PlayerStates {
  "ACTIVE" = "ACTIVE",
  "QUEUED" = "QUEUED",
  "IN_GAME" = "IN_GAME",
}

export interface Player {
  symbol: string;
  socket: Socket;
  opponent: string | null;
  turn: boolean;
  playerState: PlayerStates;
}

export interface PlayerCollection {
  [key: string]: Player;
}

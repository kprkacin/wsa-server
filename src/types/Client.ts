import { Socket } from "socket.io";

export interface ClientCollection {
  [key: string]: Socket;
}

// src/socket.js
import { io } from "socket.io-client";

let socket;

export const initSocket = (userId) => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      auth: { userId } // attach userId during handshake
    });
  }
  return socket;
};

export const getSocket = () => socket;

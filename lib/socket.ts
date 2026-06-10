import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketUrl = () => {
  let socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  try {
    const url = new URL(socketUrl);
    socketUrl = url.origin;
  } catch (error) {
    console.error("Invalid API_BASE_URL for socket connection:", error);
  }
  return socketUrl;
};

export const getSocket = (token: string) => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: false,
    });
  }

  return socket;
};

export const authenticateSocket = (socketInstance: Socket, token: string) => {
  socketInstance.emit("authenticate", { token });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

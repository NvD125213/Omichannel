"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import { getAccessToken } from "@/lib/auth";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = getSocket(token);

    function onConnect() {
      setIsConnected(true);
      console.log("Socket connected");
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log("Socket disconnected");
    }

    // Nếu socket instance đã tồn tại (singleton) nhưng chưa connect hoặc auth cũ
    if (socketInstance) {
      socketInstance.auth = { token }; // Update token mới nhất
      if (!socketInstance.connected) {
        socketInstance.connect();
      } else {
        // Nếu đã connect rồi (từ đâu đó), set state
        setIsConnected(true);
      }
    }

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);

    setSocket(socketInstance);

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      // Không disconnect ở đây vì singleton có thể được dùng lại,
      // hoặc logic app muốn giữ connection khi navigate.
      // Tuy nhiên nếu Provider unmount (ví dụ user logout), socket nên disconnect.
      // Tùy thuộc vào kiến trúc. Để an toàn, remove listeners là đủ.
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

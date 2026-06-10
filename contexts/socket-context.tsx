"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Socket } from "socket.io-client";
import {
  authenticateSocket,
  disconnectSocket,
  getSocket,
} from "@/lib/socket";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isAuthenticated: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated: isUserAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getAccessToken();

    if (!isUserAuthenticated || !token) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      setIsAuthenticated(false);
      return;
    }

    const socketInstance = getSocket(token);

    const sendAuthenticate = () => {
      const latestToken = getAccessToken();
      if (latestToken) {
        authenticateSocket(socketInstance, latestToken);
      }
    };

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
      setIsAuthenticated(false);
    }

    function onConnectionEstablished() {
      sendAuthenticate();
    }

    function onAuthenticated(data: Record<string, unknown>) {
      setIsAuthenticated(true);
      if (process.env.NODE_ENV === "development") {
        console.log("[socket] authenticated — joined tenant room", data);
      }
    }

    function onAnyEvent(eventName: string, ...args: unknown[]) {
      if (process.env.NODE_ENV !== "development") return;
      if (eventName === "connect" || eventName === "disconnect") return;
      console.log("[socket] ←", eventName, args.length === 1 ? args[0] : args);
    }

    function onAuthenticationError(error: { message?: string }) {
      setIsAuthenticated(false);
      console.error("[socket] authentication failed:", error?.message);
    }

    // Gắn listener TRƯỚC khi connect để không bỏ lỡ connection_established
    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    socketInstance.on("connection_established", onConnectionEstablished);
    socketInstance.on("authenticated", onAuthenticated);
    socketInstance.on("authentication_error", onAuthenticationError);

    socketInstance.onAny(onAnyEvent);

    if (!socketInstance.connected) {
      socketInstance.connect();
    } else {
      setIsConnected(true);
      sendAuthenticate();
    }

    setSocket(socketInstance);

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      socketInstance.off("connection_established", onConnectionEstablished);
      socketInstance.off("authenticated", onAuthenticated);
      socketInstance.off("authentication_error", onAuthenticationError);
      socketInstance.offAny(onAnyEvent);
    };
  }, [isUserAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, isAuthenticated }}>
      {children}
    </SocketContext.Provider>
  );
};

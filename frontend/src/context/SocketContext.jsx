import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "../api/axios";

const SocketContext = createContext(null);
const SOCKET_URL = API_BASE_URL.replace("/api", "");

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      const mandalId = typeof user.mandal === "object" ? user.mandal?._id : user.mandal;
      if (mandalId) {
        socket.emit("join_mandal", { mandalId, userId: user._id, name: user.name });
      }
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("online_count", ({ count, users }) => {
      setOnlineCount(count);
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineCount, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

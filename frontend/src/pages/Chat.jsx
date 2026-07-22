import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { FaPaperPlane, FaUserCircle } from "react-icons/fa";

export default function Chat() {
  const { user } = useAuth();
  const { socket, connected, onlineCount, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    api.get("/chat").then((res) => setMessages(res.data.messages)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleReceive = (message) => setMessages((prev) => [...prev, message]);
    socket.on("receive_message", handleReceive);
    return () => socket.off("receive_message", handleReceive);
  }, [socket]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post("/chat", { text: text.trim() });
      setText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-maroon-700">Mandal Chat</h1>
            <p className="text-gray-500 text-sm">Stay connected with live member chat.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            <span className={`badge ${connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {connected ? "Live" : "Connecting..."}
            </span>
            <span className="badge bg-orange-100 text-orange-700">
              {onlineCount} online
            </span>
          </div>
        </div>
        {onlineUsers.length > 0 && (
          <div className="mb-4 text-sm text-gray-500">
            Online: {onlineUsers.join(", ")}
          </div>
        )}

        <div className="card p-4 h-[60vh] overflow-y-auto space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-12">No messages yet. Waiting for admin updates.</div>
          ) : (
            messages.map((message) => (
              <div key={message._id} className={`rounded-3xl p-4 ${message.sender === user._id ? "bg-orange-100 self-end" : "bg-white"}`}>
                <div className="flex items-center gap-3 mb-2 text-sm text-gray-500">
                  <FaUserCircle />
                  <span>{message.senderName}</span>
                  <span>· {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="text-gray-700">{message.text}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary inline-flex items-center gap-2">
            <FaPaperPlane /> Send
          </button>
        </form>
      </div>
    </div>
  );
}

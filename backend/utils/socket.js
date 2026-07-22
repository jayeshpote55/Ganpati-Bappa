const ChatMessage = require("../models/ChatMessage");

let ioInstance = null;
const onlineUsers = new Map(); // mandalId -> Set of {userId, name}

function initSocket(io) {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // User joins their mandal's room for real-time updates
    socket.on("join_mandal", ({ mandalId, userId, name }) => {
      socket.join(`mandal_${mandalId}`);
      socket.mandalId = mandalId;
      socket.userId = userId;
      socket.userName = name;

      if (!onlineUsers.has(mandalId)) onlineUsers.set(mandalId, new Map());
      onlineUsers.get(mandalId).set(userId, name);

      io.to(`mandal_${mandalId}`).emit("online_count", {
        count: onlineUsers.get(mandalId).size,
        users: Array.from(onlineUsers.get(mandalId).values()),
      });
    });

    // Live group chat scoped to a mandal
    socket.on("send_message", async ({ mandalId, userId, name, text }) => {
      try {
        const msg = await ChatMessage.create({ mandal: mandalId, sender: userId, senderName: name, text });
        io.to(`mandal_${mandalId}`).emit("receive_message", {
          _id: msg._id,
          sender: userId,
          senderName: name,
          text,
          createdAt: msg.createdAt,
        });
      } catch (err) {
        console.error("Socket message error:", err.message);
      }
    });

    socket.on("typing", ({ mandalId, name }) => {
      socket.to(`mandal_${mandalId}`).emit("user_typing", { name });
    });

    socket.on("disconnect", () => {
      if (socket.mandalId && onlineUsers.has(socket.mandalId)) {
        onlineUsers.get(socket.mandalId).delete(socket.userId);
        io.to(`mandal_${socket.mandalId}`).emit("online_count", {
          count: onlineUsers.get(socket.mandalId).size,
          users: Array.from(onlineUsers.get(socket.mandalId).values()),
        });
      }
      console.log("🔌 Socket disconnected:", socket.id);
    });
  });
}

// Emit helpers used by REST controllers so changes push to clients instantly
function emitToMandal(mandalId, event, payload) {
  if (ioInstance) {
    ioInstance.to(`mandal_${mandalId}`).emit(event, payload);
  }
}

module.exports = { initSocket, emitToMandal };

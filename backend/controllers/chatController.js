const ChatMessage = require("../models/ChatMessage");
const { emitToMandal } = require("../utils/socket");

exports.getMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ mandal: req.user.mandal })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, count: messages.length, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    const message = await ChatMessage.create({
      mandal: req.user.mandal,
      sender: req.user._id,
      senderName: req.user.name,
      text: text.trim(),
    });

    emitToMandal(req.user.mandal.toString(), "receive_message", {
      _id: message._id,
      sender: req.user._id,
      senderName: req.user.name,
      text: message.text,
      createdAt: message.createdAt,
    });

    res.status(201).json({ success: true, message: "Message sent", data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

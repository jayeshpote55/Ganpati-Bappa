const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    mandal: { type: mongoose.Schema.Types.ObjectId, ref: "Mandal", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);

const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    mandal: { type: mongoose.Schema.Types.ObjectId, ref: "Mandal", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["aarti", "cultural", "sports", "prasad", "visarjan", "other"],
      default: "other",
    },
    date: { type: Date, required: true },
    time: { type: String, default: "" },
    location: { type: String, default: "" },
    image: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);

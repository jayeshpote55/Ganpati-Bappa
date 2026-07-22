const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    mandal: { type: mongoose.Schema.Types.ObjectId, ref: "Mandal", required: true },
    imageUrl: { type: String, required: true },
    caption: { type: String, default: "" },
    year: { type: Number, default: () => new Date().getFullYear() },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", gallerySchema);

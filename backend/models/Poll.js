const mongoose = require("mongoose");

const pollOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    votes: { type: Number, default: 0 },
  },
  { _id: false }
);

const voteRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    optionIndex: { type: Number, required: true },
  },
  { _id: false }
);

const pollSchema = new mongoose.Schema(
  {
    mandal: { type: mongoose.Schema.Types.ObjectId, ref: "Mandal", required: true },
    question: { type: String, required: true },
    options: { type: [pollOptionSchema], default: [] },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    multipleChoice: { type: Boolean, default: false },
    endDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    voters: [voteRecordSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Poll", pollSchema);

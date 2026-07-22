const mongoose = require("mongoose");

const fundSchema = new mongoose.Schema(
  {
    mandal: { type: mongoose.Schema.Types.ObjectId, ref: "Mandal", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    paidTo: { type: String, default: "" },
    type: {
      type: String,
      enum: ["income", "expense"],
      default: "expense",
    },
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "cheque", "card", "other"],
      default: "cash",
    },
    expenseDate: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fund", fundSchema);

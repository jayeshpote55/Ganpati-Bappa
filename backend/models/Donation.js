const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    mandal: { type: mongoose.Schema.Types.ObjectId, ref: "Mandal", required: true },
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    donorName: { type: String, required: true },
    donorPhone: { type: String, default: "" },
    amount: { type: Number, required: true, min: 1 },
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "cheque", "bank_transfer", "card", "razorpay"],
      default: "upi",
    },
    transactionId: { type: String, default: "" },
    message: { type: String, default: "" },
    isAnonymous: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "confirmed"], default: "confirmed" },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);

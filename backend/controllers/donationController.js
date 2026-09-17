const Donation = require("../models/Donation");
const { emitToMandal } = require("../utils/socket");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// @desc  Record a new donation (vargani) - triggers a live ticker update for everyone
exports.createDonation = async (req, res) => {
  try {
    const { donorName, donorPhone, amount, paymentMode, transactionId, message, isAnonymous } = req.body;

    const donation = await Donation.create({
      mandal: req.user.mandal,
      donor: req.user._id,
      donorName: isAnonymous ? "Anonymous Bhakt" : donorName || req.user.name,
      donorPhone,
      amount,
      paymentMode,
      transactionId,
      message,
      isAnonymous,
      receivedBy: req.user._id,
    });

    await donation.populate([
      { path: "mandal", select: "name" },
      { path: "receivedBy", select: "name phone role" },
    ]);

    const totalAgg = await Donation.aggregate([
      { $match: { mandal: req.user.mandal, status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    emitToMandal(req.user.mandal.toString(), "new_donation", {
      donation,
      totalRaised: totalAgg[0]?.total || 0,
    });

    res.status(201).json({ success: true, message: "Donation recorded — thank you! 🙏", donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, donorName, donorPhone, message, isAnonymous } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid amount." });
    }

    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: "Razorpay credentials are not configured." });
    }

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `donation_${Date.now()}`,
      payment_capture: 1,
      notes: {
        mandal: req.user.mandal.toString(),
        donorName: isAnonymous ? "Anonymous Bhakt" : donorName || req.user.name,
        donorPhone: donorPhone || "",
      },
    });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      donorName,
      donorPhone,
      message,
      isAnonymous,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing Razorpay payment details." });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Razorpay signature verification failed." });
    }

    const donation = await Donation.create({
      mandal: req.user.mandal,
      donor: req.user._id,
      donorName: isAnonymous ? "Anonymous Bhakt" : donorName || req.user.name,
      donorPhone,
      amount: Number(amount),
      paymentMode: "razorpay",
      transactionId: razorpay_payment_id,
      message,
      isAnonymous,
      receivedBy: req.user._id,
      status: "confirmed",
    });

    await donation.populate([
      { path: "mandal", select: "name" },
      { path: "receivedBy", select: "name phone role" },
    ]);

    const totalAgg = await Donation.aggregate([
      { $match: { mandal: req.user.mandal, status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    emitToMandal(req.user.mandal.toString(), "new_donation", {
      donation,
      totalRaised: totalAgg[0]?.total || 0,
    });

    res.json({ success: true, message: "Payment verified and donation recorded.", donation, totalRaised: totalAgg[0]?.total || 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ mandal: req.user.mandal })
      .populate("mandal", "name")
      .populate("receivedBy", "name phone role")
      .sort({ createdAt: -1 });

    const totalAgg = await Donation.aggregate([
      { $match: { mandal: req.user.mandal, status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    res.json({
      success: true,
      count: donations.length,
      totalRaised: totalAgg[0]?.total || 0,
      donations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update a donation (vargani)
exports.updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation record not found" });
    }

    if (donation.mandal.toString() !== req.user.mandal.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this donation" });
    }

    const { donorName, donorPhone, amount, paymentMode, transactionId, message, isAnonymous } = req.body;

    if (donorName !== undefined) donation.donorName = isAnonymous ? "Anonymous Bhakt" : donorName;
    if (donorPhone !== undefined) donation.donorPhone = donorPhone;
    if (amount !== undefined) donation.amount = Number(amount);
    if (paymentMode !== undefined) donation.paymentMode = paymentMode;
    if (transactionId !== undefined) donation.transactionId = transactionId;
    if (message !== undefined) donation.message = message;
    if (isAnonymous !== undefined) donation.isAnonymous = isAnonymous;

    await donation.save();
    await donation.populate([
      { path: "mandal", select: "name" },
      { path: "receivedBy", select: "name phone role" },
    ]);

    const totalAgg = await Donation.aggregate([
      { $match: { mandal: req.user.mandal, status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalRaised = totalAgg[0]?.total || 0;

    emitToMandal(req.user.mandal.toString(), "update_donation", {
      donation,
      totalRaised,
    });

    res.json({ success: true, message: "Donation record updated successfully!", donation, totalRaised });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete a donation (vargani)
exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation record not found" });
    }

    if (donation.mandal.toString() !== req.user.mandal.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this donation" });
    }

    await donation.deleteOne();

    const totalAgg = await Donation.aggregate([
      { $match: { mandal: req.user.mandal, status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalRaised = totalAgg[0]?.total || 0;

    emitToMandal(req.user.mandal.toString(), "delete_donation", {
      donationId: req.params.id,
      totalRaised,
    });

    res.json({ success: true, message: "Donation record deleted successfully.", totalRaised });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Top donors leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Donation.aggregate([
      { $match: { mandal: req.user.mandal, status: "confirmed", isAnonymous: false } },
      { $group: { _id: "$donorName", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createDonation,
  getDonations,
  getLeaderboard,
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/donationController");

router.use(protect);
router.post("/", createDonation);
router.post("/razorpay/order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);
router.get("/", getDonations);
router.get("/leaderboard", getLeaderboard);

module.exports = router;

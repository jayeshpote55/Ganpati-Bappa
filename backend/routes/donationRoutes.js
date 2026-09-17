const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createDonation,
  getDonations,
  getLeaderboard,
  createRazorpayOrder,
  verifyRazorpayPayment,
  updateDonation,
  deleteDonation,
} = require("../controllers/donationController");

router.use(protect);
router.post("/", createDonation);
router.post("/razorpay/order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);
router.get("/", getDonations);
router.get("/leaderboard", getLeaderboard);
router.put("/:id", updateDonation);
router.delete("/:id", deleteDonation);

module.exports = router;


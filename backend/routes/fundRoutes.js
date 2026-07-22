const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { createFundEntry, getFunds, deleteFundEntry } = require("../controllers/fundController");

router.use(protect);
router.post("/", authorize("admin", "committee"), createFundEntry);
router.get("/", getFunds);
router.delete("/:id", authorize("admin", "committee"), deleteFundEntry);

module.exports = router;

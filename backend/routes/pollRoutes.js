const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getPolls, createPoll, votePoll, closePoll, deletePoll } = require("../controllers/pollController");

router.use(protect);
router.get("/", getPolls);
router.post("/", createPoll);
router.post("/:id/vote", votePoll);
router.put("/:id/close", closePoll);
router.delete("/:id", deletePoll);

module.exports = router;

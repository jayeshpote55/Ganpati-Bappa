const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  toggleRSVP,
} = require("../controllers/eventController");

router.use(protect);
router.get("/", getEvents);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);
router.post("/:id/rsvp", toggleRSVP);

module.exports = router;

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} = require("../controllers/announcementController");

router.use(protect);
router.get("/", getAnnouncements);
router.post("/", createAnnouncement);
router.delete("/:id", deleteAnnouncement);

module.exports = router;

const Announcement = require("../models/Announcement");
const { emitToMandal } = require("../utils/socket");

exports.createAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      mandal: req.user.mandal,
      postedBy: req.user._id,
    });
    const populated = await announcement.populate("postedBy", "name avatar");

    emitToMandal(req.user.mandal.toString(), "new_announcement", populated);
    res.status(201).json({ success: true, message: "Announcement posted", announcement: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ mandal: req.user.mandal })
      .populate("postedBy", "name avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: announcements.length, announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: "Not found" });
    emitToMandal(announcement.mandal.toString(), "announcement_deleted", { id: announcement._id });
    res.json({ success: true, message: "Announcement removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

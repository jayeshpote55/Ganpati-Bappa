const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  register,
  login,
  getMe,
  updateMe,
  updateAvatar,
  getMembers,
  updateMemberRole,
  toggleMemberStatus,
} = require("../controllers/authController");

const avatarDir = path.join(__dirname, "../uploads/avatars");
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
    cb(null, `${name}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/me/avatar", protect, upload.single("avatar"), updateAvatar);
router.get("/members", protect, getMembers);
router.put("/members/:id/role", protect, authorize("admin"), updateMemberRole);
router.put("/members/:id/status", protect, authorize("admin"), toggleMemberStatus);

module.exports = router;

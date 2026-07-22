const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { uploadPhoto, getGallery, toggleLike, deletePhoto } = require("../controllers/galleryController");

const uploadDir = path.join(__dirname, "../uploads/gallery");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
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

router.use(protect);
router.get("/", getGallery);
router.post("/", upload.single("image"), uploadPhoto);
router.put("/:id/like", toggleLike);
router.delete("/:id", deletePhoto);

module.exports = router;

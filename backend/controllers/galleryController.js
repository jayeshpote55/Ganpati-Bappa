const Gallery = require("../models/Gallery");
const { emitToMandal } = require("../utils/socket");

exports.uploadPhoto = async (req, res) => {
  try {
    const { caption, year } = req.body;
    const imageUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/gallery/${req.file.filename}`
      : req.body.imageUrl;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "Please upload an image file." });
    }

    const photo = await Gallery.create({
      mandal: req.user.mandal,
      imageUrl,
      caption,
      year,
      uploadedBy: req.user._id,
    });
    emitToMandal(req.user.mandal.toString(), "new_photo", photo);
    res.status(201).json({ success: true, message: "Photo added to gallery", photo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGallery = async (req, res) => {
  try {
    const photos = await Gallery.find({ mandal: req.user.mandal }).sort({ createdAt: -1 });
    res.json({ success: true, count: photos.length, photos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: "Photo not found" });

    const idx = photo.likes.findIndex((u) => u.toString() === req.user._id.toString());
    if (idx > -1) photo.likes.splice(idx, 1);
    else photo.likes.push(req.user._id);
    await photo.save();

    emitToMandal(photo.mandal.toString(), "photo_like_updated", {
      photoId: photo._id,
      likeCount: photo.likes.length,
    });

    res.json({ success: true, likeCount: photo.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    const photo = await Gallery.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: "Photo not found" });
    emitToMandal(photo.mandal.toString(), "photo_deleted", { id: photo._id });
    res.json({ success: true, message: "Photo removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

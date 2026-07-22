const Mandal = require("../models/Mandal");
const Donation = require("../models/Donation");
const User = require("../models/User");
const { emitToMandal } = require("../utils/socket");

// @desc  Create a mandal (during onboarding)
// @route POST /api/mandals
exports.createMandal = async (req, res) => {
  try {
    const mandal = await Mandal.create({ ...req.body, createdBy: req.user?._id });
    res.status(201).json({ success: true, mandal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get all mandals (public directory)
// @route GET /api/mandals
exports.getMandals = async (req, res) => {
  try {
    const mandals = await Mandal.find().select("name city description logo bannerImage establishedYear");
    res.json({ success: true, count: mandals.length, mandals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single mandal with stats
// @route GET /api/mandals/:id
exports.getMandal = async (req, res) => {
  try {
    const mandal = await Mandal.findById(req.params.id);
    if (!mandal) return res.status(404).json({ success: false, message: "Mandal not found" });

    const [totalDonations, memberCount] = await Promise.all([
      Donation.aggregate([
        { $match: { mandal: mandal._id, status: "confirmed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      User.countDocuments({ mandal: mandal._id }),
    ]);

    res.json({
      success: true,
      mandal,
      stats: {
        totalRaised: totalDonations[0]?.total || 0,
        donationCount: totalDonations[0]?.count || 0,
        memberCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMandalDetails = async (req, res) => {
  try {
    const mandal = await Mandal.findById(req.params.id).lean();
    if (!mandal) return res.status(404).json({ success: false, message: "Mandal not found" });

    const [totalDonations, memberCount] = await Promise.all([
      Donation.aggregate([
        { $match: { mandal: mandal._id, status: "confirmed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      User.countDocuments({ mandal: mandal._id }),
    ]);

    res.json({
      success: true,
      mandal,
      stats: {
        totalRaised: totalDonations[0]?.total || 0,
        donationCount: totalDonations[0]?.count || 0,
        memberCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update mandal (admin/committee)
// @route PUT /api/mandals/:id
exports.updateMandal = async (req, res) => {
  try {
    const mandal = await Mandal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!mandal) return res.status(404).json({ success: false, message: "Mandal not found" });

    emitToMandal(mandal._id.toString(), "mandal_updated", mandal);
    res.json({ success: true, message: "Mandal profile updated", mandal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addAarti = async (req, res) => {
  try {
    const { title, lyrics, audioUrl, pdfUrl } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Aarti title is required." });
    }

    const mandal = await Mandal.findById(req.params.id);
    if (!mandal) return res.status(404).json({ success: false, message: "Mandal not found" });

    const newAarti = {
      title: title.trim(),
      lyrics: lyrics?.trim() || "",
      audioUrl: audioUrl?.trim() || "",
      pdfUrl: pdfUrl?.trim() || "",
    };

    mandal.aartiCollection = [newAarti, ...(mandal.aartiCollection || [])];
    await mandal.save();

    emitToMandal(mandal._id.toString(), "mandal_updated", mandal);
    res.status(201).json({ success: true, message: "Aarti added.", aarti: newAarti, mandal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAarti = async (req, res) => {
  try {
    const mandal = await Mandal.findById(req.params.id);
    if (!mandal) return res.status(404).json({ success: false, message: "Mandal not found" });

    const aartiId = req.params.aartiId;
    const updatedCollection = (mandal.aartiCollection || []).filter((item) => item._id.toString() !== aartiId);
    if (updatedCollection.length === (mandal.aartiCollection || []).length) {
      return res.status(404).json({ success: false, message: "Aarti not found." });
    }

    mandal.aartiCollection = updatedCollection;
    await mandal.save();

    emitToMandal(mandal._id.toString(), "mandal_updated", mandal);
    res.json({ success: true, message: "Aarti removed." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

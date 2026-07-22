const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Mandal = require("../models/Mandal");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// @desc  Register new member
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, mandalId, city, address, team, birthday } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered. Please login." });
    }

    let mandal = null;
    if (mandalId) {
      mandal = await Mandal.findById(mandalId);
    } else {
      // Attach to the first mandal available (single-mandal deployments)
      mandal = await Mandal.findOne();
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      city,
      address,
      team,
      birthday,
      mandal: mandal ? mandal._id : undefined,
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: "Registration successful! Ganpati Bappa Morya 🙏",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Login member
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Your account has been deactivated. Contact admin." });
    }

    user.lastSeen = new Date();
    await user.save();

    const token = signToken(user._id);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}! 🚩`,
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get logged-in user profile
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("mandal");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update profile
// @route PUT /api/auth/me
exports.updateMe = async (req, res) => {
  try {
    const { name, phone, address, city, avatar, team, birthday } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, city, avatar, team, birthday },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Upload profile avatar
// @route PUT /api/auth/me/avatar
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload an image file." });
    }
    const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true, runValidators: true });
    res.json({ success: true, message: "Avatar uploaded", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  List all members (admin/committee)
// @route GET /api/auth/members
exports.getMembers = async (req, res) => {
  try {
    const members = await User.find({ mandal: req.user.mandal }).sort({ createdAt: -1 });
    res.json({ success: true, count: members.length, members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update a member's role (admin only)
// @route PUT /api/auth/members/:id/role
exports.updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "Member not found" });
    res.json({ success: true, message: "Role updated", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Activate or deactivate a member account (admin only)
// @route PUT /api/auth/members/:id/status
exports.toggleMemberStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: Boolean(isActive) }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "Member not found" });
    res.json({ success: true, message: `Member ${user.isActive ? "activated" : "deactivated"}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

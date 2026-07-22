const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ success: false, message: "User no longer exists" });
      }
      if (!req.user.isActive) {
        return res.status(403).json({ success: false, message: "Account has been deactivated" });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: "Not authorized, token invalid" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
  }
};

// Restrict access to certain roles e.g. authorize('admin', 'committee')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not permitted to perform this action`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };

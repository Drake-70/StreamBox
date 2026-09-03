const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password -parentalControl.pin");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

const authorize = (...ageGroups) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (ageGroups.length > 0 && !ageGroups.includes(req.user.ageGroup)) {
      return res.status(403).json({ message: "Content not available for your age group" });
    }
    next();
  };
};

const protectAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = { protect, authorize, protectAdmin };

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, ageGroup, parentalPin } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }
    const group = ageGroup || "adults";

    // Kids/Teens profiles require a parent PIN so the child can't self-manage
    // the age-group filter. Adults may set one (optional, recommended).
    if (group !== "adults" && !parentalPin) {
      return res.status(400).json({
        message: `A parent PIN is required to create a ${group} profile. Please set a 4-digit PIN.`,
      });
    }
    if (parentalPin && !/^\d{4}$/.test(String(parentalPin))) {
      return res.status(400).json({ message: "Parent PIN must be 4 digits" });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      username,
      email,
      password,
      ageGroup: group,
    });
    // Set parental pin (hashed) if provided
    if (parentalPin) {
      await user.setParentalPin(parentalPin);
      await user.save();
    }

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      ageGroup: user.ageGroup,
      parentalControl: { enabled: user.hasParentalPin() },
      premium: { active: user.premium?.active || false },
      role: user.role || "user",
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        ageGroup: user.ageGroup,
        avatar: user.avatar,
        parentalControl: { enabled: user.hasParentalPin() },
        premium: { active: user.premium?.active || false },
        role: user.role || "user",
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;

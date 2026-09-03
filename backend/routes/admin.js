const express = require("express");
const router = express.Router();
const Content = require("../models/Content");
const User = require("../models/User");
const Payment = require("../models/Payment");
const { protect, protectAdmin } = require("../middleware/auth");
const {
  syncAll,
  getSyncStatus,
} = require("../services/contentSync");

// Coerce a value (bool or string) to a true boolean.
function toBool(v) {
  return v === true || v === 1 || v === "1" || v === "true" || v === "True";
}

// Admin-only: last content-sync status.
router.get("/sync", protect, protectAdmin, async (req, res) => {
  res.json(getSyncStatus());
});

// Admin-only: force a full re-sync now.
router.post("/sync", protect, protectAdmin, async (req, res) => {
  try {
    const report = await syncAll();
    res.json({ status: getSyncStatus(), report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-only: platform dashboard stats.
router.get("/stats", protect, protectAdmin, async (req, res) => {
  try {
    const [total, premium, free, users, premiumUsers, payments] = await Promise.all([
      Content.countDocuments({ blocked: { $ne: true } }),
      Content.countDocuments({ premium: true, blocked: { $ne: true } }),
      Content.countDocuments({ premium: { $ne: true }, blocked: { $ne: true } }),
      User.countDocuments(),
      User.countDocuments({ "premium.active": true }),
      Payment.countDocuments(),
    ]);
    const byCategory = await Content.aggregate([
      { $match: { blocked: { $ne: true } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    res.json({
      total,
      premium,
      free,
      users,
      premiumUsers,
      payments,
      byCategory: byCategory.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-only: full content list (not age-filtered) for management.
router.get("/content", protect, protectAdmin, async (req, res) => {
  try {
    const { category, premium, q } = req.query;
    const query = { blocked: { $ne: true } };
    if (category) query.category = category;
    if (premium === "true") query.premium = true;
    if (premium === "false") query.premium = { $ne: true };
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }
    const content = await Content.find(query).sort({ createdAt: -1 }).limit(500);
    res.json({ content, total: content.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-only: toggle premium on a single title.
router.put("/content/:id/premium", protect, protectAdmin, async (req, res) => {
  try {
    const { premium } = req.body;
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { premium: toBool(premium) },
      { new: true }
    ).select("title premium category");
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-only: mark an entire category premium (or clear it).
// Body: { category, premium: true|false }
router.post("/content/by-category", protect, protectAdmin, async (req, res) => {
  try {
    const { category, premium } = req.body;
    if (!category) {
      return res.status(400).json({ message: "category is required" });
    }
    const result = await Content.updateMany(
      { category, blocked: { $ne: true } },
      { $set: { premium: toBool(premium) } }
    );
    res.json({ modified: result.modifiedCount, category, premium: toBool(premium) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-only: list users (id, username, email, ageGroup, role, premium status).
router.get("/users", protect, protectAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("username email ageGroup role premium parentalControl.enabled")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-only: promote/demote a user's admin role.
router.put("/users/:id/role", protect, protectAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("username email role");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-only: list content flagged/blocked for moderation review.
router.get("/moderation", protect, protectAdmin, async (req, res) => {
  try {
    const content = await Content.find({
      $or: [{ flagged: true }, { blocked: true }],
    })
      .sort({ updatedAt: -1 })
      .limit(200);
    res.json({ content, total: content.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-only: approve or reject a flagged/blocked title.
// Body: { action: "approve" | "reject", reason? }
router.put("/moderation/:id", protect, protectAdmin, async (req, res) => {
  try {
    const { action, reason } = req.body;
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    if (action === "approve") {
      content.blocked = false;
      content.flagged = false;
      content.flaggedReasons = [];
      content.blockReason = "";
      content.moderatorApproved = true;
    } else if (action === "reject") {
      content.blocked = true;
      content.blockReason = reason || "Rejected by admin";
      content.flagged = true;
      content.moderatorApproved = false;
    } else {
      return res.status(400).json({ message: "action must be approve or reject" });
    }

    await content.save();
    res.json({ _id: content._id, title: content.title, blocked: content.blocked, moderatorApproved: content.moderatorApproved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get("/payments", protect, protectAdmin, async (req, res) => {
  try {
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("user", "username email");
    res.json({ payments, total: payments.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

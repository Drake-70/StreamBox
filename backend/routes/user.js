const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -parentalControl.pin")
      .populate("watchlist");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/profile", protect, async (req, res) => {
  try {
    const { username, email, avatar, ageGroup } = req.body;
    const user = await User.findById(req.user._id);
    if (username) user.username = username;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;
    if (ageGroup) user.ageGroup = ageGroup;
    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      ageGroup: user.ageGroup,
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/age-group", protect, async (req, res) => {
  try {
    const { ageGroup, pin } = req.body;
    if (!["kids", "teens", "adults"].includes(ageGroup)) {
      return res.status(400).json({ message: "Invalid age group" });
    }

    const user = await User.findById(req.user._id);

    // If a parental PIN is set, changing the age group requires it. This stops
    // a kid clicking to "Adults (18+)". If no PIN is set yet, the change is free.
    if (user.hasParentalPin()) {
      if (!pin) {
        return res.status(403).json({ message: "Parent PIN required to change age group" });
      }
      const ok = await user.verifyParentalPin(pin);
      if (!ok) {
        return res.status(403).json({ message: "Incorrect parent PIN" });
      }
    }

    user.ageGroup = ageGroup;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      ageGroup: user.ageGroup,
      parentalControl: { enabled: user.hasParentalPin() },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set or update the parental-control PIN. Changing an existing PIN requires the
// current one; setting the first one requires a valid 4-digit value.
router.post("/parental-control", protect, async (req, res) => {
  try {
    const { pin, currentPin } = req.body;
    if (!pin || !/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({ message: "Parent PIN must be 4 digits" });
    }

    const user = await User.findById(req.user._id);
    if (user.hasParentalPin()) {
      if (!currentPin || !(await user.verifyParentalPin(currentPin))) {
        return res.status(403).json({ message: "Current parent PIN required to change it" });
      }
    }

    await user.setParentalPin(pin);
    await user.save();

    res.json({
      message: "Parental control PIN updated",
      parentalControl: { enabled: true },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify a provided PIN without changing anything (used by the UI to gate
// actions). Returns 200 if correct, 403 otherwise.
router.post("/parental-control/verify", protect, async (req, res) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.hasParentalPin()) {
      return res.status(400).json({ message: "No parent PIN set on this account" });
    }
    const ok = await user.verifyParentalPin(pin);
    if (!ok) {
      return res.status(403).json({ message: "Incorrect parent PIN" });
    }
    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/watchlist/:contentId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const index = user.watchlist.indexOf(req.params.contentId);
    if (index === -1) {
      user.watchlist.push(req.params.contentId);
    } else {
      user.watchlist.splice(index, 1);
    }
    await user.save();
    res.json({ watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/history/:contentId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { progress = 0, duration = 0 } = req.body || {};
    const existing = user.watchHistory.find(
      (h) => h.content.toString() === req.params.contentId
    );
    if (existing) {
      // Keep the highest progress so resuming works, or let repeated saves
      // update live during playback.
      existing.progress = Math.max(existing.progress || 0, Number(progress) || 0);
      if (duration) existing.duration = Number(duration);
      existing.watchedAt = Date.now();
    } else {
      user.watchHistory.push({
        content: req.params.contentId,
        progress: Number(progress) || 0,
        duration: Number(duration) || 0,
      });
    }
    if (user.watchHistory.length > 50) {
      user.watchHistory = user.watchHistory.slice(-50);
    }
    await user.save();
    res.json({ watchHistory: user.watchHistory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Persist playhead position during playback without touching the recency order
// too aggressively. Returns the saved entry.
router.put("/history/:contentId/progress", protect, async (req, res) => {
  try {
    const { progress = 0, duration = 0 } = req.body || {};
    const user = await User.findById(req.user._id);
    let entry = user.watchHistory.find(
      (h) => h.content.toString() === req.params.contentId
    );
    if (!entry) {
      user.watchHistory.push({
        content: req.params.contentId,
        progress: Number(progress) || 0,
        duration: Number(duration) || 0,
      });
      entry = user.watchHistory[user.watchHistory.length - 1];
    } else {
      entry.progress = Math.max(entry.progress || 0, Number(progress) || 0);
      if (duration) entry.duration = Number(duration);
    }
    if (user.watchHistory.length > 50) {
      user.watchHistory = user.watchHistory.slice(-50);
    }
    await user.save();
    res.json({ progress: entry.progress, duration: entry.duration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/watchlist", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("watchlist");
    res.json(user.watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Populated watch history, newest first (watchlist already populated above).
router.get("/history", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const ids = [...user.watchHistory]
      .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
      .map((h) => h.content);
    const items = await require("../models/Content")
      .find({ _id: { $in: ids }, blocked: { $ne: true } })
      .select("title description thumbnailUrl category ageRating youtubeVideoId premium");
    const byId = new Map(items.map((i) => [String(i._id), i]));
    const progById = new Map(
      user.watchHistory.map((h) => [String(h.content), h])
    );
    const history = ids
      .map((id) => {
        const item = byId.get(String(id));
        if (!item) return null;
        const p = progById.get(String(id));
        return {
          ...item.toObject(),
          progress: p ? p.progress || 0 : 0,
          duration: p ? p.duration || 0 : 0,
        };
      })
      .filter(Boolean);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

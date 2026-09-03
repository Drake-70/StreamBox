const express = require("express");
const crypto = require("crypto");
const AnalyticsEvent = require("../models/AnalyticsEvent");
const { protect, protectAdmin } = require("../middleware/auth");

const router = express.Router();

// Lightweight client event logger. Fire-and-forget style: never blocks the
// caller, and a failure is silently ignored so analytics can't break UX.
router.post("/event", protect, async (req, res) => {
  try {
    const { event, content, category, meta } = req.body || {};
    if (!event) return res.status(400).json({ message: "event required" });

    const ipHash = req.ip
      ? crypto.createHash("sha256").update(String(req.ip)).digest("hex").slice(0, 16)
      : "";

    const doc = new AnalyticsEvent({
      event,
      user: req.user ? req.user._id : null,
      content: content || null,
      category: category || "",
      meta: (meta && typeof meta === "object") ? meta : {},
      ipHash,
    });
    await doc.save();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Aggregate analytics for the admin dashboard. Admin-only.
router.get("/summary", protect, protectAdmin, async (req, res) => {
  try {
    const all = await AnalyticsEvent.find({}, "ipHash event").lean();
    const uniqueVisitors = new Set(all.map((e) => e.ipHash).filter(Boolean)).size;
    const counts = {};
    all.forEach((e) => { counts[e.event] = (counts[e.event] || 0) + 1; });
    const topEvents = Object.entries(counts)
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    res.json({
      totalEvents: all.length,
      uniqueVisitors,
      topEvents,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

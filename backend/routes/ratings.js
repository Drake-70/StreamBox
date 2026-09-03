const express = require("express");
const mongoose = require("mongoose");
const Rating = require("../models/Rating");
const Content = require("../models/Content");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Helper: recompute and store the aggregate user rating on the Content doc.
async function refreshContentRating(contentId) {
  const agg = await Rating.aggregate([
    { $match: { content: new mongoose.Types.ObjectId(contentId), hidden: { $ne: true } } },
    { $match: { score: { $ne: null } } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$score" },
        count: { $sum: 1 },
      },
    },
  ]);
  const data = agg[0] || { avg: 0, count: 0 };
  await Content.updateOne(
    { _id: contentId },
    {
      $set: {
        userRating: Math.round((data.avg || 0) * 10) / 10,
        userRatingCount: data.count || 0,
      },
    }
  );
  return { avg: Math.round((data.avg || 0) * 10) / 10, count: data.count || 0 };
}

// Public: list ratings + reviews for a content item.
router.get("/:contentId", async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const user = req.user ? req.user._id : null;
    const reviews = await Rating.find({
      content: contentId,
      hidden: { $ne: true },
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    let mine = null;
    if (user) {
      mine = await Rating.findOne({
        content: contentId,
        user,
        hidden: { $ne: true },
      }).lean();
    }

    const content = await Content.findById(contentId).lean();
    res.json({
      average: content?.userRating || content?.rating || 0,
      count: content?.userRatingCount || 0,
      mine,
      reviews: reviews.map((r) => ({
        _id: r._id,
        score: r.score,
        review: r.review,
        createdAt: r.createdAt,
        user: { name: r.user?.name || "StreamBox User" },
        mine: user ? String(r.user?._id) === String(user) : false,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upsert the caller's rating/review for a content item (protect).
router.post("/:contentId", protect, async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const { score, review } = req.body || {};
    if (score != null && (isNaN(score) || score < 0 || score > 10)) {
      return res.status(400).json({ message: "Rating must be between 0 and 10." });
    }
    if (review != null && String(review).length > 2000) {
      return res.status(400).json({ message: "Review is too long (max 2000 chars)." });
    }
    const scoreNum = score == null || score === "" ? null : Number(score);
    const reviewStr = review == null ? null : String(review).trim();

    const doc = await Rating.findOneAndUpdate(
      { content: contentId, user: req.user._id },
      { $set: { score: scoreNum, review: reviewStr || "", flagged: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const agg = await refreshContentRating(contentId);
    res.json({ rating: doc, aggregate: agg });
  } catch (error) {
    // Unique index race
    if (error.code === 11000) {
      return res.status(409).json({ message: "Rating already exists." });
    }
    res.status(500).json({ message: error.message });
  }
});

// Delete the caller's rating/review (protect).
router.delete("/:contentId", protect, async (req, res) => {
  try {
    await Rating.findOneAndDelete({
      content: req.params.contentId,
      user: req.user._id,
    });
    await refreshContentRating(req.params.contentId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

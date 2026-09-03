const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // User rating (0-10) - optional; a review without a numeric rating is allowed.
    score: { type: Number, min: 0, max: 10, default: null },
    review: { type: String, default: "", maxlength: 2000 },
    // Moderation for user reviews
    flagged: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    hiddenReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// One rating entry per user per content.
ratingSchema.index({ content: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);

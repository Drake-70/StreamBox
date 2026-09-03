const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, default: "" },
    youtubeVideoId: { type: String, required: true, unique: true },
    thumbnailUrl: { type: String, default: "" },
    category: {
      type: String,
      enum: ["cameroonian_movie", "anime", "documentary", "series", "short_film"],
      required: true,
      index: true,
    },
    genre: [{ type: String }],
    ageRating: {
      type: String,
      enum: ["G", "PG", "PG-13", "R", "NC-17"],
      required: true,
    },
    ageGroups: {
      type: [String],
      enum: ["kids", "teens", "adults"],
      default: ["adults"],
    },
    year: { type: Number },
    duration: { type: String },
    language: { type: String, default: "English" },
    region: { type: String, default: "Cameroon" },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    premium: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 10, default: 0 },
    userRating: { type: Number, min: 0, max: 10, default: 0 },
    userRatingCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    // Moderation / adult-content blocking
    moderatorApproved: { type: Boolean, default: true },
    flagged: { type: Boolean, default: false },
    flaggedReasons: [{ type: String }],
    blocked: { type: Boolean, default: false },
    blockReason: { type: String, default: "" },
  },
  { timestamps: true }
);

contentSchema.index({ category: 1, ageRating: 1 });
contentSchema.index({ ageGroups: 1 });
contentSchema.index({ featured: 1, trending: 1 });
contentSchema.index({ blocked: 1 });

// Only ever return non-blocked content by default
contentSchema.pre("find", function () {
  this.where({ blocked: { $ne: true } });
});
contentSchema.pre("findOne", function () {
  this.where({ blocked: { $ne: true } });
});
contentSchema.pre("findOneAndUpdate", function () {
  this.where({ blocked: { $ne: true } });
});
contentSchema.pre("countDocuments", function () {
  this.where({ blocked: { $ne: true } });
});

module.exports = mongoose.model("Content", contentSchema);

const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    event: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    content: { type: mongoose.Schema.Types.ObjectId, ref: "Content", default: null },
    category: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    // IP is stored hashed so we can approximate unique users without keeping raw IPs.
    ipHash: { type: String, default: "" },
  },
  { timestamps: true }
);

analyticsSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model("AnalyticsEvent", analyticsSchema);

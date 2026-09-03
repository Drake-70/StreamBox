const mongoose = require("mongoose");

const watchPartySchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: mongoose.Schema.Types.ObjectId, ref: "Content", required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
    roomCode: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WatchParty", watchPartySchema);

const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  channel:  { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  title:    { type: String, required: true },
  status:   { type: String, enum: ['live', 'ended', 'cut'], default: 'live' },
  started:  { type: Date, default: Date.now },
  ended:    { type: Date, default: null },
  viewers:  { type: Number, default: 0 },
  peak:     { type: Number, default: 0 },
  hls:      { type: String, default: null },
}, { timestamps: true });

streamSchema.methods.addViewer = function () {
  this.viewers += 1;
  this.peak = Math.max(this.peak, this.viewers);
  return this.save();
};

module.exports = mongoose.model('Stream', streamSchema);
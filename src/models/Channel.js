const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  owner:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  slug:    { type: String, required: true, unique: true },
  tagline: { type: String, default: '' },
  avatar:  { type: String, default: null },
  status:  { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },
  subs:    { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Channel', channelSchema);
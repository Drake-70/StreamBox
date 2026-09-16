const express = require('express');
const Channel = require('../models/Channel');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, slug, tagline } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });
    const channel = await Channel.create({ owner: req.user.id, name, slug, tagline });
    res.status(201).json(channel);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Slug already taken' });
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const channels = await Channel.find({ status: 'active' }).populate('owner', 'name').sort({ subs: -1 }).limit(50);
  res.json(channels);
});

router.get('/:id', async (req, res) => {
  const channel = await Channel.findById(req.params.id).populate('owner', 'name');
  if (!channel) return res.status(404).json({ error: 'Channel not found' });
  res.json(channel);
});

module.exports = router;
const express = require('express');
const Stream = require('../models/Stream');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const { channel, title } = req.body;
    if (!channel || !title) return res.status(400).json({ error: 'channel and title required' });
    const stream = await Stream.create({ channel, title });
    res.status(201).json(stream);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/end', requireAuth, async (req, res) => {
  const stream = await Stream.findById(req.params.id);
  if (!stream) return res.status(404).json({ error: 'Stream not found' });
  stream.status = 'ended';
  stream.ended = new Date();
  stream.hls = stream.hls || null;
  await stream.save();
  res.json(stream);
});

router.post('/:id/viewer', async (req, res) => {
  const stream = await Stream.findById(req.params.id);
  if (!stream) return res.status(404).json({ error: 'Stream not found' });
  await stream.addViewer();
  res.json({ viewers: stream.viewers, peak: stream.peak });
});

// HLS segment serving. In a real deployment this resolves from an S3/CDN
// origin; locally the HLS files are written to /hls by the transcode worker.
router.get('/:id/hls/:segment', async (req, res) => {
  const stream = await Stream.findById(req.params.id);
  if (!stream || !stream.hls) return res.status(404).json({ error: 'HLS output not ready' });
  res.set('Content-Type', 'video/mp2t');
  res.set('Cache-Control', 'public, max-age=86400');
  res.redirect(302, `${stream.hls}/${req.params.segment}`);
});

module.exports = router;
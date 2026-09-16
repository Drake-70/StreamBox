// HLS transcode worker — FFmpeg wrapper.
// Converts a live RTMP/WebRTC input into HLS segments + playlist for playback.
// Invoked by the ingest service when a broadcast connects.
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const HLS_DIR = process.env.HLS_DIR || path.join(__dirname, '../../hls');

function ensureHlsDir() {
  if (!fs.existsSync(HLS_DIR)) fs.mkdirSync(HLS_DIR, { recursive: true });
  return HLS_DIR;
}

function transcodeToHls({ streamId, input, title = '' }) {
  ensureHlsDir();
  const outDir = path.join(HLS_DIR, streamId);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const index = path.join(outDir, 'index.m3u8');

  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', input,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-f', 'hls',
      '-hls_time', '4',
      '-hls_list_size', '6',
      '-hls_flags', 'delete_segments',
      index,
    ];
    execFile('ffmpeg', args, { timeout: 60 * 60 * 1000 }, (err) => {
      if (err) return reject(new Error(`ffmpeg HLS failed: ${err.message}`));
      resolve({ index, hls: `/api/streams/${streamId}/hls` });
    });
  });
}

module.exports = { transcodeToHls, ensureHlsDir };
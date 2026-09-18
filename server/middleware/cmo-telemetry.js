/*!
 * CMO.ai product telemetry middleware (Express, backend products)
 * --------------------------------------------------------------
 * Reports API route + DB query latency to the CMO.ai studio monitor so the
 * SEO/growth agents can act on real backend performance.
 *
 * Setup:
 *   const { createTelemetry } = require('./server/middleware/cmo-telemetry');
 *   const telemetry = createTelemetry({
 *     product: 'streambox',
 *     endpoint: process.env.CMO_ENDPOINT,      // e.g. https://your-cmo-host
 *     key: process.env.CMO_TELEMETRY_KEY,      // TELEMETRY_INGEST_KEY from the CMO .env
 *   });
 *   app.use(telemetry);                        // times every API request
 *
 * Time a DB call:
 *   await telemetry.timer('SELECT streams')(() => db.query('...'));
 *
 * Env: CMO_ENDPOINT, CMO_TELEMETRY_KEY
 */
'use strict';

const DEFAULT_FLUSH_MS = 10000;
const MAX_BATCH = 500;

function createTelemetry({ product, endpoint, key, flushMs = DEFAULT_FLUSH_MS, ignore = [] } = {}) {
  if (!product || !endpoint) throw new Error('[cmo-telemetry] product and endpoint are required');
  const queue = [];
  let timer = null;

  async function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!queue.length) return;
    const body = JSON.stringify({ queries: queue.splice(0) });
    const url = `${String(endpoint).replace(/\/$/, '')}/api/telemetry/${product}${key ? `?key=${encodeURIComponent(key)}` : ''}`;
    try {
      await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    } catch (_) { /* telemetry must never break the app */ }
  }

  function record(query) {
    queue.push({
      route: String(query.route || 'unknown').slice(0, 200),
      method: query.method || 'GET',
      status: query.status,
      kind: query.kind || 'db',
      duration_ms: Math.round(query.duration_ms || 0),
      metadata: query.metadata,
    });
    if (queue.length >= MAX_BATCH) flush();
    else if (!timer) timer = setTimeout(flush, flushMs);
  }

  // Express middleware: times every request and reports the resolved route.
  function middleware(req, res, next) {
    if (req.path.startsWith('/api/telemetry')) return next();
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const route = (req.route && req.baseUrl + req.route.path) || req.originalUrl || req.path;
      if (ignore.some((re) => re.test(route))) return;
      record({ route, method: req.method, status: res.statusCode, kind: 'api', duration_ms: Number(process.hrtime.bigint() - start) / 1e6 });
    });
    next();
  }

  middleware.record = record;
  middleware.flush = flush;
  middleware.timer = (label) => async (fn) => {
    const start = process.hrtime.bigint();
    try { return await fn(); }
    finally { record({ route: label, method: 'DB', kind: 'db', duration_ms: Number(process.hrtime.bigint() - start) / 1e6 }); }
  };
  return middleware;
}

module.exports = { createTelemetry };

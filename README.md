# StreamBox

Live streaming and creator monetization platform — audio/video delivery, channel management, and subscription-driven growth tooling.

**Status:** early development — core APIs scaffolded, real ingest pipeline incoming.

## Quick Start

```bash
npm install
cp .env.example .env   # edit with your keys
npm run dev             # API server on http://localhost:4000
```

## Stack

- **Backend:** Node.js, Express 4, Mongoose 8 (MongoDB)
- **Media:** FFmpeg (HLS output), HLS.js playback
- **Streaming:** WebRTC ingest stub → HLS transcode pipeline
- **Auth:** JWT (httpOnly cookies)
- **DB:** MongoDB (channels, streams, viewers)

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/channels` | Create a channel |
| GET | `/api/channels/:id` | Get channel info |
| POST | `/api/streams` | Start a stream session |
| PATCH | `/api/streams/:id/end` | End a stream |
| GET | `/api/streams/:id/hls/:segment` | Serve HLS segment |
| POST | `/api/streams/:id/viewer` | Viewer join (track concurrent) |

## Project Structure

```
streambox/
├── src/
│   ├── index.js          # Express entry point
│   ├── routes/           # auth, channels, streams
│   ├── models/           # Mongoose schemas
│   ├── services/         # HLS transcode, WebRTC stub
│   └── middleware/       # JWT verify, error handler
├── .env.example
├── package.json
└── README.md
```

## Roadmap

- [ ] WebRTC ingest endpoint (connect OBS/Streamyard)
- [ ] Real-time viewer count via WebSocket
- [ ] VOD archive + highlight clips
- [ ] Channel subscription + creator payout integration
- [ ] Embeddable HLS player component

## License

MIT

## CMO.ai telemetry

StreamBox reports API route and DB query latency to the CMO.ai studio monitor,
so the studio's SEO/growth agents can act on real backend performance.

```js
const { createTelemetry } = require('./server/middleware/cmo-telemetry');

const telemetry = createTelemetry({
  product: 'streambox',
  endpoint: process.env.CMO_ENDPOINT,     // e.g. https://your-cmo-host
  key: process.env.CMO_TELEMETRY_KEY,     // TELEMETRY_INGEST_KEY from the CMO .env
});

app.use(telemetry);                        // times every API request

// Time a DB call:
await telemetry.timer('SELECT streams')(() => db.query('...'));
```

Environment: `CMO_ENDPOINT`, `CMO_TELEMETRY_KEY`.


## Monitoring: revenue forwarder

You can also feed the CMO.ai revenue ledger from inside StreamBox (subscriptions,
ad revenue, etc.):

```js
const cmoRevenue = require('./server/cmo-revenue');
await cmoRevenue.report({
  product: 'streambox',
  provider: 'subscription',
  kind: 'subscription',
  amount: 9.99,
  currency: 'USD',
  reference: '<your-order-id>',
  customer: 'user@example.com',
  detail: 'pro-plan'
});
```

Set `CMO_ENDPOINT` (e.g. `https://your-cmo-host`) and `CMO_REVENUE_KEY`
(the CMO `.env`'s `REVENUE_INGEST_KEY`) in the StreamBox environment. The
forwarder never throws; unset vars make it a no-op.

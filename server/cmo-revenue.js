/*!
 * CMO.ai revenue forwarder
 * ------------------------
 * Reports a completed payment/subscription to the CMO.ai studio revenue ledger
 * so the studio monitor + finance agents track real Money. Fire-and-forget:
 * never throws, so a CMO outage can't break checkout.
 *
 * Usage:
 *   const cmoRevenue = require('../middleware/cmo-revenue'); // or ./cmo-revenue
 *   await cmoRevenue.report({
 *     product: 'streambox',
 *     provider: 'subscription',  // campay | stripe | subscription | ad | grant | other
 *     kind: 'subscription',      // payment | subscription | donation | grant | ad_revenue
 *     amount: 9.99,
 *     currency: 'USD',
 *     status: 'succeeded',       // succeeded | pending | failed | refunded
 *     reference: '<your-order-id>',
 *     customer: 'user@example.com',
 *     detail: 'pro-plan',
 *   });
 *
 * Env: CMO_ENDPOINT (e.g. https://your-cmo-host) and
 *      CMO_REVENUE_KEY (REVENUE_INGEST_KEY from the CMO .env).
 * Missing either -> report() is a no-op.
 */
'use strict';

const ENDPOINT = process.env.CMO_ENDPOINT || '';
const KEY = process.env.CMO_REVENUE_KEY || '';

async function report({ product, provider, kind, amount, currency, status, reference, customer, detail } = {}) {
  if (!ENDPOINT || !product || amount === undefined || amount === null) return { skipped: true };
  const url = String(ENDPOINT).replace(/\/$/, '') + '/api/revenue/' + product + (KEY ? '?key=' + encodeURIComponent(KEY) : '');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        kind,
        amount: Number(amount),
        currency,
        status: status || 'succeeded',
        reference,
        customer,
        detail,
      }),
    });
    return await res.json().catch(() => ({ ok: res.ok }));
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { report };

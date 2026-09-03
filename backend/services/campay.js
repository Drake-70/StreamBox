// CamPay Mobile Money gateway (MTN & Orange Cameroon) using native fetch.
// Credentials come from env vars (fill in later):
//   CAMPAY_APP_USERNAME, CAMPAY_APP_PASSWORD, CAMPAY_ENVIRONMENT (DEV|PROD)
//
// For development without a live CamPay app, set CAMPAY_MODE=mock (or leave
// unset, as it defaults to mock) to simulate the collect + status flow. In mock
// mode an initiated collect is returned as PENDING and the first status poll
// flips it to SUCCESSFUL so the full flow can be demoed end-to-end.

const mode = (process.env.CAMPAY_MODE || "mock").toLowerCase();
const env = (process.env.CAMPAY_ENVIRONMENT || "DEV").toUpperCase();

const BASE_URL =
  mode === "mock"
    ? "mock"
    : env === "PROD"
    ? "https://campay.net/api"
    : "https://demo.campay.net/api";

async function postJson(url, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Token ${token}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CamPay error ${res.status}: ${text}`);
  }
  return res.json();
}

async function getJson(url, token) {
  const headers = {};
  if (token) headers.Authorization = `Token ${token}`;
  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CamPay error ${res.status}: ${text}`);
  }
  return res.json();
}

async function getToken() {
  return postJson(`${BASE_URL}/token/`, {
    app_username: process.env.CAMPAY_APP_USERNAME,
    app_password: process.env.CAMPAY_APP_PASSWORD,
  }).then((d) => d.token);
}

/**
 * Initiate a mobile money collect (USSD push to the user's phone).
 * @param {{amount:number, currency?:string, from:string, description?:string, external_reference?:string}} opts
 * @returns reference + ussd code + operator
 */
async function initCollect(opts) {
  if (mode === "mock") {
    return {
      reference: "mock-" + Date.now(),
      external_reference: opts.external_reference || "",
      ussd_code: "*126# (MTN mock)",
      operator: "MTN",
      status: "PENDING",
    };
  }
  const token = await getToken();
  return postJson(
    `${BASE_URL}/collect/`,
    {
      amount: opts.amount,
      currency: opts.currency || "XAF",
      from: opts.from,
      description: opts.description || "StreamBox Premium",
      external_reference: opts.external_reference || "",
    },
    token
  );
}

/**
 * Check the status of a transaction.
 * @returns { status: "PENDING"|"SUCCESSFUL"|"FAILED", reference, amount, operator, code }
 */
async function getTransactionStatus(reference) {
  if (mode === "mock") {
    // Mock: any initiated collect succeeds on the first status check so the
    // flow can be demoed without real CamPay keys.
    return {
      reference,
      status: "SUCCESSFUL",
      amount: 0,
      currency: "XAF",
      operator: "MTN",
      code: "MOCK-SUCCESS",
      operator_reference: "1234567890",
    };
  }
  const token = await getToken();
  return getJson(`${BASE_URL}/transaction/${reference}/`, token);
}

module.exports = {
  initCollect,
  getTransactionStatus,
  getToken,
  isMock: () => mode === "mock",
  env,
};

const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const campay = require("../services/campay");
const { protect } = require("../middleware/auth");

// Standard offer: 1 month of StreamBox Premium.
const MONTH_PRICE_XAF = 2000;

function activatePremium(user, { months = 1 } = {}) {
  const now = new Date();
  const base = user.premium?.active && user.premium?.expiresAt > now
    ? new Date(user.premium.expiresAt)
    : now;
  const expiresAt = new Date(base);
  expiresAt.setMonth(expiresAt.getMonth() + months);
  user.premium = {
    active: true,
    startedAt: user.premium?.startedAt || now,
    expiresAt,
  };
  return user;
}

// Start a premium subscription via CamPay USSD collect.
// Body: { phone: "2376xxxxxxxx", months?: 1, amount?: number }
router.post("/subscribe", protect, async (req, res) => {
  try {
    const { phone, months = 1, amount } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Mobile money phone number is required" });
    }
    const normalized = String(phone).replace(/[^0-9]/g, "");
    // Cameroon MTN/Orange: international 237 + 9-digit number starting with 6
    // => 2376 + 8 more digits (12 total).
    if (!/^2376[0-9]{8}$/.test(normalized)) {
      return res
        .status(400)
        .json({ message: "Enter a valid Cameroon MTN/Orange number starting with 2376" });
    }

    const total = amount || Number(months) * MONTH_PRICE_XAF;
    const externalReference = `SB-${req.user._id}-${Date.now()}`;

    const initiated = await campay.initCollect({
      amount: total,
      currency: "XAF",
      from: normalized,
      description: `StreamBox Premium (${months} month${months > 1 ? "s" : ""})`,
      external_reference: externalReference,
    });

    const payment = await Payment.create({
      user: req.user._id,
      reference: initiated.reference,
      externalReference,
      amount: total,
      currency: "XAF",
      phone: normalized,
      operator: initiated.operator || "",
      ussdCode: initiated.ussd_code || "",
      status: initiated.status || "PENDING",
      months,
    });

    res.status(201).json({
      payment,
      message: campay.isMock()
        ? "Mock collect initiated (auto-confirms on status check)."
        : "Check your phone and approve the payment.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Poll the transaction status; on SUCCESSFUL, activate premium.
router.get("/status/:reference", protect, async (req, res) => {
  try {
    const { reference } = req.params;
    const payment = await Payment.findOne({ reference, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    if (payment.status === "SUCCESSFUL") {
      return res.json({
        status: "SUCCESSFUL",
        payment,
        premium: { active: true },
      });
    }

    const data = await campay.getTransactionStatus(reference);
    const newStatus = data.status || "FAILED";
    payment.status = newStatus;
    payment.operator = data.operator || payment.operator;
    await payment.save();

    if (newStatus === "SUCCESSFUL") {
      const user = await req.user.constructor.findById(req.user._id);
      await activatePremium(user, { months: payment.months }).save();
      return res.json({ status: "SUCCESSFUL", payment, premium: user.premium });
    }

    res.json({ status: newStatus, payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CamPay callback/webhook to confirm a payment (no auth needed - verified by reference).
router.post("/webhook", async (req, res) => {
  try {
    const body = req.body || {};
    const reference = body.reference || body.payment_reference || "";
    const payment = await Payment.findOne({ reference });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found for webhook" });
    }
    const data = body.status
      ? body
      : await campay.getTransactionStatus(reference);
    payment.status = data.status || payment.status;
    await payment.save();

    if (data.status === "SUCCESSFUL") {
      const User = require("../models/User");
      const user = await User.findById(payment.user);
      if (user) {
        await activatePremium(user, { months: payment.months }).save();
      }
    }
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Current user's premium status + payment history.
router.get("/me", protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
    const active =
      !!(req.user.premium && req.user.premium.active) &&
      new Date(req.user.premium.expiresAt) > new Date();
    res.json({
      premium: {
        active,
        startedAt: req.user.premium?.startedAt || null,
        expiresAt: req.user.premium?.expiresAt || null,
      },
      pricePerMonth: MONTH_PRICE_XAF,
      payments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // CamPay reference returned when the collect is initiated.
    reference: { type: String, default: "" },
    externalReference: { type: String, default: "" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "XAF" },
    phone: { type: String, required: true },
    operator: { type: String, default: "" },
    ussdCode: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESSFUL", "FAILED"],
      default: "PENDING",
    },
    // Subscription length in months (1 by default).
    months: { type: Number, default: 1 },
    description: { type: String, default: "StreamBox Premium" },
  },
  { timestamps: true }
);

paymentSchema.index({ reference: 1 });
paymentSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);

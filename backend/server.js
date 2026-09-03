require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");

const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");
const userRoutes = require("./routes/user");
const paymentRoutes = require("./routes/payment");
const adminRoutes = require("./routes/admin");
const ratingRoutes = require("./routes/ratings");
const analyticsRoutes = require("./routes/analytics");
const contentSync = require("./services/contentSync");
const { expireSubscriptions } = require("./services/subscriptionExpiry");

const app = express();

app.use(helmet());

// CORS origin is env-driven so the same build works in dev (localhost) and
// after deployment to a real domain. Comma-separated list supported.
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || corsOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

// Retry the initial connection with backoff instead of crashing immediately.
// The Camtel egress IP is dynamic, so a transient Atlas network/whitelist blip
// at startup should not take the API down for good.
async function connectWithRetry(retries = 20, delayMs = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected");
      return true;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt === retries) return false;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

mongoose.connection.on("disconnected", () => {
  console.error("[mongo] Connection disconnected — waiting for mongoose reconnect");
});
mongoose.connection.on("error", (err) => {
  console.error("[mongo] Connection error:", err.message);
});

(async () => {
  const ok = await connectWithRetry();
  if (!ok) {
    console.error("Could not connect to MongoDB after retries. Exiting.");
    process.exit(1);
  }

  app.listen(PORT, () => console.log(`StreamBox server running on port ${PORT}`));

  // Daily content refresh: fetch fresh Cameroonian videos from YouTube and
  // grow the catalog (adds new titles, keeps existing). Runs at 03:00 daily.
  cron.schedule(
    process.env.SYNC_CRON || "0 3 * * *",
    async () => {
      console.log("[sync] Daily content refresh started");
      try {
        const report = await contentSync.syncAll();
        console.log(`[sync] Done. Added ${report.totalAdded} new titles.`);
      } catch (err) {
        console.error("[sync] Daily refresh failed:", err.message);
      }
    },
    { timezone: process.env.SYNC_TIMEZONE || "Africa/Douala" }
  );
  console.log(`[sync] Scheduled daily refresh at ${process.env.SYNC_CRON || "03:00"} (${process.env.SYNC_TIMEZONE || "Africa/Douala"})`);

  // Auto-downgrade premiums whose subscription has expired. Runs hourly.
  const runExpiry = async () => {
    try {
      const n = await expireSubscriptions();
      if (n > 0) console.log(`[expiry] Downgraded ${n} expired premium subscription(s).`);
    } catch (err) {
      console.error("[expiry] Subscription expiry check failed:", err.message);
    }
  };
  cron.schedule(process.env.EXPIRY_CRON || "0 * * * *", runExpiry, {
    timezone: process.env.SYNC_TIMEZONE || "Africa/Douala",
  });
  runExpiry();
  console.log("[expiry] Scheduled hourly premium-expiry check");
})();

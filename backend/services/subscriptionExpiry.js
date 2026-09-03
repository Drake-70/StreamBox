const User = require("../models/User");

// Downgrade any premium subscription whose expiry has passed.
// Returns the number of users downgraded.
async function expireSubscriptions(now = new Date()) {
  const result = await User.updateMany(
    {
      "premium.active": true,
      "premium.expiresAt": { $lte: now },
    },
    { $set: { "premium.active": false } }
  );
  return result.modifiedCount;
}

module.exports = { expireSubscriptions };

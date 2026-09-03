require("dotenv").config();
const mongoose = require("mongoose");
const Content = require("./models/Content");

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 12000 });
    const res = await Content.updateOne(
      { youtubeVideoId: "O7vjKhLNx9g" },
      {
        title: "The Girl with the Beads",
        description: "A coming-of-age story about a young Cameroonian girl discovering her heritage.",
      }
    ).maxTimeMS(8000);
    console.log("restored The Girl with the Beads, modified=" + res.modifiedCount);
    const doc = await Content.findOne({ youtubeVideoId: "O7vjKhLNx9g" }, { title: 1 }).lean().maxTimeMS(8000);
    console.log("title now:", doc && doc.title);
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error("ERR:", e.message);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
})();
setTimeout(() => process.exit(2), 20000);

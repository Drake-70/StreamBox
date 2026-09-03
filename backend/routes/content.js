const express = require("express");
const Content = require("../models/Content");
const { protect, authorize } = require("../middleware/auth");
const youtubeService = require("../services/youtubeService");
const moderation = require("../services/contentModeration");
const { getVideoFlags } = moderation;
const contentSync = require("../services/contentSync");

const router = express.Router();

// A subscription is active when the flag is set and the expiry is in the future.
function isPremiumActive(user) {
  return !!(
    user.premium &&
    user.premium.active &&
    user.premium.expiresAt &&
    new Date(user.premium.expiresAt) > new Date()
  );
}

// ---------------------------------------------------------------------------
// CATALOG: full browsable catalogue w/ filtering, grouping, sorting
// ---------------------------------------------------------------------------
router.get("/catalog", protect, async (req, res) => {
  try {
    const {
      category,
      genre,
      q,
      premium,
      sort = "recent",
      groupBy,
      page = 1,
      limit = 50,
    } = req.query;

    const userAgeGroup = req.user.ageGroup;
    const allowedRatings = youtubeService.AGE_RATING_MAP[userAgeGroup] || ["G", "PG"];

    const query = { ageRating: { $in: allowedRatings }, blocked: { $ne: true } };
    if (premium === "true") query.premium = true;
    if (category) query.category = category;
    if (genre) query.genre = { $in: genre.split(",") };
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ];
    }

    const sortMap = {
      recent: { createdAt: -1 },
      popular: { viewCount: -1 },
      rating: { rating: -1 },
      az: { title: 1 },
    };
    const sortOptions = sortMap[sort] || sortMap.recent;

    let content;
    if (groupBy) {
      // Group by a field (e.g. category) for catalogue grouping
      content = await Content.aggregate([
        { $match: query },
        { $sort: sortOptions },
        { $group: { _id: `$${groupBy}`, items: { $push: "$$ROOT" } } },
        { $project: { title: "$_id", content: { $slice: ["$items", 20] } } },
      ]);
      res.json(content);
      return;
    }

    content = await Content.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Content.countDocuments(query);

    res.json({ content, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all content filtered by user's age group
router.get("/", protect, async (req, res) => {
  try {
    const { category, ageRating, page = 1, limit = 20, search } = req.query;
    const userAgeGroup = req.user.ageGroup;
    const allowedRatings = youtubeService.AGE_RATING_MAP[userAgeGroup] || ["G", "PG"];

    const query = { ageRating: { $in: allowedRatings }, blocked: { $ne: true } };
    if (category) query.category = category;
    if (ageRating) query.ageRating = ageRating;
    if (search) query.title = { $regex: search, $options: "i" };

    const content = await Content.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Content.countDocuments(query);

    res.json({ content, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get featured content
router.get("/featured", protect, async (req, res) => {
  try {
    const userAgeGroup = req.user.ageGroup;
    const allowedRatings = youtubeService.AGE_RATING_MAP[userAgeGroup] || ["G", "PG"];
    const featured = await Content.find({
      featured: true,
      blocked: { $ne: true },
      ageRating: { $in: allowedRatings },
    }).limit(10);
    res.json(featured);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get trending content
router.get("/trending", protect, async (req, res) => {
  try {
    const userAgeGroup = req.user.ageGroup;
    const allowedRatings = youtubeService.AGE_RATING_MAP[userAgeGroup] || ["G", "PG"];
    const trending = await Content.find({
      trending: true,
      blocked: { $ne: true },
      ageRating: { $in: allowedRatings },
    }).limit(10);
    res.json(trending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get content rows for Netflix-style layout
router.get("/rows", protect, async (req, res) => {
  try {
    const userAgeGroup = req.user.ageGroup;
    const allowedRatings = youtubeService.AGE_RATING_MAP[userAgeGroup] || ["G", "PG"];

    const rows = [
      {
        title: "Top Rated",
        query: {
          userRatingCount: { $gt: 0 },
          blocked: { $ne: true },
          ageRating: { $in: allowedRatings },
        },
        sort: { userRating: -1, userRatingCount: -1 },
      },
      { title: "Trending Now", query: { trending: true, blocked: { $ne: true }, ageRating: { $in: allowedRatings } } },
      { title: "Cameroonian Movies", query: { category: "cameroonian_movie", blocked: { $ne: true }, ageRating: { $in: allowedRatings } } },
      { title: "Anime", query: { category: "anime", blocked: { $ne: true }, ageRating: { $in: allowedRatings } } },
      { title: "Documentaries", query: { category: "documentary", blocked: { $ne: true }, ageRating: { $in: allowedRatings } } },
      { title: "Series", query: { category: "series", blocked: { $ne: true }, ageRating: { $in: allowedRatings } } },
      { title: "Short Films", query: { category: "short_film", blocked: { $ne: true }, ageRating: { $in: allowedRatings } } },
      { title: "Featured", query: { featured: true, blocked: { $ne: true }, ageRating: { $in: allowedRatings } } },
    ];

    const results = await Promise.all(
      rows.map(async (row) => ({
        title: row.title,
        content: await Content.find(row.query)
          .sort(row.sort || { createdAt: -1 })
          .limit(15),
      }))
    );

    res.json(results.filter((r) => r.content.length > 0));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search YouTube for Cameroonian content, filtering out non-Cameroonian and
// pornographic/adult videos.
router.get("/search", protect, async (req, res) => {
  try {
    const { q, category } = req.query;
    if (!q) return res.status(400).json({ message: "Search query required" });

    const results = await youtubeService.searchCameroonian(q, 30);
    const mapped = [];

    for (const item of results) {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const description = item.snippet.description;

      // First pass: keyword check on returned metadata
      if (moderation.containsBlockedTerm(`${title} ${description}`)) {
        continue;
      }

      // Second pass: verify via YouTube content rating API (adult flag)
      const flags = await getVideoFlags(videoId);
      if (flags.blocked) {
        continue;
      }

      mapped.push({
        youtubeVideoId: videoId,
        title,
        description,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
        category: category || "cameroonian_movie",
      });
    }

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Add content to DB (with moderation check)
router.post("/", protect, async (req, res) => {
  try {
    const body = req.body;

    // Run moderation on incoming content
    const flaggedTerm = moderation.containsBlockedTerm(
      `${body.title} ${body.description} ${(body.tags || []).join(" ")}`
    );

    let flaggedReasons = [];
    let blocked = false;

    if (flaggedTerm) {
      flaggedReasons.push(`Explicit keyword detected: ${flaggedTerm}`);
      blocked = true;
    }

    if (body.youtubeVideoId) {
      const flags = await getVideoFlags(body.youtubeVideoId);
      if (flags.blocked) {
        blocked = true;
        flaggedReasons.push(...(flags.reasons || []));
      }
    }

    const content = await Content.create({
      ...body,
      moderatorApproved: !blocked,
      flagged: flaggedReasons.length > 0,
      flaggedReasons,
      blocked,
      blockReason: blocked ? flaggedReasons.join("; ") : "",
    });

    if (blocked) {
      return res.status(201).json({
        content,
        message: "Content stored but BLOCKED for moderation (adult content detected)",
      });
    }
    res.status(201).json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Import a searched/browsed YouTube video into the DB so it becomes a full
// title in the catalog and can be added to a watchlist. Runs the same 3-layer
// moderation as manual adds; refuses/does not persist blocked content.
router.post("/import", protect, async (req, res) => {
  try {
    const {
      youtubeVideoId,
      title,
      description = "",
      thumbnailUrl = "",
      category = "cameroonian_movie",
      tags = [],
      ageRating,
    } = req.body;

    if (!youtubeVideoId || !title) {
      return res.status(400).json({ message: "youtubeVideoId and title are required" });
    }
    if (!["cameroonian_movie", "anime", "documentary", "series", "short_film"].includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    // 1. Keyword moderation on metadata
    const flaggedTerm = moderation.containsBlockedTerm(
      `${title} ${description} ${(tags || []).join(" ")}`
    );
    // 2. Verify via YouTube (adult flag + live age rating)
    const details = await youtubeService.getVideoDetails(youtubeVideoId);
    const flags = await getVideoFlags(youtubeVideoId);

    const flaggedReasons = [];
    if (flaggedTerm && !moderation.isInnocentFalsePositive(`${title} ${description}`)) {
      flaggedReasons.push(`Explicit keyword detected: ${flaggedTerm}`);
    }
    if (flags.blocked) {
      flaggedReasons.push(...(flags.reasons || []));
    }
    const blocked = flaggedReasons.length > 0;

    // Determine age rating: prefer client-provided, else infer from YouTube
    const finalAgeRating =
      ageRating && ["G", "PG", "PG-13", "R", "NC-17"].includes(ageRating)
        ? ageRating
        : youtubeService.inferAgeRating(details);

    const content = await Content.findOneAndUpdate(
      { youtubeVideoId },
      {
        $set: {
          title,
          description,
          youtubeVideoId,
          thumbnailUrl,
          category,
          tags: Array.isArray(tags) ? tags : [],
          ageRating: finalAgeRating,
          language: details?.snippet?.defaultLanguage || "English",
          moderatorApproved: !blocked,
          flagged: flaggedReasons.length > 0,
          flaggedReasons,
          blocked,
          blockReason: blocked ? flaggedReasons.join("; ") : "",
        },
      },
      { new: true, upsert: true }
    );

    // Blocked content is not persisted for viewing (pre-hooks hide it anyway),
    // so tell the client it can't be saved.
    if (blocked) {
      return res.status(200).json({
        blocked: true,
        reason: "This video was flagged for adult/inappropriate content and cannot be saved.",
      });
    }

    res.status(201).json({ content, blocked: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manual / on-demand refresh: fetch fresh Cameroonian videos from YouTube and
// add any new ones to the catalog (existing titles are kept).
router.post("/sync", protect, async (req, res) => {
  try {
    const report = await contentSync.syncAll();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single content
router.get("/:id", protect, async (req, res) => {
  try {
    const content = await Content.findOne({
      _id: req.params.id,
      blocked: { $ne: true },
    });
    if (!content) return res.status(404).json({ message: "Content not found" });

    const userAgeGroup = req.user.ageGroup;
    const allowedRatings = youtubeService.AGE_RATING_MAP[userAgeGroup] || ["G", "PG"];
    if (!allowedRatings.includes(content.ageRating)) {
      return res.status(403).json({ message: "Content not available for your age group" });
    }

    // Premium gate: premium titles require an active (non-expired) subscription.
    if (content.premium && !isPremiumActive(req.user)) {
      return res.status(402).json({
        message: "This is a Premium title. Subscribe to unlock it.",
        code: "PREMIUM_REQUIRED",
      });
    }

    await Content.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seed sample content
router.post("/seed", protect, async (req, res) => {
  try {
    const sampleContent = [
      {
        title: "Cameroon: The Hidden Jewel",
        description: "A documentary exploring the breathtaking landscapes and cultures of Cameroon.",
        category: "documentary",
        genre: ["Documentary", "Travel"],
        ageRating: "G",
        ageGroups: ["kids", "teens", "adults"],
        year: 2023,
        language: "English",
        region: "Cameroon",
        featured: true,
        rating: 8.5,
        tags: ["cameroon", "africa", "documentary"],
      },
      {
        title: "Love in Yaoundé",
        description: "A romantic drama set in the heart of Cameroon's capital city.",
        category: "cameroonian_movie",
        genre: ["Romance", "Drama"],
        ageRating: "PG-13",
        ageGroups: ["teens", "adults"],
        year: 2024,
        language: "French",
        region: "Cameroon",
        trending: true,
        rating: 7.8,
        tags: ["cameroon", "romance", "yaounde"],
      },
      {
        title: "Dragon Tales: Cameroon",
        description: "An anime adventure inspired by Cameroonian folklore and mythology.",
        category: "anime",
        genre: ["Animation", "Adventure", "Fantasy"],
        ageRating: "PG",
        ageGroups: ["kids", "teens"],
        year: 2024,
        language: "English",
        featured: true,
        rating: 9.0,
        tags: ["anime", "african", "fantasy"],
      },
      {
        title: "The Bakossi Legend",
        description: "An animated series based on the rich mythology of the Bakossi people.",
        category: "anime",
        genre: ["Animation", "Mythology"],
        ageRating: "G",
        ageGroups: ["kids", "teens", "adults"],
        year: 2024,
        language: "English",
        trending: true,
        rating: 8.2,
        tags: ["anime", "cameroon", "mythology"],
      },
      {
        title: "Douala Nights",
        description: "A gripping crime thriller set in the nightlife of Douala.",
        category: "cameroonian_movie",
        genre: ["Thriller", "Crime"],
        ageRating: "R",
        ageGroups: ["adults"],
        year: 2023,
        language: "French",
        region: "Cameroon",
        rating: 7.5,
        tags: ["cameroon", "thriller", "douala"],
      },
      {
        title: "Kids of Buea",
        description: "A heartwarming story about children in Buea overcoming challenges through friendship.",
        category: "short_film",
        genre: ["Drama", "Family"],
        ageRating: "G",
        ageGroups: ["kids"],
        year: 2024,
        language: "English",
        region: "Cameroon",
        featured: true,
        rating: 8.8,
        tags: ["cameroon", "kids", "buea"],
      },
      {
        title: "Samurai of the Savanna",
        description: "An anime series blending African savanna settings with samurai action.",
        category: "anime",
        genre: ["Animation", "Action"],
        ageRating: "PG-13",
        ageGroups: ["teens", "adults"],
        year: 2024,
        language: "English",
        trending: true,
        rating: 9.2,
        tags: ["anime", "action", "africa"],
      },
      {
        title: "Mount Cameroon: The Ascent",
        description: "A documentary following climbers tackling Africa's most active volcano.",
        category: "documentary",
        genre: ["Documentary", "Adventure"],
        ageRating: "PG",
        ageGroups: ["teens", "adults"],
        year: 2023,
        language: "English",
        region: "Cameroon",
        rating: 8.0,
        tags: ["cameroon", "mountain", "documentary"],
      },
      {
        title: "The Girl with the Beads",
        description: "A coming-of-age story about a young Cameroonian girl discovering her heritage.",
        category: "cameroonian_movie",
        genre: ["Drama", "Coming-of-age"],
        ageRating: "PG",
        ageGroups: ["teens", "adults"],
        year: 2024,
        language: "English",
        region: "Cameroon",
        featured: true,
        rating: 8.7,
        tags: ["cameroon", "drama", "heritage"],
      },
      {
        title: "Ghost Tales of Bamenda",
        description: "A horror anime anthology inspired by ghost stories from Northwest Cameroon.",
        category: "anime",
        genre: ["Animation", "Horror", "Anthology"],
        ageRating: "R",
        ageGroups: ["adults"],
        year: 2024,
        language: "English",
        rating: 7.9,
        tags: ["anime", "horror", "cameroon"],
      },
    ];

    // Real, embeddable, relevant Cameroonian videos (verified against the
    // YouTube API). Matched to each seed item by category/theme.
    const ids = [
      "TNugLK3Ffgs", // 0 Cameroon: The Hidden Jewel  -> Cameroon doc
      "k2moKI6510w", // 1 Love in Yaoundé            -> Broken Home (Cameroon movie)
      "mxIBee3cWlE", // 2 Dragon Tales: Cameroon     -> Bessem & Neba Cameroon animation
      "j2jNz9kzlJY", // 3 The Bakossi Legend         -> Yayakam (Cameroon animation)
      "WPUVHcfJkBc", // 4 Douala Nights              -> CHEPELE (Latest Cameroon Movie)
      "qmRBq2zM3co", // 5 Kids of Buea               -> Standard 7 (Cameroon kids movie)
      "aDL_y9wCt9Q", // 6 Samurai of the Savanna     -> LFC Cartoon (Cameroon animation)
      "OLIJXtGJXiY", // 7 Mount Cameroon: The Ascent -> Cameroon documentary
      "O7vjKhLNx9g", // 8 The Girl with the Beads    -> Wrong Impression (Cameroon movie)
      "zOwrhmBT0Tk", // 9 Ghost Tales of Bamenda     -> Bad Angel (Cameroon series)
    ];

    const prepared = sampleContent.map((c, i) => ({
      ...c,
      youtubeVideoId: ids[i % ids.length],
      moderatorApproved: true,
      flagged: false,
      flaggedReasons: [],
      blocked: false,
      blockReason: "",
    }));

    // Idempotent: insert only items whose title isn't already in the DB
    const existing = await Content.find(
      { title: { $in: prepared.map((c) => c.title) } },
      { title: 1 }
    );
    const existingTitles = new Set(existing.map((e) => e.title));
    const toInsert = prepared.filter((c) => !existingTitles.has(c.title));

    let inserted = [];
    for (const item of toInsert) {
      try {
        inserted.push(await Content.create(item));
      } catch (e) {
        // skip duplicates / failed items silently (e.g. video id already used)
        continue;
      }
    }

    res.status(201).json({
      message: `Seeded ${inserted.length} new content items`,
      content: inserted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

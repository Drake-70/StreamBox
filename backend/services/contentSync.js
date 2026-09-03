const Content = require("../models/Content");
const youtubeService = require("./youtubeService");
const moderation = require("./contentModeration");

// Multiple search queries per category to surface a wider, fresher set each run.
const CATEGORY_SEARCHES = {
  cameroonian_movie: ["Cameroonian movie", "Cameroon Nollywood movie", "Cameroonian film full"],
  anime: ["African animation", "Cameroon cartoon", "African anime", "Cameroon animation"],
  documentary: ["Cameroon documentary", "Cameroon history", "Cameroon culture documentary"],
  series: ["Cameroonian TV series", "Cameroon web series", "African series episode"],
  short_film: ["Cameroonian short film", "African short film", "Cameroon short movie"],
};

const MAX_PER_QUERY = 5;
const MAX_TOTAL_PER_CATEGORY = 10;

function buildAgeGroups(ageRating) {
  if (ageRating === "G" || ageRating === "PG") return ["kids", "teens", "adults"];
  if (ageRating === "PG-13") return ["teens", "adults"];
  return ["adults"];
}

// Fetch fresh videos for a single category, moderate them and upsert new ones
// into the DB. Existing video IDs are skipped (catalog grows, never shrinks).
async function syncCategory(category) {
  const queries = CATEGORY_SEARCHES[category] || CATEGORY_SEARCHES.cameroonian_movie;
  const results = new Map(); // videoId -> {snippet-ish payload}

  for (const q of queries) {
    const items = await youtubeService.searchYouTube(q, MAX_PER_QUERY);
    for (const item of items) {
      const videoId = item.id && item.id.videoId;
      if (!videoId || results.has(videoId)) continue;
      results.set(videoId, {
        youtubeVideoId: videoId,
        title: item.snippet?.title || "Untitled",
        description: item.snippet?.description || "",
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          "",
      });
      if (results.size >= MAX_TOTAL_PER_CATEGORY) break;
    }
    if (results.size >= MAX_TOTAL_PER_CATEGORY) break;
  }

  let added = 0;
  let skippedExisting = 0;
  let blocked = 0;

  for (const payload of results.values()) {
    // Skip if already in DB (grow-only)
    const existing = await Content.findOne({ youtubeVideoId: payload.youtubeVideoId }).lean();
    if (existing) {
      skippedExisting++;
      continue;
    }

    // Keyword + YouTube moderation (same 3-layer approach as /import)
    const flaggedTerm = moderation.containsBlockedTerm(
      `${payload.title} ${payload.description}`
    );
    const flags = await moderation.getVideoFlags(payload.youtubeVideoId);
    const reasons = [];
    if (flaggedTerm && !moderation.isInnocentFalsePositive(`${payload.title} ${payload.description}`)) {
      reasons.push(`Explicit keyword detected: ${flaggedTerm}`);
    }
    if (flags.blocked) reasons.push(...(flags.reasons || []));
    if (reasons.length > 0) {
      blocked++;
      continue; // do not persist adult content
    }

    const details = await youtubeService.getVideoDetails(payload.youtubeVideoId);
    const ageRating = youtubeService.inferAgeRating(details);

    try {
      await Content.create({
        ...payload,
        category,
        genre: ["Cameroon"],
        ageRating,
        ageGroups: buildAgeGroups(ageRating),
        year: details?.snippet?.publishedAt ? new Date(details.snippet.publishedAt).getFullYear() : undefined,
        language: details?.snippet?.defaultLanguage || "English",
        region: "Cameroon",
        tags: ["cameroon", category],
        moderatorApproved: true,
        flagged: false,
        flaggedReasons: [],
        blocked: false,
        blockReason: "",
      });
      added++;
    } catch (err) {
      // unique index race or validation — skip
      console.error(`sync skip (${category}):`, err.message);
    }
  }

  return { category, candidates: results.size, added, skippedExisting, blocked };
}

// Track the most recent sync outcome (in-memory; resets on process restart).
let syncStatus = { lastRunAt: null, lastDurationMs: 0, lastAdded: 0, lastErrors: [] };

// Run a full refresh across every category. Safe to call on a schedule or on
// demand; returns a summary.
async function syncAll() {
  const report = { startedAt: new Date().toISOString(), categories: {} };
  let totalAdded = 0;
  const errors = [];

  for (const category of Object.keys(CATEGORY_SEARCHES)) {
    try {
      const result = await syncCategory(category);
      report.categories[category] = result;
      totalAdded += result.added;
    } catch (err) {
      errors.push(`${category}: ${err.message}`);
      console.error(`sync failed (${category}):`, err.message);
    }
  }

  report.totalAdded = totalAdded;
  report.finishedAt = new Date().toISOString();
  report.errors = errors;

  // Record the last run so the admin dashboard can show when it happened.
  syncStatus = {
    lastRunAt: report.finishedAt,
    lastDurationMs: Date.parse(report.finishedAt) - Date.parse(report.startedAt),
    lastAdded: totalAdded,
    lastErrors: errors,
  };

  return report;
}

function getSyncStatus() {
  return { ...syncStatus };
}

module.exports = { syncAll, syncCategory, CATEGORY_SEARCHES, getSyncStatus };

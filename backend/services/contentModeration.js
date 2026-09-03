const { google } = require("googleapis");

const BLOCKED_TERMS = [
  // Pornographic / explicit adult content
  "porn", "porno", "pornhub", "xvideos", "xnxx", "nude", "naked", "onlyfans",
  "sex", "sextape", "pornography", "adult video", "nsfw", "18+ video",
  "xxx video", "gonewild", "camgirl", "webcam sex", "shemale porn",
  "rape porn", "incest", "cp video", "child porn", "loli porn", "hentai porn",
  "milf porn", "teen porn", "anal porn", "blowjob", "creampie", "dildo",
  "erotic video", "nude cam", "leaked sex", "explicit", "strip tease sex",
  "fetish video", "hardcore video",
];

const BLOCKED_TERMS_STRONG = [
  "porn", "porno", "nude", "naked", "sex tape", "sexvideos", "xnxx", "xvideos",
  "pornhub", "onlyfans", "intercourse explicit", "nsfw video",
];

// YouTube content rating categories that indicate adult-only / sensitive content
const BLOCKED_YOUTUBE_CATEGORIES = ["22", "28"]; // 22 = People & Blogs adult, 28 = Science? (not adult) - see comment below
const BLOCKED_YOUTUBE_RATINGS = ["adults", "sexually explicit"];

function normalize(text = "") {
  return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function containsBlockedTerm(text = "") {
  const normalized = normalize(text);
  for (const term of BLOCKED_TERMS) {
    const normalizedTerm = normalize(term);
    if (normalizedTerm && normalized.includes(normalizedTerm)) {
      return term;
    }
  }
  return null;
}

function containsStrongBlockedTerm(text = "") {
  const normalized = normalize(text);
  for (const term of BLOCKED_TERMS_STRONG) {
    const normalizedTerm = normalize(term);
    if (normalizedTerm && normalized.includes(normalizedTerm)) {
      return term;
    }
  }
  return null;
}

function isInnocentFalsePositive(text = "") {
  const normalized = normalize(text);
  const allowlist = [
    "dessert", "cooking", "food", "recipe",
    "sex education", "sexual health", "hiv", "aids awareness",
    "sex and the city", "relationships", "sexism",
  ];
  for (const w of allowlist) {
    if (normalized.includes(normalize(w))) return true;
  }
  return false;
}

async function getVideoFlags(videoId) {
  try {
    const response = await youtube.videos.list({
      part: "snippet,contentDetails",
      id: videoId,
    });
    const video = response.data.items?.[0];
    if (!video) return { blocked: true, reason: "Video not found" };

    const contentRating = video.contentDetails?.contentRating || {};
    const sniffed = [];

    if (contentRating.ytRating && /adult|sex/i.test(contentRating.ytRating)) {
      sniffed.push(`YouTube rating: ${contentRating.ytRating}`);
    }

    const title = video.snippet?.title || "";
    const description = video.snippet?.description || "";
    const tags = (video.snippet?.tags || []).join(" ");

    const strong = containsStrongBlockedTerm(`${title} ${description} ${tags}`);
    if (strong && !isInnocentFalsePositive(`${title} ${description}`)) {
      sniffed.push(`Explicit term: ${strong}`);
    }

    return {
      blocked: sniffed.length > 0,
      reasons: sniffed,
    };
  } catch (error) {
    console.error("getVideoFlags error:", error.message);
    return { blocked: false, reasons: [] };
  }
}

module.exports = {
  normalize,
  containsBlockedTerm,
  containsStrongBlockedTerm,
  isInnocentFalsePositive,
  getVideoFlags,
  BLOCKED_TERMS,
};

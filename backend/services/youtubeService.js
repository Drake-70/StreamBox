const { google } = require("googleapis");

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

const AGE_RATING_MAP = {
  kids: ["G", "PG"],
  teens: ["G", "PG", "PG-13"],
  adults: ["G", "PG", "PG-13", "R", "NC-17"],
};

const CATEGORY_QUERIES = {
  cameroonian_movie: "Cameroonian movie full film",
  anime: "anime full episode dubbed",
  documentary: "Cameroon documentary",
  series: "Cameroonian web series",
  short_film: "Cameroonian short film",
};

async function searchYouTube(query, maxResults = 20) {
  try {
    const response = await youtube.search.list({
      part: "snippet",
      q: query,
      type: "video",
      maxResults,
      videoCategoryId: "1",
      relevanceLanguage: "en",
    });
    return response.data.items || [];
  } catch (error) {
    console.error("YouTube API error:", error.message);
    return [];
  }
}

// Keywords that signal Cameroonian (or broadly Cameroonian-friendly) content
// in a video's title, description, or channel name.
const CAMEROON_SIGNALS = [
  "cameroon", "cameroun", "camerounaise", "camerounais", "cameronian",
  "yaound", "douala", "buea", "bamenda", "bafoussam", "limbe", "garoua",
  "kribi", "mina", "cm", "cit\u00e9 des sept collines", "mount cameroon",
  "macabo", "ndol\u00e9", "sanza", "bikutsi", "mbolo", "africa's little lion",
  "cameroonian movie", "cameroon movie", "film camerounais", "s\u00e9rie camerounaise",
];

// A browse/search result is "Cameroonian" if its title/description/channel
// mention Cameroon (or a Cameroon place/language marker). This keeps
// non-Cameroonian videos out of the Browse page.
function isLikelyCameroonian(item) {
  const text = [
    item?.snippet?.title,
    item?.snippet?.description,
    item?.snippet?.channelTitle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return CAMEROON_SIGNALS.some((s) => text.includes(s.toLowerCase()));
}

// Search biased toward Cameroonian content: prepend Cameroonian context to the
// query, pull extra candidates, then keep only results that look Cameroonian.
async function searchCameroonian(query, maxResults = 20) {
  const base = String(query || "").trim();
  if (!base) return [];

  const rewrites = [
    `${base} Cameroon`,
    `Cameroonian ${base}`,
    `${base} Cameroun film`,
  ];

  const seen = new Map(); // videoId -> item
  try {
    for (const rw of rewrites) {
      const items = await searchYouTube(rw, Math.max(maxResults, 10));
      for (const it of items) {
        const id = it?.id?.videoId;
        if (!id || seen.has(id)) continue;
        if (isLikelyCameroonian(it)) seen.set(id, it);
        if (seen.size >= maxResults) break;
      }
      if (seen.size >= maxResults) break;
    }
  } catch (e) {
    console.error("searchCameroonian error:", e.message);
  }

  return Array.from(seen.values());
}

async function getVideoDetails(videoId) {
  try {
    const response = await youtube.videos.list({
      part: "snippet,contentDetails,statistics",
      id: videoId,
    });
    return response.data.items?.[0] || null;
  } catch (error) {
    console.error("YouTube video details error:", error.message);
    return null;
  }
}

async function getVideosByCategory(category, maxResults = 20) {
  const query = CATEGORY_QUERIES[category] || "Cameroon movie";
  return searchYouTube(query, maxResults);
}

async function getTrendingVideos(regionCode = "CM", maxResults = 20) {
  try {
    const response = await youtube.videos.list({
      part: "snippet,statistics",
      chart: "mostPopular",
      regionCode,
      maxResults,
      videoCategoryId: "1",
    });
    return response.data.items || [];
  } catch (error) {
    console.error("YouTube trending error:", error.message);
    return [];
  }
}

async function searchByAgeGroup(ageGroup, category = null, maxResults = 20) {
  const queryParts = [];
  if (category && CATEGORY_QUERIES[category]) {
    queryParts.push(CATEGORY_QUERIES[category]);
  } else {
    queryParts.push("Cameroonian movie");
  }
  if (ageGroup === "kids") queryParts.push("for kids family");
  if (ageGroup === "teens") queryParts.push("teen friendly");
  return searchYouTube(queryParts.join(" "), maxResults);
}

// Map YouTube's content ratings onto StreamBox's G/PG/PG-13/R/NC-17 scale.
// Unknown / unrated content defaults to PG (family-friendly assumption).
function inferAgeRating(videoDetails) {
  if (!videoDetails) return "PG";
  const r = videoDetails.contentDetails?.contentRating || {};
  if (r.ytRating === "ytAgeRestricted") return "R";
  const yt =
    r.mpaaRating ||
    r.tvRating ||
    r.ytRating;
  if (!yt) return "PG";
  const y = String(yt).toLowerCase();
  if (/(nc-17|nc17|18|adults only)/.test(y)) return "NC-17";
  if (/(r\b|restricted|tv-ma)/.test(y)) return "R";
  if (/(pg-13|tv-14)/.test(y)) return "PG-13";
  if (/(pg|tv-pg)/.test(y)) return "PG";
  return "G";
}

module.exports = {
  searchYouTube,
  searchCameroonian,
  getVideoDetails,
  getVideosByCategory,
  getTrendingVideos,
  searchByAgeGroup,
  inferAgeRating,
  AGE_RATING_MAP,
};

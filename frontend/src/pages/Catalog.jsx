import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import WatchlistToggle from "../components/WatchlistToggle";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "cameroonian_movie", label: "🇨🇲 Cameroonian Movies" },
  { value: "anime", label: "⛩️ Anime" },
  { value: "documentary", label: "🎥 Documentaries" },
  { value: "series", label: "📺 Series" },
  { value: "short_film", label: "🎬 Short Films" },
];

const SORTS = [
  { value: "recent", label: "Recently Added" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Top Rated" },
  { value: "az", label: "A - Z" },
];

const PREMIUM_FILTERS = [
  { value: "", label: "All Titles" },
  { value: "true", label: "Premium Only" },
  { value: "false", label: "Free Only" },
];

function Catalog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPremium = !!(user?.premium?.active);
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState("recent");
  const [premiumFilter, setPremiumFilter] = useState(searchParams.get("premium") || "");
  const [query, setQuery] = useState("");
  const [content, setContent] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, premiumFilter, searchParams]);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const q = searchParams.get("q");
      const params = { sort, limit: 60 };
      if (category) params.category = category;
      if (premiumFilter) params.premium = premiumFilter;
      if (q) params.q = q;
      const res = await api.get("/content/catalog", { params });
      setContent(res.data.content || []);
      setTotal(res.data.total || 0);
      setQuery(q || "");
    } catch (error) {
      console.error("Catalog error:", error);
      setContent([]);
    }
    setLoading(false);
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    setCategory(val);
    const next = new URLSearchParams(searchParams);
    if (val) next.set("category", val);
    else next.delete("category");
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (query.trim()) next.set("q", query.trim());
    else next.delete("q");
    setSearchParams(next);
  };

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const handleRefresh = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await api.post("/content/sync");
      setSyncMsg(`Added ${res.data.totalAdded} new title(s).`);
      fetchCatalog();
    } catch (error) {
      setSyncMsg("Refresh failed. Try again later.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="catalog-page">
      <h2 className="catalog-title">Browse the Catalog</h2>
      <p className="catalog-sub">
        Explore {total} titles of Cameroonian cinema, anime and more — curated and safe for your age group.
      </p>

      <div className="catalog-controls">
        <form className="catalog-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search titles, genres, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="catalog-filters">
          <select value={category} onChange={handleCategoryChange}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select value={premiumFilter} onChange={(e) => setPremiumFilter(e.target.value)}>
            {PREMIUM_FILTERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button className="catalog-refresh-btn" onClick={handleRefresh} disabled={syncing}>
            {syncing ? "Refreshing..." : "🔄 Refresh Now"}
          </button>
          {syncMsg && <span className="sync-msg">{syncMsg}</span>}
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          Loading catalog...
        </div>
      ) : content.length === 0 ? (
        <div className="empty-state">
          <h3>No titles found</h3>
          <p>Try a different category or search term. All content is moderated for safety.</p>
        </div>
      ) : (
        <>
          <div className="catalog-grid">
            {content.map((item) => (
              <div
                key={item._id}
                className="catalog-card"
                onClick={() =>
                  item.premium && !isPremium
                    ? navigate("/subscribe")
                    : navigate(`/watch/${item._id}`)
                }
              >
                <div className="catalog-card-poster">
                  <img
                    src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeVideoId}/mqdefault.jpg`}
                    alt={item.title}
                  />
                  {item.premium && (
                    <span className="premium-badge">PREMIUM</span>
                  )}
                  <div className="catalog-card-overlay">
                    <button className="catalog-play">
                      {item.premium && !isPremium ? (
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="catalog-card-body">
                  <div className="catalog-card-title-row">
                    <h3>{item.title}</h3>
                    <div onClick={(e) => e.stopPropagation()}>
                      <WatchlistToggle contentId={item._id} />
                    </div>
                  </div>
                  <div className="catalog-card-meta">
                    {item.rating > 0 && <span className="match">{item.rating * 10}% Match</span>}
                    {item.year && <span>{item.year}</span>}
                    <span className={`age-badge ${item.ageGroups?.[0] || "adults"}`}>{item.ageRating}</span>
                  </div>
                  {item.genre?.length > 0 && (
                    <p className="catalog-card-genres">{item.genre.slice(0, 3).join(" • ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Catalog;

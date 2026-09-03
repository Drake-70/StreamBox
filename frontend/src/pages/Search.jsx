import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { track } from "../services/analytics";

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [savedMap, setSavedMap] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const TRENDING = [
    { label: "Cameroonian Movies", query: "Cameroonian movie" },
    { label: "Anime", query: "anime" },
    { label: "Documentaries", query: "documentary" },
    { label: "Series", query: "series" },
    { label: "Short Films", query: "short film" },
    { label: "Love", query: "love" },
    { label: "Culture", query: "culture" },
  ];

  // Debounced live suggestions from the existing catalog (titles already in DB).
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/content/catalog`, {
          params: { q: query.trim(), sort: "recent", limit: 6 },
        });
        setSuggestions((res.data.content || []).slice(0, 5));
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const runTrending = (q) => {
    setQuery(q);
    setSearchParams({ q });
    track("search", { meta: { q } });
  };

  const saveResult = async (item, e) => {
    e.stopPropagation();
    setSavingId(item.youtubeVideoId);
    try {
      const res = await api.post("/content/import", {
        youtubeVideoId: item.youtubeVideoId,
        title: item.title,
        description: item.description,
        thumbnailUrl: item.thumbnailUrl,
        category: "cameroonian_movie",
      });
      if (res.data.blocked) {
        setSavedMap((m) => ({ ...m, [item.youtubeVideoId]: "blocked" }));
        return;
      }
      await api.post(`/user/watchlist/${res.data.content._id}`);
      setSavedMap((m) => ({ ...m, [item.youtubeVideoId]: "saved" }));
    } catch (error) {
      console.error("Save error:", error);
      setSavedMap((m) => ({ ...m, [item.youtubeVideoId]: "error" }));
    } finally {
      setSavingId(null);
    }
  };

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    track("search", { meta: { q: searchQuery } });
    try {
      const res = await api.get(`/content/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(res.data);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  return (
    <div className="search-page">
      <h2>Browse StreamBox</h2>

      <form className="search-bar-large" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search for Cameroonian movies, anime, documentaries..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        <button type="submit">Search</button>
        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggest">
            {suggestions.map((s) => (
              <button
                key={s._id}
                type="button"
                onMouseDown={() => navigate(`/watch/${s._id}`)}
                className="search-suggest-item"
              >
                <img src={s.thumbnailUrl || `https://img.youtube.com/vi/${s.youtubeVideoId}/mqdefault.jpg`} alt="" />
                <span>{s.title}</span>
                {s.premium ? <em>Premium</em> : null}
              </button>
            ))}
          </div>
        )}
      </form>

      <div className="trending-row">
        <span className="trending-label">Trending:</span>
        {TRENDING.map((t) => (
          <button key={t.label} className="trending-chip" onClick={() => runTrending(t.query)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          Searching...
        </div>
      ) : results.length > 0 ? (
        <div className="search-results-grid">
          {results.map((item, index) => (
            <div
              key={index}
              className="search-card"
              onClick={() => {
                navigate(
                  item._id
                    ? `/watch/${item._id}`
                    : `/watch?videoId=${encodeURIComponent(item.youtubeVideoId)}&title=${encodeURIComponent(item.title || "")}&description=${encodeURIComponent(item.description || "")}&thumb=${encodeURIComponent(item.thumbnailUrl || "")}`
                );
              }}
            >
              <img
                src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeVideoId}/mqdefault.jpg`}
                alt={item.title}
              />
              <div className="search-card-info">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <button
                  className={`search-save-btn ${savedMap[item.youtubeVideoId] === "saved" ? "active" : ""}`}
                  onClick={(e) => saveResult(item, e)}
                  disabled={savingId === item.youtubeVideoId || savedMap[item.youtubeVideoId] === "saved"}
                >
                  {savedMap[item.youtubeVideoId] === "saved"
                    ? "✓ Saved"
                    : savedMap[item.youtubeVideoId] === "blocked"
                    ? "Blocked"
                    : savingId === item.youtubeVideoId
                    ? "Saving..."
                    : "+ Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : searched ? (
        <div className="empty-state">
          <h3>No results found</h3>
          <p>Try a different search term</p>
        </div>
      ) : (
        <div className="empty-state">
          <h3>Start exploring</h3>
          <p>Search for Cameroonian movies, anime, documentaries and more</p>
        </div>
      )}
    </div>
  );
}

export default Search;

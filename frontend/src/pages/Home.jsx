import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { track } from "../services/analytics";
import ContentRow from "../components/ContentRow";

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState(null);
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    track("home_view");
  }, [user]);

  const fetchData = async () => {
    try {
      const [featuredRes, rowsRes, histRes] = await Promise.all([
        api.get("/content/featured"),
        api.get("/content/rows"),
        api.get("/user/history").catch(() => []),
      ]);
      if (featuredRes.data.length > 0) {
        setFeatured(featuredRes.data[Math.floor(Math.random() * featuredRes.data.length)]);
      }
      setRows(rowsRes.data);
      const hist = histRes.data || [];
      setHistory(hist);
      if (hist.length > 0) {
        buildRecommendations(hist, rowsRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  // "Because you watched" — pull titles sharing a category with recent watches,
  // exclude ones already watched, cap as a single row.
  const buildRecommendations = (hist, allRows) => {
    const watchedIds = new Set(hist.map((h) => h._id));
    const watchedCats = new Set(hist.map((h) => h.category));
    const seen = new Set();
    const recs = [];
    for (const row of allRows) {
      for (const item of row.content || []) {
        if (recs.length >= 12) break;
        if (watchedIds.has(item._id) || seen.has(item._id)) continue;
        if (item.category && watchedCats.has(item.category)) {
          recs.push(item);
          seen.add(item._id);
        }
      }
    }
    setRecommended(recs);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading StreamBox...
      </div>
    );
  }

  return (
    <div className="home">
      {featured && (
        <div
          className="hero-banner"
          style={{
            backgroundImage: `url(${featured.thumbnailUrl || `https://img.youtube.com/vi/${featured.youtubeVideoId}/maxresdefault.jpg`})`,
          }}
        >
          <div className="hero-content">
            <h1 className="hero-title">{featured.title}</h1>
            <p className="hero-description">{featured.description}</p>
            <div className="hero-buttons">
              <button className="btn btn-play" onClick={() => navigate(`/watch/${featured._id}`)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Play
              </button>
              <button className="btn btn-info" onClick={() => navigate(`/watch/${featured._id}`)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                More Info
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: "-80px", position: "relative", zIndex: 2 }}>
        {history.length > 0 && <ContentRow title="Continue Watching" content={history} />}
        {recommended.length > 0 && <ContentRow title="Because you watched" content={recommended} />}
        {rows.map((row, index) => (
          <ContentRow key={index} title={row.title} content={row.content} />
        ))}
      </div>

      {rows.length === 0 && !featured && (
        <div className="empty-state" style={{ paddingTop: "200px" }}>
          <h3>Welcome to StreamBox!</h3>
          <p style={{ color: "#008751", fontSize: "14px", marginBottom: "4px" }}>Cameroon's Home for Movies & Anime</p>
          <p>No content available yet. Add some content to get started.</p>
          <button
            className="btn btn-play"
            style={{ marginTop: "20px" }}
            onClick={async () => {
              try {
                await api.post("/content/seed");
                fetchData();
              } catch (err) {
                console.error(err);
              }
            }}
          >
            Load Sample Content
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/user/history");
      setHistory(res.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="watchlist-page">
        <div className="loading">
          <div className="spinner"></div>
          Loading your history...
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <h2>Continue Watching</h2>

      {history.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing watched yet</h3>
          <p>Movies and anime you watch will show up here</p>
          <button className="btn btn-play" style={{ marginTop: "16px" }} onClick={() => navigate("/")}>
            Browse Content
          </button>
        </div>
      ) : (
        <div className="watchlist-grid">
          {history.map((item) => (
            <div key={item._id} className="search-card">
              <img
                src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeVideoId}/mqdefault.jpg`}
                alt={item.title}
                onClick={() => navigate(`/watch/${item._id}`)}
                style={{ cursor: "pointer" }}
              />
              <div className="search-card-info">
                <h4>{item.title}</h4>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                  <span className={`age-badge ${item.ageGroups?.[0] || "adults"}`} style={{ fontSize: "10px" }}>
                    {item.ageRating}
                  </span>
                  <span style={{ color: "#777", fontSize: "11px" }}>
                    {item.premium ? "Premium" : "Free"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;

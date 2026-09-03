import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Watchlist() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const res = await api.get("/user/watchlist");
      setWatchlist(res.data);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    }
    setLoading(false);
  };

  const removeFromWatchlist = async (contentId) => {
    try {
      await api.post(`/user/watchlist/${contentId}`);
      setWatchlist(watchlist.filter((item) => item._id !== contentId));
    } catch (error) {
      console.error("Error removing from watchlist:", error);
    }
  };

  if (loading) {
    return (
      <div className="watchlist-page">
        <div className="loading">
          <div className="spinner"></div>
          Loading your list...
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <h2>My List</h2>

      {watchlist.length === 0 ? (
        <div className="empty-state">
          <h3>Your list is empty</h3>
          <p>Add movies and anime to your list to watch later</p>
          <button className="btn btn-play" style={{ marginTop: "16px" }} onClick={() => navigate("/")}>
            Browse Content
          </button>
        </div>
      ) : (
        <div className="watchlist-grid">
          {watchlist.map((item) => (
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
                  <button
                    onClick={() => removeFromWatchlist(item._id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e50914",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Watchlist;

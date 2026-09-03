import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import WatchlistToggle from "./WatchlistToggle";

function ContentRow({ title, content }) {
  const rowRef = useRef(null);
  const navigate = useNavigate();

  const scroll = (direction) => {
    if (rowRef.current) {
      const scrollAmount = direction === "left" ? -600 : 600;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!content || content.length === 0) return null;

  return (
    <div className="content-row">
      <div className="row-header">
        <h3 className="row-title">{title}</h3>
        <div className="row-controls">
          <button className="carousel-btn" onClick={() => scroll("left")} aria-label="Scroll left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <button className="carousel-btn" onClick={() => scroll("right")} aria-label="Scroll right">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="row-posters" ref={rowRef}>
        {content.map((item) => (
          <div
            key={item._id}
            className="poster-card"
            onClick={() => navigate(`/watch/${item._id}`)}
          >
            <img
              src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeVideoId}/mqdefault.jpg`}
              alt={item.title}
            />
            {item.progress > 0 && (
              <div className="poster-progress">
                <div
                  className="poster-progress-bar"
                  style={{
                    width: `${
                      item.duration > 0
                        ? Math.min(100, (item.progress / item.duration) * 100)
                        : 100
                    }%`,
                  }}
                />
              </div>
            )}
            <div className="poster-info">
              <h4>{item.title}</h4>
              <div className="poster-meta">
                {item.userRatingCount > 0 && (
                  <span className="user-score">{item.userRating?.toFixed?.(1) || item.userRating} ★</span>
                )}
                {item.rating > 0 && <span className="match">{item.rating * 10}% Match</span>}
                {item.year && <span>{item.year}</span>}
                <span className={`age-badge ${item.ageGroups?.[0] || "adults"}`}>
                  {item.ageRating}
                </span>
              </div>
              <div className="poster-actions">
                <button className="play-btn" onClick={(e) => { e.stopPropagation(); navigate(`/watch/${item._id}`); }}>
                  {item.progress > 0 ? "Resume" : "Play"}
                </button>
                <span onClick={(e) => e.stopPropagation()}>
                  <WatchlistToggle contentId={item._id} initialAdded={false} size="sm" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ContentRow;

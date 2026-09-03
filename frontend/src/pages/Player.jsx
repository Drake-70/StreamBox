import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { track } from "../services/analytics";
import ResumePlayer from "../components/ResumePlayer";

function Player() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);

  // A browsed video that isn't saved in the DB yet: play directly from the
  // YouTube video id passed via query params (?videoId=...).
  const isExternal = !id && searchParams.get("videoId");

  useEffect(() => {
    if (isExternal) {
      setContent({
        youtubeVideoId: searchParams.get("videoId"),
        title: searchParams.get("title") || "Video",
        description: searchParams.get("description") || "",
        thumbnailUrl: searchParams.get("thumb") || "",
        ageRating: searchParams.get("ageRating") || "G",
      });
      setLoading(false);
      return;
    }
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchContent = async () => {
    try {
      const res = await api.get(`/content/${id}`);
      setContent(res.data);

      await api.post(`/user/history/${id}`).catch(() => {});

      track("watch_play", { content: id, category: res.data.category });

      // Load saved playback position so "Continue Watching" resumes where left off.
      api.get("/user/history").then((histRes) => {
        const entry = (histRes.data || []).find((h) => h._id === id);
        if (entry && entry.progress > 0) {
          setResumeProgress(entry.progress);
          setResumeDuration(entry.duration || 0);
        }
      }).catch(() => {});

      const profileRes = await api.get("/user/watchlist").catch(() => null);
      if (profileRes) {
        setInWatchlist(profileRes.data.some((item) => item._id === id));
      }

      api.get(`/ratings/${id}`).then((r) => {
        setRatings(r.data);
        setMyScore(r.data.mine?.score ?? null);
        setMyReview(r.data.mine?.review || "");
      }).catch(() => {});
    } catch (error) {
      console.error("Error fetching content:", error);
      if (error.response?.status === 402) {
        // Premium title - user needs a subscription.
        navigate("/subscribe", { state: { from: id } });
        return;
      }
      if (error.response?.status === 403) {
        setContent({ restricted: true, message: error.response.data.message });
      }
    }
    setLoading(false);
  };

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [resumeProgress, setResumeProgress] = useState(0);
  const [resumeDuration, setResumeDuration] = useState(0);
  const [ratings, setRatings] = useState({ average: 0, count: 0, mine: null, reviews: [] });
  const [myScore, setMyScore] = useState(null);
  const [myReview, setMyReview] = useState("");
  const [ratingMsg, setRatingMsg] = useState("");

  // Throttled persistence of the live playhead during playback.
  const saveProgress = async (progress, duration) => {
    if (!id) return;
    try {
      await api.put(`/user/history/${id}/progress`, { progress, duration });
    } catch (error) {
      /* non-critical; ignore */
    }
  };

  const submitRating = async (e) => {
    e.preventDefault();
    setRatingMsg("");
    try {
      const body = { score: myScore, review: myReview };
      const res = await api.post(`/ratings/${id}`, body);
      setRatings((prev) => ({
        ...prev,
        average: res.data.aggregate.avg,
        count: res.data.aggregate.count,
        mine: res.data.rating,
      }));
      setRatingMsg("Thanks! Your rating and review were saved.");
    } catch (error) {
      setRatingMsg(error.response?.data?.message || "Could not save rating.");
    }
  };

  const deleteRating = async () => {
    setRatingMsg("");
    try {
      await api.delete(`/ratings/${id}`);
      setMyScore(null);
      setMyReview("");
      const fresh = await api.get(`/ratings/${id}`);
      setRatings(fresh.data);
      setRatingMsg("Your review was removed.");
    } catch (error) {
      setRatingMsg("Could not remove review.");
    }
  };

  const toggleWatchlist = async () => {
    // External (browsed, not-yet-in-DB) videos must be imported into the DB
    // first so they get an _id and can appear in the catalog/watchlist.
    if (isExternal) {
      try {
        setSaving(true);
        setSaveMsg("");
        const importRes = await api.post("/content/import", {
          youtubeVideoId: content.youtubeVideoId,
          title: content.title,
          description: content.description,
          thumbnailUrl: content.thumbnailUrl,
          category: searchParams.get("category") || "cameroonian_movie",
        });
        if (importRes.data.blocked) {
          setSaveMsg(importRes.data.reason || "This video cannot be saved.");
          return;
        }
        const savedContent = importRes.data.content;
        setContent({ ...content, _id: savedContent._id, ageRating: savedContent.ageRating });
        await api.post(`/user/watchlist/${savedContent._id}`);
        setInWatchlist(true);
        setSaveMsg("Saved to My List.");
      } catch (error) {
        console.error("Import/watchlist error:", error);
        setSaveMsg("Could not save this video.");
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      await api.post(`/user/watchlist/${id}`);
      setInWatchlist(!inWatchlist);
    } catch (error) {
      console.error("Watchlist error:", error);
    }
  };

  if (loading) {
    return (
      <div className="player-page">
        <div className="loading">
          <div className="spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  if (content?.restricted) {
    return (
      <div className="player-page">
        <div className="player-container" style={{ paddingTop: "120px", textAlign: "center" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "16px" }}>Content Restricted</h1>
          <p style={{ color: "#999", marginBottom: "24px" }}>{content.message}</p>
          <button className="btn btn-info" onClick={() => navigate("/")}>
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="player-page">
        <div className="player-container" style={{ paddingTop: "120px", textAlign: "center" }}>
          <h1>Content Not Found</h1>
          <button className="btn btn-info" onClick={() => navigate("/")} style={{ marginTop: "16px" }}>
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-page">
      <div className="player-container">
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "24px",
            marginBottom: "16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          &larr; Back
        </button>

        <div className="player-video">
          <ResumePlayer
            youtubeVideoId={content.youtubeVideoId}
            initialProgress={resumeProgress}
            onProgressSave={saveProgress}
            duration={resumeDuration}
          />
        </div>

        <div className="player-details">
          <div className="player-actions">
            <button>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Play
            </button>
            <button onClick={toggleWatchlist} className={inWatchlist ? "active" : ""}>
              {saving ? "Saving..." : inWatchlist ? "✓ In My List" : "+ My List"}
            </button>
            {saveMsg && <span className="save-msg">{saveMsg}</span>}
            <button>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              Like
            </button>
          </div>

          <div className="meta-row">
            <span className="match">{content.rating ? `${content.rating * 10}% Match` : ""}</span>
            {content.year && <span>{content.year}</span>}
            <span className={`age-badge ${content.ageGroups?.[0] || "adults"}`}>{content.ageRating}</span>
            {content.duration && <span>{content.duration}</span>}
          </div>

          <h1>{content.title}</h1>
          <p className="description">{content.description}</p>

          {content.genre?.length > 0 && (
            <p style={{ color: "#999", fontSize: "13px", marginTop: "12px" }}>
              <strong style={{ color: "#ddd" }}>Genre:</strong> {content.genre.join(", ")}
            </p>
          )}
          {content.language && (
            <p style={{ color: "#999", fontSize: "13px", marginTop: "4px" }}>
              <strong style={{ color: "#ddd" }}>Language:</strong> {content.language}
            </p>
          )}

          <div className="reviews-section">
            <h3 className="reviews-heading">Ratings &amp; Reviews</h3>
            <div className="reviews-summary">
              <div className="reviews-score">
                {ratings.average > 0 ? ratings.average.toFixed(1) : "—"}
              </div>
              <div className="reviews-count">
                {ratings.average > 0 ? `${ratings.average.toFixed(1)} / 10` : "No ratings yet"}
                <span>{ratings.count} rating{ratings.count === 1 ? "" : "s"}</span>
              </div>
            </div>

            <form className="review-form" onSubmit={submitRating}>
              <div className="star-row">
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`star-btn ${myScore >= n ? "lit" : ""}`}
                    onClick={() => setMyScore(n)}
                    aria-label={`${n} stars`}
                  >★</button>
                ))}
              </div>
              <textarea
                className="review-text"
                rows="3"
                maxLength="2000"
                placeholder="Share your thoughts…"
                value={myReview}
                onChange={(e) => setMyReview(e.target.value)}
              />
              <div className="review-actions">
                <button type="submit" className="btn btn-info">
                  {ratings.mine ? "Update Review" : "Post Review"}
                </button>
                {ratings.mine && (
                  <button type="button" className="btn btn-danger" onClick={deleteRating}>
                    Remove
                  </button>
                )}
              </div>
              {ratingMsg && <p className="save-msg">{ratingMsg}</p>}
            </form>

            <div className="reviews-list">
              {ratings.reviews.length === 0 && <p className="reviews-empty">Be the first to review this title.</p>}
              {ratings.reviews.map((r) => (
                <div key={r._id} className="review-item">
                  <div className="review-item-top">
                    <strong>{r.user.name}</strong>
                    {r.score != null && <span className="review-score">★ {r.score}/10</span>}
                    <span className="review-date">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {r.review && <p className="review-body">{r.review}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;

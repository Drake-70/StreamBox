import React, { useState } from "react";
import api from "../services/api";

// A small, reusable "Add to My List / Added" toggle. POST /user/watchlist/:id
// is a toggle (adds if absent, removes if present), so membership is managed
// here locally. `initialAdded` lets a parent seed the state when it knows the
// item's membership; otherwise it defaults to not-added.
function WatchlistToggle({ contentId, initialAdded = false, onToggle, size = "sm", style }) {
  const [added, setAdded] = useState(initialAdded);
  const [busy, setBusy] = useState(false);

  const toggle = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && e.preventDefault) e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api.post(`/user/watchlist/${contentId}`);
      setAdded((a) => !a);
      if (onToggle) onToggle(!added);
    } catch (err) {
      // ignore — likely not authenticated
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className={`watchlist-toggle ${added ? "is-added" : ""} size-${size}`}
      onClick={toggle}
      disabled={busy}
      title={added ? "Remove from My List" : "Add to My List"}
      style={style}
    >
      <svg width={size === "lg" ? 18 : 14} height={size === "lg" ? 18 : 14} viewBox="0 0 24 24" fill={added ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {added ? (
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        ) : (
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        )}
      </svg>
      <span>{added ? "Added" : "My List"}</span>
    </button>
  );
}

export default WatchlistToggle;

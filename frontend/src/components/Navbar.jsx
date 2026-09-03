import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <Link to="/home" className="navbar-logo">
        <span className="logo-stream">Stream</span>
        <span className="logo-box">Box</span>
      </Link>

      <ul className="navbar-links">
        <li><Link to="/home" className={location.pathname === "/home" ? "active" : ""}>Home</Link></li>
        <li><Link to="/catalog" className={location.pathname === "/catalog" ? "active" : ""}>Catalog</Link></li>
        <li><Link to="/search" className={location.pathname === "/search" ? "active" : ""}>Browse</Link></li>
        <li><Link to="/watchlist" className={location.pathname === "/watchlist" ? "active" : ""}>My List</Link></li>
        <li><Link to="/history" className={location.pathname === "/history" ? "active" : ""}>History</Link></li>
        {user && user.role === "admin" && (
          <li>
            <Link to="/admin" className={location.pathname === "/admin" ? "active" : ""}>Admin</Link>
          </li>
        )}
      </ul>

      <div className="navbar-right">
        <form className="navbar-search" onSubmit={handleSearch}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Titles, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {user && !user.premium?.active && (
          <Link to="/subscribe" className="navbar-premium">
            Go Premium
          </Link>
        )}

        {user && (
          <span className={`age-badge ${user.ageGroup}`}>{user.ageGroup}</span>
        )}

        <div className="navbar-avatar" onClick={() => navigate("/profile")}>
          {user?.username?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

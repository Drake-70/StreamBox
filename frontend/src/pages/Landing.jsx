import React from "react";
import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "M12 3l7 2v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V5l7-2z",
    title: "Cameroonian Cinema",
    desc: "Stream the best films from Cameroon — from Yaoundé to Douala, Buea to Bamenda.",
  },
  {
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 5l6 5-6 5V7z",
    title: "Anime Collection",
    desc: "Curated anime series and movies for every age group, dubbed and subbed.",
  },
  {
    icon: "M12 2l7 3.5V11c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V5.5L12 2zM8 12l3 3 5-6",
    title: "Age-Group Filtering",
    desc: "Safe content for kids, teens, and adults — automatically filtered by age group.",
  },
  {
    icon: "M12 2a15 15 0 0 1 10 14c0 4-1 6-2 6s-2-2-4-2-3 2-4 2-1-2-4-2-3 2-4 2-1-2-2-6A15 15 0 0 1 12 2z",
    title: "African Stories",
    desc: "Celebrate the richness of Cameroonian culture, folklore, and storytelling.",
  },
];

const CATEGORIES = [
  { label: "Cameroonian Movies", color: "#008751" },
  { label: "Anime", color: "#CE1126" },
  { label: "Documentaries", color: "#FCD116" },
  { label: "Series", color: "#008751" },
  { label: "Short Films", color: "#CE1126" },
];

function Landing() {
  return (
    <div className="landing">
      {/* ===== NAVBAR ===== */}
      <nav className="landing-nav">
        <div className="landing-logo">
          Stream<span>Box</span>
        </div>
        <div className="landing-nav-right">
          <Link to="/login" className="landing-nav-link">Sign In</Link>
          <Link to="/register" className="landing-cta-btn">Get Started</Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="landing-hero">
        <div className="landing-hero-pattern" />
        <div className="landing-hero-content">
          <div className="landing-flag-bar" />
          <h1>
            Cameroon's Home for
            <br />
            <span className="hero-highlight">Movies</span> &{" "}
            <span className="hero-highlight-alt">Anime</span>
          </h1>
          <p className="landing-hero-sub">
            StreamBox brings you the finest Cameroonian cinema, captivating anime, and
            African stories — all filtered by age group for the whole family.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="landing-btn-primary">
              Start Watching Free
            </Link>
            <Link to="/login" className="landing-btn-secondary">
              Sign In
            </Link>
          </div>
          <div className="landing-flag-bar" />
        </div>
        <div className="landing-hero-mosaic">
          <div className="mosaic-tile" style={{ background: "#008751" }} />
          <div className="mosaic-tile" style={{ background: "#CE1126" }} />
          <div className="mosaic-tile" style={{ background: "#FCD116" }} />
          <div className="mosaic-tile" style={{ background: "#008751" }} />
          <div className="mosaic-tile" style={{ background: "#CE1126" }} />
          <div className="mosaic-tile" style={{ background: "#FCD116" }} />
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="landing-features">
        <h2 className="section-title">
          Why <span className="cm-title">StreamBox</span>?
        </h2>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="landing-categories">
        <h2 className="section-title">
          Explore <span className="cm-title">Categories</span>
        </h2>
        <div className="categories-strip">
          {CATEGORIES.map((cat, i) => (
            <div
              key={i}
              className="category-pill"
              style={{ borderColor: cat.color, color: cat.color }}
            >
              <span className="cat-dot" style={{ background: cat.color }} />
              {cat.label}
            </div>
          ))}
        </div>
      </section>

      {/* ===== AGE GROUPS ===== */}
      <section className="landing-age-section">
        <h2 className="section-title">
          Content for <span className="cm-title">Every Age</span>
        </h2>
        <div className="age-cards">
          <div className="age-card age-card-kids">
            <div className="age-card-badge">KIDS</div>
            <h3>Under 13</h3>
            <p>Safe, fun, and educational content for the little ones. Family-friendly Cameroonian stories and anime adventures.</p>
          </div>
          <div className="age-card age-card-teens">
            <div className="age-card-badge">TEENS</div>
            <h3>13 - 17</h3>
            <p>Exciting anime, coming-of-age stories, and Cameroon's vibrant youth culture captured on screen.</p>
          </div>
          <div className="age-card age-card-adults">
            <div className="age-card-badge">ADULTS</div>
            <h3>18+</h3>
            <p>The full catalogue. Thrillers, dramas, documentaries — all of Cameroon's cinematic brilliance.</p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="landing-footer">
        <div className="footer-pattern" />
        <div className="footer-content">
          <div className="footer-logo">
            Stream<span>Box</span>
          </div>
          <p className="footer-tagline">The Heart of Cameroonian Streaming</p>
          <div className="footer-links">
            <Link to="/login">Sign In</Link>
            <Link to="/register">Sign Up</Link>
          </div>
          <div className="footer-legal">
            <Link to="/terms">Terms</Link>
            <span className="footer-legal-sep">•</span>
            <Link to="/privacy">Privacy</Link>
          </div>
          <div className="footer-flag" />
          <p className="footer-copy">&copy; {new Date().getFullYear()} StreamBox. Made with love in Cameroon.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;

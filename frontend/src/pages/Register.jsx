import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageGroup, setAgeGroup] = useState("kids");
  const [parentalPin, setParentalPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const pinRequired = ageGroup !== "adults";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (pinRequired && !/^\d{4}$/.test(parentalPin)) {
      setError("A 4-digit parent PIN is required for a kids/teens profile.");
      return;
    }
    if (parentalPin && !/^\d{4}$/.test(parentalPin)) {
      setError("Parent PIN must be 4 digits.");
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password, ageGroup, parentalPin || undefined);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-overlay" />
      <div className="auth-form">
        <div className="logo">
          <span className="logo-stream">Stream</span>
          <span className="logo-box">Box</span>
        </div>
        <div className="auth-flag-bar" />
        <h2>Sign Up</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
              <option value="kids">Kids (Under 13)</option>
              <option value="teens">Teens (13-17)</option>
              <option value="adults">Adults (18+)</option>
            </select>
          </div>
          <div className="form-group">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              placeholder={
                pinRequired
                  ? "4-digit Parent PIN (required)"
                  : "4-digit Parent PIN (optional, recommended)"
              }
              value={parentalPin}
              onChange={(e) => setParentalPin(e.target.value.replace(/\D/g, ""))}
            />
            <small
              style={{
                display: "block",
                color: "#999",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              {pinRequired
                ? "A parent PIN protects this profile. It is required to change the age-group filter."
                : "Setting a parent PIN will require it to change the age-group filter later."}
            </small>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;

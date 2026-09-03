import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
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
        <h2>Sign In</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
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
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <p className="auth-link">
          New to StreamBox? <Link to="/register">Sign up now</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

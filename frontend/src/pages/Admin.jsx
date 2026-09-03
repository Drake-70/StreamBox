import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "cameroonian_movie", label: "Cameroonian Movies" },
  { value: "anime", label: "Anime" },
  { value: "documentary", label: "Documentaries" },
  { value: "series", label: "Series" },
  { value: "short_film", label: "Short Films" },
];

function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [content, setContent] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [review, setReview] = useState([]);
  const [sync, setSync] = useState({ lastRunAt: null, lastAdded: 0, lastErrors: [] });
  const [syncing, setSyncing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [premiumFilter, setPremiumFilter] = useState("");
  const [bulkCategory, setBulkCategory] = useState("cameroonian_movie");
  const [bulkPref, setBulkPref] = useState(true);
  const [bulkMsg, setBulkMsg] = useState("");
  const [toast, setToast] = useState("");

  const loadStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (e) {}
  };
  const loadAnalytics = async () => {
    try {
      const res = await api.get("/analytics/summary");
      setAnalytics(res.data);
    } catch (e) {}
  };
  const loadContent = async () => {
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (premiumFilter) params.premium = premiumFilter;
      const res = await api.get("/admin/content", { params });
      setContent(res.data.content || []);
    } catch (e) {}
  };
  const loadUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (e) {}
  };
  const loadPayments = async () => {
    try {
      const res = await api.get("/admin/payments");
      setPayments(res.data.payments || []);
    } catch (e) {}
  };
  const loadReview = async () => {
    try {
      const res = await api.get("/admin/moderation");
      setReview(res.data.content || []);
    } catch (e) {}
  };
  const loadSync = async () => {
    try {
      const res = await api.get("/admin/sync");
      setSync(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    loadStats();
    loadContent();
    loadUsers();
    loadPayments();
    loadReview();
    loadSync();
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, premiumFilter]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const togglePremium = async (item) => {
    try {
      await api.put(`/admin/content/${item._id}/premium`, { premium: !item.premium });
      showToast(`"${item.title.slice(0, 40)}" ${!item.premium ? "→ Premium" : "→ Free"}`);
      loadContent();
      loadStats();
    } catch (err) {
      showToast("Update failed");
    }
  };

  const applyBulk = async () => {
    setBulkMsg("");
    try {
      const res = await api.post("/admin/content/by-category", {
        category: bulkCategory,
        premium: bulkPref,
      });
      setBulkMsg(`Updated ${res.data.modified} title(s) in ${bulkCategory}.`);
      loadContent();
      loadStats();
    } catch (err) {
      setBulkMsg("Bulk update failed.");
    }
  };

  const toggleRole = async (u) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    try {
      await api.put(`/admin/users/${u._id}/role`, { role: newRole });
      showToast(`${u.username} → ${newRole}`);
      loadUsers();
    } catch (err) {
      showToast("Role update failed");
    }
  };

  const reviewDecision = async (item, action) => {
    try {
      await api.put(`/admin/moderation/${item._id}`, { action });
      showToast(action === "approve" ? "Approved (restored)" : "Rejected (blocked)");
      loadReview();
      loadStats();
    } catch (err) {
      showToast("Review action failed");
    }
  };

  const forceSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post("/admin/sync");
      setSync(res.data.status);
      loadStats();
      showToast(`Re-sync complete: +${res.data.status.lastAdded} new title(s)`);
    } catch (err) {
      showToast("Re-sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="player-page">
        <div className="player-container" style={{ paddingTop: "120px", textAlign: "center" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "16px" }}>Admin Access Required</h1>
          <p style={{ color: "#999", marginBottom: "24px" }}>You are not authorized to view this page.</p>
          <button className="btn btn-info" onClick={() => navigate("/home")}>Go Home</button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Titles", value: stats?.total ?? "—", accent: "green", icon: "M12 3l7 2v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V5l7-2z" },
    { label: "Premium", value: stats?.premium ?? "—", accent: "gold", icon: "M11.8 2l2.4 5.3 5.8.8-4.2 4 1 5.7-5-2.7-5 2.7 1-5.7-4.2-4 5.8-.8L11.8 2z" },
    { label: "Free", value: stats?.free ?? "—", accent: "blue", icon: "M20 12H4M12 4v16" },
    { label: "Users", value: stats?.users ?? "—", accent: "red", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
    { label: "Premium Members", value: stats?.premiumUsers ?? "—", accent: "teal", icon: "M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7" },
    { label: "Payments", value: stats?.payments ?? "—", accent: "violet", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3 7l-4 4-2-2" },
  ];

  return (
    <div className="admin-page">
      {toast && <div className="admin-toast">{toast}</div>}
      <div className="admin-titlebar">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Manage content, subscriptions & moderators</p>
        </div>
        <span className="admin-role-chip">Signed in as {user.username}</span>
      </div>

      <div className="admin-stats">
        {statCards.map((s) => (
          <div className={`admin-stat accent-${s.accent}`} key={s.label}>
            <div className="admin-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon} />
              </svg>
            </div>
            <div>
              <div className="admin-stat-value">{s.value}</div>
              <div className="admin-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {analytics && (
        <section className="admin-section">
          <div className="admin-section-head">
            <h3>Analytics</h3>
            <p>Lightweight app events (watches, searches, subscriptions)</p>
          </div>
          <div className="admin-bulk-card analytics-card">
            <div className="analytics-kpis">
              <div className="analytics-kpi">
                <div className="analytics-kpi-value">{analytics.totalEvents ?? 0}</div>
                <div className="analytics-kpi-label">Events</div>
              </div>
              <div className="analytics-kpi">
                <div className="analytics-kpi-value">{analytics.uniqueVisitors ?? 0}</div>
                <div className="analytics-kpi-label">Unique visitors</div>
              </div>
            </div>
            {analytics.topEvents?.length > 0 && (
              <div className="analytics-events">
                {analytics.topEvents.map((ev) => (
                  <span key={ev.event} className="analytics-chip">
                    {ev.event} <b>{ev.count}</b>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bulk premium by category */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h3>Bulk Premium Settings</h3>
          <p>Apply a premium/free flag to an entire category at once</p>
        </div>
        <div className="admin-bulk-card">
          <div className="admin-field">
            <span className="admin-field-label">Category</span>
            <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
              {CATEGORIES.filter((c) => c.value).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <span className="admin-field-label">Set To</span>
            <select value={bulkPref ? "t" : "f"} onChange={(e) => setBulkPref(e.target.value === "t")}>
              <option value="t">Premium</option>
              <option value="f">Free</option>
            </select>
          </div>
          <button className="admin-apply-btn btn-primary" onClick={applyBulk}>Apply to Category</button>
        </div>
        {bulkMsg && <p className="sync-msg">{bulkMsg}</p>}
      </section>

      {/* Content sync */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h3>Content Sync</h3>
          <p>Pull the latest titles from YouTube across all categories</p>
        </div>
        <div className="admin-sync-bar">
          <div className="admin-sync-info">
            <span className={`admin-sync-dot ${sync.lastErrors?.length ? "has-err" : ""}`}></span>
            <div>
              <div style={{ fontSize: "14px", color: "#eee", fontWeight: 600 }}>
                {sync.lastRunAt
                  ? `Last sync: ${new Date(sync.lastRunAt).toLocaleString()}`
                  : "No sync recorded this session"}
              </div>
              <div style={{ color: "#999", fontSize: "12px" }}>
                {sync.lastAdded !== null && sync.lastAdded !== undefined
                  ? `+${sync.lastAdded} new title(s) added`
                  : "— acquiring..."}
                {sync.lastErrors?.length ? ` • ${sync.lastErrors.length} category error(s)` : " • no errors"}
              </div>
            </div>
          </div>
          <button className="admin-apply-btn btn-primary" onClick={forceSync} disabled={syncing}>
            {syncing ? "Syncing..." : "🔁 Re-sync Now"}
          </button>
        </div>
      </section>

      {/* Content management table */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h3>Content Management</h3>
          <div className="admin-filters">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label || "All Categories"}</option>
              ))}
            </select>
            <select value={premiumFilter} onChange={(e) => setPremiumFilter(e.target.value)}>
              <option value="">Premium: All</option>
              <option value="true">Premium: On</option>
              <option value="false">Premium: Off</option>
            </select>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table" cellPadding="8">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Age</th>
                <th>Premium</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {content.map((c) => (
                <tr key={c._id}>
                  <td style={{ maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</td>
                  <td><span className="admin-cat">{c.category.replace(/_/g, " ")}</span></td>
                  <td><span className={`admin-age age-badge ${c.ageRating?.toLowerCase() || "adults"}`}>{c.ageRating}</span></td>
                  <td>{c.premium ? <span className="pay-status successful">Premium</span> : <span className="pay-status pending">Free</span>}</td>
                  <td>
                    <button className={`admin-toggle ${c.premium ? "is-free" : "is-premium"}`} onClick={() => togglePremium(c)}>
                      {c.premium ? "Make Free" : "Make Premium"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Moderation Review Queue */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h3>Moderation Review Queue <span className="admin-count">{review.length}</span></h3>
          <p>Flagged / blocked titles that need a decision. Approving restores them to the catalog.</p>
        </div>
        {review.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
            </div>
            <p>All caught up — no items awaiting review.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table" cellPadding="8">
              <thead>
                <tr><th>Title</th><th>Status</th><th>Reason</th><th></th></tr>
              </thead>
              <tbody>
                {review.map((c) => (
                  <tr key={c._id}>
                    <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</td>
                    <td>
                      {c.blocked ? <span className="pay-status failed">Blocked</span> : <span className="pay-status pending">Flagged</span>}
                    </td>
                    <td style={{ color: "#bbb", fontSize: "12px", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.blockReason || (c.flaggedReasons || []).join("; ") || "—"}
                    </td>
                    <td>
                      <button className="admin-toggle is-premium" onClick={() => reviewDecision(c, "approve")}>Approve</button>{" "}
                      <button className="admin-toggle is-free" onClick={() => reviewDecision(c, "reject")}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Users */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h3>Users & Roles</h3>
          <p>Promote or demote moderators / admins</p>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table" cellPadding="8">
            <thead>
              <tr><th>User</th><th>Email</th><th>Age Group</th><th>Role</th><th>Premium</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td><div className="admin-user"><span className="admin-avatar">{u.username?.[0]?.toUpperCase() || "U"}</span>{u.username}</div></td>
                  <td style={{ color: "#999" }}>{u.email}</td>
                  <td><span className={`admin-age age-badge ${u.ageGroup}`}>{u.ageGroup}</span></td>
                  <td>{u.role === "admin" ? <span className="pay-status successful">admin</span> : <span className="pay-status pending">user</span>}</td>
                  <td>{u.premium?.active ? <span className="pay-status successful">Yes</span> : <span style={{ color: "#666" }}>No</span>}</td>
                  <td>
                    <button className="admin-toggle" onClick={() => toggleRole(u)} disabled={u.email === user.email}>
                      {u.role === "admin" ? "Demote" : "Make Admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payments */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h3>Recent Payments</h3>
          <p>Latest CamPay subscription transactions</p>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table" cellPadding="8">
            <thead>
              <tr><th>User</th><th>Amount</th><th>Status</th><th>Reference</th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{p.user?.username || "—"}</td>
                  <td>{p.amount} XAF</td>
                  <td><span className={`pay-status ${p.status.toLowerCase()}`}>{p.status}</span></td>
                  <td style={{ color: "#bbb", fontSize: "12px" }}>{p.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Admin;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, logout, updateAgeGroup, updateParentalPin } = useAuth();
  const navigate = useNavigate();
  const [selectedAge, setSelectedAge] = useState(user?.ageGroup || "adults");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Age-group change: require the parent PIN when one is set
  const [agePin, setAgePin] = useState("");
  const [askingPin, setAskingPin] = useState(false);
  const pinSet = user?.parentalControl?.enabled;

  // PIN manager state
  const [pinManagerOpen, setPinManagerOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");

  const handleAgePinClick = () => {
    setError("");
    setMessage("");
    if (selectedAge === user?.ageGroup) {
      setMessage("Age group is already set to that.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (pinSet) {
      setAskingPin(true);
    } else {
      doChangeAgeGroup();
    }
  };

  const doChangeAgeGroup = async (pin) => {
    try {
      const res = await updateAgeGroup(selectedAge, pin);
      setAskingPin(false);
      setAgePin("");
      setMessage("Age group updated! Content will be refreshed.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update age group.");
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    await doChangeAgeGroup(agePin);
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!/^\d{4}$/.test(newPin)) {
      setError("Parent PIN must be 4 digits.");
      return;
    }
    try {
      await updateParentalPin(newPin, currentPin || undefined);
      setPinManagerOpen(false);
      setNewPin("");
      setCurrentPin("");
      setMessage("Parental control PIN updated.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update parent PIN.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.username?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="profile-info">
          <h1>{user?.username}</h1>
          <p>{user?.email}</p>
          <span
            className={`age-badge ${user?.ageGroup}`}
            style={{ marginTop: "8px", display: "inline-block" }}
          >
            {user?.ageGroup}
          </span>
        </div>
      </div>

      <div className="profile-settings">

        <section className="settings-card">
          <h3>Profile Settings</h3>

          <div className="setting-row">
            <label>Age Group (Content Filter)</label>
            <select value={selectedAge} onChange={(e) => setSelectedAge(e.target.value)}>
              <option value="kids">Kids (Under 13)</option>
              <option value="teens">Teens (13-17)</option>
              <option value="adults">Adults (18+)</option>
            </select>
          </div>

          {askingPin && (
            <form className="pin-form" onSubmit={handlePinSubmit}>
              <label>Enter Parent PIN to change age group</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                placeholder="4-digit PIN"
                value={agePin}
                autoFocus
                onChange={(e) => setAgePin(e.target.value.replace(/\D/g, ""))}
              />
              <div className="pin-actions">
                <button type="submit" className="btn-primary">
                  Confirm
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setAskingPin(false);
                    setAgePin("");
                    setSelectedAge(user?.ageGroup);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="setting-row">
            <button onClick={handleAgePinClick}>Save Changes</button>
          </div>

          {message && (
            <p style={{ color: "#008751", fontSize: "14px", marginTop: "8px" }}>{message}</p>
          )}
          {error && (
            <p style={{ color: "#e5484d", fontSize: "14px", marginTop: "8px" }}>{error}</p>
          )}
        </section>

        <section className="settings-card">
          <h3>Parental Control</h3>

          <div className="setting-row">
            <label>
              Parent PIN {pinSet ? "(set)" : "(not set)"}
              <small style={{ display: "block", color: "#999", fontSize: "12px" }}>
                Required to change the age-group content filter.
              </small>
            </label>
            <button onClick={() => setPinManagerOpen((o) => !o)}>
              {pinSet ? "Change PIN" : "Set PIN"}
            </button>
          </div>

          {pinManagerOpen && (
            <form className="pin-form" onSubmit={handleSavePin}>
              {pinSet && (
                <div className="form-group">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="\d{4}"
                    placeholder="Current PIN"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              )}
              <div className="form-group">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="\d{4}"
                  placeholder="New 4-digit PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="pin-actions">
                <button type="submit" className="btn-primary">
                  Save PIN
                </button>
                <button type="button" className="btn" onClick={() => setPinManagerOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="settings-card">
          <h3>Account</h3>

          <div className="setting-row">
            <label>Username</label>
            <span style={{ color: "#999" }}>{user?.username}</span>
          </div>

          <div className="setting-row">
            <label>Email</label>
            <span style={{ color: "#999" }}>{user?.email}</span>
          </div>

          <button className="btn-logout btn" onClick={handleLogout}>
            Sign Out of StreamBox
          </button>
        </section>
      </div>
    </div>
  );
}

export default Profile;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { track } from "../services/analytics";
import { useAuth } from "../context/AuthContext";

function Subscribe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [pricePerMonth, setPricePerMonth] = useState(2000);
  const [premium, setPremium] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [ussd, setUssd] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadStatus = async () => {
    try {
      const res = await api.get("/payment/me");
      setPremium(res.data.premium);
      setPricePerMonth(res.data.pricePerMonth);
      setPayments(res.data.payments || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const startPayment = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      track("subscribe_intent", { category: "premium" });
      const res = await api.post("/payment/subscribe", { phone, months: 1 });
      setPaymentRef(res.data.payment.reference);
      setUssd(res.data.payment.ussdCode || "");
      setMessage(
        res.data.message ||
          "Check your phone and approve the payment using the instructions sent."
      );
      setPolling(true);
      await pollStatus(res.data.payment.reference);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start payment.");
    }
  };

  const pollStatus = async (reference) => {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await api.get(`/payment/status/${reference}`);
        if (res.data.status === "SUCCESSFUL") {
          setPolling(false);
          track("subscribe_success", { category: "premium" });
          setMessage("Payment successful! Premium is now active.");
          setPremium((prev) => ({ ...prev, active: true }));
          await loadStatus();
          return;
        }
        if (res.data.status === "FAILED") {
          setPolling(false);
          setError("Payment failed. Please try again.");
          return;
        }
      } catch (e) {}
    }
    setPolling(false);
    setMessage("Payment is taking longer than expected. Check your phone and refresh.");
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  return (
    <div className="subscribe-page">
      <div className="subscribe-hero">
        <h1>StreamBox <span className="premium-tag">Premium</span></h1>
        <p>
          Unlock exclusive Cameroonian premieres, premium movies and ad-free viewing with
          Mobile Money (MTN / Orange).
        </p>
        <div className="price-card">
          <span className="price-amount">{pricePerMonth} XAF</span>
          <span className="price-period">/ month</span>
        </div>
      </div>

      {premium?.active && (
        <div className="premium-active-box">
          <strong>You are a Premium member.</strong>{" "}
          <span>Valid until {formatDate(premium.expiresAt)}.</span>
        </div>
      )}

      <div className="subscribe-form">
        <label>MTN / Orange Mobile Money number</label>
        <input
          type="tel"
          placeholder="2376XXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={polling}
        />
        <button className="btn-primary" onClick={startPayment} disabled={polling || !phone}>
          {polling ? "Waiting for approval..." : "Pay with Mobile Money"}
        </button>
        {ussd && <p className="ussd-hint">Approve on your phone (USSD: {ussd}).</p>}
        {message && <p className="sync-msg">{message}</p>}
        {error && <p className="error-msg">{error}</p>}
      </div>

      <div className="payments-history">
        <h3>Payment History</h3>
        {payments.length === 0 ? (
          <p style={{ color: "#999" }}>No payments yet.</p>
        ) : (
          <table border="0" cellPadding="8" style={{ width: "100%" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#aaa" }}>
                <th>Date</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{formatDate(p.createdAt)}</td>
                  <td style={{ color: "#bbb", fontSize: "12px" }}>{p.reference}</td>
                  <td>{p.amount} XAF</td>
                  <td>
                    <span className={`pay-status ${p.status.toLowerCase()}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="btn-logout btn" style={{ marginTop: "20px" }} onClick={() => navigate("/home")}>
        Back to Home
      </button>
    </div>
  );
}

export default Subscribe;

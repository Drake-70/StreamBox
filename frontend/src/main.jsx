import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Register the service worker for installability/offline app-shell (only on
// http/https, not during dev if it errors).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

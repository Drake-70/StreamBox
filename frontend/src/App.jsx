import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Player from "./pages/Player";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Watchlist from "./pages/Watchlist";
import History from "./pages/History";
import Subscribe from "./pages/Subscribe";
import Admin from "./pages/Admin";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import "./App.css";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
}

function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/home" /> : children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <Landing />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/terms"
        element={
          <PublicOnlyRoute>
            <Terms />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/privacy"
        element={
          <PublicOnlyRoute>
            <Privacy />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Navbar />
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/watch/:id"
        element={
          <ProtectedRoute>
            <Navbar />
            <Player />
          </ProtectedRoute>
        }
      />
      <Route
        path="/watch"
        element={
          <ProtectedRoute>
            <Navbar />
            <Player />
          </ProtectedRoute>
        }
      />
      <Route
        path="/catalog"
        element={
          <ProtectedRoute>
            <Navbar />
            <Catalog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <Navbar />
            <Search />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Navbar />
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/watchlist"
        element={
          <ProtectedRoute>
            <Navbar />
            <Watchlist />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <Navbar />
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscribe"
        element={
          <ProtectedRoute>
            <Navbar />
            <Subscribe />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Navbar />
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? "/home" : "/"} />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

import React, { createContext, useState, useContext, useEffect } from "react";
import api, { setAuthToken } from "../services/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "streambox_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setAuthToken(parsed.token);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      setAuthToken(user.token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data);
    return res.data;
  };

  const register = async (username, email, password, ageGroup, parentalPin) => {
    const res = await api.post("/auth/register", {
      username,
      email,
      password,
      ageGroup,
      parentalPin,
    });
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    setUser(null);
  };

  const updateAgeGroup = async (ageGroup, pin) => {
    const res = await api.put("/user/age-group", { ageGroup, pin });
    setUser((prev) => ({
      ...prev,
      ageGroup: res.data.ageGroup,
      parentalControl: res.data.parentalControl,
    }));
    return res.data;
  };

  const updateParentalPin = async (pin, currentPin) => {
    const res = await api.post("/user/parental-control", { pin, currentPin });
    setUser((prev) => ({ ...prev, parentalControl: { enabled: true } }));
    return res.data;
  };

  const verifyParentalPin = async (pin) => {
    const res = await api.post("/user/parental-control/verify", { pin });
    return res.data.valid;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateAgeGroup,
        updateParentalPin,
        verifyParentalPin,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

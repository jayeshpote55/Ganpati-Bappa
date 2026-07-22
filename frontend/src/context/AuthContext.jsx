import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bappa_token");
    const savedUser = localStorage.getItem("bappa_user");
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Refresh profile in background
      api
        .get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem("bappa_user", JSON.stringify(res.data.user));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("bappa_token", res.data.token);
    localStorage.setItem("bappa_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    toast.success(res.data.message || "Logged in!");
    return res.data.user;
  };

  const register = async (payload, autoLogin = true) => {
    const res = await api.post("/auth/register", payload);
    if (autoLogin) {
      localStorage.setItem("bappa_token", res.data.token);
      localStorage.setItem("bappa_user", JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    toast.success(res.data.message || "Registered!");
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("bappa_token");
    localStorage.removeItem("bappa_user");
    setUser(null);
    toast("Logged out. Ganpati Bappa Morya! 🙏", { icon: "👋" });
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem("bappa_user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FaEnvelope, FaLock } from "react-icons/fa";

export default function Login() {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!quickName.trim()) {
      toast.error("कृपया तुमचे नाव टाका");
      return;
    }
    setQuickLoading(true);
    try {
      await quickLogin(quickName.trim());
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Quick entry failed");
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-orange-50 mandala-pattern px-4 py-12">
      <div className="card w-full max-w-md p-8 animate-slide-up space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-2">🌺</div>
          <h1 className="font-display text-2xl font-bold text-maroon-700">Welcome to Navtarun Mitra Mandal</h1>
          <p className="text-gray-500 text-sm mt-1">Login to your Mandal account</p>
          <button type="button" onClick={() => navigate("/")} className="mt-2 text-xs text-orange-600 underline hover:text-orange-700">
            Skip and browse app
          </button>
        </div>

        {/* Quick Name Entry Option */}
        <div className="rounded-2xl bg-orange-100/70 p-4 border border-orange-200 text-center space-y-2">
          <p className="text-xs font-semibold text-orange-800">⚡ रजिस्ट्रेशन न करता फक्त नाव टाकून ॲप उघडा</p>
          <form onSubmit={handleQuickSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="तुमचे नाव (Enter Name)..."
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              className="w-full bg-white text-xs text-slate-800 px-3 py-2 rounded-xl outline-none border border-orange-300 focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={quickLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-3 py-2 rounded-xl shrink-0 disabled:opacity-50"
            >
              {quickLoading ? "..." : "प्रवेश करा"}
            </button>
          </form>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-3 text-xs text-gray-400 uppercase font-medium">किंवा Email ने Login करा</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/80 px-4 py-3 shadow-sm">
            <FaEnvelope className="text-orange-500 shrink-0" />
            <input
              type="email"
              required
              placeholder="Email address"
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/80 px-4 py-3 shadow-sm">
            <FaLock className="text-orange-500 shrink-0" />
            <input
              type="password"
              required
              placeholder="Password"
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          New to the mandal?{" "}
          <Link to="/register" className="text-orange-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
}

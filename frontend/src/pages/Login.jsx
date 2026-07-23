import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FaEnvelope, FaLock } from "react-icons/fa";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-orange-50 mandala-pattern px-4 py-12">
      <div className="card w-full max-w-md p-8 animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🌺</div>
          <h1 className="font-display text-2xl font-bold text-maroon-700">Welcome to Navtarun Mitra Mandal</h1>
          <p className="text-gray-500 text-sm mt-1">Login to your Mandal account</p>
          <button type="button" onClick={() => navigate("/")} className="mt-3 text-xs text-orange-600 underline hover:text-orange-700">
            Skip and browse app
          </button>
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

        <p className="text-center text-sm text-gray-500 mt-6">
          New to the mandal?{" "}
          <Link to="/register" className="text-orange-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
}

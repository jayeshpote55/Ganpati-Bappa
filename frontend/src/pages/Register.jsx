import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", city: "", address: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!/^[0-9]{10}$/.test(form.phone)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      await register(form, false);
      toast.success("Account created successfully. Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-orange-50 mandala-pattern px-4 py-12">
      <div className="card w-full max-w-md p-8 animate-slide-up bg-white/95 shadow-xl shadow-orange-200">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🙏</div>
          <h1 className="font-display text-2xl font-bold text-maroon-700">Join the Mandal</h1>
          <p className="text-gray-500 text-sm mt-1">Create your member account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/80 px-4 py-3 shadow-sm">
            <FaUser className="text-orange-500 shrink-0" />
            <input
              name="name"
              required
              placeholder="Full name"
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/80 px-4 py-3 shadow-sm">
            <FaEnvelope className="text-orange-500 shrink-0" />
            <input
              type="email"
              name="email"
              required
              placeholder="Email address"
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/80 px-4 py-3 shadow-sm">
            <FaPhone className="text-orange-500 shrink-0" />
            <input
              name="phone"
              required
              placeholder="10-digit phone number"
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              value={form.phone}
              onChange={handleChange}
              maxLength={10}
            />
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/80 px-4 py-3 shadow-sm">
            <FaMapMarkerAlt className="text-orange-500 shrink-0" />
            <input
              name="city"
              placeholder="City (optional)"
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              value={form.city}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/80 px-4 py-3 shadow-sm">
            <FaLock className="text-orange-500 shrink-0" />
            <input
              type="password"
              name="password"
              required
              placeholder="Password (min 6 characters)"
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full !mt-5">
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already a member?{" "}
          <Link to="/login" className="text-orange-600 font-semibold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

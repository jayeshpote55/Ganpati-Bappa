import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Donations from "./pages/Donations";
import Gallery from "./pages/Gallery";
import Announcements from "./pages/Announcements";
import Polls from "./pages/Polls";
import Aartis from "./pages/Aartis";
import Funds from "./pages/Funds";
import Chat from "./pages/Chat";
import Members from "./pages/Members";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-orange-50/30">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: "12px", fontWeight: 500 } }} />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/donations" element={<ProtectedRoute><Donations /></ProtectedRoute>} />
          <Route path="/funds" element={<ProtectedRoute><Funds /></ProtectedRoute>} />
          <Route path="/aartis" element={<ProtectedRoute><Aartis /></ProtectedRoute>} />
          <Route path="/polls" element={<ProtectedRoute><Polls /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

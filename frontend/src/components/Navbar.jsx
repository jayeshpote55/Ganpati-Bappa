import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  FaBars, FaTimes, FaOm, FaTachometerAlt, FaCalendarAlt,
  FaDonate, FaImages, FaBullhorn, FaUserCircle, FaSignOutAlt,
  FaVoteYea, FaComments, FaUsers, FaChartBar, FaPray,
} from "react-icons/fa";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected, onlineCount } = useSocket();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { to: "/events", label: "Events", icon: <FaCalendarAlt /> },
    { to: "/donations", label: "Vargani", icon: <FaDonate /> },
    { to: "/funds", label: "Funds", icon: <FaChartBar /> },
    { to: "/aartis", label: "Aartis", icon: <FaPray /> },
    { to: "/polls", label: "Polls", icon: <FaVoteYea /> },
    { to: "/chat", label: "Chat", icon: <FaComments /> },
    { to: "/members", label: "Members", icon: <FaUsers /> },
    { to: "/gallery", label: "Gallery", icon: <FaImages /> },
    { to: "/announcements", label: "Announcements", icon: <FaBullhorn /> },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-festive-gradient shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-white font-display font-bold text-xl">
            <span className="text-2xl animate-float inline-block">🪔</span>
            <span className="hidden sm:inline">Ganpati Bappa</span>
            <span className="sm:hidden">GBM</span>
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-white/20 text-white" : "text-orange-100 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  {l.icon} {l.label}
                </NavLink>
              ))}
            </div>
          )}

          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-1.5 bg-white/10 text-white text-xs px-2.5 py-1 rounded-full">
                <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}></span>
                {connected ? `${onlineCount} online` : "connecting..."}
              </div>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="flex items-center gap-1.5 text-white text-sm font-medium hover:opacity-80">
                  <FaUserCircle className="text-lg" /> {user.name?.split(" ")[0]}
                </Link>
                <button onClick={handleLogout} className="text-orange-100 hover:text-white p-2" title="Logout">
                  <FaSignOutAlt />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="text-white font-medium px-4 py-2 hover:bg-white/10 rounded-lg text-sm">Login</Link>
                <Link to="/register" className="bg-gold-500 text-maroon-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gold-400">
                  Join Mandal
                </Link>
              </div>
            )}
          </div>

          <button className="md:hidden text-white text-2xl" onClick={() => setOpen(!open)}>
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-maroon-700/95 backdrop-blur px-4 pb-4 space-y-1">
          {user ? (
            <>
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? "bg-white/20 text-white" : "text-orange-100"
                    }`
                  }
                >
                  {l.icon} {l.label}
                </NavLink>
              ))}
              <NavLink to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-orange-100">
                <FaUserCircle /> Profile
              </NavLink>
              <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-orange-100">
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" onClick={() => setOpen(false)} className="text-white font-medium px-3 py-2">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="bg-gold-500 text-maroon-700 font-semibold px-3 py-2 rounded-lg text-center">
                Join Mandal
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

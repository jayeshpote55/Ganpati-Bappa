import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import {
  FaUsers,
  FaCalendarAlt,
  FaDonate,
  FaImages,
  FaBullhorn,
  FaBolt,
  FaMapMarkerAlt,
  FaMusic,
  FaGift,
  FaCameraRetro,
  FaHandsHelping,
  FaShieldAlt,
  FaClock,
} from "react-icons/fa";

const eventSchedule = [
  { time: "10:00 AM", title: "Murti Sthapana", label: "Day 1" },
  { time: "07:00 PM", title: "Bhajan Sandhya", label: "Day 2" },
  { time: "05:00 PM", title: "Cultural Program", label: "Day 5" },
  { time: "05:00 PM", title: "Visarjan Procession", label: "Day 10" },
];

const volunteerRoles = [
  "Decoration",
  "Sound System",
  "Prasad",
  "Security",
  "Photography",
  "Cleaning",
  "Logistics",
  "Media",
];

const pollingItems = [
  { question: "Tomorrow meeting timing?", options: ["6 PM", "7 PM", "8 PM"] },
  { question: "Aarti playlist for today?", options: ["Old bhajans", "New releases", "Mix"] },
];

const sponsorData = [
  { name: "Shree Decorators", note: "Lighting & stage partner" },
  { name: "Bappa Foods", note: "Prasad sponsor" },
  { name: "Sankalp Motors", note: "Transport support" },
];

const dailyUpdates = [
  "Today's Program: Ganesh Aarati at 7 AM",
  "Volunteers: 32 confirmed",
  "Expenses: ₹18,400 for decoration",
  "New gallery upload: 24 photos",
];

const emergencyContacts = [
  "President: 98765 43210",
  "Police: 100",
  "Hospital: 108",
  "Ambulance: 102",
];

export default function Home() {
  const [mandal, setMandal] = useState(null);
  const [countdown, setCountdown] = useState({ days: "--", hours: "--", minutes: "--", seconds: "--" });

  useEffect(() => {
    api.get("/mandals").then((res) => {
      if (res.data.mandals?.length) setMandal(res.data.mandals[0]);
    }).catch(() => {});
  }, []);

  const nextChaturthi = useMemo(() => {
    const now = new Date();
    const year = now.getMonth() > 8 || (now.getMonth() === 8 && now.getDate() > 18) ? now.getFullYear() + 1 : now.getFullYear();
    return new Date(`${year}-09-18T00:00:00`);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = nextChaturthi - new Date();
      if (diff <= 0) {
        setCountdown({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [nextChaturthi]);

  return (
    <div className="mandala-pattern bg-saffron-50 text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,168,38,0.18),_transparent_35%),linear-gradient(180deg,#7c2d12_0%,#f97316_55%,#fffaf3_100%)]">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-orange-700/40 to-transparent blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24 relative z-10">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/20 border border-white/30 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">🙏</span>
                <span>Festival platform for every Ganpati Mandal.</span>
              </div>
              <div className="space-y-4">
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-[0_25px_45px_rgba(0,0,0,0.25)]">
                  {mandal?.name || "Ganpati Bappa Mandal"}
                </h1>
                <p className="max-w-2xl text-lg sm:text-xl text-orange-100/95 leading-relaxed">
                  Build a modern community app for announcements, volunteers, donations, events, gallery, polls, and live updates with premium glassmorphism design.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Link to="/register" className="btn-primary text-base inline-flex justify-center">
                  Join Mandal Now
                </Link>
                <Link to="/login" className="btn-secondary text-base inline-flex justify-center">
                  Member Login
                </Link>
              </div>
            </div>

            <div className="glass-card p-6 shadow-[0_40px_120px_rgba(225,98,9,0.18)] border-white/30">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-orange-200/90">Countdown</p>
                  <h2 className="text-3xl font-bold text-white">Ganesh Chaturthi</h2>
                </div>
                <div className="inline-flex rounded-3xl bg-orange-500/15 px-4 py-2 text-orange-100 text-sm font-medium">
                  {nextChaturthi.getFullYear()}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {Object.entries(countdown).map(([key, value]) => (
                  <div key={key} className="rounded-3xl bg-white/90 p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-maroon-700">{value}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{key}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl bg-orange-100/90 p-4">
                  <p className="text-sm text-orange-700 uppercase tracking-[0.2em] mb-2">Latest announcement</p>
                  <p className="font-semibold text-slate-800">Bhajan rehearsal moved to 5 PM today in hall 1.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-white">
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="font-semibold">85+</p>
                    <p className="text-slate-200/80">Active Volunteers</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="font-semibold">₹85,000</p>
                    <p className="text-slate-200/80">Collected Donations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-start">
          <div className="space-y-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-orange-600">Featured modules</p>
                <h2 className="font-display text-4xl font-bold text-maroon-700">All your Ganesh Mandal tools in one home.</h2>
              </div>
              <Link to="/dashboard" className="btn-secondary">
                Explore Dashboard
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { icon: <FaUsers />, title: "Members", desc: "Profiles, teams, birthdays and search." },
                { icon: <FaBullhorn />, title: "Notices", desc: "Meeting updates, donations & practice alerts." },
                { icon: <FaCalendarAlt />, title: "Events", desc: "Aarti schedule, cultural programs & registrations." },
                { icon: <FaDonate />, title: "Donations", desc: "Donor details, receipts and balance tracking." },
                { icon: <FaImages />, title: "Gallery", desc: "Photos, videos and festival memories." },
                { icon: <FaBolt />, title: "Chat & Live", desc: "Realtime updates, channels & member alerts." },
              ].map((item, index) => (
                <div key={index} className="glass-card p-6 border border-white/40">
                  <div className="mb-4 text-3xl text-orange-500">{item.icon}</div>
                  <h3 className="font-semibold text-xl text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 border-white/30">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-orange-600">Notice Board</p>
                  <h3 className="text-2xl font-semibold text-slate-900">Latest announcements</h3>
                </div>
                <Link to="/announcements" className="text-orange-700 font-semibold hover:text-orange-800">
                  View all
                </Link>
              </div>
              {[
                "Decoration meeting at 4 PM in the hall.",
                "Donation campaign has reached ₹85,000!",
                "Volunteer registration closes tomorrow.",
              ].map((text, idx) => (
                <div key={idx} className="rounded-3xl bg-white/90 p-4 mb-3 last:mb-0">
                  <p className="text-sm text-slate-700">{text}</p>
                </div>
              ))}
            </div>

            <div className="glass-card p-6 border-white/30">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-orange-600">Event Schedule</p>
                  <h3 className="text-2xl font-semibold text-slate-900">Festival timeline</h3>
                </div>
                <Link to="/events" className="text-orange-700 font-semibold hover:text-orange-800">
                  See schedule
                </Link>
              </div>
              <div className="space-y-4">
                {eventSchedule.map((event) => (
                  <div key={event.time} className="flex items-center gap-4 rounded-3xl bg-white/95 p-4 border border-orange-100">
                    <div className="text-orange-600 font-bold text-lg w-24">{event.time}</div>
                    <div>
                      <p className="font-semibold text-slate-900">{event.title}</p>
                      <p className="text-sm text-slate-500">{event.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-saffron-100/80 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[0.24em] text-orange-600">Volunteer Management</p>
            <h2 className="font-display text-4xl font-bold text-maroon-700">Your team ready for every duty.</h2>
            <p className="text-slate-600 max-w-2xl mx-auto mt-3">Members can pick roles and admin can assign duties, all through the same platform.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {volunteerRoles.map((role) => (
              <div key={role} className="glass-card p-6 flex flex-col justify-between border-white/40">
                <div className="text-3xl text-orange-500 mb-4">{role === "Security" ? <FaShieldAlt /> : role === "Photography" ? <FaCameraRetro /> : role === "Cleaning" ? <FaHandsHelping /> : role === "Sound System" ? <FaMusic /> : <FaGift />}</div>
                <h3 className="font-semibold text-xl text-slate-900 mb-1">{role}</h3>
                <p className="text-sm text-slate-600">Add members, shift duties and keep every squad connected.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-card p-8 border-white/30">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-3xl bg-orange-500 text-white text-lg">
                <FaDonate />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-orange-600">Donation dashboard</p>
                <h3 className="text-2xl font-semibold text-slate-900">Transparent collection & expense view</h3>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              {[
                { label: "Total collected", value: "₹85,000" },
                { label: "Expenses", value: "₹18,400" },
                { label: "Balance", value: "₹66,600" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl bg-orange-50 p-5 border border-orange-100">
                  <p className="text-xl font-bold text-maroon-700">{stat.value}</p>
                  <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { name: "Decoration", amount: "₹7,800" },
                { name: "Lights", amount: "₹4,300" },
                { name: "Food", amount: "₹3,900" },
                { name: "Sound", amount: "₹2,900" },
                { name: "Flowers", amount: "₹1,500" },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-3xl bg-white/90 p-4 border border-orange-100">
                  <span className="font-medium text-slate-800">{item.name}</span>
                  <span className="text-orange-700 font-semibold">{item.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="glass-card p-6 border-white/30">
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-orange-500 text-white text-lg"><FaImages /></span>
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-orange-600">Gallery preview</p>
                  <h3 className="text-xl font-semibold text-slate-900">Memories in one place</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-28 rounded-3xl bg-gradient-to-br from-orange-200 via-saffron-100 to-white shadow-inner" />
                ))}
              </div>
              <Link to="/gallery" className="mt-5 inline-flex items-center justify-center w-full rounded-3xl bg-orange-600 text-white font-semibold py-3 hover:bg-orange-700 transition">
                See gallery
              </Link>
            </div>

            <div className="glass-card p-6 border-white/30">
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-maroon-700 text-orange-100 text-lg"><FaBolt /></span>
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-orange-600">Live & chat</p>
                  <h3 className="text-xl font-semibold text-slate-900">Stay connected in real time</h3>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-5">A dedicated platform for group chat channels, urgent announcements and live aarti updates.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "General" },
                  { label: "Volunteers" },
                  { label: "Committee" },
                  { label: "Emergency" },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl bg-white/90 p-3 text-center text-sm font-medium text-slate-700">{item.label}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-orange-50/70 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-10">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-orange-600">Polls</p>
              <h2 className="font-display text-3xl font-bold text-maroon-700">Get member opinions instantly</h2>
            </div>
            <Link to="/dashboard" className="btn-secondary">
              Create a poll
            </Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {pollingItems.map((poll, idx) => (
              <div key={idx} className="glass-card p-6 border-white/40">
                <p className="text-sm uppercase tracking-[0.18em] text-orange-600 mb-4">{poll.question}</p>
                <div className="space-y-3">
                  {poll.options.map((option) => (
                    <button key={option} className="w-full rounded-3xl border border-orange-100 bg-white/90 px-4 py-3 text-left text-sm text-slate-700 hover:bg-orange-50 transition">
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-card p-8 border-white/30">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.24em] text-orange-600">Daily updates</p>
              <h3 className="text-3xl font-semibold text-slate-900">Keep everyone in the loop</h3>
            </div>
            <div className="space-y-4">
              {dailyUpdates.map((update, idx) => (
                <div key={idx} className="rounded-3xl bg-white/95 p-5 border border-orange-100 flex items-center gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-orange-100 text-orange-700 text-lg"><FaClock /></div>
                  <p className="text-slate-700">{update}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="glass-card p-6 border-white/30">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-orange-500 text-white text-lg"><FaMapMarkerAlt /></span>
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-orange-600">Location</p>
                  <h3 className="text-xl font-semibold text-slate-900">Route, parking & nearby care</h3>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-5">Embed a map for route planning, parking details and emergency hospital locations.</p>
              <div className="rounded-3xl bg-white/90 p-4 border border-orange-100 text-sm text-slate-700">
                <p className="font-semibold">Near Mandal Hall, Mumbai</p>
                <p className="mt-2">Parking available nearby. Hospital 2 km away.</p>
              </div>
            </div>
            <div className="glass-card p-6 border-white/30">
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.18em] text-orange-600">Sponsors</p>
                <h3 className="text-xl font-semibold text-slate-900">Thank you to our supporters</h3>
              </div>
              <div className="space-y-3">
                {sponsorData.map((sponsor) => (
                  <div key={sponsor.name} className="rounded-3xl bg-white/95 p-4 border border-orange-100">
                    <p className="font-semibold text-slate-900">{sponsor.name}</p>
                    <p className="text-sm text-slate-600">{sponsor.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-saffron-100/90 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-orange-600">Legacy & spirit</p>
          <h2 className="font-display text-4xl font-bold text-maroon-700 mb-6">An app built for devotion, community and celebration.</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="glass-card p-6 border-white/40">
              <h3 className="font-semibold text-xl text-slate-900 mb-2">History</h3>
              <p className="text-sm text-slate-600">Founder stories, old photos and the journey of the Mandal are preserved here.</p>
            </div>
            <div className="glass-card p-6 border-white/40">
              <h3 className="font-semibold text-xl text-slate-900 mb-2">Emergency</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {emergencyContacts.map((contact) => (
                  <li key={contact}>{contact}</li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-6 border-white/40">
              <h3 className="font-semibold text-xl text-slate-900 mb-2">Fun section</h3>
              <p className="text-sm text-slate-600">Quiz, wallpapers, stickers and countdown features make the app feel festive and engaging.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

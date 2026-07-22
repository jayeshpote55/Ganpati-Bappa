# 🐘 Ganpati Bappa Mandal — Real-Time Management Platform

A complete, real-time web platform built for **every Ganesh Utsav Mandal** to manage members,
events, donations (vargani), photo memories and announcements — all with live Socket.io updates.

Built with the **MERN stack**: MongoDB, Express, React, Node.js + Socket.io.

---

## ✨ Features

| Module | What it does |
|---|---|
| 🔐 **Auth** | Member registration & login (JWT), roles: `member`, `volunteer`, `committee`, `admin` |
| 📊 **Dashboard** | Live stats, visarjan countdown timer, aarti timings, latest events & announcements |
| 📅 **Events** | Create/manage festival schedule (aarti, cultural, sports, prasad, visarjan), RSVP in real-time |
| 💰 **Vargani / Donations** | Record donations, **live donation ticker** (Socket.io), top-donors leaderboard |
| 🖼️ **Gallery** | Upload & like celebration photos, updates pushed live to everyone |
| 📢 **Announcements** | Notice board — new posts appear **instantly** for all members, no refresh needed |
| 🟢 **Online presence** | See how many members are online right now, live member count badge |
| 👑 **Admin panel** | Manage member roles from the Profile page |

Everything marked **live/real-time** is powered by **Socket.io** — when one member records a
donation or posts an announcement, every other member connected sees it appear instantly, with a
toast notification.

---

## 🏗️ Tech Stack

**Backend:** Node.js, Express, MongoDB + Mongoose, Socket.io, JWT, bcryptjs, Helmet
**Frontend:** React 18, Vite, Tailwind CSS, React Router, Socket.io-client, Axios, react-hot-toast, react-icons

---

## 📁 Project Structure

```
ganpati-bappa-mandal/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── models/                   # User, Mandal, Event, Donation, Announcement, Gallery, ChatMessage
│   ├── middleware/auth.js        # JWT protect + role-based authorize()
│   ├── controllers/              # Business logic for each module
│   ├── routes/                   # REST API routes
│   ├── utils/socket.js           # Socket.io real-time event handling
│   ├── server.js                 # App entry point, auto-bootstraps admin + default mandal
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/axios.js          # Axios instance with JWT interceptor
    │   ├── context/              # AuthContext, SocketContext
    │   ├── components/           # Navbar, Footer, CountdownTimer, LiveDonationTicker, etc.
    │   ├── pages/                # Home, Login, Register, Dashboard, Events, Donations, Gallery, Announcements, Profile
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** — either running locally, or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set your `MONGO_URI` (local example is already filled in) and a strong `JWT_SECRET`.

```bash
npm run dev       # starts on http://localhost:5000 with nodemon
# or
npm start
```

On first run, the server **automatically creates**:
- A default Mandal — "Shree Ganesh Mitra Mandal"
- A default admin account — check your `.env` for `ADMIN_EMAIL` / `ADMIN_PASSWORD`
  (defaults: `admin@bappamandal.com` / `Admin@12345`)

### 2. Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
cp .env.example .env    # already points to http://localhost:5000/api
npm run dev              # starts on http://localhost:5173
```

Visit **http://localhost:5173** — register a new member account or log in with the admin credentials above.

### 3. Production Build

```bash
cd frontend
npm run build            # outputs static files to frontend/dist
```
Deploy `frontend/dist` to any static host (Vercel/Netlify) and the `backend/` folder to any Node host
(Render/Railway/EC2) with your MongoDB Atlas connection string set in the environment variables.

---

## 🔑 Roles & Permissions

| Role | Can do |
|---|---|
| `member` | View everything, RSVP to events, donate, upload gallery photos, like photos |
| `volunteer` | + Create events & announcements |
| `committee` | + Delete events/announcements/photos, edit mandal profile |
| `admin` | + Manage member roles, full control |

Promote a member to `committee`/`admin` from **Profile → Manage Members** (visible only to admins).

---

## 🔌 Real-Time Events (Socket.io)

| Event | Triggered when |
|---|---|
| `new_donation` | Someone records a donation → live ticker + toast for everyone |
| `new_event` / `event_updated` / `event_deleted` | Event schedule changes |
| `event_rsvp_updated` | Someone RSVPs to an event |
| `new_announcement` / `announcement_deleted` | Notice board changes |
| `new_photo` / `photo_deleted` / `photo_like_updated` | Gallery changes |
| `online_count` | Member count updates as people join/leave |
| `send_message` / `receive_message` | Group chat (backend ready — wire up a Chat page if needed) |

---

## 🛠️ Customize for Your Mandal

1. Log in as admin and edit your Mandal's name, aarti timings, visarjan date, and donation goal
   via the API (`PUT /api/mandals/:id`) — a settings UI can easily be added to the Profile page.
2. Update colors in `frontend/tailwind.config.js` (`saffron`, `maroon`, `gold`) to match your
   mandal's branding.
3. Replace the 🐘 emoji logo with your mandal's actual logo image.

---

**Ganpati Bappa Morya! Mangal Murti Morya! 🙏**

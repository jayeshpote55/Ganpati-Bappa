require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { initSocket } = require("./utils/socket");
const User = require("./models/User");
const Mandal = require("./models/Mandal");

const authRoutes = require("./routes/authRoutes");
const mandalRoutes = require("./routes/mandalRoutes");
const eventRoutes = require("./routes/eventRoutes");
const donationRoutes = require("./routes/donationRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const pollRoutes = require("./routes/pollRoutes");
const chatRoutes = require("./routes/chatRoutes");
const fundRoutes = require("./routes/fundRoutes");

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"], credentials: true },
});

// ------- Middleware -------
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// ------- Health check -------
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "🚩 Ganpati Bappa Mandal API is running!", time: new Date() });
});

// ------- Routes -------
app.use("/api/auth", authRoutes);
app.use("/api/mandals", mandalRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/funds", fundRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/chat", chatRoutes);

// ------- 404 -------
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ------- Error handler -------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
});

// ------- Real-time -------
initSocket(io);

// ------- Bootstrap default mandal + admin on first run -------
async function bootstrap() {
  const mandalCount = await Mandal.countDocuments();
  let mandal;
  if (mandalCount === 0) {
    mandal = await Mandal.create({
      name: "Shree Ganesh Mitra Mandal",
      establishedYear: new Date().getFullYear(),
      description: "Welcome to our Ganpati Bappa Mandal! Ganpati Bappa Morya 🙏",
      city: "Mumbai",
      aartiTimings: {
        morning: "07:00 AM",
        afternoon: "12:30 PM",
        evening: "07:30 PM",
        night: "10:00 PM",
      },
    });
    console.log("🏛️  Default mandal created:", mandal.name);
  } else {
    mandal = await Mandal.findOne();
  }

  if (!mandal.aartiCollection?.length) {
    mandal.aartiCollection = [
      { title: "Sukhakarta Dukhharta", lyrics: "Sukhakarta dukhharta, varta vighnachi...", audioUrl: "", pdfUrl: "" },
      { title: "Shankarachi Aarti", lyrics: "Jay dev jay dev jay mangal murti...", audioUrl: "", pdfUrl: "" },
      { title: "Devichi Aarti", lyrics: "Devichi aamhi krupa karave...", audioUrl: "", pdfUrl: "" },
      { title: "Vithalachi Aarti", lyrics: "Shri Vitthalicha aarti, kirtana shodhu ghya...", audioUrl: "", pdfUrl: "" },
    ];
    await mandal.save();
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@bappamandal.com").toLowerCase();
  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    await User.create({
      name: process.env.ADMIN_NAME || "Mandal Admin",
      email: adminEmail,
      phone: process.env.ADMIN_PHONE || "9999999999",
      password: process.env.ADMIN_PASSWORD || "Admin@12345",
      role: "admin",
      mandal: mandal._id,
    });
    console.log("👑 Default admin created:", adminEmail, "| password:", process.env.ADMIN_PASSWORD || "Admin@12345");
  }
}

const DEFAULT_PORT = 5000;
const PORT = parseInt(process.env.PORT, 10) || DEFAULT_PORT;

const startServer = (port, attempt = 0) => {
  if (attempt >= 5) {
    console.error(`❌ Could not start server after ${attempt} attempts.`);
    process.exit(1);
  }

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

  server.once("error", (error) => {
    if (error.syscall !== "listen") throw error;
    switch (error.code) {
      case "EACCES":
        console.error(`❌ ${bind} requires elevated privileges.`);
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.warn(`⚠️ ${bind} is already in use. Trying port ${port + 1}...`);
        startServer(port + 1, attempt + 1);
        break;
      default:
        throw error;
    }
  });

  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📡 Socket.io ready for real-time connections`);
  });
};

connectDB().then(async () => {
  await bootstrap();
  startServer(PORT);
});

module.exports = { app, io };

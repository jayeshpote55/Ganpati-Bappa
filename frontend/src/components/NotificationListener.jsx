import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FaBell, FaDonate, FaMusic, FaCalendarAlt, FaPoll, FaBullhorn, FaCheckCircle } from "react-icons/fa";

/**
 * Plays a pleasant notification audio chime using Web Audio API
 */
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Note 1: A5 (880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);

    // Note 2: D6 (1174.66Hz) after 0.1s delay
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (err) {
    // Ignore audio autoplay restrictions if user hasn't interacted yet
  }
};

/**
 * Sends native Mobile / Browser Push Notification
 */
const sendNativeNotification = (title, body) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        vibrate: [200, 100, 200],
      });
    } catch (err) {
      console.warn("Native Notification error:", err);
    }
  }
};

export default function NotificationListener() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        setShowPrompt(true);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    try {
      const res = await Notification.requestPermission();
      setPermissionStatus(res);
      setShowPrompt(false);
      if (res === "granted") {
        toast.success("फोन नोटिफिकेशन्स सुरू झाले! 🔔");
      }
    } catch (err) {
      setShowPrompt(false);
    }
  };

  useEffect(() => {
    if (!socket || !user) return;

    // 💰 1. NEW VARGANI (DONATION)
    const handleDonation = (data) => {
      const donation = data.donation || data;
      const donor = donation.donorName || "अनामित भक्त";
      const amt = (donation.amount || 0).toLocaleString("en-IN");
      const title = "💰 नवीन वर्गणी (Vargani)!";
      const body = `${donor} यांनी ₹${amt} वर्गणी जमा केली. 🙏`;

      playNotificationSound();
      sendNativeNotification(title, body);

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-orange-500/20 p-4 border-l-4 border-orange-500`}
          >
            <div className="flex-1 w-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-lg flex-shrink-0">
                <FaDonate />
              </div>
              <div className="ml-1 flex-1">
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="mt-0.5 text-xs text-gray-600">{body}</p>
              </div>
            </div>
          </div>
        ),
        { duration: 5000 }
      );
    };

    // 🌺 2. NEW AARTI
    const handleAarti = (aarti) => {
      const title = "🌺 नवीन आरती अपडेट!";
      const body = `नवीन आरती '${aarti.title || "आरती"}' जोडली गेली आहे.`;

      playNotificationSound();
      sendNativeNotification(title, body);

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-orange-500/20 p-4 border-l-4 border-red-500`}
          >
            <div className="flex-1 w-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg flex-shrink-0">
                <FaMusic />
              </div>
              <div className="ml-1 flex-1">
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="mt-0.5 text-xs text-gray-600">{body}</p>
              </div>
            </div>
          </div>
        ),
        { duration: 5000 }
      );
    };

    // 📅 3. NEW EVENT
    const handleEvent = (event) => {
      const title = "📅 नवीन कार्यक्रम (Event)!";
      const body = `नवीन कार्यक्रम '${event.title || "कार्यक्रम"}' जाहीर झाला आहे.`;

      playNotificationSound();
      sendNativeNotification(title, body);

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-blue-500/20 p-4 border-l-4 border-blue-500`}
          >
            <div className="flex-1 w-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg flex-shrink-0">
                <FaCalendarAlt />
              </div>
              <div className="ml-1 flex-1">
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="mt-0.5 text-xs text-gray-600">{body}</p>
              </div>
            </div>
          </div>
        ),
        { duration: 5000 }
      );
    };

    // 📊 4. NEW POLL
    const handlePoll = (poll) => {
      const title = "📊 नवीन पोल (Poll)!";
      const body = `'${poll.question || "नवीन पोल"}' - तुमचे मत नोंदवा!`;

      playNotificationSound();
      sendNativeNotification(title, body);

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-purple-500/20 p-4 border-l-4 border-purple-500`}
          >
            <div className="flex-1 w-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg flex-shrink-0">
                <FaPoll />
              </div>
              <div className="ml-1 flex-1">
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="mt-0.5 text-xs text-gray-600">{body}</p>
              </div>
            </div>
          </div>
        ),
        { duration: 5000 }
      );
    };

    // 📢 5. NEW ANNOUNCEMENT
    const handleAnnouncement = (announcement) => {
      const title = "📢 नवीन सूचना (Announcement)!";
      const body = announcement.title || announcement.text || "मंडळाची नवीन सूचना आली आहे.";

      playNotificationSound();
      sendNativeNotification(title, body);

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-amber-500/20 p-4 border-l-4 border-amber-500`}
          >
            <div className="flex-1 w-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-lg flex-shrink-0">
                <FaBullhorn />
              </div>
              <div className="ml-1 flex-1">
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="mt-0.5 text-xs text-gray-600">{body}</p>
              </div>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    };

    socket.on("new_donation", handleDonation);
    socket.on("new_aarti", handleAarti);
    socket.on("new_event", handleEvent);
    socket.on("new_poll", handlePoll);
    socket.on("new_announcement", handleAnnouncement);

    return () => {
      socket.off("new_donation", handleDonation);
      socket.off("new_aarti", handleAarti);
      socket.off("new_event", handleEvent);
      socket.off("new_poll", handlePoll);
      socket.off("new_announcement", handleAnnouncement);
    };
  }, [socket, user]);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-sm bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-xl shadow-2xl border border-orange-300 flex items-center justify-between gap-3 animate-bounce">
      <div className="flex items-center gap-3">
        <FaBell className="text-2xl text-yellow-300 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-bold text-sm">फोन नोटिफिकेशन्स</p>
          <p className="opacity-90">वर्गणी, आरती, पोल व कार्यक्रमांचे अपडेट्स मिळवण्यासाठी परवानगी द्या.</p>
        </div>
      </div>
      <button
        onClick={requestPermission}
        className="bg-white text-orange-700 hover:bg-orange-100 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow transition"
      >
        सुरू करा 🔔
      </button>
    </div>
  );
}

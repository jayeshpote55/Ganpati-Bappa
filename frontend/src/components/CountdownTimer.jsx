import React, { useEffect, useState } from "react";

function getTimeLeft(target) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ targetDate, label = "Visarjan Countdown" }) {
  const [timeLeft, setTimeLeft] = useState(targetDate ? getTimeLeft(targetDate) : null);

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return null;

  if (!timeLeft) {
    return (
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl p-5 text-center font-display font-bold">
        Ganpati Bappa's darshan awaits next year! 🙏
      </div>
    );
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Mins", value: timeLeft.minutes },
    { label: "Secs", value: timeLeft.seconds },
  ];

  return (
    <div className="bg-gradient-to-br from-maroon-700 via-orange-700 to-orange-500 rounded-2xl p-5 shadow-xl">
      <p className="text-orange-100 text-sm font-medium text-center mb-3">{label}</p>
      <div className="grid grid-cols-4 gap-2">
        {units.map((u) => (
          <div key={u.label} className="bg-white/15 backdrop-blur rounded-xl py-3 text-center animate-glow">
            <div className="text-2xl sm:text-3xl font-display font-bold text-white tabular-nums">
              {String(u.value).padStart(2, "0")}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-orange-100">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

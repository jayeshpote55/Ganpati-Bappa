import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { FaDonate } from "react-icons/fa";
import toast from "react-hot-toast";

export default function LiveDonationTicker({ initialTotal = 0, onTotalUpdate }) {
  const { socket } = useSocket();
  const [total, setTotal] = useState(initialTotal);
  const [recent, setRecent] = useState([]);

  useEffect(() => setTotal(initialTotal), [initialTotal]);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ donation, totalRaised }) => {
      setTotal(totalRaised);
      setRecent((prev) => [donation, ...prev].slice(0, 5));
      onTotalUpdate?.(totalRaised);
      toast.success(`₹${donation.amount.toLocaleString("en-IN")} received from ${donation.donorName}! 🙏`, {
        icon: "🎉",
      });
    };
    socket.on("new_donation", handler);
    return () => socket.off("new_donation", handler);
  }, [socket, onTotalUpdate]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-maroon-700 flex items-center gap-2">
          <FaDonate className="text-orange-500" /> Live Vargani Collection
        </h3>
        <span className="badge bg-green-100 text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span> LIVE
        </span>
      </div>
      <div className="text-3xl sm:text-4xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-4">
        ₹{total.toLocaleString("en-IN")}
      </div>
      {recent.length > 0 && (
        <div className="space-y-2">
          {recent.map((d, i) => (
            <div key={i} className="flex justify-between text-sm bg-orange-50 rounded-lg px-3 py-2 animate-slide-up">
              <span className="text-gray-700 font-medium">{d.donorName}</span>
              <span className="text-orange-600 font-bold">₹{d.amount.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

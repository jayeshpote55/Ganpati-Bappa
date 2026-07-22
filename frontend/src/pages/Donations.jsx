import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";
import LiveDonationTicker from "../components/LiveDonationTicker";
import toast from "react-hot-toast";
import { FaTrophy, FaHistory } from "react-icons/fa";

const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
};

export default function Donations() {
  const { socket } = useSocket();
  const [donations, setDonations] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalRaised, setTotalRaised] = useState(0);
  const [form, setForm] = useState({ donorName: "", donorPhone: "", amount: "", paymentMode: "upi", message: "", isAnonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

  const load = async () => {
    const [donRes, lbRes] = await Promise.all([api.get("/donations"), api.get("/donations/leaderboard")]);
    setDonations(donRes.data.donations);
    setTotalRaised(donRes.data.totalRaised);
    setLeaderboard(lbRes.data.leaderboard);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ donation, totalRaised }) => {
      setDonations((prev) => [donation, ...prev]);
      setTotalRaised(totalRaised);
      api.get("/donations/leaderboard").then((res) => setLeaderboard(res.data.leaderboard));
    };
    socket.on("new_donation", handler);
    return () => socket.off("new_donation", handler);
  }, [socket]);

  const handleOrder = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!razorpayKey) {
      toast.error("Razorpay key not configured.");
      return;
    }

    setPaying(true);

    try {
      await loadRazorpayScript();
      const orderRes = await api.post("/donations/razorpay/order", {
        amount: Number(form.amount),
        donorName: form.donorName,
        donorPhone: form.donorPhone,
        message: form.message,
        isAnonymous: form.isAnonymous,
      });

      const { order } = orderRes.data;
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "Ganpati Bappa Mandal",
        description: "Donation payment",
        order_id: order.id,
        prefill: {
          name: form.donorName || "",
          contact: form.donorPhone || "",
        },
        notes: {
          message: form.message || "",
          isAnonymous: form.isAnonymous ? "true" : "false",
        },
        theme: { color: "#f97316" },
        handler: async function (response) {
          try {
            await api.post("/donations/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(form.amount),
              donorName: form.donorName,
              donorPhone: form.donorPhone,
              message: form.message,
              isAnonymous: form.isAnonymous,
            });
            toast.success("Payment successful and donation recorded! 🙏");
            setForm({ donorName: "", donorPhone: "", amount: "", paymentMode: "upi", message: "", isAnonymous: false });
            load();
          } catch (verifyError) {
            toast.error(verifyError.response?.data?.message || "Payment verification failed.");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      toast.error(err.message || "Razorpay checkout failed.");
      setPaying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (form.paymentMode === "razorpay") {
      await handleOrder();
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/donations", { ...form, amount: Number(form.amount) });
      setForm({ donorName: "", amount: "", paymentMode: "upi", message: "", isAnonymous: false });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record donation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-maroon-700">Vargani Collection</h1>
        <p className="text-gray-500 text-sm mt-1">Contribute and track donations in real-time</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <h3 className="font-display font-bold text-maroon-700">Record a Donation</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <input placeholder="Donor name" className="input-field" value={form.donorName} onChange={(e) => setForm({ ...form, donorName: e.target.value })} />
              <input placeholder="Phone (optional)" className="input-field" value={form.donorPhone || ""} onChange={(e) => setForm({ ...form, donorPhone: e.target.value })} />
              <input required type="number" min="1" placeholder="Amount (₹)" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <select className="input-field" value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="razorpay">Razorpay</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })} className="accent-orange-500" />
                Donate anonymously
              </label>
              <input placeholder="Message (optional)" className="input-field sm:col-span-2" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <button type="submit" disabled={submitting || paying} className="btn-primary w-full">
              {submitting || paying ? (paying ? "Opening Razorpay..." : "Recording...") : "Submit Donation 🙏"}
            </button>
          </form>

          <div className="card p-6">
            <h3 className="font-display font-bold text-maroon-700 mb-4 flex items-center gap-2">
              <FaHistory className="text-orange-500" /> Donation History
            </h3>
            {donations.length === 0 ? (
              <p className="text-gray-400 text-sm">No donations recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {donations.map((d) => (
                  <div key={d._id} className="flex justify-between items-center bg-orange-50 rounded-lg px-4 py-2.5 text-sm">
                    <div>
                      <p className="font-semibold text-gray-800">{d.donorName}</p>
                      <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString("en-IN")} · {d.paymentMode.toUpperCase()}</p>
                    </div>
                    <span className="font-bold text-orange-600">₹{d.amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <LiveDonationTicker initialTotal={totalRaised} onTotalUpdate={setTotalRaised} />

          <div className="card p-5">
            <h3 className="font-display font-bold text-maroon-700 mb-4 flex items-center gap-2">
              <FaTrophy className="text-gold-500" /> Top Donors
            </h3>
            {leaderboard.length === 0 ? (
              <p className="text-gray-400 text-sm">No donors yet — be the first!</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((d, i) => (
                  <div key={d._id} className="flex items-center gap-3 bg-orange-50 rounded-lg px-3 py-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-gold-500 text-white" : i === 1 ? "bg-gray-300 text-white" : i === 2 ? "bg-orange-400 text-white" : "bg-orange-100 text-orange-600"}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-700 truncate">{d._id}</span>
                    <span className="text-sm font-bold text-orange-600">₹{d.total.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import LiveDonationTicker from "../components/LiveDonationTicker";
import toast from "react-hot-toast";
import {
  FaTrophy,
  FaHistory,
  FaWhatsapp,
  FaReceipt,
  FaCopy,
  FaTimes,
  FaPhoneAlt,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaUser,
} from "react-icons/fa";
import { generateMarathiReceiptText, openWhatsAppReceipt, getPaymentModeInMarathi } from "../utils/whatsappReceipt";

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
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalRaised, setTotalRaised] = useState(0);
  const DEFAULT_PHONE = "7972558521";
  const [form, setForm] = useState({
    donorName: "",
    donorPhone: user?.phone || DEFAULT_PHONE,
    amount: "",
    paymentMode: "upi",
    message: "",
    isAnonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [receiptModalDonation, setReceiptModalDonation] = useState(null);

  // Edit donation state
  const [editingDonation, setEditingDonation] = useState(null);
  const [editForm, setEditForm] = useState({
    donorName: "",
    donorPhone: "",
    amount: "",
    paymentMode: "upi",
    message: "",
    isAnonymous: false,
  });
  const [updating, setUpdating] = useState(false);

  // Delete donation state
  const [deletingDonationId, setDeletingDonationId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const mandalName = user?.mandal?.name || "श्री गणेश उत्सव मंडळ";

  useEffect(() => {
    if (user?.phone && !form.donorPhone) {
      setForm((prev) => ({ ...prev, donorPhone: user.phone }));
    }
  }, [user]);

  const load = async () => {
    try {
      const [donRes, lbRes] = await Promise.all([api.get("/donations"), api.get("/donations/leaderboard")]);
      setDonations(donRes.data.donations || []);
      setTotalRaised(donRes.data.totalRaised || 0);
      setLeaderboard(lbRes.data.leaderboard || []);
    } catch (err) {
      toast.error("Failed to load donation data");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onNewDonation = ({ donation, totalRaised }) => {
      setDonations((prev) => [donation, ...prev]);
      setTotalRaised(totalRaised);
      api.get("/donations/leaderboard").then((res) => setLeaderboard(res.data.leaderboard || []));
    };

    const onUpdateDonation = ({ donation, totalRaised }) => {
      setDonations((prev) => prev.map((d) => (d._id === donation._id ? donation : d)));
      setTotalRaised(totalRaised);
      api.get("/donations/leaderboard").then((res) => setLeaderboard(res.data.leaderboard || []));
    };

    const onDeleteDonation = ({ donationId, totalRaised }) => {
      setDonations((prev) => prev.filter((d) => d._id !== donationId));
      setTotalRaised(totalRaised);
      api.get("/donations/leaderboard").then((res) => setLeaderboard(res.data.leaderboard || []));
    };

    socket.on("new_donation", onNewDonation);
    socket.on("update_donation", onUpdateDonation);
    socket.on("delete_donation", onDeleteDonation);

    return () => {
      socket.off("new_donation", onNewDonation);
      socket.off("update_donation", onUpdateDonation);
      socket.off("delete_donation", onDeleteDonation);
    };
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
        donorPhone: form.donorPhone || DEFAULT_PHONE,
        message: form.message,
        isAnonymous: form.isAnonymous,
      });

      const { order } = orderRes.data;
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: mandalName,
        description: "Donation payment",
        order_id: order.id,
        prefill: {
          name: form.donorName || "",
          contact: form.donorPhone || DEFAULT_PHONE,
        },
        notes: {
          message: form.message || "",
          isAnonymous: form.isAnonymous ? "true" : "false",
        },
        theme: { color: "#f97316" },
        handler: async function (response) {
          try {
            const verifyRes = await api.post("/donations/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(form.amount),
              donorName: form.donorName,
              donorPhone: form.donorPhone || DEFAULT_PHONE,
              message: form.message,
              isAnonymous: form.isAnonymous,
            });

            toast.success("Payment successful & Vargani recorded! 🙏");
            const recordedDonation = verifyRes.data.donation;
            setForm({ donorName: "", donorPhone: user?.phone || DEFAULT_PHONE, amount: "", paymentMode: "upi", message: "", isAnonymous: false });
            load();

            if (recordedDonation) {
              setReceiptModalDonation(recordedDonation);
            }
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
      const payload = {
        ...form,
        donorPhone: form.donorPhone || DEFAULT_PHONE,
        amount: Number(form.amount),
      };
      const res = await api.post("/donations", payload);
      toast.success("Donation recorded — thank you! 🙏");
      const newDonation = res.data.donation;
      setForm({ donorName: "", donorPhone: user?.phone || DEFAULT_PHONE, amount: "", paymentMode: "upi", message: "", isAnonymous: false });
      load();

      if (newDonation) {
        setReceiptModalDonation(newDonation);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record donation");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (donation) => {
    setEditingDonation(donation);
    setEditForm({
      donorName: donation.donorName === "Anonymous Bhakt" ? "" : donation.donorName || "",
      donorPhone: donation.donorPhone || "",
      amount: donation.amount || "",
      paymentMode: donation.paymentMode || "upi",
      message: donation.message || "",
      isAnonymous: !!donation.isAnonymous,
    });
  };

  // Submit Edit Form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.amount || Number(editForm.amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setUpdating(true);
    try {
      const payload = {
        ...editForm,
        donorName: editForm.isAnonymous ? "Anonymous Bhakt" : editForm.donorName || "Anonymous Bhakt",
        amount: Number(editForm.amount),
      };
      const res = await api.put(`/donations/${editingDonation._id}`, payload);
      toast.success("Vargani receipt updated! 🙏");

      const updatedDonation = res.data.donation;
      setDonations((prev) => prev.map((d) => (d._id === updatedDonation._id ? updatedDonation : d)));
      if (res.data.totalRaised !== undefined) setTotalRaised(res.data.totalRaised);
      api.get("/donations/leaderboard").then((lbRes) => setLeaderboard(lbRes.data.leaderboard || []));

      setEditingDonation(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update donation");
    } finally {
      setUpdating(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deletingDonationId) return;

    setDeleting(true);
    try {
      const res = await api.delete(`/donations/${deletingDonationId}`);
      toast.success("Vargani receipt deleted successfully.");

      setDonations((prev) => prev.filter((d) => d._id !== deletingDonationId));
      if (res.data.totalRaised !== undefined) setTotalRaised(res.data.totalRaised);
      api.get("/donations/leaderboard").then((lbRes) => setLeaderboard(lbRes.data.leaderboard || []));

      setDeletingDonationId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete donation");
    } finally {
      setDeleting(false);
    }
  };

  const copyMarathiText = (donation) => {
    const text = generateMarathiReceiptText(donation, mandalName);
    navigator.clipboard.writeText(text);
    toast.success("मराठी पावतीचा मजकूर कॉपी झाला! 📋");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-maroon-700">Vargani Collection (वर्गणी जमा)</h1>
          <p className="text-gray-500 text-sm mt-1">Contribute, manage Vargani records & send instant WhatsApp bills in Marathi</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Donation Record Form */}
          <form onSubmit={handleSubmit} className="card p-6 space-y-4 border-t-4 border-orange-500 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-maroon-700 text-lg flex items-center gap-2">
                <FaReceipt className="text-orange-500" /> Record Vargani / देणगी नोंदवा
              </h3>
              <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2.5 py-1 rounded-full">
                WhatsApp Bill Ready 💬
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">देणगीदाराचे नाव (Donor Name)</label>
                <input
                  placeholder="e.g. Ramesh Patil"
                  className="input-field"
                  value={form.donorName}
                  onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">WhatsApp Mobile No. (व्हॉट्सॲप नंबर)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">
                    <FaWhatsapp className="text-green-500 inline mr-1" /> +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    className="input-field pl-16"
                    value={form.donorPhone || ""}
                    onChange={(e) => setForm({ ...form, donorPhone: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">रक्कम / Amount (₹) *</label>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="e.g. 501"
                  className="input-field font-bold text-orange-600"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">भरणा माध्यम / Payment Mode</label>
                <select
                  className="input-field"
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                >
                  <option value="upi">UPI (यु.पी.आय.)</option>
                  <option value="cash">Cash (नगद)</option>
                  <option value="cheque">Cheque (चेक)</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card (कार्ड)</option>
                  <option value="razorpay">Razorpay Online</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <input
                  placeholder="संदेश / Message or Note (Optional)"
                  className="input-field"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAnonymous}
                  onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                  className="accent-orange-500 w-4 h-4"
                />
                <span>गुप्त दान (Donate Anonymously)</span>
              </label>
            </div>

            <button type="submit" disabled={submitting || paying} className="btn-primary w-full text-base py-3 font-semibold shadow-lg">
              {submitting || paying ? (paying ? "Opening Razorpay..." : "Recording Vargani...") : "Submit Vargani & Generate Bill 🙏"}
            </button>
          </form>

          {/* Donation History List */}
          <div className="card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-maroon-700 flex items-center gap-2">
                <FaHistory className="text-orange-500" /> Vargani Records (वर्गणी नोंदवही)
              </h3>
              <span className="text-xs text-gray-500">{donations.length} records</span>
            </div>

            {donations.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No Vargani records found.</p>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {donations.map((d) => {
                  const collectorName =
                    typeof d.receivedBy === "object" && d.receivedBy?.name
                      ? d.receivedBy.name
                      : d.receivedByName || "";

                  return (
                    <div
                      key={d._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between bg-orange-50/70 border border-orange-100 hover:border-orange-300 rounded-xl p-3.5 gap-3 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-800 text-base">{d.donorName}</p>
                          {d.isAnonymous && (
                            <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                              Anonymous
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                          <span>🗓 {new Date(d.createdAt).toLocaleDateString("mr-IN")}</span>
                          <span>•</span>
                          <span className="font-medium text-gray-600">{getPaymentModeInMarathi(d.paymentMode)}</span>
                          {d.donorPhone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-green-700 font-medium">
                                <FaPhoneAlt className="text-[10px]" /> {d.donorPhone}
                              </span>
                            </>
                          )}
                          {collectorName && (
                            <>
                              <span>•</span>
                              <span className="text-orange-700 font-semibold bg-orange-100 px-1.5 py-0.5 rounded text-[11px]">
                                ✍️ पावती देणारे: {collectorName}
                              </span>
                            </>
                          )}
                        </div>

                        {d.message && <p className="text-xs text-gray-600 italic">"{d.message}"</p>}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-orange-200">
                        <span className="font-extrabold text-orange-600 text-lg sm:text-base mr-1">
                          ₹{d.amount.toLocaleString("en-IN")}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setReceiptModalDonation(d)}
                            title="पावती पाहा (View Receipt)"
                            className="px-2 py-1.5 text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg flex items-center gap-1 font-semibold transition"
                          >
                            <FaReceipt /> पावती
                          </button>

                          <button
                            onClick={() => openWhatsAppReceipt(d, mandalName)}
                            title="WhatsApp वर Marathi मध्ये पावती पाठवा"
                            className="px-2.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 font-bold shadow-sm transition"
                          >
                            <FaWhatsapp className="text-sm text-white" /> WhatsApp
                          </button>

                          <button
                            onClick={() => openEditModal(d)}
                            title="पावती माहिती संपादित करा (Edit Pavti)"
                            className="p-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg flex items-center gap-1 font-semibold transition"
                          >
                            <FaEdit className="text-sm" />
                          </button>

                          <button
                            onClick={() => setDeletingDonationId(d._id)}
                            title="पावती हटवा (Delete Pavti)"
                            className="p-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center gap-1 font-semibold transition"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <LiveDonationTicker initialTotal={totalRaised} onTotalUpdate={setTotalRaised} />

          <div className="card p-5 shadow-sm">
            <h3 className="font-display font-bold text-maroon-700 mb-4 flex items-center gap-2">
              <FaTrophy className="text-gold-500" /> Top Donors (सर्वोच्च देणगीदार)
            </h3>
            {leaderboard.length === 0 ? (
              <p className="text-gray-400 text-sm">No donors yet — be the first!</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((d, i) => (
                  <div key={d._id} className="flex items-center gap-3 bg-orange-50/80 rounded-lg px-3 py-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? "bg-gold-500 text-white shadow-sm"
                          : i === 1
                          ? "bg-gray-300 text-white"
                          : i === 2
                          ? "bg-orange-400 text-white"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-800 truncate">{d._id}</span>
                    <span className="text-sm font-bold text-orange-600">₹{d.total.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MARATHI WHATSAPP RECEIPT MODAL */}
      {receiptModalDonation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-orange-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaWhatsapp className="text-2xl text-emerald-300" />
                <h3 className="font-bold text-lg font-display">मराठी WhatsApp पावती (Bill)</h3>
              </div>
              <button
                onClick={() => setReceiptModalDonation(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Receipt Preview Box */}
              <div className="bg-emerald-950/90 text-emerald-50 rounded-xl p-4 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-inner border border-emerald-700/50 relative">
                <div className="absolute top-3 right-3">
                  <span className="bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                    Marathi Message
                  </span>
                </div>
                {generateMarathiReceiptText(receiptModalDonation, mandalName)}
              </div>

              {/* Donor Quick Info */}
              <div className="bg-orange-50 rounded-lg p-3 text-xs space-y-1 text-gray-700">
                <p>
                  <strong>देणगीदार:</strong> {receiptModalDonation.donorName}
                </p>
                <p>
                  <strong>WhatsApp Mobile:</strong>{" "}
                  {receiptModalDonation.donorPhone ? (
                    <span className="font-bold text-emerald-700">{receiptModalDonation.donorPhone}</span>
                  ) : (
                    <span className="text-red-500 font-medium">मोबाईल नंबर दिलेला नाही (No Phone Provided)</span>
                  )}
                </p>
                <p>
                  <strong>रक्कम:</strong> ₹{receiptModalDonation.amount?.toLocaleString("en-IN")}
                </p>
                {receiptModalDonation.receivedBy?.name && (
                  <p>
                    <strong>पावती देणारे (Issued By):</strong>{" "}
                    <span className="font-bold text-orange-700">{receiptModalDonation.receivedBy.name}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => openWhatsAppReceipt(receiptModalDonation, mandalName)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition text-base"
                >
                  <FaWhatsapp className="text-xl" /> WhatsApp वर पावती पाठवा (Send Bill)
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyMarathiText(receiptModalDonation)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs transition"
                  >
                    <FaCopy /> पावती मजकूर कॉपी करा
                  </button>

                  <button
                    onClick={() => setReceiptModalDonation(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2 px-4 rounded-lg text-xs transition"
                  >
                    बंद करा (Close)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT VARGANI / PAVTI MODAL */}
      {editingDonation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-blue-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaEdit className="text-xl text-blue-200" />
                <h3 className="font-bold text-lg font-display">पावती संपादित करा (Edit Receipt)</h3>
              </div>
              <button
                onClick={() => setEditingDonation(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">देणगीदाराचे नाव (Donor Name)</label>
                  <input
                    placeholder="e.g. Ramesh Patil"
                    className="input-field"
                    value={editForm.donorName}
                    onChange={(e) => setEditForm({ ...editForm, donorName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">WhatsApp Mobile No.</label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    className="input-field"
                    value={editForm.donorPhone}
                    onChange={(e) => setEditForm({ ...editForm, donorPhone: e.target.value.replace(/\D/g, "") })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">रक्कम / Amount (₹) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="input-field font-bold text-orange-600"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">भरणा माध्यम / Payment Mode</label>
                  <select
                    className="input-field"
                    value={editForm.paymentMode}
                    onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                  >
                    <option value="upi">UPI (यु.पी.आय.)</option>
                    <option value="cash">Cash (नगद)</option>
                    <option value="cheque">Cheque (चेक)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card (कार्ड)</option>
                    <option value="razorpay">Razorpay Online</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">संदेश / Note (Optional)</label>
                  <input
                    placeholder="Message"
                    className="input-field"
                    value={editForm.message}
                    onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isAnonymous}
                    onChange={(e) => setEditForm({ ...editForm, isAnonymous: e.target.checked })}
                    className="accent-blue-500 w-4 h-4"
                  />
                  <span>गुप्त दान (Donate Anonymously)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingDonation(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm transition"
                >
                  रद्द करा (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition shadow"
                >
                  {updating ? "Saving..." : "अपडेट करा (Save Changes)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDonationId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-red-200">
            <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="text-xl text-yellow-300" />
                <h3 className="font-bold text-lg font-display">पावती हटवा (Delete Pavti)</h3>
              </div>
              <button
                onClick={() => setDeletingDonationId(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-sm">
                तुम्हाला खात्री आहे का की ही वर्गणी पावती हटवायची आहे?
                <br />
                <span className="text-xs text-red-600 font-semibold">
                  (Are you sure you want to delete this Vargani record? This action cannot be undone.)
                </span>
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingDonationId(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm transition"
                >
                  रद्द करा (Cancel)
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition shadow"
                >
                  {deleting ? "Deleting..." : "होय, हटवा (Yes, Delete)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

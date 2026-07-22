import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../api/axios";
import CountdownTimer from "../components/CountdownTimer";
import LiveDonationTicker from "../components/LiveDonationTicker";
import { Link } from "react-router-dom";
import { FaUsers, FaCalendarAlt, FaBullhorn, FaImages, FaCrown, FaRupeeSign, FaPray, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [mandal, setMandal] = useState(null);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [funds, setFunds] = useState([]);
  const [totalRaised, setTotalRaised] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [aartiForm, setAartiForm] = useState({ title: "", lyrics: "", audioUrl: "", pdfUrl: "" });
  const [fundForm, setFundForm] = useState({ title: "", amount: "", paidTo: "", paymentMode: "cash", description: "", expenseDate: "" });
  const [savingAarti, setSavingAarti] = useState(false);
  const [savingFund, setSavingFund] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "admin" || user?.role === "committee";

  const mandalId = typeof user?.mandal === "object" ? user?.mandal?._id : user?.mandal;

  useEffect(() => {
    if (!mandalId) return;
    (async () => {
      try {
        const [mandalRes, eventsRes, annRes, donRes, fundRes] = await Promise.all([
          api.get(`/mandals/${mandalId}`),
          api.get("/events"),
          api.get("/announcements"),
          api.get("/donations"),
          api.get("/funds"),
        ]);
        setMandal(mandalRes.data.mandal);
        setStats(mandalRes.data.stats);
        setEvents(eventsRes.data.events.slice(0, 4));
        setAnnouncements(annRes.data.announcements.slice(0, 4));
        setTotalRaised(donRes.data.totalRaised);
        setFunds(fundRes.data.funds);
        setTotalSpent(fundRes.data.totalSpent);
      } catch (err) {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [mandalId]);

  useEffect(() => {
    if (!socket) return;
    const onAnnouncement = (a) => setAnnouncements((prev) => [a, ...prev].slice(0, 4));
    const onEvent = (e) => setEvents((prev) => [e, ...prev].slice(0, 4));
    const onFundUpdated = async ({ totalSpent }) => {
      setTotalSpent(totalSpent);
      try {
        const res = await api.get("/funds");
        setFunds(res.data.funds);
      } catch (err) {
        toast.error("Failed to refresh fund details");
      }
    };
    socket.on("new_announcement", onAnnouncement);
    socket.on("new_event", onEvent);
    socket.on("fund_updated", onFundUpdated);
    return () => {
      socket.off("new_announcement", onAnnouncement);
      socket.off("new_event", onEvent);
      socket.off("fund_updated", onFundUpdated);
    };
  }, [socket]);

  const handleAddAarti = async (e) => {
    e.preventDefault();
    if (!mandalId) return;
    if (!aartiForm.title.trim()) {
      toast.error("Aarti title is required");
      return;
    }
    setSavingAarti(true);
    try {
      const res = await api.post(`/mandals/${mandalId}/aartis`, aartiForm);
      setMandal(res.data.mandal || mandal);
      setAartiForm({ title: "", lyrics: "", audioUrl: "", pdfUrl: "" });
      toast.success("Aarti added successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add aarti");
    } finally {
      setSavingAarti(false);
    }
  };

  const handleDeleteAarti = async (aartiId) => {
    if (!mandalId || !aartiId) return;
    try {
      await api.delete(`/mandals/${mandalId}/aartis/${aartiId}`);
      setMandal((prev) => ({
        ...prev,
        aartiCollection: (prev?.aartiCollection || []).filter((item) => item._id !== aartiId),
      }));
      toast.success("Aarti removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove aarti");
    }
  };

  const handleAddFund = async (e) => {
    e.preventDefault();
    if (!fundForm.title.trim() || !fundForm.amount || Number(fundForm.amount) <= 0) {
      toast.error("Enter a valid fund title and amount");
      return;
    }
    setSavingFund(true);
    try {
      const res = await api.post("/funds", {
        ...fundForm,
        amount: Number(fundForm.amount),
      });
      setFunds((prev) => [res.data.fund, ...prev]);
      setTotalSpent(res.data.totalSpent ?? totalSpent + Number(fundForm.amount));
      setFundForm({ title: "", amount: "", paidTo: "", paymentMode: "cash", description: "", expenseDate: "" });
      toast.success("Expense recorded successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record expense");
    } finally {
      setSavingFund(false);
    }
  };

  const handleDeleteFund = async (id) => {
    if (!id) return;
    try {
      const res = await api.delete(`/funds/${id}`);
      setFunds((prev) => prev.filter((item) => item._id !== id));
      setTotalSpent(res.data.totalSpent);
      toast.success("Expense removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove expense");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-maroon-700">
          Namaste, {user?.name?.split(" ")[0]}! 🙏
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening at {mandal?.name}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<FaUsers />} label="Total Members" value={stats?.memberCount ?? 0} color="from-blue-500 to-indigo-500" />
        <StatCard icon={<FaCrown />} label="Vargani Raised" value={`₹${(stats?.totalRaised ?? 0).toLocaleString("en-IN")}`} color="from-orange-500 to-red-500" />
        <StatCard icon={<FaCalendarAlt />} label="Upcoming Events" value={events.length} color="from-emerald-500 to-teal-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CountdownTimer targetDate={mandal?.visarjanDate} label="Visarjan Countdown" />

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-maroon-700 flex items-center gap-2">
                <FaCalendarAlt className="text-orange-500" /> Upcoming Events
              </h3>
              <Link to="/events" className="text-sm text-orange-600 font-semibold hover:underline">View all</Link>
            </div>
            {events.length === 0 ? (
              <p className="text-gray-400 text-sm">No events scheduled yet.</p>
            ) : (
              <div className="space-y-3">
                {events.map((e) => (
                  <div key={e._id} className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-800">{e.title}</p>
                      <p className="text-xs text-gray-500">{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} {e.time && `• ${e.time}`}</p>
                    </div>
                    <span className="badge bg-orange-200 text-orange-800 capitalize">{e.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-maroon-700 flex items-center gap-2">
                <FaBullhorn className="text-orange-500" /> Latest Announcements
              </h3>
              <Link to="/announcements" className="text-sm text-orange-600 font-semibold hover:underline">View all</Link>
            </div>
            {announcements.length === 0 ? (
              <p className="text-gray-400 text-sm">No announcements yet.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a._id} className="border-l-4 border-orange-400 bg-orange-50 rounded-r-xl px-4 py-3">
                    <p className="font-semibold text-gray-800">{a.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <LiveDonationTicker initialTotal={totalRaised} onTotalUpdate={setTotalRaised} />

          <div className="card p-5 space-y-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-maroon-700">💰 Fund Dashboard</h3>
                <p className="text-sm text-gray-500">Total expense and spending history for your mandal.</p>
              </div>
              <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-semibold">₹{totalSpent?.toLocaleString("en-IN")}</span>
            </div>

            <div className="space-y-3">
              {funds.length === 0 ? (
                <p className="text-gray-400 text-sm">No expense records yet.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {funds.slice(0, 5).map((item) => (
                    <div key={item._id} className="bg-orange-50 rounded-xl p-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-800">{item.title}</p>
                        <p className="text-xs text-gray-500">Paid to {item.paidTo || "N/A"} · {item.paymentMode.toUpperCase()}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.description || "No description provided."}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">₹{item.amount.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-gray-500">{new Date(item.expenseDate).toLocaleDateString("en-IN")}</p>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteFund(item._id)}
                            className="mt-2 inline-flex items-center gap-2 text-red-600 text-xs font-semibold"
                          >
                            <FaTrash /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isAdmin && (
              <form onSubmit={handleAddFund} className="space-y-3">
                <div className="grid gap-3">
                  <input
                    value={fundForm.title}
                    onChange={(e) => setFundForm({ ...fundForm, title: e.target.value })}
                    placeholder="Expense title"
                    className="input-field"
                  />
                  <input
                    type="number"
                    min="1"
                    value={fundForm.amount}
                    onChange={(e) => setFundForm({ ...fundForm, amount: e.target.value })}
                    placeholder="Amount (₹)"
                    className="input-field"
                  />
                  <input
                    value={fundForm.paidTo}
                    onChange={(e) => setFundForm({ ...fundForm, paidTo: e.target.value })}
                    placeholder="Paid to"
                    className="input-field"
                  />
                  <select
                    value={fundForm.paymentMode}
                    onChange={(e) => setFundForm({ ...fundForm, paymentMode: e.target.value })}
                    className="input-field"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="date"
                    value={fundForm.expenseDate}
                    onChange={(e) => setFundForm({ ...fundForm, expenseDate: e.target.value })}
                    className="input-field"
                  />
                  <textarea
                    value={fundForm.description}
                    onChange={(e) => setFundForm({ ...fundForm, description: e.target.value })}
                    placeholder="Description (optional)"
                    className="input-field min-h-[90px]"
                  />
                </div>
                <button type="submit" disabled={savingFund} className="btn-primary w-full">
                  {savingFund ? "Saving expense..." : "Add Expense"}
                </button>
              </form>
            )}
          </div>

          <div className="card p-5 space-y-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-maroon-700">🕉️ Aarti Collection</h3>
                <p className="text-sm text-gray-500">Popular aarti list with create/delete controls.</p>
              </div>
              <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-semibold">{mandal?.aartiCollection?.length || 0} Aartis</span>
            </div>

            <div className="space-y-3">
              {mandal?.aartiCollection?.length === 0 ? (
                <p className="text-gray-400 text-sm">No aarti entries found.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {mandal.aartiCollection.map((item) => (
                    <div key={item._id} className="bg-orange-50 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-800">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.lyrics?.slice(0, 90) || "Lyrics not added."}</p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteAarti(item._id)}
                            className="inline-flex items-center gap-2 text-red-600 text-xs font-semibold"
                          >
                            <FaTrash /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isAdmin && (
              <form onSubmit={handleAddAarti} className="space-y-3">
                <div className="space-y-3">
                  <input
                    value={aartiForm.title}
                    onChange={(e) => setAartiForm({ ...aartiForm, title: e.target.value })}
                    placeholder="Aarti title"
                    className="input-field"
                  />
                  <textarea
                    value={aartiForm.lyrics}
                    onChange={(e) => setAartiForm({ ...aartiForm, lyrics: e.target.value })}
                    placeholder="Lyrics (optional)"
                    className="input-field min-h-[90px]"
                  />
                  <input
                    value={aartiForm.audioUrl}
                    onChange={(e) => setAartiForm({ ...aartiForm, audioUrl: e.target.value })}
                    placeholder="Audio URL (optional)"
                    className="input-field"
                  />
                  <input
                    value={aartiForm.pdfUrl}
                    onChange={(e) => setAartiForm({ ...aartiForm, pdfUrl: e.target.value })}
                    placeholder="PDF URL (optional)"
                    className="input-field"
                  />
                </div>
                <button type="submit" disabled={savingAarti} className="btn-primary w-full">
                  {savingAarti ? "Adding aarti..." : "Add Aarti"}
                </button>
              </form>
            )}
          </div>

          {mandal?.liveStreamUrl && (
            <div className="card p-5">
              <div className="bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">Live Stream</div>
              <div className="aspect-video bg-black">
                <iframe
                  src={mandal.liveStreamUrl}
                  title="Live Stream"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>
          )}

          <div className="card p-5">
            <div className="grid gap-3">
              {mandal?.sponsors?.length > 0 && (
                <div className="bg-orange-50 rounded-3xl p-4 border border-orange-100">
                  <h4 className="font-semibold text-gray-800 mb-2">Sponsors</h4>
                  <div className="space-y-2">
                    {mandal.sponsors.map((sponsor) => (
                      <div key={sponsor.name} className="rounded-2xl bg-white p-3 shadow-sm">
                        <p className="font-semibold text-gray-800">{sponsor.name}</p>
                        <p className="text-xs text-gray-500">{sponsor.note || sponsor.website || sponsor.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mandal?.emergencyContacts?.length > 0 && (
                <div className="bg-orange-50 rounded-3xl p-4 border border-orange-100">
                  <h4 className="font-semibold text-gray-800 mb-2">Emergency Contacts</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {mandal.emergencyContacts.map((contact) => (
                      <li key={contact.phone} className="flex justify-between gap-3">
                        <span>{contact.label}</span>
                        <span className="font-semibold">{contact.phone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-maroon-700 mb-4">Mandal Story</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{mandal?.history?.story || "A strong community formed around Ganpati devotion."}</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="font-semibold">Founded</p>
                <p>{mandal?.history?.foundedYear || "N/A"}</p>
              </div>
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="font-semibold">Founder members</p>
                <p>{mandal?.history?.founderMembers?.join(", ") || "Not listed"}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-maroon-700 mb-4">Visit Info</h3>
            <p className="text-sm text-gray-600">{mandal?.locationInfo?.address || "Location details will be shared soon."}</p>
            {mandal?.locationInfo?.parking && <p className="text-sm text-gray-600 mt-2">Parking: {mandal.locationInfo.parking}</p>}
            {mandal?.locationInfo?.nearbyHospitals && <p className="text-sm text-gray-600 mt-2">Nearby hospital: {mandal.locationInfo.nearbyHospitals}</p>}
          </div>
          
          <Link to="/gallery" className="card p-5 flex items-center gap-3 hover:bg-orange-50">
            <FaImages className="text-2xl text-orange-500" />
            <div>
              <p className="font-semibold text-gray-800">Photo Gallery</p>
              <p className="text-xs text-gray-500">Relive the celebrations</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">{label}</p>
          <p className="text-2xl font-display font-bold mt-1">{value}</p>
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}

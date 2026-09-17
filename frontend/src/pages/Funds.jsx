import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import {
  FaWallet,
  FaSearch,
  FaFilter,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaExclamationTriangle,
  FaTag,
  FaCalendarAlt,
  FaUserCheck,
  FaArrowUp,
  FaArrowDown,
  FaChartPie,
} from "react-icons/fa";

const CATEGORIES = [
  { id: "General", label: "General / सामान्य", icon: "📁", color: "bg-gray-100 text-gray-700" },
  { id: "Decoration", label: "Decoration / मंडप व सजावट", icon: "🎪", color: "bg-purple-100 text-purple-700" },
  { id: "Puja & Prasad", label: "Puja & Prasad / पूजा व प्रसाद", icon: "🌺", color: "bg-pink-100 text-pink-700" },
  { id: "Sound & Light", label: "Sound & Light / रोषणाई व साऊंड", icon: "🔊", color: "bg-amber-100 text-amber-800" },
  { id: "Miravanuk & Visarjan", label: "Miravanuk / मिरवणूक व विसर्जन", icon: "🥁", color: "bg-orange-100 text-orange-800" },
  { id: "Cultural & Program", label: "Cultural / सांस्कृतिक कार्यक्रम", icon: "🎭", color: "bg-indigo-100 text-indigo-700" },
  { id: "Social Service", label: "Social Service / सामाजिक कार्य", icon: "🤝", color: "bg-emerald-100 text-emerald-700" },
];

export default function Funds() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [funds, setFunds] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Create form state
  const [form, setForm] = useState({
    title: "",
    type: "expense",
    category: "General",
    amount: "",
    paidTo: "",
    paymentMode: "cash",
    expenseDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  // Edit modal state
  const [editingFund, setEditingFund] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    type: "expense",
    category: "General",
    amount: "",
    paidTo: "",
    paymentMode: "cash",
    expenseDate: "",
    description: "",
  });
  const [updating, setUpdating] = useState(false);

  // Delete modal state
  const [deletingFundId, setDeletingFundId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "committee";

  const calculateSummary = (items) => {
    const income = items.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expense = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    setTotalIncome(income);
    setTotalExpense(expense);
    setBalance(Math.max(income - expense, 0));
  };

  const loadFunds = async () => {
    try {
      const res = await api.get("/funds");
      setFunds(res.data.funds || []);
      calculateSummary(res.data.funds || []);
    } catch (err) {
      toast.error("Unable to load fund entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunds();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = async () => {
      try {
        const res = await api.get("/funds");
        setFunds(res.data.funds || []);
        calculateSummary(res.data.funds || []);
      } catch (err) {
        console.error(err);
      }
    };
    socket.on("fund_updated", handleUpdate);
    return () => socket.off("fund_updated", handleUpdate);
  }, [socket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) {
      toast.error("Enter a valid title and amount.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/funds", {
        ...form,
        amount: Number(form.amount),
      });
      const updated = [res.data.fund, ...funds];
      setFunds(updated);
      calculateSummary(updated);
      setForm({
        title: "",
        type: "expense",
        category: "General",
        amount: "",
        paidTo: "",
        paymentMode: "cash",
        expenseDate: new Date().toISOString().split("T")[0],
        description: "",
      });
      toast.success(res.data.fund.type === "income" ? "Fund added successfully! 🙏" : "Expense saved successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (fund) => {
    setEditingFund(fund);
    setEditForm({
      title: fund.title || "",
      type: fund.type || "expense",
      category: fund.category || "General",
      amount: fund.amount || "",
      paidTo: fund.paidTo || "",
      paymentMode: fund.paymentMode || "cash",
      expenseDate: fund.expenseDate ? new Date(fund.expenseDate).toISOString().split("T")[0] : "",
      description: fund.description || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim() || !editForm.amount || Number(editForm.amount) <= 0) {
      toast.error("Enter a valid title and amount.");
      return;
    }
    setUpdating(true);
    try {
      const res = await api.put(`/funds/${editingFund._id}`, {
        ...editForm,
        amount: Number(editForm.amount),
      });
      toast.success("Fund entry updated successfully!");
      const updatedFund = res.data.fund;
      const updatedList = funds.map((item) => (item._id === updatedFund._id ? updatedFund : item));
      setFunds(updatedList);
      calculateSummary(updatedList);
      setEditingFund(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update fund entry.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFundId) return;
    setDeleting(true);
    try {
      await api.delete(`/funds/${deletingFundId}`);
      const updated = funds.filter((item) => item._id !== deletingFundId);
      setFunds(updated);
      calculateSummary(updated);
      toast.success("Fund entry deleted.");
      setDeletingFundId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete entry.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredFunds = funds.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.paidTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || item.type === filterType;
    const matchesCategory = filterCategory === "all" || (item.category || "General") === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  const getCategoryMeta = (catId) => {
    return CATEGORIES.find((c) => c.id === catId) || { icon: "📁", label: catId || "General", color: "bg-gray-100 text-gray-700" };
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-maroon-700 flex items-center gap-2">
            <FaWallet className="text-orange-500" /> Ganpati Mandal Fund Ledger (निधी व खर्च नोंदवही)
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage Ganpati Utsav funds, track expenses, edit entries & view transparent ledgers</p>
        </div>
        <Link to="/dashboard" className="text-orange-600 hover:text-orange-700 text-sm font-semibold flex items-center gap-1">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow">
          <p className="text-xs uppercase tracking-wide opacity-90 flex items-center gap-1">
            <FaArrowUp /> Total Fund (निधी जमा)
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1">₹{totalIncome.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white p-4 rounded-2xl shadow">
          <p className="text-xs uppercase tracking-wide opacity-90 flex items-center gap-1">
            <FaArrowDown /> Total Spent (एकूण खर्च)
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1">₹{totalExpense.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-4 rounded-2xl shadow">
          <p className="text-xs uppercase tracking-wide opacity-90">Remaining Balance (शिल्लक)</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">₹{balance.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 rounded-2xl shadow">
          <p className="text-xs uppercase tracking-wide opacity-90">Total Entries (नोंदी)</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">{funds.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Controls & Filter Bar */}
          <div className="card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, paid to, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-9"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field sm:w-36"
              >
                <option value="all">All Types (सर्व)</option>
                <option value="income">Income (निधी)</option>
                <option value="expense">Expense (खर्च)</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-field sm:w-48"
              >
                <option value="all">All Categories (सर्व श्रेणी)</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ledger List */}
          <div className="card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-maroon-700 flex items-center gap-2">
                <FaWallet className="text-orange-500" /> Fund Ledger Entries (नोंदवही)
              </h2>
              <span className="text-xs text-gray-500">{filteredFunds.length} entries shown</span>
            </div>

            {filteredFunds.length === 0 ? (
              <p className="text-gray-400 text-sm py-6 text-center">No fund entries found matching your search.</p>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {filteredFunds.map((item) => {
                  const catMeta = getCategoryMeta(item.category);
                  const recordedByName =
                    typeof item.recordedBy === "object" && item.recordedBy?.name
                      ? item.recordedBy.name
                      : item.recordedByName || "";

                  return (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-orange-100 bg-orange-50/70 hover:border-orange-300 p-4 transition-all space-y-2 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                            <span
                              className={`badge text-[11px] ${
                                item.type === "income" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {item.type === "income" ? "Income (निधी)" : "Expense (खर्च)"}
                            </span>
                            <span className={`badge text-[11px] font-medium ${catMeta.color}`}>
                              {catMeta.icon} {catMeta.id}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                            <span>🗓 {new Date(item.expenseDate).toLocaleDateString("mr-IN")}</span>
                            <span>•</span>
                            <span className="font-medium text-gray-700">
                              {item.type === "income"
                                ? `Received from: ${item.paidTo || "Unknown"}`
                                : `Paid to: ${item.paidTo || "N/A"}`}
                            </span>
                            {item.paymentMode && (
                              <>
                                <span>•</span>
                                <span className="uppercase text-gray-600 font-semibold">{item.paymentMode}</span>
                              </>
                            )}
                            {recordedByName && (
                              <>
                                <span>•</span>
                                <span className="text-orange-700 font-semibold bg-orange-100 px-1.5 py-0.5 rounded text-[11px]">
                                  ✍️ नोंदणी: {recordedByName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-orange-200">
                          <span
                            className={`font-extrabold text-lg sm:text-base ${
                              item.type === "income" ? "text-emerald-600" : "text-orange-600"
                            }`}
                          >
                            {item.type === "income" ? "+" : "-"}₹{item.amount.toLocaleString("en-IN")}
                          </span>

                          {isAdmin && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEditModal(item)}
                                title="Edit Fund Entry"
                                className="p-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold transition"
                              >
                                <FaEdit className="text-sm" />
                              </button>

                              <button
                                onClick={() => setDeletingFundId(item._id)}
                                title="Delete Fund Entry"
                                className="p-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {item.description && <p className="text-xs text-gray-600 italic bg-white/60 p-2 rounded-lg border border-orange-100">{item.description}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Form & Analytics */}
        <div className="space-y-6">
          {isAdmin && (
            <div className="card p-6 shadow-md border-t-4 border-orange-500">
              <h2 className="font-display font-bold text-maroon-700 text-lg mb-3 flex items-center gap-2">
                <FaPlus className="text-orange-500" /> Create Fund / Expense Entry
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Entry Type (प्रकार)</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="expense">Expense (खर्च)</option>
                    <option value="income">Fund Income (निधी जमा)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category (वर्गवारी)</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-field"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Title (शीर्षक) *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Mandap Decoration & Stage"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Amount / रक्कम (₹) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="e.g. 5000"
                    className="input-field font-bold text-orange-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {form.type === "income" ? "Received from (कडून प्राप्त)" : "Paid to (दुकानदार / व्यक्ती)"}
                  </label>
                  <input
                    value={form.paidTo}
                    onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
                    placeholder={form.type === "income" ? "e.g. Local Donor / Sponsor" : "e.g. Royal Sound & Lights"}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Mode (माध्यम)</label>
                  <select
                    value={form.paymentMode}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    className="input-field"
                  >
                    <option value="cash">Cash (नगद)</option>
                    <option value="upi">UPI (यु.पी.आय.)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque (चेक)</option>
                    <option value="card">Card (कार्ड)</option>
                    <option value="other">Other (इतर)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Date (दिनांक)</label>
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Notes / Description (टीप)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Details or invoice notes..."
                    rows={3}
                    className="input-field min-h-[80px]"
                  />
                </div>

                <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-base shadow">
                  {saving ? "Saving..." : form.type === "income" ? "Save Fund Income 🙏" : "Save Expense Entry 🙏"}
                </button>
              </form>
            </div>
          )}

          {/* Fund Breakdown Card */}
          <div className="card p-5 space-y-3">
            <h3 className="font-display font-bold text-maroon-700 flex items-center gap-2">
              <FaChartPie className="text-orange-500" /> Category Breakdown
            </h3>
            <div className="space-y-2.5">
              {CATEGORIES.map((cat) => {
                const categoryTotal = funds
                  .filter((item) => (item.category || "General") === cat.id && item.type === "expense")
                  .reduce((sum, item) => sum + item.amount, 0);

                const percentage = totalExpense > 0 ? Math.round((categoryTotal / totalExpense) * 100) : 0;

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-gray-700">
                      <span>
                        {cat.icon} {cat.id}
                      </span>
                      <span className="font-bold text-orange-600">₹{categoryTotal.toLocaleString("en-IN")} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT FUND MODAL */}
      {editingFund && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-blue-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaEdit className="text-xl text-blue-200" />
                <h3 className="font-bold text-lg font-display">निधी नोंद संपादित करा (Edit Entry)</h3>
              </div>
              <button
                onClick={() => setEditingFund(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Entry Type (प्रकार)</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="expense">Expense (खर्च)</option>
                    <option value="income">Fund Income (निधी जमा)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category (वर्गवारी)</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="input-field"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Title (शीर्षक) *</label>
                  <input
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Amount / रक्कम (₹) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    className="input-field font-bold text-orange-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Paid To / Received From</label>
                  <input
                    value={editForm.paidTo}
                    onChange={(e) => setEditForm({ ...editForm, paidTo: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Mode</label>
                  <select
                    value={editForm.paymentMode}
                    onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                    className="input-field"
                  >
                    <option value="cash">Cash (नगद)</option>
                    <option value="upi">UPI (यु.पी.आय.)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque (चेक)</option>
                    <option value="card">Card (कार्ड)</option>
                    <option value="other">Other (इतर)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={editForm.expenseDate}
                    onChange={(e) => setEditForm({ ...editForm, expenseDate: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description / Notes</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="input-field min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingFund(null)}
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
      {deletingFundId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-red-200">
            <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="text-xl text-yellow-300" />
                <h3 className="font-bold text-lg font-display">निधी नोंद हटवा (Delete Entry)</h3>
              </div>
              <button
                onClick={() => setDeletingFundId(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-sm">
                तुम्हाला खात्री आहे का की ही निधी/खर्च नोंद हटवायची आहे?
                <br />
                <span className="text-xs text-red-600 font-semibold">
                  (Are you sure you want to delete this fund entry? This action cannot be undone.)
                </span>
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingFundId(null)}
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

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";

export default function Funds() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [funds, setFunds] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "expense",
    amount: "",
    paidTo: "",
    paymentMode: "cash",
    expenseDate: "",
    description: "",
  });
  const isAdmin = user?.role === "admin" || user?.role === "committee";

  const calculateSummary = (items) => {
    const income = items.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expense = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    setTotalIncome(income);
    setTotalExpense(expense);
    setBalance(Math.max(income - expense, 0));
  };

  useEffect(() => {
    const loadFunds = async () => {
      try {
        const res = await api.get("/funds");
        setFunds(res.data.funds);
        calculateSummary(res.data.funds);
      } catch (err) {
        toast.error("Unable to load fund entries.");
      } finally {
        setLoading(false);
      }
    };
    loadFunds();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = async () => {
      try {
        const res = await api.get("/funds");
        setFunds(res.data.funds);
        calculateSummary(res.data.funds);
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
        amount: "",
        paidTo: "",
        paymentMode: "cash",
        expenseDate: "",
        description: "",
      });
      toast.success(res.data.fund.type === "income" ? "Fund created successfully." : "Expense saved.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  }; 

  const handleDelete = async (id) => {
    if (!id) return;
    try {
      await api.delete(`/funds/${id}`);
      const updated = funds.filter((item) => item._id !== id);
      setFunds(updated);
      calculateSummary(updated);
      toast.success("Entry deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete entry.");
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-maroon-700">Fund Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track fund income and expense entries separately.</p>
        </div>
        <Link to="/dashboard" className="text-orange-600 hover:text-orange-700 text-sm font-semibold">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-maroon-700">Fund Ledger</h2>
                <p className="text-sm text-gray-500">All created fund and expense entries appear here.</p>
              </div>
              <span className="badge bg-orange-100 text-orange-700">{funds.length} Entries</span>
            </div>

            {funds.length === 0 ? (
              <div className="text-gray-400 text-sm">No fund entries recorded yet.</div>
            ) : (
              <div className="space-y-4">
                {funds.map((item) => (
                  <div key={item._id} className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{item.title}</h3>
                          <span className={`badge ${item.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {item.type === "income" ? "Income" : "Expense"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.type === "income" ? `Received from ${item.paidTo || "Unknown"}` : `Paid to ${item.paidTo || "N/A"}`}
                          {item.paymentMode ? ` · ${item.paymentMode.toUpperCase()}` : ""}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(item.expenseDate).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${item.type === "income" ? "text-emerald-600" : "text-orange-600"}`}>
                          {item.type === "income" ? "+" : "-"}₹{item.amount.toLocaleString("en-IN")}
                        </p>
                        {isAdmin && (
                          <button onClick={() => handleDelete(item._id)} className="text-red-600 text-xs font-semibold mt-3">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-700">{item.description || "No details provided."}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="font-display font-bold text-maroon-700 mb-3">Fund Summary</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-xs uppercase tracking-wide text-orange-700">Total fund</p>
                <p className="mt-2 text-xl font-semibold text-orange-600">₹{totalIncome.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-xs uppercase tracking-wide text-orange-700">Total spent</p>
                <p className="mt-2 text-xl font-semibold text-orange-600">₹{totalExpense.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-xs uppercase tracking-wide text-orange-700">Remaining balance</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">₹{balance.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-xs uppercase tracking-wide text-orange-700">Recorded entries</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">{funds.length}</p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="card p-6">
              <h2 className="font-display font-bold text-maroon-700 mb-3">Create Fund / Expense</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="input-field"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Fund</option>
                </select>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Title"
                  className="input-field"
                />
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Amount (₹)"
                  className="input-field"
                />
                <input
                  value={form.paidTo}
                  onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
                  placeholder={form.type === "income" ? "Received from" : "Paid to"}
                  className="input-field"
                />
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
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
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                  className="input-field"
                />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Notes"
                  rows={4}
                  className="input-field min-h-[110px]"
                />
                <button type="submit" disabled={saving} className="btn-primary w-full">
                  {saving ? "Saving..." : form.type === "income" ? "Create Fund" : "Save Expense"}
                </button>
              </form>
            </div>
          )}

          <div className="card p-6 bg-orange-50">
            <h3 className="font-semibold text-maroon-700 mb-2">Fund Notes</h3>
            <p className="text-sm text-gray-600">You can create fund inflows and record expense outflows here. All entries are editable by admin/committee.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

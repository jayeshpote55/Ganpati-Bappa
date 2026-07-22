import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import { FaPlus, FaVoteYea, FaChartBar, FaLock } from "react-icons/fa";

export default function Polls() {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ question: "", options: ["", ""], endDate: "", multipleChoice: false });

  const load = async () => {
    try {
      const res = await api.get("/polls");
      setPolls(res.data.polls);
    } catch (err) {
      toast.error("Unable to load polls");
    } finally {
      setLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onNewPoll = (poll) => setPolls((prev) => [poll, ...prev]);
    const onPollUpdated = (poll) => setPolls((prev) => prev.map((item) => (item._id === poll._id ? poll : item)));
    const onPollDeleted = ({ id }) => setPolls((prev) => prev.filter((item) => item._id !== id));

    socket.on("new_poll", onNewPoll);
    socket.on("poll_updated", onPollUpdated);
    socket.on("poll_deleted", onPollDeleted);

    return () => {
      socket.off("new_poll", onNewPoll);
      socket.off("poll_updated", onPollUpdated);
      socket.off("poll_deleted", onPollDeleted);
    };
  }, [socket]);

  const handleOptionChange = (index, value) => {
    const updated = [...form.options];
    updated[index] = value;
    setForm({ ...form, options: updated });
  };

  const addOption = () => setForm({ ...form, options: [...form.options, ""] });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.question.trim() || form.options.filter(Boolean).length < 2) {
      toast.error("Enter a question and at least two options.");
      return;
    }
    try {
      await api.post("/polls", {
        question: form.question,
        options: form.options.filter(Boolean),
        endDate: form.endDate || undefined,
        multipleChoice: form.multipleChoice,
      });
      toast.success("Poll published");
      setForm({ question: "", options: ["", ""], endDate: "", multipleChoice: false });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create poll");
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    try {
      await api.post(`/polls/${pollId}/vote`, { optionIndex });
      toast.success("Vote cast successfully");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to vote");
    }
  };

  const handleDelete = async (pollId) => {
    if (!confirm("Delete this poll?")) return;
    try {
      await api.delete(`/polls/${pollId}`);
      setPolls((prev) => prev.filter((poll) => poll._id !== pollId));
      toast.success("Poll deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete poll");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-maroon-700">Community Polls</h1>
          <p className="text-gray-500 text-sm mt-1">Gather member feedback and make decisions together.</p>
        </div>
        <button onClick={() => setShowForm((state) => !state)} className="btn-primary inline-flex items-center gap-2">
          <FaPlus /> Create poll
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 mb-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Question</label>
            <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="What should our next bhajan focus on?" className="input-field mt-2" />
          </div>

          <div className="grid gap-3">
            {form.options.map((option, index) => (
              <input
                key={index}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="input-field"
              />
            ))}
            <button type="button" onClick={addOption} className="btn-secondary w-full text-center">
              Add option
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.multipleChoice} onChange={(e) => setForm({ ...form, multipleChoice: e.target.checked })} className="accent-orange-500" />
              Allow multiple choices
            </label>
          </div>

          <button type="submit" className="btn-primary">
            Publish poll
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading polls…</div>
      ) : polls.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No active polls yet.</div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <div key={poll._id} className="card p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div>
                  <h2 className="font-semibold text-lg text-maroon-700">{poll.question}</h2>
                  <p className="text-sm text-gray-500 mt-1">Created by {poll.createdBy?.name || "Committee"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${poll.status === "closed" ? "bg-gray-100 text-gray-700" : "bg-orange-100 text-orange-700"}`}>
                    {poll.status}
                  </span>
                  <button onClick={() => handleDelete(poll._id)} className="text-gray-400 hover:text-red-500 text-sm">
                    Delete
                  </button>
                </div>
              </div>
              <div className="grid gap-3 mt-4">
                {poll.options.map((option, index) => (
                  <button
                    key={index}
                    disabled={poll.status === "closed"}
                    onClick={() => handleVote(poll._id, index)}
                    className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-left hover:border-orange-400 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span>{option.label}</span>
                      <span className="text-orange-700 font-semibold">{option.votes}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{poll.voters?.filter((vote) => vote.optionIndex === index).length} votes</p>
                  </button>
                ))}
              </div>
              {poll.endDate && (
                <p className="text-xs text-gray-500 mt-3">Ends on {new Date(poll.endDate).toLocaleDateString("en-IN")}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

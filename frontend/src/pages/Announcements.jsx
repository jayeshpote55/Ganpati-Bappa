import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import { FaBullhorn, FaPlus, FaTrash } from "react-icons/fa";

const PRIORITY_STYLE = {
  low: "border-gray-300 bg-gray-50",
  normal: "border-blue-400 bg-blue-50",
  high: "border-orange-500 bg-orange-50",
  urgent: "border-red-500 bg-red-50 animate-glow",
};

export default function Announcements() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", priority: "normal" });
  const [loading, setLoading] = useState(true);

  const load = () => api.get("/announcements").then((res) => setAnnouncements(res.data.announcements)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = (a) => {
      setAnnouncements((prev) => [a, ...prev]);
      toast(`📢 ${a.title}`, { duration: 5000 });
    };
    const onDelete = ({ id }) => setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    socket.on("new_announcement", onNew);
    socket.on("announcement_deleted", onDelete);
    return () => {
      socket.off("new_announcement", onNew);
      socket.off("announcement_deleted", onDelete);
    };
  }, [socket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/announcements", form);
      toast.success("Announcement posted!");
      setForm({ title: "", message: "", priority: "normal" });
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this announcement?")) return;
    try {
      await api.delete(`/announcements/${id}`);
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-maroon-700 flex items-center gap-2">
            <FaBullhorn className="text-orange-500" /> Notice Board
          </h1>
          <p className="text-gray-500 text-sm mt-1">Live updates pushed instantly to all members.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <FaPlus /> Post
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4 animate-slide-up">
          <input required placeholder="Title" className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea required placeholder="Message" rows={3} className="input-field" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low priority</option>
            <option value="normal">Normal</option>
            <option value="high">High priority</option>
            <option value="urgent">Urgent</option>
          </select>
          <button type="submit" className="btn-primary w-full">Publish to All Members</button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No announcements yet.</div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a._id} className={`border-l-4 rounded-r-xl p-5 shadow-sm ${PRIORITY_STYLE[a.priority]}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-gray-800">{a.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{a.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Posted by {a.postedBy?.name || "Committee"} · {new Date(a.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <button onClick={() => handleDelete(a._id)} className="text-gray-300 hover:text-red-500 shrink-0 ml-3">
                  <FaTrash size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

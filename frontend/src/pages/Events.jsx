import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import { FaPlus, FaMapMarkerAlt, FaClock, FaUsers, FaTrash } from "react-icons/fa";

const CATEGORY_COLORS = {
  aarti: "bg-purple-100 text-purple-700",
  cultural: "bg-pink-100 text-pink-700",
  sports: "bg-blue-100 text-blue-700",
  prasad: "bg-green-100 text-green-700",
  visarjan: "bg-red-100 text-red-700",
  other: "bg-gray-100 text-gray-700",
};

export default function Events() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ title: "", description: "", category: "cultural", date: "", time: "", location: "" });

  const load = () => api.get("/events").then((res) => setEvents(res.data.events)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = (e) => setEvents((prev) => [...prev, e].sort((a, b) => new Date(a.date) - new Date(b.date)));
    const onUpdate = (e) => setEvents((prev) => prev.map((ev) => (ev._id === e._id ? e : ev)));
    const onDelete = ({ id }) => setEvents((prev) => prev.filter((ev) => ev._id !== id));
    const onRsvp = ({ eventId, rsvpCount }) =>
      setEvents((prev) => prev.map((ev) => (ev._id === eventId ? { ...ev, rsvps: new Array(rsvpCount).fill(null) } : ev)));

    socket.on("new_event", onNew);
    socket.on("event_updated", onUpdate);
    socket.on("event_deleted", onDelete);
    socket.on("event_rsvp_updated", onRsvp);
    return () => {
      socket.off("new_event", onNew);
      socket.off("event_updated", onUpdate);
      socket.off("event_deleted", onDelete);
      socket.off("event_rsvp_updated", onRsvp);
    };
  }, [socket]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/events", form);
      toast.success("Event created!");
      setShowForm(false);
      setForm({ title: "", description: "", category: "cultural", date: "", time: "", location: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create event");
    }
  };

  const handleRSVP = async (id) => {
    try {
      const res = await api.post(`/events/${id}/rsvp`);
      toast.success(res.data.joined ? "You're going! 🎉" : "RSVP removed");
    } catch (err) {
      toast.error("Failed to update RSVP");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success("Event deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const isGoing = (event) => event.rsvps?.some((r) => (typeof r === "object" ? r._id : r) === user._id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-maroon-700">Mandal Events</h1>
          <p className="text-gray-500 text-sm mt-1">Aarti, cultural programs & festival schedule</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <FaPlus /> New Event
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 mb-6 grid sm:grid-cols-2 gap-4 animate-slide-up">
          <input required placeholder="Event title" className="input-field sm:col-span-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Description" className="input-field sm:col-span-2" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="aarti">Aarti</option>
            <option value="cultural">Cultural</option>
            <option value="sports">Sports</option>
            <option value="prasad">Prasad</option>
            <option value="visarjan">Visarjan</option>
            <option value="other">Other</option>
          </select>
          <input required type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input placeholder="Time (e.g. 7:00 PM)" className="input-field" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          <input placeholder="Location" className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <button type="submit" className="btn-primary sm:col-span-2">Create Event</button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No events scheduled yet. Check back soon! 🎊</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {events.map((event) => (
            <div key={event._id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <span className={`badge capitalize ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other}`}>{event.category}</span>
                <button onClick={() => handleDelete(event._id)} className="text-gray-300 hover:text-red-500">
                  <FaTrash size={14} />
                </button>
              </div>
              <h3 className="font-display font-bold text-lg text-maroon-700">{event.title}</h3>
              {event.description && <p className="text-gray-500 text-sm mt-1">{event.description}</p>}
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><FaClock /> {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} {event.time && `• ${event.time}`}</span>
                {event.location && <span className="flex items-center gap-1"><FaMapMarkerAlt /> {event.location}</span>}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-orange-100">
                <span className="flex items-center gap-1.5 text-sm text-gray-500"><FaUsers /> {event.rsvps?.length || 0} going</span>
                <button
                  onClick={() => handleRSVP(event._id)}
                  className={isGoing(event) ? "btn-secondary !py-1.5 !px-4 text-sm" : "btn-primary !py-1.5 !px-4 text-sm"}
                >
                  {isGoing(event) ? "Going ✓" : "RSVP"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

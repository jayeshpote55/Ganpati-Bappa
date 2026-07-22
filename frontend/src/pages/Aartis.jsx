import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";

export default function Aartis() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [mandal, setMandal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", lyrics: "", audioUrl: "", pdfUrl: "" });
  const isAdmin = user?.role === "admin" || user?.role === "committee";
  const mandalId = typeof user?.mandal === "object" ? user?.mandal?._id : user?.mandal;

  useEffect(() => {
    if (!mandalId) return;
    const load = async () => {
      try {
        const res = await api.get(`/mandals/${mandalId}`);
        setMandal(res.data.mandal);
      } catch (err) {
        toast.error("Failed to load Aarti collection.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mandalId]);

  useEffect(() => {
    if (!socket) return;
    const onMandalUpdated = (updated) => {
      if (updated._id === mandal?._id) {
        setMandal(updated);
      }
    };
    socket.on("mandal_updated", onMandalUpdated);
    return () => socket.off("mandal_updated", onMandalUpdated);
  }, [socket, mandal]);

  const handleAddAarti = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Aarti title is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post(`/mandals/${mandalId}/aartis`, form);
      setMandal(res.data.mandal);
      setForm({ title: "", lyrics: "", audioUrl: "", pdfUrl: "" });
      toast.success("Aarti added successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to add Aarti.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (aartiId) => {
    if (!aartiId) return;
    try {
      await api.delete(`/mandals/${mandalId}/aartis/${aartiId}`);
      setMandal((prev) => ({
        ...prev,
        aartiCollection: (prev?.aartiCollection || []).filter((item) => item._id !== aartiId),
      }));
      toast.success("Aarti removed.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to remove Aarti.");
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-maroon-700">Aarti Collection</h1>
          <p className="text-gray-500 text-sm mt-1">All aartis listed separately with full lyrics and links.</p>
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
                <h2 className="font-display font-bold text-maroon-700">Aarti Library</h2>
                <p className="text-sm text-gray-500">Each aarti is shown separately so members can read or share.</p>
              </div>
              <span className="badge bg-orange-100 text-orange-700">{mandal?.aartiCollection?.length || 0} Aartis</span>
            </div>

            {mandal?.aartiCollection?.length === 0 ? (
              <div className="text-gray-400 text-sm">No Aartis available yet.</div>
            ) : (
              <div className="space-y-4">
                {mandal.aartiCollection.map((aarti) => (
                  <div key={aarti._id} className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{aarti.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">Lyrics and reference links</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aarti.audioUrl && (
                          <a href={aarti.audioUrl} target="_blank" rel="noreferrer" className="badge bg-amber-100 text-amber-700">
                            Play audio
                          </a>
                        )}
                        {aarti.pdfUrl && (
                          <a href={aarti.pdfUrl} target="_blank" rel="noreferrer" className="badge bg-amber-100 text-amber-700">
                            View PDF
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-700">
                      {aarti.lyrics || "Lyrics not added for this Aarti."}
                    </div>

                    {isAdmin && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleDelete(aarti._id)}
                          className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Delete Aarti
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="font-display font-bold text-maroon-700 mb-3">Aarti Schedule</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between rounded-2xl bg-orange-50 p-3">
                <span>Morning</span>
                <strong>{mandal?.aartiTimings?.morning || "--"}</strong>
              </div>
    
              
              <div className="flex items-center justify-between rounded-2xl bg-orange-50 p-3">
                <span>Night</span>
                <strong>{mandal?.aartiTimings?.night || "--"}</strong>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="card p-6">
              <h2 className="font-display font-bold text-maroon-700 mb-3">Add New Aarti</h2>
              <form onSubmit={handleAddAarti} className="space-y-3">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Aarti title"
                  className="input-field"
                />
                <textarea
                  value={form.lyrics}
                  onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
                  placeholder="Full lyrics"
                  rows={5}
                  className="input-field min-h-[120px]"
                />
                <input
                  value={form.audioUrl}
                  onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                  placeholder="Audio URL (optional)"
                  className="input-field"
                />
                <input
                  value={form.pdfUrl}
                  onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
                  placeholder="PDF URL (optional)"
                  className="input-field"
                />
                <button type="submit" disabled={saving} className="btn-primary w-full">
                  {saving ? "Saving..." : "Add Aarti"}
                </button>
              </form>
            </div>
          )}

          <div className="card p-6 bg-orange-50">
            <h3 className="font-semibold text-maroon-700 mb-2">Aarti Tips</h3>
            <p className="text-sm text-gray-600">Use this page to keep all devotional aartis separate and easy to browse. Add audio or PDF links for members to access full resources.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

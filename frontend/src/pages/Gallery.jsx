import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import { FaHeart, FaRegHeart, FaPlus, FaTrash, FaImages } from "react-icons/fa";

export default function Gallery() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [photos, setPhotos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ image: null, caption: "" });
  const [loading, setLoading] = useState(true);

  const load = () => api.get("/gallery").then((res) => setPhotos(res.data.photos)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = (p) => setPhotos((prev) => [p, ...prev]);
    const onDelete = ({ id }) => setPhotos((prev) => prev.filter((p) => p._id !== id));
    const onLike = ({ photoId, likeCount }) =>
      setPhotos((prev) => prev.map((p) => (p._id === photoId ? { ...p, likes: new Array(likeCount).fill(null) } : p)));

    socket.on("new_photo", onNew);
    socket.on("photo_deleted", onDelete);
    socket.on("photo_like_updated", onLike);
    return () => {
      socket.off("new_photo", onNew);
      socket.off("photo_deleted", onDelete);
      socket.off("photo_like_updated", onLike);
    };
  }, [socket]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.image) return toast.error("Please select an image file to upload.");

    const data = new FormData();
    data.append("image", form.image);
    if (form.caption) data.append("caption", form.caption);

    try {
      await api.post("/gallery", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Photo added!");
      setForm({ image: null, caption: "" });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload");
    }
  };

  const handleLike = async (id) => {
    try {
      await api.put(`/gallery/${id}/like`);
    } catch {
      toast.error("Failed to like photo");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this photo?")) return;
    try {
      await api.delete(`/gallery/${id}`);
      toast.success("Photo removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const isLiked = (photo) => photo.likes?.some((l) => (typeof l === "object" ? l?._id : l) === user._id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-maroon-700 flex items-center gap-2">
            <FaImages className="text-orange-500" /> Memory Gallery
          </h1>
          <p className="text-gray-500 text-sm mt-1">Celebration moments, shared by the mandal</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <FaPlus /> Add Photo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="card p-6 mb-6 grid gap-4 animate-slide-up">
          <label className="block text-sm font-medium text-gray-700">Choose image</label>
          <input
            required
            type="file"
            accept="image/*"
            className="file-input"
            onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
          />
          <input
            placeholder="Caption (optional)"
            className="input-field"
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
          />
          <button type="submit" className="btn-primary">Upload Photo</button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading gallery...</div>
      ) : photos.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No photos yet. Add the first memory! 📸</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {photos.map((photo) => (
            <div key={photo._id} className="card overflow-hidden group">
              <div className="relative aspect-square bg-orange-100 overflow-hidden">
                <img src={photo.imageUrl} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => (e.target.src = "https://placehold.co/400x400/f97316/ffffff?text=🐘")} />
              </div>
              <div className="p-4">
                {photo.caption && <p className="text-sm text-gray-700 mb-2 truncate">{photo.caption}</p>}
                <div className="flex items-center justify-between">
                  <button onClick={() => handleLike(photo._id)} className="flex items-center gap-1.5 text-sm">
                    {isLiked(photo) ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-gray-400" />}
                    <span className="text-gray-500">{photo.likes?.length || 0}</span>
                  </button>
                  <button onClick={() => handleDelete(photo._id)} className="text-gray-300 hover:text-red-500">
                    <FaTrash size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

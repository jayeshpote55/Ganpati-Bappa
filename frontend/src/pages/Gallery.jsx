import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import { FaHeart, FaRegHeart, FaPlus, FaTrash, FaImages, FaDownload, FaTimes } from "react-icons/fa";

export default function Gallery() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [photos, setPhotos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ image: null, caption: "" });
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null); // NEW: currently opened photo

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

  // NEW: close modal on Escape key press
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedPhoto(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
      setSelectedPhoto(null); // close modal if the deleted photo was open
    } catch {
      toast.error("Failed to delete");
    }
  };

  // NEW: download handler — fetches the image as a blob so it saves instead of opening in a new tab
  const handleDownload = async (photo) => {
    try {
      const res = await fetch(photo.imageUrl, { mode: "cors" });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = blob.type.split("/")[1] || "jpg";
      link.download = `${photo.caption ? photo.caption.replace(/\s+/g, "_") : "photo"}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: if fetching as blob fails (e.g. CORS), just open the image in a new tab
      window.open(photo.imageUrl, "_blank");
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
              <div
                className="relative aspect-square bg-orange-100 overflow-hidden cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => (e.target.src = "https://placehold.co/400x400/f97316/ffffff?text=🐘")}
                />
              </div>
              <div className="p-4">
                {photo.caption && <p className="text-sm text-gray-700 mb-2 truncate">{photo.caption}</p>}
                <div className="flex items-center justify-between">
                  <button onClick={() => handleLike(photo._id)} className="flex items-center gap-1.5 text-sm">
                    {isLiked(photo) ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-gray-400" />}
                    <span className="text-gray-500">{photo.likes?.length || 0}</span>
                  </button>
                  <div className="flex items-center gap-3">
                    {/* NEW: quick download button on the card itself */}
                    <button
                      onClick={() => handleDownload(photo)}
                      className="text-gray-300 hover:text-orange-500"
                      title="Download"
                    >
                      <FaDownload size={13} />
                    </button>
                    <button onClick={() => handleDelete(photo._id)} className="text-gray-300 hover:text-red-500">
                      <FaTrash size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW: Lightbox / modal for viewing a photo full-size */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside the modal
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 z-10"
            >
              <FaTimes />
            </button>

            <img
              src={selectedPhoto.imageUrl}
              alt={selectedPhoto.caption}
              className="w-full max-h-[75vh] object-contain bg-black"
              onError={(e) => (e.target.src = "https://placehold.co/400x400/f97316/ffffff?text=🐘")}
            />

            <div className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                {selectedPhoto.caption && (
                  <p className="text-sm text-gray-700 truncate">{selectedPhoto.caption}</p>
                )}
                <button onClick={() => handleLike(selectedPhoto._id)} className="flex items-center gap-1.5 text-sm mt-1">
                  {isLiked(selectedPhoto) ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-gray-400" />}
                  <span className="text-gray-500">{selectedPhoto.likes?.length || 0}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleDownload(selectedPhoto)}
                  className="btn-primary flex items-center gap-2"
                >
                  <FaDownload /> Download
                </button>
                <button
                  onClick={() => handleDelete(selectedPhoto._id)}
                  className="text-gray-400 hover:text-red-500"
                  title="Delete"
                >
                  <FaTrash size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
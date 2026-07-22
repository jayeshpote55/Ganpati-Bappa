import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { FaUserCircle, FaUsers } from "react-icons/fa";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", city: user?.city || "", address: user?.address || "", team: user?.team || "", birthday: user?.birthday ? new Date(user.birthday).toISOString().slice(0, 10) : "", avatar: user?.avatar || "" });
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      api.get("/auth/members").then((res) => setMembers(res.data.members)).catch(() => {});
    }
  }, [isAdmin]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let updatedUser = null;
      if (selectedImage) {
        const data = new FormData();
        data.append("avatar", selectedImage);
        const avatarRes = await api.put("/auth/me/avatar", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updatedUser = avatarRes.data.user;
      }

      const profilePayload = { ...form };
      if (selectedImage) {
        profilePayload.avatar = updatedUser.avatar;
      } else {
        delete profilePayload.avatar;
      }

      const profileRes = await api.put("/auth/me", profilePayload);
      const finalUser = profileRes.data.user;
      updateUser(finalUser);
      setAvatarPreview(finalUser.avatar || avatarPreview);
      setSelectedImage(null);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/auth/members/${id}/role`, { role });
      setMembers((prev) => prev.map((m) => (m._id === id ? { ...m, role } : m)));
      toast.success("Role updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-orange-100 border-4 border-white shadow-sm">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold bg-orange-400">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-maroon-700">{user?.name}</h1>
            <span className="badge bg-orange-100 text-orange-700 capitalize mt-1">{user?.role}</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <label className="flex flex-col gap-2 text-sm text-gray-700">
            Profile photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file) {
                  setSelectedImage(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }
              }}
              className="file-input"
            />
            <span className="text-xs text-gray-500">Take a photo or choose from your gallery.</span>
          </label>
          {selectedImage && (
            <div className="p-4 rounded-xl border border-orange-200 bg-orange-50">
              <p className="text-sm font-medium text-gray-700">Selected image:</p>
              <img src={avatarPreview} alt="Selected avatar" className="mt-3 rounded-lg w-full h-40 object-cover" />
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
          <input placeholder="Full name" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Phone" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="City" className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input placeholder="Address" className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input placeholder="Team / Role" className="input-field" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} />
          <input type="date" placeholder="Birthday" className="input-field" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
          <button type="submit" disabled={saving} className="btn-primary sm:col-span-2">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {isAdmin && (
        <div className="card p-6">
          <h3 className="font-display font-bold text-maroon-700 mb-4 flex items-center gap-2">
            <FaUsers className="text-orange-500" /> Manage Members ({members.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {members.map((m) => (
              <div key={m._id} className="flex items-center justify-between bg-orange-50 rounded-lg px-4 py-2.5">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m._id, e.target.value)}
                  className="text-sm border border-orange-200 rounded-lg px-2 py-1 bg-white"
                >
                  <option value="member">Member</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="committee">Committee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

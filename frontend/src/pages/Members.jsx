import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FaUsers, FaShieldAlt, FaToggleOn, FaToggleOff } from "react-icons/fa";

export default function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "admin";

  const loadMembers = async () => {
    try {
      const res = await api.get("/auth/members");
      setMembers(res.data.members);
    } catch (err) {
      toast.error("Unable to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/auth/members/${id}/role`, { role });
      setMembers((prev) => prev.map((member) => (member._id === id ? { ...member, role } : member)));
      toast.success("Role updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      await api.put(`/auth/members/${id}/status`, { isActive: !isActive });
      setMembers((prev) => prev.map((member) => (member._id === id ? { ...member, isActive: !isActive } : member)));
      toast.success(`Member ${isActive ? "deactivated" : "activated"}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-maroon-700">Member Directory</h1>
          <p className="text-gray-500 text-sm mt-1">View member roles, teams, and account status.</p>
        </div>
        {isAdmin && (
          <div className="text-sm text-gray-600">Admin controls enabled</div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading members...</div>
      ) : members.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No members found yet.</div>
      ) : (
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member._id} className="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
                <p className="text-sm text-gray-500">{member.phone}</p>
                {member.team && <p className="text-sm text-gray-500">Team: {member.team}</p>}
                {member.birthday && <p className="text-sm text-gray-500">Birthday: {new Date(member.birthday).toLocaleDateString("en-IN")}</p>}
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <span className="badge bg-orange-100 text-orange-700 capitalize">{member.role}</span>
                <span className={`badge ${member.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                  {member.isActive ? "Active" : "Inactive"}
                </span>
                {isAdmin && (
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member._id, e.target.value)}
                      className="input-field bg-white"
                    >
                      <option value="member">Member</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="committee">Committee</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => toggleStatus(member._id, member.isActive)}
                      className="btn-secondary inline-flex items-center gap-2"
                    >
                      {member.isActive ? <FaToggleOn /> : <FaToggleOff />}
                      {member.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

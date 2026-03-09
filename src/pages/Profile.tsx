import React, { useState, useEffect } from "react";
import { User, Mail, Target, Save, Loader2, CheckCircle2, Trash2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>({ name: "", bio: "", career_goals: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/full-profile");
        setProfile(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.post("/auth/update-profile", profile);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete("/auth/delete-account");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } catch (e) {
      console.error(e);
      setDeleting(false);
      setShowDeleteConfirm(false);
      alert("Failed to delete account. Please try again later.");
    }
  };

  if (loading) return <div className="animate-pulse space-y-6">
    <div className="h-12 bg-slate-200 rounded-xl w-1/4"></div>
    <div className="h-64 bg-slate-200 rounded-3xl"></div>
  </div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center md:text-left space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">My Profile</h2>
        <p className="text-slate-500">Manage your personal information and career settings.</p>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          {message && (
            <div className="p-4 bg-emerald-50 text-emerald-600 text-sm rounded-xl font-medium flex items-center">
              <CheckCircle2 size={18} className="mr-2" />
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email Address (Read-only)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  disabled
                  value={profile.email}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-100 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Bio</label>
              <textarea 
                rows={4}
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Career Goals</label>
              <div className="relative">
                <Target className="absolute left-4 top-4 text-slate-400" size={18} />
                <textarea 
                  rows={3}
                  value={profile.career_goals || ""}
                  onChange={(e) => setProfile({ ...profile, career_goals: e.target.value })}
                  placeholder="What are your long-term career objectives?"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <button 
            disabled={saving}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center"
          >
            {saving ? <Loader2 className="animate-spin mr-2" size={20} /> : (
              <>
                <Save size={20} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </form>

        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 space-y-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
              <p className="text-sm text-red-600">Deleting your account will permanently remove all your data, including resume evaluations, skill gap analysis, and training plans. This action cannot be undone.</p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-4 bg-white text-red-600 border border-red-200 rounded-2xl font-bold hover:bg-red-50 transition-all flex items-center justify-center"
            >
              <Trash2 size={20} className="mr-2" />
              Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-bold text-red-900 text-center">Are you absolutely sure?</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  {deleting ? <Loader2 className="animate-spin" size={20} /> : "Yes, Delete Everything"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

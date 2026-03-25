import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowLeft, Save, User } from "lucide-react";
import { GET_USER_INFO, UPDATE_PROFILE_ROUTE } from "../../utils/constants";
import { useAppStore } from "@/store/index.js";
import { apiClient } from "@/lib/api-client.js";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();
  const [profilePic, setProfilePic] = useState(null);
  const [about, setAbout] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await apiClient.get(GET_USER_INFO, { withCredentials: true });
        if (response.status === 200 && response.data) {
          setUserInfo(response.data);
          setAbout(response.data.about || "");
          setProfilePic(response.data.profilePic || null);
        } else {
          navigate("/auth");
        }
      } catch {
        navigate("/auth");
      }
    };
    fetchUserInfo();
  }, []);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfilePic(reader.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("profilePic", file);
    try {
      const response = await apiClient.put(UPDATE_PROFILE_ROUTE, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 200 && response.data.image) {
        setUserInfo((prev) => ({ ...prev, profilePic: response.data.image }));
        setHasChanges(true);
        toast.success("Photo updated!");
      }
    } catch {
      toast.error("Failed to update profile photo");
    }
  };

  const handleDeleteImage = () => {
    setProfilePic("");
    setHasChanges(true);
    toast.success("Photo removed");
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("about", about);
      if (!profilePic) formData.append("removeImage", "true");

      const response = await apiClient.put(UPDATE_PROFILE_ROUTE, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        setUserInfo((prev) => ({ ...prev, about }));
        setHasChanges(false);
        toast.success("Profile saved!");
      }
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "radial-gradient(ellipse at 20% 10%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(236,72,153,0.1) 0%, transparent 60%), #07070d",
      }}
    >
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-violet-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Card */}
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(18,18,31,0.95), rgba(26,26,46,0.95))",
            border: "1px solid rgba(124,58,237,0.2)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Card header gradient bar */}
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #7c3aed, #ec4899)" }} />

          <div className="p-8">
            <h1 className="text-2xl font-extrabold text-gradient mb-1">Profile Settings</h1>
            <p className="text-sm text-slate-500 mb-8">Update your avatar and bio</p>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-5 mb-8">
              <div className="relative">
                <div
                  className="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{
                    boxShadow: "0 0 40px rgba(124,58,237,0.4), 0 0 0 2px rgba(124,58,237,0.3)",
                  }}
                >
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-700 to-pink-600 flex items-center justify-center">
                      <User className="w-14 h-14 text-white/80" />
                    </div>
                  )}
                </div>
                {profilePic && (
                  <button
                    onClick={handleDeleteImage}
                    className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center rounded-full text-white transition-all hover:scale-110"
                    style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 2px 8px rgba(220,38,38,0.5)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => document.getElementById("profile-image-input").click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}
              >
                <Plus className="w-4 h-4" />
                {profilePic ? "Change Photo" : "Add Photo"}
              </button>
              <input
                id="profile-image-input"
                type="file" accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Username (read-only) */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Username</label>
              <div
                className="px-4 py-3 rounded-xl text-slate-300 text-sm"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.12)" }}
              >
                {userInfo?.username || "—"}
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Email</label>
              <div
                className="px-4 py-3 rounded-xl text-slate-300 text-sm"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.12)" }}
              >
                {userInfo?.email || "—"}
              </div>
            </div>

            {/* About */}
            <div className="mb-7">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">About Me</label>
              <textarea
                placeholder="Tell the world something about yourself…"
                value={about}
                onChange={(e) => { setAbout(e.target.value); setHasChanges(true); }}
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none resize-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(124,58,237,0.18)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.18)")}
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSaveChanges}
              disabled={!hasChanges || isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                boxShadow: hasChanges && !isLoading ? "0 4px 24px rgba(124,58,237,0.4)" : "none",
              }}
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, Save, User } from "lucide-react";
import { GET_USER_INFO, UPDATE_PROFILE_ROUTE, MY_BOOKMARKS_ROUTE, getRemoveBookmarkRoute, SERVER_ROUTES } from "../../utils/constants";
import { useAppStore } from "@/store/index.js";
import { apiClient } from "@/lib/api-client.js";
import { toast } from "sonner";
import RankBadge from "@/components/cp/RankBadge";
import CpDashboardContent from "@/components/cp/CpDashboardContent";
import { BarChart3, X as XIcon, MessageSquare } from "lucide-react";

const fieldBoxStyle = { background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.1)" };
const readonlyBoxStyle = { background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.08)" };

const Profile = () => {
  const navigate = useNavigate();
  const {
    userInfo,
    setUserInfo,
    removeBookmarkedKey,
    setCurrentServer,
    setActiveView,
    setPendingHighlight,
  } = useAppStore();
  const [profilePic, setProfilePic] = useState(null);
  const [about, setAbout] = useState("");
  const [handle, setHandle] = useState("");
  const [leetcodeHandle, setLeetcodeHandle] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await apiClient.get(GET_USER_INFO, { withCredentials: true });
        if (response.status === 200 && response.data) {
          setUserInfo(response.data);
          setAbout(response.data.about || "");
          setHandle(response.data.codeforcesHandle || "");
          setLeetcodeHandle(response.data.leetcodeHandle || "");
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

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await apiClient.get(MY_BOOKMARKS_ROUTE);
        setBookmarks(res.data.data);
      } catch (_) {}
    };
    fetchBookmarks();
  }, []);

  const handleRemoveBookmark = async (bookmark) => {
    try {
      await apiClient.delete(getRemoveBookmarkRoute(bookmark.contestId, bookmark.index));
      setBookmarks((prev) => prev.filter((b) => b._id !== bookmark._id));
      removeBookmarkedKey(`${bookmark.contestId}-${bookmark.index}`);
      toast.success("Removed from your list");
    } catch (_) {}
  };

  const handleOpenInChat = async (bookmark) => {
    if (!bookmark.server || !bookmark.channel || !bookmark.sourceMessageId) {
      window.open(bookmark.url, "_blank", "noreferrer");
      return;
    }
    try {
      const res = await apiClient.get(`${SERVER_ROUTES}/${bookmark.server}`);
      setCurrentServer(res.data.data);
      setActiveView("server");
      setPendingHighlight({ channelId: bookmark.channel, messageId: bookmark.sourceMessageId });
      navigate("/home");
    } catch (_) {}
  };

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
      formData.append("codeforcesHandle", handle.trim());
      formData.append("leetcodeHandle", leetcodeHandle.trim());
      if (!profilePic) formData.append("removeImage", "true");

      const response = await apiClient.put(UPDATE_PROFILE_ROUTE, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        setUserInfo((prev) => ({
          ...prev,
          about,
          codeforcesHandle: handle.trim(),
          leetcodeHandle: leetcodeHandle.trim(),
        }));
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
      className="min-h-screen p-6"
      style={{
        background: "radial-gradient(ellipse at 20% 10%, rgba(37,99,235,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(37,99,235,0.05) 0%, transparent 60%), #ffffff",
      }}
    >
      <div className="w-full max-w-6xl mx-auto">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Top card: avatar + info + handles */}
        <div
          className="rounded-3xl overflow-hidden shadow-2xl mb-6"
          style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.1)" }}
        >
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #2563eb, #3b82f6)" }} />

          <div className="p-8">
            <h1 className="text-2xl font-extrabold text-gradient mb-1">Profile Settings</h1>
            <p className="text-sm text-slate-500 mb-8">Update your avatar and bio</p>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Avatar column */}
              <div className="flex flex-col items-center gap-4 lg:w-48 shrink-0">
                <div className="relative">
                  <div
                    className="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{ boxShadow: "0 0 40px rgba(37,99,235,0.25), 0 0 0 2px rgba(37,99,235,0.2)" }}
                  >
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-600 flex items-center justify-center">
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
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}
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

              {/* Info + handles grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Username</label>
                  <div className="px-4 py-3 rounded-xl text-slate-700 text-sm" style={readonlyBoxStyle}>
                    {userInfo?.username || "—"}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Email</label>
                  <div className="px-4 py-3 rounded-xl text-slate-700 text-sm" style={readonlyBoxStyle}>
                    {userInfo?.email || "—"}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">About Me</label>
                  <textarea
                    placeholder="Tell the world something about yourself…"
                    value={about}
                    onChange={(e) => { setAbout(e.target.value); setHasChanges(true); }}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none resize-none transition-all"
                    style={fieldBoxStyle}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(37,99,235,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(15,23,42,0.1)")}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Codeforces Handle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. tourist"
                    value={handle}
                    onChange={(e) => { setHandle(e.target.value); setHasChanges(true); }}
                    className="w-full px-4 py-3 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none font-mono transition-all"
                    style={fieldBoxStyle}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(37,99,235,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(15,23,42,0.1)")}
                  />
                  {userInfo?.codeforcesHandle && (
                    <div className="mt-2">
                      <RankBadge rating={userInfo.cfRating} handle={userInfo.codeforcesHandle} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    LeetCode Handle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. leetcode_user"
                    value={leetcodeHandle}
                    onChange={(e) => { setLeetcodeHandle(e.target.value); setHasChanges(true); }}
                    className="w-full px-4 py-3 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none font-mono transition-all"
                    style={fieldBoxStyle}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(37,99,235,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(15,23,42,0.1)")}
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || isLoading}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                      boxShadow: hasChanges && !isLoading ? "0 4px 24px rgba(37,99,235,0.35)" : "none",
                    }}
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookmarked Problems */}
        <div
          className="rounded-3xl overflow-hidden shadow-2xl mb-6"
          style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.1)" }}
        >
          <div className="p-6">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
              Bookmarked Problems ({bookmarks.length})
            </label>
            {bookmarks.length === 0 ? (
              <p className="text-sm text-slate-400">No saved questions yet.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                {bookmarks.map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl"
                    style={readonlyBoxStyle}
                  >
                    <button
                      onClick={() => handleOpenInChat(b)}
                      className="text-sm text-slate-700 hover:text-blue-600 truncate text-left flex-1"
                    >
                      {b.contestId}{b.index} — {b.name || "Untitled problem"}
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      {b.server && b.channel && b.sourceMessageId && (
                        <button
                          onClick={() => handleOpenInChat(b)}
                          title="Open discussion in chat"
                          className="text-slate-400 hover:text-blue-600"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveBookmark(b)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CP Dashboard */}
        <div
          className="rounded-3xl overflow-hidden shadow-2xl mb-10"
          style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.1)" }}
        >
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">CP Dashboard</h2>
            </div>
            {userInfo?.codeforcesHandle ? (
              <CpDashboardContent userId={userInfo._id} />
            ) : (
              <p className="text-sm text-slate-400">Link your Codeforces handle above to see your dashboard.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

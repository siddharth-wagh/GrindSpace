import React, { useEffect, useRef, useState } from "react";
import {
  Users, Search, Plus, Settings, LogOut, Copy, Check, Key, X, Crown,
} from "lucide-react";
import { useAppStore } from "../store/index.js";
import { apiClient } from "../lib/api-client.js";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LOGOUT_ROUTE } from "../utils/constants.js";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

/* ── tiny helpers ─────────────────────────────────────────── */
const Avatar = ({ src, name, size = 10, ring = false, online = false }) => (
  <div className={`relative flex-shrink-0 w-${size} h-${size}`}>
    <div className={`w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-violet-700 to-pink-600 ${ring ? "ring-2 ring-violet-500/60" : ""}`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-bold text-sm">{name?.[0]?.toUpperCase() || "?"}</span>
      )}
    </div>
    {online !== undefined && (
      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d0d1a] ${online ? "bg-emerald-400" : "bg-slate-600"}`} />
    )}
  </div>
);

const ModalOverlay = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(7,7,13,0.85)", backdropFilter: "blur(12px)" }}
    onClick={onClose}
  >
    <div onClick={(e) => e.stopPropagation()} className="animate-scale-in w-full max-w-md">
      {children}
    </div>
  </div>
);

const ModalCard = ({ children }) => (
  <div className="rounded-2xl border border-violet-500/20 shadow-2xl"
    style={{ background: "linear-gradient(135deg, #12121f 0%, #1a1a2e 100%)" }}>
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
const Sidebar = () => {
  const navigate = useNavigate();
  const {
    userInfo, setUserInfo, currentGroup, setCurrentGroup, setMessages,
    onlineUsers, addOnlineUser, removeOnlineUser,
  } = useAppStore();

  const sidebarSocketRef = useRef(null);

  useEffect(() => {
    sidebarSocketRef.current = io(SERVER_URL, { withCredentials: true });
    sidebarSocketRef.current.on("user-status-change", ({ userId, status }) => {
      status === "online" ? addOnlineUser(userId) : removeOnlineUser(userId);
    });
    return () => sidebarSocketRef.current?.disconnect();
  }, []);

  /* ── state ────────────────────────────────────────────────── */
  const [groupCreated, setGroupCreated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [newGroup, setNewGroup] = useState({ name: "", description: "", isPrivate: false, tags: [] });
  const [tagInput, setTagInput] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [members, setMembers] = useState([]);
  const [leaderId, setLeaderId] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [groupToken, setGroupToken] = useState("");
  const [tokenCopied, setTokenCopied] = useState(false);
  const [tokenGroup, setTokenGroup] = useState(null);

  /* ── helpers ──────────────────────────────────────────────── */
  function openGroup(group) {
    setCurrentGroup(group);
    setMessages([]);
    setShowMembersPanel(false);
  }

  const handleLogout = async () => {
    try { await apiClient.post(LOGOUT_ROUTE, {}, { withCredentials: true }); } catch (_) { }
    setUserInfo(undefined);
    setCurrentGroup(null);
    navigate("/auth");
  };

  const fetchUserInfo = async () => {
    try {
      const res = await apiClient.get("/api/auth/check", { withCredentials: true });
      setUserInfo(res.data);
    } catch (err) {
      console.error("Error fetching user info", err);
    } finally {
      setGroupCreated(false);
    }
  };

  useEffect(() => { if (groupCreated) fetchUserInfo(); }, [groupCreated]);
  useEffect(() => { fetchUserInfo(); }, []);

  /* ── create group ─────────────────────────────────────────── */
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) { toast.error("Group name is required"); return; }
    try {
      const formData = new FormData();
      formData.append("name", newGroup.name);
      formData.append("description", newGroup.description);
      formData.append("isPrivate", newGroup.isPrivate);
      newGroup.tags.forEach((tag) => formData.append("tags[]", tag));
      if (groupImage) formData.append("groupImage", groupImage);

      const response = await apiClient.post("/api/group/create", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Group created! 🎉");
      setShowModal(false);
      setGroupCreated(true);

      if (response.data?.data?.isPrivate && response.data?.data?._id) {
        fetchGroupToken(response.data.data);
      }
      setNewGroup({ name: "", description: "", isPrivate: false, tags: [] });
      setTagInput("");
      setGroupImage(null);
    } catch {
      toast.error("Failed to create group");
    }
  };

  /* ── search ───────────────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!search.trim()) { setSearchResults([]); setShowSuggestions(false); return; }
      try {
        const res = await apiClient.get(`/api/group/search?query=${search}&full=false`);
        setSearchResults(res.data);
        setShowSuggestions(true);
      } catch { setSearchResults([]); setShowSuggestions(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSearchEnter = async (e) => {
    if (e.key === "Enter" && search.trim()) {
      try {
        const res = await apiClient.get(`/api/group/search?query=${search}&full=true`);
        setSearchResults(res.data);
        setShowSuggestions(false);
        setShowingSearchResults(true);
      } catch { console.error("Search failed"); }
    }
  };

  /* ── join group ───────────────────────────────────────────── */
  const closeGroupModal = () => { setSelectedGroup(null); setShowGroupModal(false); setJoinToken(""); };

  const handleJoinGroup = async () => {
    if (!selectedGroup) return;
    try {
      await apiClient.post(`/api/group/join/${selectedGroup._id}`, { joinToken });
      await fetchUserInfo();
      toast.success(`Joined "${selectedGroup.name}" 🎉`);
      closeGroupModal();
      setShowingSearchResults(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to join group");
    }
  };

  /* ── members panel ────────────────────────────────────────── */
  const toggleMembersPanel = async () => {
    if (!currentGroup) return;
    if (showMembersPanel) { setShowMembersPanel(false); return; }
    try {
      const res = await apiClient.get(`/api/group/${currentGroup._id}/members`, { withCredentials: true });
      setMembers(res.data.members);
      setLeaderId(res.data.leaderId);
      setShowMembersPanel(true);
    } catch { toast.error("Failed to load members"); }
  };

  /* ── group token ──────────────────────────────────────────── */
  const fetchGroupToken = async (group) => {
    setTokenGroup(group);
    setGroupToken("");
    setTokenCopied(false);
    try {
      const res = await apiClient.get(`/api/group/${group._id}/token`, { withCredentials: true });
      setGroupToken(res.data.joinToken);
      setShowTokenModal(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to get token");
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(groupToken);
    setTokenCopied(true);
    toast.success("Token copied!");
    setTimeout(() => setTokenCopied(false), 2000);
  };

  /* ── render ───────────────────────────────────────────────── */
  return (
    <>
      {/* ── Sidebar shell ─────────────────────────────────────── */}
      <div
        className="w-72 h-screen flex flex-col shadow-2xl"
        style={{
          background: "linear-gradient(180deg, #0d0d1a 0%, #10101e 60%, #0d0d1a 100%)",
          borderRight: "1px solid rgba(124,58,237,0.15)",
        }}
      >
        {/* ── Brand header ────────────────────────────────────── */}
        <div className="px-5 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-lg font-extrabold text-gradient tracking-wide">GrindSpace</h1>
              <p className="text-[10px] text-violet-400/60 font-medium tracking-widest uppercase mt-0.5">Study Together</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate("/profile")}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
                title="Profile"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search + User avatar row */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-violet-500/40">
              {userInfo?.profilePic ? (
                <img src={userInfo.profilePic} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-700 to-pink-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{userInfo?.username?.[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchEnter}
                placeholder="Search groups…"
                className="w-full pl-8 pr-3 py-2 text-sm rounded-xl text-slate-200 placeholder-slate-500 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.2)")}
              />
              {showSuggestions && searchResults.length > 0 && (
                <div
                  className="absolute z-50 mt-1 w-full rounded-xl shadow-xl overflow-hidden"
                  style={{ background: "#12121f", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  {searchResults.map((g) => (
                    <button
                      key={g._id}
                      onClick={() => { setSelectedGroup(g); setShowSuggestions(false); setSearch(""); setShowGroupModal(true); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-violet-500/10 transition-colors"
                      style={{ borderBottom: "1px solid rgba(124,58,237,0.08)" }}
                    >
                      <div className="text-sm font-medium text-slate-200 truncate">{g.name}</div>
                      <div className="text-xs text-slate-500 truncate">{g.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to groups */}
        {showingSearchResults && (
          <div className="px-5 py-2" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
            <button
              onClick={() => { setShowingSearchResults(false); setSearch(""); setSearchResults([]); }}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition-colors"
            >
              ← Back to My Groups
            </button>
          </div>
        )}

        {/* ── Groups list ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex items-center justify-between px-2 mb-3">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              {showingSearchResults ? "Search Results" : "My Groups"}
            </span>
            <span className="text-[10px] text-violet-400/60 bg-violet-500/10 px-2 py-0.5 rounded-full font-mono">
              {showingSearchResults ? searchResults.length : userInfo?.groups?.length || 0}
            </span>
          </div>

          <div className="space-y-1">
            {showingSearchResults ? (
              searchResults.length > 0 ? searchResults.map((g) => (
                <GroupRow
                  key={g._id} group={g} active={false}
                  onClick={() => { setSelectedGroup(g); setShowGroupModal(true); }}
                />
              )) : (
                <EmptyGroups text="No groups found." />
              )
            ) : userInfo?.groups?.length > 0 ? (
              userInfo.groups.map((group) => (
                <GroupRow
                  key={group._id}
                  group={group}
                  active={currentGroup?._id === group._id}
                  onClick={() => openGroup(group)}
                  actions={currentGroup?._id === group._id ? (
                    <div className="flex gap-1">
                      {group.isPrivate && group.leader === userInfo?._id && (
                        <ActionBtn title="Join token" onClick={(e) => { e.stopPropagation(); fetchGroupToken(group); }}>
                          <Key className="w-3 h-3" />
                        </ActionBtn>
                      )}
                      <ActionBtn title="View members" onClick={(e) => { e.stopPropagation(); toggleMembersPanel(); }}>
                        <Users className="w-3 h-3" />
                      </ActionBtn>
                    </div>
                  ) : null}
                />
              ))
            ) : (
              <EmptyGroups text="You're not in any groups yet." />
            )}
          </div>
        </div>

        {/* ── Members panel ───────────────────────────────────── */}
        {showMembersPanel && currentGroup && (
          <div
            className="px-4 py-3 animate-fade-slide"
            style={{ borderTop: "1px solid rgba(124,58,237,0.12)", background: "rgba(7,7,13,0.6)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Members · {members.length}
              </span>
              <button
                onClick={() => setShowMembersPanel(false)}
                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/5 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
              {members.map((m) => (
                <div key={m._id} className="flex items-center gap-2.5">
                  <Avatar
                    src={m.profilePic}
                    name={m.username}
                    size={7}
                    online={onlineUsers.has(m._id)}
                  />
                  <span className="text-sm text-slate-300 flex-1 truncate">{m.username}</span>
                  {m._id === leaderId?.toString() && (
                    <Crown className="w-3.5 h-3.5 text-yellow-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Create button ────────────────────────────────────── */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(124,58,237,0.12)" }}>
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
              boxShadow: "0 4px 24px rgba(124,58,237,0.35)",
            }}
          >
            <Plus className="w-4 h-4" />
            Create Group
          </button>
        </div>
      </div>

      {/* ═══════════════ Create Group Modal ══════════════════ */}
      {showModal && (
        <ModalOverlay onClose={() => setShowModal(false)}>
          <ModalCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gradient">Create New Group</h2>
                <CloseBtn onClick={() => setShowModal(false)} />
              </div>

              <div className="space-y-3">
                <DarkInput
                  placeholder="Group Name *"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                />
                <DarkTextarea
                  placeholder="Description (optional)"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  rows={3}
                />

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setNewGroup({ ...newGroup, isPrivate: !newGroup.isPrivate })}
                    className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 ${newGroup.isPrivate ? "bg-violet-600" : "bg-slate-700"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${newGroup.isPrivate ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Private Group (join token required)</span>
                </label>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Group Image</label>
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => setGroupImage(e.target.files[0])}
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-500/20 file:text-violet-300 hover:file:bg-violet-500/30 transition-all"
                  />
                  {groupImage && (
                    <img src={URL.createObjectURL(groupImage)} alt="Preview" className="mt-2 h-16 w-16 rounded-xl object-cover ring-1 ring-violet-500/30" />
                  )}
                </div>

                <DarkInput
                  placeholder="Add tags (press Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (tagInput.trim() && newGroup.tags.length < 5) {
                        setNewGroup({ ...newGroup, tags: [...newGroup.tags, tagInput.trim()] });
                        setTagInput("");
                      }
                    }
                  }}
                />
                {newGroup.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {newGroup.tags.map((tag, i) => (
                      <span
                        key={i}
                        onClick={() => setNewGroup({ ...newGroup, tags: newGroup.tags.filter((_, idx) => idx !== i) })}
                        className="px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all"
                        style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}
                      >
                        {tag} ×
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <GhostBtn onClick={() => { setShowModal(false); setNewGroup({ name: "", description: "", isPrivate: false, tags: [] }); setTagInput(""); setGroupImage(null); }}>
                  Cancel
                </GhostBtn>
                <PrimaryBtn onClick={handleCreateGroup}>Create Group</PrimaryBtn>
              </div>
            </div>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* ═══════════════ Join Group Modal ═══════════════════ */}
      {showGroupModal && selectedGroup && (
        <ModalOverlay onClose={closeGroupModal}>
          <ModalCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-white">{selectedGroup.name}</h2>
                <CloseBtn onClick={closeGroupModal} />
              </div>
              <p className="text-sm text-slate-400 mb-4">{selectedGroup.description}</p>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${selectedGroup.isPrivate ? "bg-yellow-500/15 text-yellow-300" : "bg-emerald-500/15 text-emerald-300"}`}
                >
                  {selectedGroup.isPrivate ? "🔒 Private" : "🌐 Public"}
                </span>
              </div>
              {selectedGroup.isPrivate && (
                <DarkInput
                  placeholder="Enter join token"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  className="mb-4"
                />
              )}
              <div className="flex gap-3 mt-4">
                <GhostBtn onClick={closeGroupModal}>Cancel</GhostBtn>
                <PrimaryBtn onClick={handleJoinGroup}>Join Group</PrimaryBtn>
              </div>
            </div>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* ═══════════════ Token Modal ════════════════════════ */}
      {showTokenModal && tokenGroup && (
        <ModalOverlay onClose={() => setShowTokenModal(false)}>
          <ModalCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-lg font-bold text-white">Join Token</h2>
                </div>
                <CloseBtn onClick={() => setShowTokenModal(false)} />
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Share this with people you want to invite to <strong className="text-white">{tokenGroup.name}</strong>.
              </p>
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)" }}
              >
                <code className="flex-1 text-sm font-mono text-violet-200 break-all">{groupToken || "Loading…"}</code>
                <button
                  onClick={copyToken}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all flex-shrink-0"
                >
                  {tokenCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-yellow-500/70 mt-3">🔒 Keep this private — anyone with it can join.</p>
            </div>
          </ModalCard>
        </ModalOverlay>
      )}
    </>
  );
};

/* ── Micro-components ─────────────────────────────────────── */
const GroupRow = ({ group, active, onClick, actions }) => (
  <div className="relative group/row">
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3"
      style={{
        background: active
          ? "linear-gradient(90deg, rgba(124,58,237,0.18), rgba(124,58,237,0.08))"
          : "transparent",
        borderLeft: active ? "2px solid rgba(124,58,237,0.7)" : "2px solid transparent",
        boxShadow: active ? "inset 0 0 20px rgba(124,58,237,0.05)" : "none",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-700 to-pink-600 flex items-center justify-center">
        {group.profilePicGrp
          ? <img src={group.profilePicGrp} alt={group.name} className="w-full h-full object-cover" />
          : <span className="text-white font-bold text-sm">{group.name?.[0]?.toUpperCase()}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-semibold truncate transition-colors ${active ? "text-violet-200" : "text-slate-300"}`}>
            {group.name}
          </span>
          {group.isPrivate && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />}
        </div>
        <p className="text-[11px] text-slate-500 truncate mt-0.5">{group.description || "No description"}</p>
      </div>
    </button>
    {actions && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
        {actions}
      </div>
    )}
  </div>
);

const EmptyGroups = ({ text }) => (
  <div className="flex flex-col items-center py-10 text-slate-600">
    <Users className="w-8 h-8 mb-2 opacity-30" />
    <p className="text-sm">{text}</p>
  </div>
);

const ActionBtn = ({ children, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-violet-300 transition-all"
    style={{ background: "rgba(124,58,237,0.2)" }}
  >
    {children}
  </button>
);

const CloseBtn = ({ onClick }) => (
  <button onClick={onClick} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
    <X className="w-4 h-4" />
  </button>
);

const GhostBtn = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
    style={{ border: "1px solid rgba(124,58,237,0.2)" }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    {children}
  </button>
);

const PrimaryBtn = ({ onClick, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}
  >
    {children}
  </button>
);

const DarkInput = ({ className = "", ...props }) => (
  <input
    className={`w-full px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none transition-all ${className}`}
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.18)" }}
    onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
    onBlur={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.18)")}
    {...props}
  />
);

const DarkTextarea = ({ className = "", ...props }) => (
  <textarea
    className={`w-full px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none transition-all resize-none ${className}`}
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.18)" }}
    onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
    onBlur={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.18)")}
    {...props}
  />
);

export default Sidebar;

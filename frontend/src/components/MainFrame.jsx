import React, { useEffect, useRef, useState } from "react";
import {
  Users, Video, Send, Image, Mic, MicOff, VideoOff,
  X, PhoneOff, Trash2, Loader2, ChevronUp, LogOut, AlertTriangle,
} from "lucide-react";
import { useAppStore } from "../store/index.js";
import { apiClient } from "../lib/api-client.js";
import { io } from "socket.io-client";
import { toast } from "sonner";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

/* ── Small helpers ────────────────────────────────────────── */
const formatTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return d.toDateString() === now.toDateString()
    ? time
    : `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${time}`;
};

/* ── Confirm Leave Dialog ─────────────────────────────────── */
const LeaveConfirmDialog = ({ groupName, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(7,7,13,0.9)", backdropFilter: "blur(16px)" }}
  >
    <div
      className="w-full max-w-sm rounded-2xl p-6 animate-scale-in"
      style={{ background: "linear-gradient(135deg, #12121f, #1a1a2e)", border: "1px solid rgba(239,68,68,0.25)" }}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
          <AlertTriangle className="w-7 h-7 text-rose-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Leave Group?</h3>
          <p className="text-sm text-slate-400">
            You'll leave <strong className="text-white">"{groupName}"</strong> and lose access to its messages.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 16px rgba(220,38,38,0.3)" }}
          >
            Leave Group
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ── Leader Block Dialog ─────────────────────────────────── */
const LeaderBlockDialog = ({ groupName, onClose, onDeleteClick }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(7,7,13,0.9)", backdropFilter: "blur(16px)" }}
  >
    <div
      className="w-full max-w-sm rounded-2xl p-6 animate-scale-in"
      style={{ background: "linear-gradient(135deg, #12121f, #1a1a2e)", border: "1px solid rgba(124,58,237,0.3)" }}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
          <span className="text-3xl">👑</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2">You're the Leader!</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            As the leader you can't leave — you can only <span className="text-rose-400 font-medium">delete the group</span> entirely.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Cancel
          </button>
          <button
            onClick={onDeleteClick}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 16px rgba(220,38,38,0.3)" }}
          >
            Delete Group
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ── Delete Group Confirm Dialog ──────────────────────────── */
const DeleteGroupDialog = ({ groupName, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(7,7,13,0.92)", backdropFilter: "blur(16px)" }}
  >
    <div
      className="w-full max-w-sm rounded-2xl p-6 animate-scale-in"
      style={{ background: "linear-gradient(135deg, #12121f, #1a1a2e)", border: "1px solid rgba(239,68,68,0.3)" }}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
          <Trash2 className="w-7 h-7 text-rose-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Delete Group?</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            <strong className="text-white">"{groupName}"</strong> and all its messages will be permanently deleted.
            <br />
            <span className="text-rose-400 font-medium">This cannot be undone.</span>
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 16px rgba(220,38,38,0.3)" }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ── Profile Popup ────────────────────────────────────────── */
const ProfilePopup = ({ popup, onClose }) => (
  <div
    className="fixed z-50 rounded-2xl p-4 w-56 animate-fade-slide"
    style={{
      left: popup.x, top: popup.y,
      background: "linear-gradient(135deg, #12121f, #1a1a2e)",
      border: "1px solid rgba(124,58,237,0.25)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    }}
    onClick={onClose}
  >
    <div className="flex items-center gap-3">
      <img src={popup.profilePic} alt={popup.username}
        className="w-11 h-11 rounded-xl object-cover ring-2 ring-violet-500/40" />
      <div>
        <p className="font-semibold text-white text-sm">{popup.username}</p>
        <p className="text-[11px] text-slate-500">Click to dismiss</p>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════ MAIN COMPONENT ═ */
const MainFrame = () => {
  const { currentGroup, messages, setMessages, userInfo, setCurrentGroup, setUserInfo } = useAppStore();
  const [tempmessages, setTempMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [inCall, setInCall] = useState(false);
  const groupRef = useRef(currentGroup);
  const peerConnections = useRef({});
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  // Pagination
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const oldestMsgId = useRef(null);

  // Typing
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeout = useRef(null);
  const isTyping = useRef(false);

  // Misc UI
  const [profilePopup, setProfilePopup] = useState(null);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLeaderBlock, setShowLeaderBlock] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* ── Socket setup ────────────────────────────────────────── */
  useEffect(() => {
    socketRef.current = io(SERVER_URL, { withCredentials: true });
    if (userInfo?._id) socketRef.current.emit("user-online", userInfo._id);
    return () => socketRef.current?.disconnect();
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [tempmessages]);

  useEffect(() => {
    return () => {
      if (inCall) {
        socketRef.current?.emit("leave-call", groupRef.current._id);
        Object.values(peerConnections.current).forEach((pc) => pc.close());
        peerConnections.current = {};
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        const rc = document.getElementById("remoteVideos");
        if (rc) rc.innerHTML = "";
      }
    };
  }, [inCall]);

  useEffect(() => { groupRef.current = currentGroup; }, [currentGroup]);

  /* ── Fetch messages ──────────────────────────────────────── */
  useEffect(() => {
    if (!currentGroup?._id) return;
    const fetchMsgs = async () => {
      try {
        const res = await apiClient.get(`/api/messages/getAllMessages/${currentGroup._id}`, { withCredentials: true });
        setTempMessages(res.data.data);
        setHasMore(res.data.hasMore);
        if (res.data.data.length > 0) oldestMsgId.current = res.data.data[0]._id;
      } catch (e) { console.error("Failed to fetch messages", e); }
    };
    fetchMsgs();
    socketRef.current?.emit("join-room", currentGroup._id);
    setTypingUsers([]);
    return () => socketRef.current?.emit("leave-room", currentGroup._id);
  }, [currentGroup]);

  /* ── Load older messages ─────────────────────────────────── */
  const loadOlderMessages = async () => {
    if (!currentGroup?._id || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const container = messagesContainerRef.current;
      const prevH = container?.scrollHeight || 0;
      const res = await apiClient.get(
        `/api/messages/getAllMessages/${currentGroup._id}?before=${oldestMsgId.current}`,
        { withCredentials: true }
      );
      if (res.data.data.length > 0) {
        setTempMessages((prev) => [...res.data.data, ...prev]);
        oldestMsgId.current = res.data.data[0]._id;
        requestAnimationFrame(() => { if (container) container.scrollTop = container.scrollHeight - prevH; });
      }
      setHasMore(res.data.hasMore);
    } catch (e) { console.error("Failed to load older messages", e); }
    finally { setLoadingMore(false); }
  };

  /* ── Socket listeners ────────────────────────────────────── */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const onNew = (msg) => setTempMessages((p) => [...p, msg]);
    const onDel = (id) => setTempMessages((p) => p.filter((m) => m._id !== id));
    const onTyping = ({ userId, username }) => setTypingUsers((p) => p.find((t) => t.userId === userId) ? p : [...p, { userId, username }]);
    const onStop = ({ userId }) => setTypingUsers((p) => p.filter((t) => t.userId !== userId));
    socket.on("new-message", onNew);
    socket.on("message-deleted", onDel);
    socket.on("user-typing", onTyping);
    socket.on("user-stopped-typing", onStop);
    return () => { socket.off("new-message", onNew); socket.off("message-deleted", onDel); socket.off("user-typing", onTyping); socket.off("user-stopped-typing", onStop); };
  }, [socketRef.current]);

  /* ── Typing emit ─────────────────────────────────────────── */
  const handleTyping = () => {
    if (!isTyping.current && currentGroup?._id) {
      isTyping.current = true;
      socketRef.current?.emit("typing-start", { groupId: currentGroup._id, userId: userInfo?._id, username: userInfo?.username });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      socketRef.current?.emit("typing-stop", { groupId: currentGroup?._id, userId: userInfo?._id });
    }, 2000);
  };

  /* ── Send message ────────────────────────────────────────── */
  const sendMessage = () => {
    if (!text && !image) return;
    isTyping.current = false;
    socketRef.current?.emit("typing-stop", { groupId: currentGroup?._id, userId: userInfo?._id });
    const emit = (imgUrl = null) => {
      socketRef.current?.emit("send-message", { text, image: imgUrl, sender: userInfo?._id, groupId: currentGroup._id });
      setText(""); setImage(null);
    };
    if (image) { const r = new FileReader(); r.onloadend = () => emit(r.result); r.readAsDataURL(image); }
    else emit();
  };

  const deleteMessage = async (id) => {
    try { await apiClient.delete(`/api/messages/${id}`, { withCredentials: true }); }
    catch { toast.error("Failed to delete message"); }
  };

  /* ── Leave group ─────────────────────────────────────────── */
  /* ── Delete group (leader only) ──────────────────────────── */
  const handleDeleteGroup = async () => {
    if (!currentGroup?._id) return;
    try {
      await apiClient.delete(`/api/group/delete/${currentGroup._id}`, { withCredentials: true });
      toast.success(`"${currentGroup.name}" has been deleted`);
      setCurrentGroup(null);
      const res = await apiClient.get("/api/auth/check", { withCredentials: true });
      setUserInfo(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete group");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentGroup?._id) return;
    try {
      await apiClient.post(`/api/group/leave/${currentGroup._id}`, {}, { withCredentials: true });
      toast.success(`Left "${currentGroup.name}"`);
      setCurrentGroup(null);
      const res = await apiClient.get("/api/auth/check", { withCredentials: true });
      setUserInfo(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to leave group");
    } finally {
      setShowLeaveConfirm(false);
    }
  };

  /* ── Profile popup ───────────────────────────────────────── */
  const showProfile = (sender, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setProfilePopup({
      username: sender?.username || "Unknown",
      profilePic: sender?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      x: rect.left, y: rect.bottom + 8,
    });
    setTimeout(() => setProfilePopup(null), 3000);
  };

  /* ── Video call logic ────────────────────────────────────── */
  const startCall = async () => {
    try {
      setInCall(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;
      socketRef.current?.emit("join-call", currentGroup._id);
      socketRef.current?.on("new-peer", async ({ from }) => {
        if (peerConnections.current[from]) return;
        const pc = createPC(from, stream);
        peerConnections.current[from] = pc;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit("offer", { to: from, sdp: offer });
      });
      socketRef.current?.on("offer", async ({ from, sdp }) => {
        if (peerConnections.current[from]) return;
        const pc = createPC(from, stream);
        peerConnections.current[from] = pc;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current?.emit("answer", { to: from, sdp: answer });
      });
      socketRef.current?.on("answer", async ({ from, sdp }) => {
        await peerConnections.current[from]?.setRemoteDescription(new RTCSessionDescription(sdp));
      });
      socketRef.current?.on("candidate", async ({ from, candidate }) => {
        await peerConnections.current[from]?.addIceCandidate(new RTCIceCandidate(candidate));
      });
      socketRef.current?.on("peer-disconnected", (id) => {
        peerConnections.current[id]?.close();
        delete peerConnections.current[id];
        document.getElementById(`remote-${id}`)?.remove();
      });
    } catch (e) { console.error("Error starting call:", e); setInCall(false); }
  };

  const createPC = (peerId, stream) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.onicecandidate = (e) => { if (e.candidate) socketRef.current?.emit("candidate", { to: peerId, candidate: e.candidate }); };
    pc.ontrack = (e) => {
      if (!document.getElementById(`remote-${peerId}`)) {
        const v = document.createElement("video");
        v.id = `remote-${peerId}`; v.autoplay = true; v.playsInline = true;
        v.className = "w-1/3 min-w-[260px] aspect-video rounded-2xl ring-2 ring-violet-500 shadow-2xl";
        v.srcObject = e.streams[0];
        document.getElementById("remoteVideos")?.appendChild(v);
      }
    };
    return pc;
  };

  const endCall = () => {
    socketRef.current?.emit("leave-call", currentGroup._id);
    Object.values(peerConnections.current).forEach((p) => p.close());
    peerConnections.current = {};
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    const rc = document.getElementById("remoteVideos");
    if (rc) rc.innerHTML = "";
    setInCall(false); setIsMuted(false); setIsVideoOff(false);
  };

  const toggleMute = () => { setIsMuted(!isMuted); localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = isMuted)); };
  const toggleVideo = () => { setIsVideoOff(!isVideoOff); localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = isVideoOff)); };
  const handleImageUpload = (e) => { const f = e.target.files[0]; if (f) setImage(f); };
  const handleKeyPress = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  /* ── No group selected ───────────────────────────────────── */
  if (!currentGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-mesh">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
          style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <Users className="w-12 h-12 text-violet-400/50" />
        </div>
        <h2 className="text-xl font-bold text-slate-300 mb-2">No Group Selected</h2>
        <p className="text-sm text-slate-500">Pick a group from the sidebar to start chatting</p>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-screen flex-1 bg-mesh" style={{ minWidth: 0 }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div
        className="px-6 py-4 flex items-center justify-between flex-shrink-0"
        style={{
          background: "rgba(13,13,26,0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(124,58,237,0.12)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Group avatar */}
          <div
            className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: "0 0 16px rgba(124,58,237,0.4)", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            {currentGroup?.profilePicGrp ? (
              <img src={currentGroup.profilePicGrp} alt="Group" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
                <span className="text-white font-bold">{currentGroup?.name?.[0]?.toUpperCase()}</span>
              </div>
            )}
          </div>
          <div>
            <h2 className="font-bold text-white leading-tight">{currentGroup?.name}</h2>
            {typingUsers.length > 0 ? (
              <p className="text-xs text-violet-400 flex items-center gap-1">
                <span className="flex gap-0.5">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1 h-1 bg-violet-400 rounded-full inline-block"
                      style={{ animation: `bounceDot 1.2s ease-in-out ${d}ms infinite` }} />
                  ))}
                </span>
                {typingUsers.map((t) => t.username).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </p>
            ) : (
              <p className="text-xs text-slate-500">Group chat</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!inCall && (
            <>
              <button
                onClick={startCall}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}
              >
                <Video className="w-4 h-4" />
                Join Call
              </button>
              <button
                onClick={() => {
                  const leaderId = typeof currentGroup?.leader === "object"
                    ? currentGroup?.leader?._id?.toString()
                    : currentGroup?.leader?.toString();
                  if (leaderId && leaderId === userInfo?._id?.toString()) {
                    setShowLeaderBlock(true);
                  } else {
                    setShowLeaveConfirm(true);
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 transition-all hover:bg-rose-500/10"
                style={{ border: "1px solid rgba(239,68,68,0.2)" }}
                title="Leave group"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Leave</span>
              </button>

              {/* Delete button — visible only to the leader */}
              {(() => {
                const leaderId = typeof currentGroup?.leader === "object"
                  ? currentGroup?.leader?._id?.toString()
                  : currentGroup?.leader?.toString();
                return leaderId && leaderId === userInfo?._id?.toString() ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 transition-all hover:bg-rose-500/10"
                    style={{ border: "1px solid rgba(239,68,68,0.2)" }}
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                ) : null;
              })()}
            </>
          )}
        </div>
      </div>

      {/* ── Video call overlay ─────────────────────────────────── */}
      {inCall && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#07070d" }}>
          <div className="flex-1 flex flex-wrap items-center justify-center gap-6 p-8 overflow-auto">
            <div className="relative">
              <video
                ref={localVideoRef} autoPlay muted
                className="w-1/3 min-w-[260px] aspect-video rounded-2xl ring-2 ring-emerald-500 shadow-2xl"
              />
              <div className="absolute bottom-3 left-3 text-xs text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full font-medium">You</div>
            </div>
            <div id="remoteVideos" className="flex flex-wrap gap-6 justify-center" />
          </div>

          <div
            className="flex justify-center gap-4 items-center py-6 px-8"
            style={{ background: "rgba(13,13,26,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(124,58,237,0.15)" }}
          >
            <CallBtn onClick={toggleMute} active={isMuted} danger>
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </CallBtn>
            <CallBtn onClick={toggleVideo} active={isVideoOff} danger>
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </CallBtn>
            <button
              onClick={endCall}
              className="w-14 h-14 flex items-center justify-center rounded-full text-white transition-all hover:scale-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 20px rgba(220,38,38,0.5)" }}
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────────── */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={loadOlderMessages}
              disabled={loadingMore}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-violet-400 hover:text-violet-300 rounded-full transition-all disabled:opacity-50"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronUp className="w-3.5 h-3.5" />}
              {loadingMore ? "Loading…" : "Load older messages"}
            </button>
          </div>
        )}

        {Array.isArray(tempmessages) && tempmessages.length > 0 ? (
          tempmessages.map((msg, idx) => {
            const senderId = typeof msg.sender === "string" ? msg.sender : msg.sender?._id;
            const isOwn = senderId === userInfo?._id;
            const senderObj = typeof msg.sender === "object" ? msg.sender : null;
            const senderName = senderObj?.username || (isOwn ? "You" : "Unknown");

            return (
              <div
                key={msg._id || idx}
                className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end gap-2`}
                onMouseEnter={() => setHoveredMsg(msg._id)}
                onMouseLeave={() => setHoveredMsg(null)}
              >
                {/* Avatar */}
                {!isOwn && senderObj && (
                  <button onClick={(e) => showProfile(senderObj, e)} className="flex-shrink-0 mb-0.5">
                    <div className="w-7 h-7 rounded-lg overflow-hidden hover:ring-2 hover:ring-violet-500/50 transition-all"
                      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                      <img
                        src={senderObj?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt={senderName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </button>
                )}

                {/* Bubble + delete */}
                <div className="relative group">
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-sm ${isOwn
                      ? "rounded-br-md text-white"
                      : "rounded-bl-md text-slate-200"
                      }`}
                    style={isOwn
                      ? { background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(8px)" }
                    }
                  >
                    {!isOwn && (
                      <button
                        onClick={(e) => showProfile(senderObj, e)}
                        className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 mb-1 block transition-colors"
                      >
                        {senderName}
                      </button>
                    )}
                    {msg.image && (
                      <img src={msg.image} alt="attachment" className="rounded-xl max-w-full h-auto mb-2 shadow-lg" />
                    )}
                    {msg.text && <p className="leading-relaxed break-words">{msg.text}</p>}
                    <div className={`text-[10px] mt-1.5 ${isOwn ? "text-violet-200/60" : "text-slate-500"}`}>
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>

                  {/* Delete button */}
                  {isOwn && hoveredMsg === msg._id && (
                    <button
                      onClick={() => deleteMessage(msg._id)}
                      title="Delete"
                      className="absolute -left-8 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-rose-400 hover:text-rose-300 transition-all"
                      style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-24 text-slate-600">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}
            >
              <Users className="w-8 h-8 text-violet-400/30" />
            </div>
            <p className="text-base font-medium text-slate-400">No messages yet</p>
            <p className="text-sm text-slate-600 mt-1">Be the first to say hello!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Message Input ─────────────────────────────────────────── */}
      <div
        className="px-5 py-4 flex-shrink-0"
        style={{
          background: "rgba(13,13,26,0.85)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(124,58,237,0.1)",
        }}
      >
        {/* Image preview */}
        {image && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl w-fit"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
            <span className="text-xs text-violet-300 font-medium">Image ready</span>
            <button onClick={() => setImage(null)} className="text-violet-400 hover:text-rose-400 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-violet-300 transition-all flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.15)" }}
            title="Attach image"
          >
            <Image className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyPress}
            placeholder="Send a message…"
            className="flex-1 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 rounded-xl outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(124,58,237,0.18)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.18)")}
          />

          <button
            onClick={sendMessage}
            disabled={!text && !image}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              boxShadow: (text || image) ? "0 4px 16px rgba(124,58,237,0.4)" : "none",
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Dialogs & Popups ──────────────────────────────────────── */}
      {showLeaveConfirm && (
        <LeaveConfirmDialog
          groupName={currentGroup?.name}
          onConfirm={handleLeaveGroup}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
      {showLeaderBlock && (
        <LeaderBlockDialog
          groupName={currentGroup?.name}
          onClose={() => setShowLeaderBlock(false)}
          onDeleteClick={() => { setShowLeaderBlock(false); setShowDeleteConfirm(true); }}
        />
      )}
      {showDeleteConfirm && (
        <DeleteGroupDialog
          groupName={currentGroup?.name}
          onConfirm={handleDeleteGroup}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      {profilePopup && <ProfilePopup popup={profilePopup} onClose={() => setProfilePopup(null)} />}
    </div>
  );
};

/* ── CallBtn ──────────────────────────────────────────────── */
const CallBtn = ({ onClick, active, danger, children }) => (
  <button
    onClick={onClick}
    className="w-12 h-12 flex items-center justify-center rounded-full text-white transition-all hover:scale-110 active:scale-95"
    style={{
      background: active && danger ? "linear-gradient(135deg, #dc2626, #ef4444)"
        : "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.1)",
    }}
  >
    {children}
  </button>
);

export default MainFrame;

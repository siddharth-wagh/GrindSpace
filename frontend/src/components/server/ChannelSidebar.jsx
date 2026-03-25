import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { getChannelsRoute, SERVER_ROUTES } from "@/utils/constants";
import {
  Hash,
  Volume2,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  LogOut,
  Trash2,
  X,
  Copy,
  Mic,
  MicOff,
  Headphones,
  VolumeX,
} from "lucide-react";

export default function ChannelSidebar({ socket }) {
  const {
    currentServer,
    channels,
    setChannels,
    currentChannel,
    setCurrentChannel,
    userInfo,
    setCurrentServer,
    setServers,
    servers,
    currentVoiceChannel,
    setCurrentVoiceChannel,
    isMuted,
    setIsMuted,
    isDeafened,
    setIsDeafened,
    voiceParticipants,
  } = useAppStore();

  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  // Fetch channels when server changes
  useEffect(() => {
    if (!currentServer) return;
    (async () => {
      try {
        const res = await apiClient.get(getChannelsRoute(currentServer._id));
        setChannels(res.data.data);
        // Auto-select default text channel and join socket room
        const defaultChannel = res.data.data.find((c) => c.isDefault && c.type === "text");
        const selected = defaultChannel || res.data.data.find((c) => c.type === "text");
        if (selected) {
          setCurrentChannel(selected);
          if (socket) socket.emit("join-channel", selected._id);
        }
      } catch (err) {
        console.error("Failed to fetch channels:", err);
      }
    })();
  }, [currentServer?._id]);

  const toggleCategory = (cat) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSelectTextChannel = (channel) => {
    if (socket && currentChannel) {
      socket.emit("leave-channel", currentChannel._id);
    }
    setCurrentChannel(channel);
    if (socket) {
      socket.emit("join-channel", channel._id);
    }
  };

  const handleJoinVoice = (channel) => {
    if (currentVoiceChannel) {
      socket?.emit("leave-voice", currentVoiceChannel._id);
    }
    setCurrentVoiceChannel(channel);
    socket?.emit("join-voice", channel._id);
  };

  const handleLeaveVoice = () => {
    if (currentVoiceChannel) {
      socket?.emit("leave-voice", currentVoiceChannel._id);
    }
    setCurrentVoiceChannel(null);
  };

  const handleLeaveServer = async () => {
    if (!currentServer) return;
    try {
      await apiClient.post(`${SERVER_ROUTES}/${currentServer._id}/leave`);
      setServers(servers.filter((s) => s._id !== currentServer._id));
      setCurrentServer(null);
      setCurrentChannel(null);
      setChannels([]);
    } catch (err) {
      console.error("Failed to leave server:", err);
    }
  };

  const handleDeleteServer = async () => {
    if (!currentServer) return;
    if (!confirm("Are you sure you want to delete this server? This cannot be undone.")) return;
    try {
      await apiClient.delete(`${SERVER_ROUTES}/${currentServer._id}`);
      setServers(servers.filter((s) => s._id !== currentServer._id));
      setCurrentServer(null);
      setCurrentChannel(null);
      setChannels([]);
    } catch (err) {
      console.error("Failed to delete server:", err);
    }
  };

  if (!currentServer) return null;

  // Group channels by category
  const categories = {};
  channels.forEach((ch) => {
    const cat = ch.category || "Uncategorized";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(ch);
  });

  const myRole = currentServer.members?.find(
    (m) => (m.user?._id || m.user) === userInfo?._id
  )?.role;
  const isAdmin = ["owner", "admin"].includes(myRole);
  const isOwner = myRole === "owner";

  return (
    <div className="w-60 min-w-[240px] bg-[var(--bg-dark)] flex flex-col h-full border-r border-[var(--border)]">
      {/* Server Header */}
      <div className="relative group">
        <button
          onClick={() => setShowServerSettings(!showServerSettings)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--bg-surface)] transition-colors border-b border-[var(--border)]"
        >
          <span className="font-semibold text-sm truncate">{currentServer.name}</span>
          <ChevronDown size={16} className="text-[var(--text-muted)]" />
        </button>

        {/* Server dropdown */}
        {showServerSettings && (
          <div className="absolute top-full left-2 right-2 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl z-40 py-1.5">
            <button
              onClick={() => { setShowInvite(true); setShowServerSettings(false); }}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-[var(--bg-surface)] flex items-center gap-2 text-[var(--violet-lite)]"
            >
              <Copy size={14} /> Invite People
            </button>
            {isAdmin && (
              <button
                onClick={() => { setShowCreateChannel(true); setShowServerSettings(false); }}
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-[var(--bg-surface)] flex items-center gap-2"
              >
                <Plus size={14} /> Create Channel
              </button>
            )}
            {!isOwner && (
              <button
                onClick={() => { handleLeaveServer(); setShowServerSettings(false); }}
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-[var(--bg-surface)] flex items-center gap-2 text-red-400"
              >
                <LogOut size={14} /> Leave Server
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => { handleDeleteServer(); setShowServerSettings(false); }}
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-[var(--bg-surface)] flex items-center gap-2 text-red-400"
              >
                <Trash2 size={14} /> Delete Server
              </button>
            )}
          </div>
        )}
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin">
        {Object.entries(categories).map(([catName, catChannels]) => (
          <div key={catName}>
            <button
              onClick={() => toggleCategory(catName)}
              className="flex items-center gap-1 w-full px-1 py-1 text-xs font-semibold uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              {collapsedCategories[catName] ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
              {catName}
            </button>

            {!collapsedCategories[catName] &&
              catChannels.map((channel) => (
                <ChannelItem
                  key={channel._id}
                  channel={channel}
                  active={
                    channel.type === "text"
                      ? currentChannel?._id === channel._id
                      : currentVoiceChannel?._id === channel._id
                  }
                  onClick={() =>
                    channel.type === "text"
                      ? handleSelectTextChannel(channel)
                      : handleJoinVoice(channel)
                  }
                  voiceParticipants={voiceParticipants[channel._id]}
                />
              ))}
          </div>
        ))}
      </div>

      {/* Voice Controls (shown when in voice channel) */}
      {currentVoiceChannel && (
        <div className="border-t border-[var(--border)] px-2 py-2 bg-[var(--bg-card)]">
          <div className="text-xs text-emerald-400 font-medium mb-1 flex items-center gap-1">
            <Volume2 size={12} /> Voice Connected
          </div>
          <p className="text-xs text-[var(--text-muted)] truncate mb-2">
            {currentVoiceChannel.name}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                socket?.emit("voice-state-update", {
                  channelId: currentVoiceChannel._id,
                  muted: !isMuted,
                  deafened: isDeafened,
                });
              }}
              className={`flex-1 p-1.5 rounded flex items-center justify-center ${
                isMuted ? "bg-red-500/20 text-red-400" : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white"
              }`}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              onClick={() => {
                setIsDeafened(!isDeafened);
                socket?.emit("voice-state-update", {
                  channelId: currentVoiceChannel._id,
                  muted: isMuted,
                  deafened: !isDeafened,
                });
              }}
              className={`flex-1 p-1.5 rounded flex items-center justify-center ${
                isDeafened ? "bg-red-500/20 text-red-400" : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white"
              }`}
            >
              {isDeafened ? <VolumeX size={16} /> : <Headphones size={16} />}
            </button>
            <button
              onClick={handleLeaveVoice}
              className="flex-1 p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* User Bar */}
      <div className="border-t border-[var(--border)] px-2 py-2 flex items-center gap-2 bg-[var(--bg-deepest)]">
        <div className="relative">
          <img
            src={userInfo?.profilePic}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[var(--bg-deepest)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{userInfo?.username}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Online</p>
        </div>
      </div>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <CreateChannelModal
          serverId={currentServer._id}
          categories={Object.keys(categories)}
          onClose={() => setShowCreateChannel(false)}
          onCreated={(channel) => {
            setChannels([...channels, channel]);
            setShowCreateChannel(false);
          }}
        />
      )}

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          server={currentServer}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}

// ─── Channel Item ────────────────────────────────────────────────────────────
function ChannelItem({ channel, active, onClick, voiceParticipants }) {
  return (
    <div>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors
          ${
            active
              ? "bg-[var(--bg-surface)] text-white"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50"
          }`}
      >
        {channel.type === "text" ? (
          <Hash size={16} className="shrink-0 opacity-60" />
        ) : (
          <Volume2 size={16} className="shrink-0 opacity-60" />
        )}
        <span className="truncate">{channel.name}</span>
      </button>

      {/* Voice channel participants */}
      {channel.type === "voice" && voiceParticipants?.length > 0 && (
        <div className="ml-8 space-y-0.5 py-0.5">
          {voiceParticipants.map((p) => (
            <div key={p.socketId} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <div className="w-4 h-4 rounded-full bg-[var(--bg-surface)]" />
              <span className="truncate">{p.username || "User"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create Channel Modal ────────────────────────────────────────────────────
function CreateChannelModal({ serverId, categories, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [category, setCategory] = useState(categories[0] || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post(getChannelsRoute(serverId), {
        name: name.trim(),
        type,
        category,
      });
      onCreated(res.data.data);
    } catch (err) {
      console.error("Create channel error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--bg-card)] rounded-xl p-6 w-[400px] max-w-[90vw] border border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Create Channel</h2>
          <button onClick={onClose}><X size={20} className="text-[var(--text-muted)]" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("text")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                type === "text"
                  ? "bg-[var(--violet)] text-white"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)]"
              }`}
            >
              <Hash size={16} /> Text
            </button>
            <button
              type="button"
              onClick={() => setType("voice")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                type === "voice"
                  ? "bg-[var(--violet)] text-white"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)]"
              }`}
            >
              <Volume2 size={16} /> Voice
            </button>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Channel Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[var(--bg-deepest)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--violet)]"
              placeholder={type === "text" ? "new-channel" : "General Voice"}
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[var(--bg-deepest)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--violet)]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="bg-[var(--violet)] hover:bg-[var(--violet-lite)] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Channel"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Invite Modal ────────────────────────────────────────────────────────────
function InviteModal({ server, onClose }) {
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.post(`${SERVER_ROUTES}/${server._id}/invite`);
        setInviteCode(res.data.inviteCode);
      } catch (err) {
        // If user is not admin, try to get existing code
        setInviteCode(server.inviteCode || "N/A");
      }
    })();
  }, [server._id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--bg-card)] rounded-xl p-6 w-[400px] max-w-[90vw] border border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Invite Friends</h2>
          <button onClick={onClose}><X size={20} className="text-[var(--text-muted)]" /></button>
        </div>

        <p className="text-sm text-[var(--text-muted)] mb-3">Share this invite code:</p>

        <div className="flex gap-2">
          <div className="flex-1 bg-[var(--bg-deepest)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono">
            {inviteCode || "Loading..."}
          </div>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-[var(--violet)] hover:bg-[var(--violet-lite)] rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { getChannelsRoute, SERVER_ROUTES } from "@/utils/constants";
import {
  Hash,
  ChevronDown,
  ChevronRight,
  Plus,
  LogOut,
  Trash2,
  X,
  Copy,
  ListChecks,
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
    setShowMemberSidebar,
    setRightPanelTab,
    pendingHighlight,
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
        // Jump straight to the target channel when arriving via a bookmark
        // deep-link; otherwise auto-select the default text channel.
        const targetChannel = pendingHighlight
          ? res.data.data.find((c) => c._id === pendingHighlight.channelId)
          : null;
        const defaultChannel = res.data.data.find((c) => c.isDefault && c.type === "text");
        const selected = targetChannel || defaultChannel || res.data.data.find((c) => c.type === "text");
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
    if (ch.type && ch.type !== "text") return;
    const cat = ch.category || "Uncategorized";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(ch);
  });

  const myRole = currentServer.members?.find(
    (m) => (m.user?._id || m.user) === userInfo?._id
  )?.role;
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
            <button
              onClick={() => {
                setShowMemberSidebar(true);
                setRightPanelTab("problems");
                setShowServerSettings(false);
              }}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-[var(--bg-surface)] flex items-center gap-2"
            >
              <ListChecks size={14} /> Problem Ledger
            </button>
            {isOwner && (
              <button
                onClick={() => { setShowCreateChannel(true); setShowServerSettings(false); }}
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-[var(--bg-surface)] flex items-center gap-2"
              >
                <Plus size={14} /> Create Room
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
                  active={currentChannel?._id === channel._id}
                  onClick={() => handleSelectTextChannel(channel)}
                />
              ))}
          </div>
        ))}
      </div>

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
function ChannelItem({ channel, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors
        ${
          active
            ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50"
        }`}
    >
      <Hash size={16} className="shrink-0 opacity-60" />
      <span className="truncate">{channel.name}</span>
    </button>
  );
}

// ─── Create Channel Modal ────────────────────────────────────────────────────
function CreateChannelModal({ serverId, categories, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0] || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post(getChannelsRoute(serverId), {
        name: name.trim(),
        type: "text",
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
          <h2 className="text-lg font-bold">Create Contest Room</h2>
          <button onClick={onClose}><X size={20} className="text-[var(--text-muted)]" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Channel Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[var(--bg-deepest)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--violet)]"
              placeholder="new-channel"
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
            {loading ? "Creating..." : "Create Room"}
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

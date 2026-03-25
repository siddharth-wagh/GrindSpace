import { useState } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { CREATE_SERVER, GET_MY_SERVERS, SERVER_ROUTES } from "@/utils/constants";
import { Plus, MessageCircle, Search, X, Upload, Globe, Lock } from "lucide-react";

export default function ServerSidebar() {
  const {
    servers,
    setServers,
    currentServer,
    setCurrentServer,
    setCurrentChannel,
    setChannels,
    activeView,
    setActiveView,
    userInfo,
  } = useAppStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);

  const handleSelectServer = (server) => {
    setActiveView("server");
    setCurrentServer(server);
  };

  const handleDMClick = () => {
    setActiveView("dm");
    setCurrentServer(null);
    setCurrentChannel(null);
  };

  return (
    <div className="w-[72px] min-w-[72px] bg-[var(--bg-deepest)] flex flex-col items-center py-3 gap-2 overflow-y-auto scrollbar-hide">
      {/* DM / Home Button */}
      <SidebarIcon
        active={activeView === "dm"}
        onClick={handleDMClick}
        tooltip="Direct Messages"
      >
        <MessageCircle size={24} />
      </SidebarIcon>

      <div className="w-8 h-[2px] bg-[var(--border)] rounded-full" />

      {/* Server Icons */}
      {servers.map((server) => (
        <SidebarIcon
          key={server._id}
          active={currentServer?._id === server._id && activeView === "server"}
          onClick={() => handleSelectServer(server)}
          tooltip={server.name}
        >
          {server.icon ? (
            <img
              src={server.icon}
              alt={server.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-sm font-semibold">
              {server.name?.slice(0, 2).toUpperCase()}
            </span>
          )}
        </SidebarIcon>
      ))}

      <div className="w-8 h-[2px] bg-[var(--border)] rounded-full" />

      {/* Add Server */}
      <SidebarIcon onClick={() => setShowCreate(true)} tooltip="Create Server" color="green">
        <Plus size={24} />
      </SidebarIcon>

      {/* Join by Invite */}
      <SidebarIcon onClick={() => setShowJoin(true)} tooltip="Join Server" color="green">
        <Search size={20} />
      </SidebarIcon>

      {/* Discover */}
      <SidebarIcon onClick={() => setShowDiscover(true)} tooltip="Discover Servers" color="green">
        <Globe size={20} />
      </SidebarIcon>

      {/* Modals */}
      {showCreate && (
        <CreateServerModal
          onClose={() => setShowCreate(false)}
          onCreated={(server) => {
            setServers([...servers, server]);
            setShowCreate(false);
            handleSelectServer(server);
          }}
        />
      )}
      {showJoin && (
        <JoinServerModal
          onClose={() => setShowJoin(false)}
          onJoined={async () => {
            setShowJoin(false);
            const res = await apiClient.get(GET_MY_SERVERS);
            setServers(res.data.data);
          }}
        />
      )}
      {showDiscover && (
        <DiscoverModal
          onClose={() => setShowDiscover(false)}
          onJoined={async () => {
            const res = await apiClient.get(GET_MY_SERVERS);
            setServers(res.data.data);
          }}
        />
      )}
    </div>
  );
}

// ─── Sidebar Icon ────────────────────────────────────────────────────────────
function SidebarIcon({ children, active, onClick, tooltip, color }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-12 h-12 flex items-center justify-center transition-all duration-200 overflow-hidden
          ${
            active
              ? "rounded-2xl bg-[var(--violet)]"
              : color === "green"
              ? "rounded-full bg-[var(--bg-card)] hover:rounded-2xl hover:bg-emerald-600 text-emerald-500 hover:text-white"
              : "rounded-full bg-[var(--bg-card)] hover:rounded-2xl hover:bg-[var(--violet)]"
          }`}
      >
        {children}
      </button>

      {/* Active pill indicator */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1 h-10 bg-white rounded-r-full" />
      )}

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--bg-surface)] text-sm font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[var(--border)]">
          {tooltip}
        </div>
      )}
    </div>
  );
}

// ─── Create Server Modal ─────────────────────────────────────────────────────
function CreateServerModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [icon, setIcon] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("isPrivate", isPrivate);
      if (icon) formData.append("icon", icon);

      const res = await apiClient.post(CREATE_SERVER, formData);
      onCreated(res.data.data);
    } catch (err) {
      console.error("Create server error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[var(--bg-card)] rounded-xl p-6 w-[440px] max-w-[90vw] border border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create a Server</h2>
          <button onClick={onClose}><X size={20} className="text-[var(--text-muted)]" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Server Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[var(--bg-deepest)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--violet)]"
              placeholder="My Awesome Server"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[var(--bg-deepest)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--violet)]"
              placeholder="What's your server about?"
            />
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="accent-[var(--violet)]"
            />
            <Lock size={14} className="text-[var(--text-muted)]" />
            <span className="text-sm">Private Server (invite only)</span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Server Icon</span>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden border border-[var(--border)]">
                {icon ? (
                  <img src={URL.createObjectURL(icon)} className="w-full h-full object-cover" />
                ) : (
                  <Upload size={20} className="text-[var(--text-muted)]" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIcon(e.target.files[0])}
                className="text-sm text-[var(--text-muted)]"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="bg-[var(--violet)] hover:bg-[var(--violet-lite)] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Server"}
          </button>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ─── Join Server Modal ───────────────────────────────────────────────────────
function JoinServerModal({ onClose, onJoined }) {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      await apiClient.get(`${SERVER_ROUTES}/join-by-code/${inviteCode.trim()}`);
      onJoined();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[var(--bg-card)] rounded-xl p-6 w-[440px] max-w-[90vw] border border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Join a Server</h2>
          <button onClick={onClose}><X size={20} className="text-[var(--text-muted)]" /></button>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Invite Code</span>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="bg-[var(--bg-deepest)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--violet)]"
              placeholder="Enter an invite code"
              required
            />
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--violet)] hover:bg-[var(--violet-lite)] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Joining..." : "Join Server"}
          </button>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ─── Discover Servers Modal ──────────────────────────────────────────────────
function DiscoverModal({ onClose, onJoined }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { userInfo } = useAppStore();

  const handleSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get(`${SERVER_ROUTES}/discover`, {
        params: { query: q },
      });
      setResults(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  const handleJoin = async (serverId) => {
    try {
      await apiClient.post(`${SERVER_ROUTES}/${serverId}/join`);
      onJoined();
    } catch (_) {}
  };

  // Load initial list on mount
  useState(() => {
    (async () => {
      try {
        const res = await apiClient.get(`${SERVER_ROUTES}/discover`);
        setResults(res.data.data);
      } catch (_) {}
    })();
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[var(--bg-card)] rounded-xl p-6 w-[540px] max-w-[90vw] max-h-[80vh] flex flex-col border border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Discover Servers</h2>
          <button onClick={onClose}><X size={20} className="text-[var(--text-muted)]" /></button>
        </div>

        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-[var(--bg-deepest)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-[var(--violet)]"
          placeholder="Search public servers..."
        />

        <div className="flex-1 overflow-y-auto space-y-2">
          {results.map((server) => (
            <div
              key={server._id}
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-dark)] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] flex items-center justify-center overflow-hidden">
                {server.icon ? (
                  <img src={server.icon} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{server.name?.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{server.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{server.description || "No description"}</p>
                <p className="text-xs text-[var(--text-muted)]">{server.members?.length || 0} members</p>
              </div>
              <button
                onClick={() => handleJoin(server._id)}
                className="px-3 py-1.5 text-xs font-semibold bg-[var(--violet)] hover:bg-[var(--violet-lite)] rounded-md transition-colors"
              >
                Join
              </button>
            </div>
          ))}
          {results.length === 0 && !loading && (
            <p className="text-center text-[var(--text-muted)] text-sm py-8">No servers found</p>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Modal Overlay ───────────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  );
}

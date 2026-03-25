import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { FRIEND_ROUTES, DM_ROUTES } from "@/utils/constants";
import {
  UserPlus,
  UserCheck,
  UserX,
  MessageCircle,
  Search,
  X,
  Check,
  Clock,
} from "lucide-react";

export default function FriendsPanel({ socket }) {
  const {
    friends,
    setFriends,
    friendRequests,
    setFriendRequests,
    friendsView,
    setFriendsView,
    onlineUsers,
    setCurrentConversation,
    setActiveView,
  } = useAppStore();

  // Fetch friends + requests on mount
  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  // Socket listeners for real-time friend events
  useEffect(() => {
    if (!socket) return;

    const handleRequestReceived = (data) => {
      setFriendRequests({
        ...friendRequests,
        incoming: [...friendRequests.incoming, data],
      });
    };
    const handleAccepted = () => {
      fetchFriends();
      fetchRequests();
    };
    const handleRemoved = () => {
      fetchFriends();
    };

    socket.on("friend-request-received", handleRequestReceived);
    socket.on("friend-request-accepted", handleAccepted);
    socket.on("friend-removed", handleRemoved);

    return () => {
      socket.off("friend-request-received", handleRequestReceived);
      socket.off("friend-request-accepted", handleAccepted);
      socket.off("friend-removed", handleRemoved);
    };
  }, [socket, friendRequests]);

  const fetchFriends = async () => {
    try {
      const res = await apiClient.get(FRIEND_ROUTES);
      setFriends(res.data.data);
    } catch (_) {}
  };

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get(`${FRIEND_ROUTES}/requests`);
      setFriendRequests({
        incoming: res.data.incoming,
        outgoing: res.data.outgoing,
      });
    } catch (_) {}
  };

  const handleAccept = async (userId) => {
    try {
      await apiClient.post(`${FRIEND_ROUTES}/accept/${userId}`);
      fetchFriends();
      fetchRequests();
    } catch (_) {}
  };

  const handleDecline = async (userId) => {
    try {
      await apiClient.post(`${FRIEND_ROUTES}/decline/${userId}`);
      fetchRequests();
    } catch (_) {}
  };

  const handleRemove = async (userId) => {
    try {
      await apiClient.delete(`${FRIEND_ROUTES}/${userId}`);
      setFriends(friends.filter((f) => f._id !== userId));
    } catch (_) {}
  };

  const handleStartDM = async (userId) => {
    try {
      const res = await apiClient.post(`${DM_ROUTES}/create`, {
        targetUserId: userId,
      });
      setCurrentConversation(res.data.data);
    } catch (_) {}
  };

  const tabs = [
    { key: "online", label: "Online" },
    { key: "all", label: "All" },
    { key: "pending", label: "Pending", count: friendRequests.incoming.length },
    { key: "add", label: "Add Friend" },
  ];

  const onlineFriends = friends.filter((f) => onlineUsers.has(f._id));
  const displayFriends = friendsView === "online" ? onlineFriends : friends;

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-dark)]">
      {/* Header */}
      <div className="h-12 min-h-[48px] flex items-center px-4 border-b border-[var(--border)] gap-4">
        <span className="font-semibold text-sm">Friends</span>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFriendsView(tab.key)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors relative ${
                friendsView === tab.key
                  ? "bg-[var(--bg-surface)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Online / All Friends */}
        {(friendsView === "online" || friendsView === "all") && (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-3">
              {friendsView === "online" ? "Online" : "All Friends"} — {displayFriends.length}
            </p>
            {displayFriends.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                {friendsView === "online"
                  ? "No friends online right now"
                  : "No friends yet. Add some!"}
              </p>
            )}
            {displayFriends.map((friend) => (
              <FriendRow
                key={friend._id}
                user={friend}
                isOnline={onlineUsers.has(friend._id)}
                actions={
                  <>
                    <ActionIcon
                      icon={MessageCircle}
                      tooltip="Message"
                      onClick={() => handleStartDM(friend._id)}
                    />
                    <ActionIcon
                      icon={X}
                      tooltip="Remove"
                      onClick={() => handleRemove(friend._id)}
                      className="text-red-400"
                    />
                  </>
                }
              />
            ))}
          </div>
        )}

        {/* Pending Requests */}
        {friendsView === "pending" && (
          <div className="space-y-4">
            {friendRequests.incoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-2">
                  Incoming — {friendRequests.incoming.length}
                </p>
                <div className="space-y-1">
                  {friendRequests.incoming.map((user) => (
                    <FriendRow
                      key={user._id}
                      user={user}
                      subtitle="Incoming Friend Request"
                      actions={
                        <>
                          <ActionIcon
                            icon={Check}
                            tooltip="Accept"
                            onClick={() => handleAccept(user._id)}
                            className="text-emerald-400"
                          />
                          <ActionIcon
                            icon={X}
                            tooltip="Decline"
                            onClick={() => handleDecline(user._id)}
                            className="text-red-400"
                          />
                        </>
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {friendRequests.outgoing.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-2">
                  Outgoing — {friendRequests.outgoing.length}
                </p>
                <div className="space-y-1">
                  {friendRequests.outgoing.map((user) => (
                    <FriendRow
                      key={user._id}
                      user={user}
                      subtitle="Outgoing Friend Request"
                      actions={
                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Clock size={14} /> Pending
                        </div>
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {friendRequests.incoming.length === 0 &&
              friendRequests.outgoing.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">
                  No pending requests
                </p>
              )}
          </div>
        )}

        {/* Add Friend */}
        {friendsView === "add" && <AddFriendView />}
      </div>
    </div>
  );
}

// ─── Friend Row ──────────────────────────────────────────────────────────────
function FriendRow({ user, isOnline, subtitle, actions }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors group">
      <div className="relative shrink-0">
        <img
          src={user.profilePic}
          className="w-9 h-9 rounded-full object-cover"
        />
        {isOnline !== undefined && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-dark)] ${
              isOnline ? "bg-emerald-500" : "bg-gray-500"
            }`}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.username}</p>
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
        )}
        {isOnline !== undefined && !subtitle && (
          <p className="text-xs text-[var(--text-muted)]">
            {isOnline ? "Online" : "Offline"}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {actions}
      </div>
    </div>
  );
}

// ─── Action Icon Button ──────────────────────────────────────────────────────
function ActionIcon({ icon: Icon, onClick, tooltip, className = "" }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] ${className}`}
    >
      <Icon size={18} />
    </button>
  );
}

// ─── Add Friend View ─────────────────────────────────────────────────────────
function AddFriendView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [sent, setSent] = useState(new Set());
  const [message, setMessage] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const res = await apiClient.get(`${FRIEND_ROUTES}/search`, {
        params: { query: query.trim() },
      });
      setResults(res.data.data);
      setMessage("");
    } catch (_) {
      setResults([]);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await apiClient.post(`${FRIEND_ROUTES}/request/${userId}`);
      setSent((prev) => new Set([...prev, userId]));
      setMessage("Friend request sent!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send request");
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold mb-1">Add Friend</h3>
      <p className="text-xs text-[var(--text-muted)] mb-3">
        Search by username to send a friend request.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Enter a username..."
          className="flex-1 bg-[var(--bg-deepest)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--violet)]"
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim()}
          className="px-4 py-2 bg-[var(--violet)] hover:bg-[var(--violet-lite)] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          Search
        </button>
      </div>

      {message && (
        <p className="text-xs text-emerald-400 mb-3">{message}</p>
      )}

      <div className="space-y-1">
        {results.map((user) => (
          <FriendRow
            key={user._id}
            user={user}
            isOnline={user.status === "online"}
            actions={
              sent.has(user._id) ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <UserCheck size={14} /> Sent
                </span>
              ) : (
                <ActionIcon
                  icon={UserPlus}
                  tooltip="Send Request"
                  onClick={() => handleSendRequest(user._id)}
                  className="text-[var(--violet-lite)]"
                />
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

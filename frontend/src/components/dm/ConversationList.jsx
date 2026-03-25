import { useEffect } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { DM_ROUTES } from "@/utils/constants";

export default function ConversationList({ socket }) {
  const {
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    userInfo,
    onlineUsers,
  } = useAppStore();

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`${DM_ROUTES}/conversations`);
        setConversations(res.data.data);
      } catch (_) {}
    })();
  }, []);

  const handleSelect = (conv) => {
    if (socket && currentConversation) {
      socket.emit("leave-conversation", currentConversation._id);
    }
    setCurrentConversation(conv);
    if (socket) {
      socket.emit("join-conversation", conv._id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin">
      <p className="text-xs font-semibold uppercase text-[var(--text-muted)] px-2 mb-2">
        Direct Messages
      </p>

      {conversations.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] px-2 py-4 text-center">
          No conversations yet
        </p>
      )}

      {conversations.map((conv) => {
        const otherUsers = conv.participants?.filter(
          (p) => (p._id || p) !== userInfo?._id
        );
        const displayName =
          conv.type === "group_dm"
            ? conv.name || otherUsers.map((u) => u.username).join(", ")
            : otherUsers[0]?.username || "Unknown";
        const displayPic =
          conv.type === "dm" ? otherUsers[0]?.profilePic : conv.icon;
        const isOnline =
          conv.type === "dm" && otherUsers[0]
            ? onlineUsers.has(otherUsers[0]._id)
            : false;
        const isActive = currentConversation?._id === conv._id;

        return (
          <button
            key={conv._id}
            onClick={() => handleSelect(conv)}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors ${
              isActive
                ? "bg-[var(--bg-surface)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50"
            }`}
          >
            <div className="relative shrink-0">
              <img
                src={displayPic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                className="w-8 h-8 rounded-full object-cover"
              />
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[var(--bg-dark)]" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">{displayName}</p>
              {conv.lastMessage?.text && (
                <p className="text-xs truncate opacity-60">
                  {conv.lastMessage.text}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

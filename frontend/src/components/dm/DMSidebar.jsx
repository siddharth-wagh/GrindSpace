import { useAppStore } from "@/store";
import ConversationList from "./ConversationList";

export default function DMSidebar({ socket }) {
  const { userInfo } = useAppStore();

  return (
    <div className="w-60 min-w-[240px] bg-[var(--bg-dark)] flex flex-col h-full border-r border-[var(--border)]">
      {/* Header */}
      <div className="px-3 py-3 border-b border-[var(--border)]">
        <input
          placeholder="Find or start a conversation"
          className="w-full bg-[var(--bg-deepest)] border border-[var(--border)] rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--violet)] placeholder:text-[var(--text-muted)]/50"
        />
      </div>

      {/* Conversation List */}
      <ConversationList socket={socket} />

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
    </div>
  );
}

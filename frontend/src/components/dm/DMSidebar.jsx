import { useAppStore } from "@/store";
import ConversationList from "./ConversationList";
import { apiClient } from "@/lib/api-client";
import { LOGOUT_ROUTE } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function DMSidebar({ socket }) {
  const { userInfo, setUserInfo, setCurrentGroup } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await apiClient.post(LOGOUT_ROUTE, {}, { withCredentials: true }); } catch (_) {}
    setUserInfo(undefined);
    setCurrentGroup?.(null);
    navigate("/auth");
  };

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
        <button
          onClick={handleLogout}
          title="Logout"
          className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

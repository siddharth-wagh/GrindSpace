import { useAppStore } from "@/store";
import { Users, ListChecks, Trophy } from "lucide-react";
import MembersList from "./MemberSidebar";
import ProblemLedgerPanel from "./ProblemLedgerPanel";
import Leaderboard from "@/components/cp/Leaderboard";

export default function RightPanel() {
  const { showMemberSidebar, currentServer, rightPanelTab, setRightPanelTab } =
    useAppStore();

  if (!showMemberSidebar || !currentServer) return null;

  const tabClass = (name) =>
    rightPanelTab === name
      ? "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-white border-b-2 border-[var(--violet)]"
      : "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors";

  return (
    <div className="w-60 min-w-[240px] bg-[var(--bg-dark)] border-l border-[var(--border)] flex flex-col h-full">
      <div className="flex border-b border-[var(--border)]">
        <button onClick={() => setRightPanelTab("members")} className={tabClass("members")}>
          <Users size={14} /> Members
        </button>
        <button onClick={() => setRightPanelTab("problems")} className={tabClass("problems")}>
          <ListChecks size={14} /> Problems
        </button>
        <button onClick={() => setRightPanelTab("board")} className={tabClass("board")}>
          <Trophy size={14} /> Board
        </button>
      </div>

      {rightPanelTab === "members" && <MembersList />}
      {rightPanelTab === "problems" && <ProblemLedgerPanel />}
      {rightPanelTab === "board" && (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <Leaderboard serverId={currentServer._id} />
        </div>
      )}
    </div>
  );
}

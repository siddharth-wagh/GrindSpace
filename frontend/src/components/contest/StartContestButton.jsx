import { useState } from "react";
import { Trophy, Radio, CalendarClock } from "lucide-react";
import { useAppStore } from "@/store";
import AnnounceContestModal from "./AnnounceContestModal";

function StartContestButton({ channelId }) {
  const activeContest = useAppStore((state) => state.activeContest);
  const setActiveContest = useAppStore((state) => state.setActiveContest);
  const setRightPanelTab = useAppStore((state) => state.setRightPanelTab);
  const setShowMemberSidebar = useAppStore((state) => state.setShowMemberSidebar);
  const [modalOpen, setModalOpen] = useState(false);

  const status = activeContest ? activeContest.status : null;
  const isLive = status === "running";
  const isLobby = status === "lobby";

  function openBoard() {
    setShowMemberSidebar(true);
    setRightPanelTab("board");
  }

  function handleAnnounced(contest) {
    setActiveContest(contest);
    openBoard();
  }

  if (isLive) {
    return (
      <button
        onClick={openBoard}
        className="flex items-center gap-2 rounded-full border border-[var(--violet)] bg-[var(--violet)]/15 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--violet)]/25"
      >
        <Radio size={14} className="animate-pulse text-[var(--pink)]" />
        Contest live
      </button>
    );
  }

  if (isLobby) {
    return (
      <button
        onClick={openBoard}
        className="flex items-center gap-2 rounded-full border border-[var(--violet)] bg-[var(--violet)]/10 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--violet)]/20"
      >
        <CalendarClock size={14} className="text-[var(--violet-lite)]" />
        Contest scheduled
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 rounded-md bg-[var(--violet)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--violet-lite)]"
      >
        <Trophy size={15} />
        Start Contest
      </button>

      {modalOpen ? (
        <AnnounceContestModal
          channelId={channelId}
          onClose={() => setModalOpen(false)}
          onAnnounced={handleAnnounced}
        />
      ) : null}
    </>
  );
}

export default StartContestButton;

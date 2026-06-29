import { useState } from "react";
import { Trophy, Radio, ChevronDown } from "lucide-react";
import { useAppStore } from "@/store";
import VirtualContestModal from "./VirtualContestModal";
import ContestScoreboard from "./ContestScoreboard";

function StartContestButton({ channelId }) {
  const activeContest = useAppStore((state) => state.activeContest);
  const setActiveContest = useAppStore((state) => state.setActiveContest);
  const [modalOpen, setModalOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const isLive = activeContest && activeContest.status === "running";

  function handleStarted(contest) {
    setActiveContest(contest);
  }

  if (isLive) {
    return (
      <div className="relative">
        <button
          onClick={() => setPanelOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-[var(--violet)] bg-[var(--violet)]/15 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--violet)]/25"
        >
          <Radio size={14} className="animate-pulse text-[var(--pink)]" />
          Contest live
          <ChevronDown
            size={14}
            className={
              "text-[var(--text-muted)] transition-transform " +
              (panelOpen ? "rotate-180" : "")
            }
          />
        </button>

        {panelOpen ? (
          <div className="absolute right-0 z-40 mt-2 w-[32rem] max-w-[90vw]">
            <ContestScoreboard contestId={activeContest._id} />
          </div>
        ) : null}
      </div>
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
        <VirtualContestModal
          channelId={channelId}
          onClose={() => setModalOpen(false)}
          onStarted={handleStarted}
        />
      ) : null}
    </>
  );
}

export default StartContestButton;

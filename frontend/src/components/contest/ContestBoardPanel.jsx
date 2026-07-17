import { useEffect, useState } from "react";
import { Timer, Square, Loader2, ListChecks, ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { getEndContestRoute } from "@/utils/constants";
import CfHandleGate from "./CfHandleGate";
import ContestScoreboard from "./ContestScoreboard";
import UpsolvePanel from "./UpsolvePanel";
import { rankColor } from "@/utils/rankColor";

function formatRemaining(ms) {
  if (ms <= 0) return "00:00:00";
  let total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  total = total - hours * 3600;
  const mins = Math.floor(total / 60);
  const secs = total - mins * 60;
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return pad(hours) + ":" + pad(mins) + ":" + pad(secs);
}

// The live-contest control surface: countdown, scoreboard, end button, upsolve.
// Rendered in the right-panel "Board" tab while a contest is running.
function ContestBoardPanel() {
  const activeContest = useAppStore((state) => state.activeContest);
  const setActiveContest = useAppStore((state) => state.setActiveContest);
  const userInfo = useAppStore((state) => state.userInfo);

  const socket = useAppStore((state) => state.socket);

  const [now, setNow] = useState(Date.now());
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!activeContest) {
    return (
      <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
        No contest running.
      </div>
    );
  }

  const endMs = new Date(activeContest.endTime).getTime();
  const remaining = endMs - now;
  const isOver = remaining <= 0;

  const creatorId =
    activeContest.createdBy && activeContest.createdBy._id
      ? activeContest.createdBy._id
      : activeContest.createdBy;
  const isCreator =
    userInfo && creatorId && String(creatorId) === String(userInfo._id);

  async function handleEnd() {
    setEnding(true);
    try {
      await apiClient.post(getEndContestRoute(activeContest._id));
      setActiveContest(null);
    } catch (err) {
      setEnding(false);
    }
  }

  const problems = activeContest.problems || [];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
      {isOver ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2">
          <Timer size={13} className="text-[var(--text-muted)]" />
          <span className="text-xs font-semibold text-[var(--text-muted)]">Finished</span>
          <span className="truncate text-xs text-[var(--text-primary)]">{activeContest.name}</span>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer size={15} className="text-[var(--pink)]" />
              <span className="font-code text-lg font-bold text-[var(--text-primary)]">
                {formatRemaining(remaining)}
              </span>
            </div>
            <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
              remaining
            </span>
          </div>
          <div className="mt-1 truncate text-sm text-[var(--text-primary)]">
            {activeContest.name}
          </div>
        </div>
      )}

      <CfHandleGate />

      {problems.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            <ListChecks size={13} /> Problems ({problems.length})
          </h4>
          <div className="space-y-1.5">
            {problems.map((p) => {
              const url = "https://codeforces.com/contest/" + p.contestId + "/problem/" + p.index;
              return (
                <a
                  key={p.label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5 hover:border-[var(--violet)]"
                >
                  <span className="font-code text-xs font-bold text-[var(--violet-lite)] w-4 shrink-0">
                    {p.label}
                  </span>
                  <span className="flex-1 truncate text-sm text-[var(--text-primary)]">
                    {p.name || p.contestId + p.index}
                  </span>
                  {p.rating ? (
                    <span
                      className="shrink-0 font-code text-xs"
                      style={{ color: rankColor(p.rating) }}
                    >
                      {p.rating}
                    </span>
                  ) : null}
                  <ExternalLink size={12} className="shrink-0 text-[var(--text-muted)]" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      <ContestScoreboard contestId={activeContest._id} refreshKey={0} socket={socket} />

      {(isCreator || isOver) && (
        <button
          onClick={handleEnd}
          disabled={ending}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--pink)]/50 bg-[var(--pink)]/10 px-3 py-2 text-sm font-semibold text-[var(--pink)] hover:bg-[var(--pink)]/20 disabled:opacity-50"
        >
          {ending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Square size={14} />
          )}
          End contest
        </button>
      )}

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Upsolve
        </h4>
        <UpsolvePanel contestId={activeContest._id} />
      </div>
    </div>
  );
}

export default ContestBoardPanel;

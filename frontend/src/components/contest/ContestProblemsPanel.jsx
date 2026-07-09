import { ExternalLink, Trophy } from "lucide-react";
import { useAppStore } from "@/store";
import { rankColor } from "@/utils/rankColor";

function problemUrl(p) {
  return (
    "https://codeforces.com/contest/" + p.contestId + "/problem/" + p.index
  );
}

// The live contest's problem set — the thing you actually solve.
// Shown in the "Problems" right-panel tab while a contest is running.
function ContestProblemsPanel() {
  const activeContest = useAppStore((state) => state.activeContest);
  const problems = (activeContest && activeContest.problems) || [];

  return (
    <div className="flex h-full flex-col bg-[var(--bg-card)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-3">
        <Trophy size={14} className="text-[var(--violet-lite)]" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-primary)]">
          {activeContest ? activeContest.name : "Contest"}
        </span>
        <span className="ml-auto font-code text-[11px] text-[var(--text-muted)]">
          {problems.length} problems
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {problems.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            No problems in this contest.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {problems.map((p, i) => (
              <li key={p.contestId + "-" + p.index + "-" + i}>
                <a
                  href={problemUrl(p)}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 px-3 py-3 hover:bg-[var(--bg-surface)]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--bg-dark)] font-code text-sm font-bold text-[var(--violet-lite)]">
                    {p.label || String.fromCharCode(65 + i)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-[var(--text-primary)]">
                      {p.name || p.contestId + p.index}
                    </div>
                    <div className="flex items-center gap-2 font-code text-[11px] text-[var(--text-muted)]">
                      <span>
                        {p.contestId}
                        {p.index}
                      </span>
                      {p.rating ? (
                        <span style={{ color: rankColor(p.rating) }}>
                          {p.rating}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ExternalLink
                    size={15}
                    className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--violet-lite)]"
                  />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ContestProblemsPanel;

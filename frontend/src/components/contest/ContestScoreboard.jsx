import { useEffect, useState } from "react";
import { RefreshCw, Snowflake } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getContestScoreboardRoute } from "@/utils/constants";
import UpsolvePanel from "./UpsolvePanel";

function ContestScoreboard({ contestId }) {
  const [rows, setRows] = useState([]);
  const [problemLabels, setProblemLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadScoreboard() {
    setLoading(true);
    try {
      const resp = await apiClient.get(getContestScoreboardRoute(contestId));
      const fetched = resp.data.data || [];
      setRows(fetched);
      const labels = [];
      for (let i = 0; i < fetched.length; i++) {
        const perProblem = fetched[i].perProblem || [];
        for (let j = 0; j < perProblem.length; j++) {
          if (!labels.includes(perProblem[j].index)) {
            labels.push(perProblem[j].index);
          }
        }
      }
      setProblemLabels(labels);
    } catch (err) {
      setRows([]);
      setProblemLabels([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (contestId) loadScoreboard();
  }, [contestId]);

  function cellStyleFor(status) {
    if (status === "solved") {
      return "bg-green-500/20 text-green-400 border-green-500/40";
    }
    if (status === "attempted") {
      return "bg-red-500/15 text-red-400 border-red-500/40";
    }
    return "bg-[var(--bg-dark)] text-[var(--text-muted)] border-[var(--border)]";
  }

  function findCell(perProblem, label) {
    for (let i = 0; i < perProblem.length; i++) {
      if (perProblem[i].index === label) return perProblem[i];
    }
    return null;
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Scoreboard</h3>
        <button
          onClick={loadScoreboard}
          className="flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      <div className="mb-3 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <Snowflake size={12} className="text-[var(--violet-lite)]" />
        Scoreboard freezes in the last hour of the contest.
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton h-9 w-full rounded-md" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border)] px-3 py-8 text-center text-sm text-[var(--text-muted)]">
          No submissions on the board yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2 text-center">Solved</th>
                <th className="px-2 py-2 text-center">Penalty</th>
                {problemLabels.map((label) => (
                  <th key={label} className="px-2 py-2 text-center font-code">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={(row.user && row.user.username) || i}
                  className="border-t border-[var(--border)]"
                >
                  <td className="px-2 py-2 font-code text-[var(--text-muted)]">{i + 1}</td>
                  <td className="px-2 py-2 text-[var(--text-primary)]">
                    {row.user ? row.user.username : "unknown"}
                  </td>
                  <td className="px-2 py-2 text-center font-code font-bold text-[var(--violet-lite)]">
                    {row.solvedCount}
                  </td>
                  <td className="px-2 py-2 text-center font-code text-[var(--text-muted)]">
                    {row.penalty}
                  </td>
                  {problemLabels.map((label) => {
                    const found = findCell(row.perProblem || [], label);
                    const status = found ? found.status : "none";
                    const attempts = found ? found.attempts : 0;
                    return (
                      <td key={label} className="px-1 py-1 text-center">
                        <div
                          className={
                            "mx-auto flex h-8 w-10 flex-col items-center justify-center rounded border text-xs font-code " +
                            cellStyleFor(status)
                          }
                        >
                          {status === "solved" ? "+" : null}
                          {status === "attempted" ? "-" + attempts : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Upsolve
        </h4>
        <UpsolvePanel contestId={contestId} />
      </div>
    </div>
  );
}

export default ContestScoreboard;

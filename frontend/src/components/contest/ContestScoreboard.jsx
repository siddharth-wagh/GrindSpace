import { useEffect, useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getContestScoreboardRoute } from "@/utils/constants";

// ICPC-style standings table. Columns come from the contest's own problem
// set (always present, even before anyone submits); cells come from each
// participant's Codeforces submissions in the contest window.
//
// Auto-refreshes every 30s while mounted, and also refreshes instantly when
// the server pushes a "scoreboard-refresh" socket event (triggered by the
// CF poller detecting a new submission).
function ContestScoreboard({ contestId, refreshKey, socket }) {
  const [rows, setRows] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const loadScoreboard = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get(getContestScoreboardRoute(contestId));
      const payload = resp.data.data || {};
      if (mountedRef.current) {
        setRows(payload.rows || []);
        setProblems(payload.problems || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setRows([]);
        setProblems([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [contestId]);

  // Initial load + react to refreshKey changes
  useEffect(() => {
    mountedRef.current = true;
    if (contestId) loadScoreboard();
    return () => {
      mountedRef.current = false;
    };
  }, [contestId, refreshKey, loadScoreboard]);

  // Auto-poll every 30 seconds so the scoreboard stays reasonably fresh
  // even without socket events (e.g. if a user's cfPoller hasn't fired yet).
  useEffect(() => {
    if (!contestId) return;
    const id = setInterval(() => {
      loadScoreboard();
    }, 30_000);
    return () => clearInterval(id);
  }, [contestId, loadScoreboard]);

  // Listen for real-time scoreboard-refresh events from the server
  useEffect(() => {
    if (!socket || !contestId) return;
    const handleRefresh = () => {
      loadScoreboard();
    };
    socket.on("scoreboard-refresh", handleRefresh);
    return () => {
      socket.off("scoreboard-refresh", handleRefresh);
    };
  }, [socket, contestId, loadScoreboard]);

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
      if (perProblem[i].label === label) return perProblem[i];
    }
    return null;
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Scoreboard
        </h3>
        <button
          onClick={loadScoreboard}
          className="flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="skeleton h-8 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-1.5 py-2">#</th>
                <th className="px-1.5 py-2">User</th>
                <th className="px-1.5 py-2 text-center">Solved</th>
                <th className="px-1.5 py-2 text-center">Pen</th>
                {problems.map((p) => (
                  <th key={p.label} className="px-1 py-2 text-center font-code">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      title={p.name || ""}
                      className="hover:text-[var(--violet-lite)]"
                    >
                      {p.label}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + problems.length}
                    className="px-2 py-6 text-center text-xs text-[var(--text-muted)]"
                  >
                    No ranked players yet. Link a Codeforces handle and start
                    solving.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={(row.user && row.user.username) || i}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="px-1.5 py-2 font-code text-[var(--text-muted)]">
                      {i + 1}
                    </td>
                    <td className="px-1.5 py-2 text-[var(--text-primary)] truncate max-w-[90px]">
                      {row.user ? row.user.username : "unknown"}
                    </td>
                    <td className="px-1.5 py-2 text-center font-code font-bold text-[var(--violet-lite)]">
                      {row.solvedCount}
                    </td>
                    <td className="px-1.5 py-2 text-center font-code text-[var(--text-muted)]">
                      {row.penalty}
                    </td>
                    {problems.map((p) => {
                      const found = findCell(row.perProblem || [], p.label);
                      const status = found ? found.status : "none";
                      const attempts = found ? found.attempts : 0;
                      return (
                        <td key={p.label} className="px-0.5 py-1 text-center">
                          <div
                            className={
                              "mx-auto flex h-7 w-8 items-center justify-center rounded border text-xs font-code " +
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ContestScoreboard;

import { useEffect, useState } from "react";
import { Flame, Trophy } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getLeaderboardRoute } from "@/utils/constants";
import RankBadge from "@/components/cp/RankBadge";

function medalColor(rank) {
  if (rank === 1) return "#facc15";
  if (rank === 2) return "#cbd5e1";
  if (rank === 3) return "#d97706";
  return "";
}

export default function Leaderboard({ serverId }) {
  const [range, setRange] = useState("week");
  const [sortBy, setSortBy] = useState("score");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!serverId) return;
      setLoading(true);
      try {
        const res = await apiClient.get(getLeaderboardRoute(serverId) + "?range=" + range);
        const data = res.data.data || [];
        if (alive) setRows(data);
      } catch (err) {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [serverId, range]);

  const sorted = [...rows];
  sorted.sort((a, b) => {
    if (sortBy === "solved") return (b.solved || 0) - (a.solved || 0);
    if (sortBy === "streak") return (b.streak || 0) - (a.streak || 0);
    return (b.score || 0) - (a.score || 0);
  });

  let rangeTabs = [];
  rangeTabs.push({ key: "week", label: "This Week" });
  rangeTabs.push({ key: "month", label: "This Month" });
  rangeTabs.push({ key: "all", label: "All Time" });

  let sortTabs = [];
  sortTabs.push({ key: "score", label: "Score" });
  sortTabs.push({ key: "solved", label: "Solved" });
  sortTabs.push({ key: "streak", label: "Streak" });

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[var(--violet-lite)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Leaderboard</span>
        </div>
        <div className="flex gap-1 text-xs">
          {rangeTabs.map((tab) => {
            let cls = "px-2.5 py-1 rounded font-code transition-colors ";
            if (range === tab.key) {
              cls += "bg-[var(--violet)] text-white";
            } else {
              cls += "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]";
            }
            return (
              <button key={tab.key} className={cls} onClick={() => setRange(tab.key)}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3 text-[11px]">
        <span className="text-[var(--text-muted)] mr-1">Sort by</span>
        {sortTabs.map((tab) => {
          let cls = "px-2 py-0.5 rounded font-code transition-colors ";
          if (sortBy === tab.key) {
            cls += "bg-[var(--bg-surface)] text-[var(--violet-lite)] border border-[var(--violet)]";
          } else {
            cls += "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent";
          }
          return (
            <button key={tab.key} className={cls} onClick={() => setSortBy(tab.key)}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-10 w-full rounded" />
          <div className="skeleton h-10 w-full rounded" />
          <div className="skeleton h-10 w-full rounded" />
          <div className="skeleton h-10 w-full rounded" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--text-muted)]">
          No one on the board yet. Go solve something.
        </div>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((row, i) => {
            const rank = i + 1;
            const medal = medalColor(rank);
            const name = row.username || row.handle || "anon";
            return (
              <div
                key={row.userId || row._id || name + i}
                className="flex items-center gap-3 px-3 py-2 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-dark)] transition-colors"
              >
                <div className="w-6 flex items-center justify-center">
                  {medal ? (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                      style={{ backgroundColor: medal }}
                    >
                      {rank}
                    </span>
                  ) : (
                    <span className="text-xs font-code text-[var(--text-muted)]">{rank}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {row.profilePic ? (
                    <img
                      src={row.profilePic}
                      alt={name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[var(--bg-dark)] flex items-center justify-center text-xs text-[var(--text-muted)]">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-[var(--text-primary)] truncate">{name}</span>
                  <RankBadge rating={row.cfRating} rank={row.cfRank} />
                </div>

                <div className="flex items-center gap-4 text-xs font-code">
                  <div className="text-center w-12">
                    <div className="text-[var(--text-primary)]">{row.solved || 0}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">solved</div>
                  </div>
                  <div className="text-center w-14">
                    <div className="text-[var(--violet-lite)]">{row.score || 0}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">score</div>
                  </div>
                  <div className="flex items-center gap-1 w-12 justify-end text-[var(--pink)]">
                    <Flame size={13} />
                    <span>{row.streak || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

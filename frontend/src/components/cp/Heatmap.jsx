import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { getHeatmapRoute } from "@/utils/constants";

function formatDate(d) {
  const year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  if (month < 10) month = "0" + month;
  if (day < 10) day = "0" + day;
  return year + "-" + month + "-" + day;
}

function squareColor(count) {
  if (!count || count <= 0) return "rgba(124, 58, 237, 0.07)";
  if (count === 1) return "rgba(124, 58, 237, 0.28)";
  if (count === 2) return "rgba(124, 58, 237, 0.45)";
  if (count <= 4) return "rgba(124, 58, 237, 0.65)";
  if (count <= 6) return "rgba(124, 58, 237, 0.82)";
  return "rgba(139, 92, 246, 1)";
}

export default function Heatmap({ userId }) {
  const [dayInfo, setDayInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await apiClient.get(getHeatmapRoute(userId));
        const rows = res.data.data || [];
        const built = {};
        for (let i = 0; i < rows.length; i++) {
          const one = rows[i];
          built[one.date] = { count: one.count || 0, ratingSum: one.ratingSum || 0 };
        }
        if (alive) setDayInfo(built);
      } catch (err) {
        if (alive) setDayInfo({});
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [userId]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = 365;
  const allDays = [];
  for (let back = totalDays - 1; back >= 0; back--) {
    const d = new Date(today);
    d.setDate(today.getDate() - back);
    allDays.push(d);
  }

  const startWeekday = allDays[0].getDay();
  const cells = [];
  for (let pad = 0; pad < startWeekday; pad++) {
    cells.push(null);
  }
  for (let i = 0; i < allDays.length; i++) {
    cells.push(allDays[i]);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  let totalSolved = 0;
  for (const key in dayInfo) {
    totalSolved += dayInfo[key].count;
  }

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
        <div className="skeleton h-4 w-40 mb-4 rounded" />
        <div className="skeleton h-28 w-full rounded" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          Activity
        </span>
        <span className="text-xs font-code text-[var(--text-muted)]">
          {totalSolved} solved in the last year
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => {
                if (!day) {
                  return (
                    <div
                      key={di}
                      className="w-[11px] h-[11px] rounded-sm"
                      style={{ backgroundColor: "transparent" }}
                    />
                  );
                }
                const key = formatDate(day);
                const info = dayInfo[key] || { count: 0, ratingSum: 0 };
                const title =
                  info.count +
                  " solved, rating sum " +
                  info.ratingSum +
                  " on " +
                  key;
                return (
                  <div
                    key={di}
                    title={title}
                    className="w-[11px] h-[11px] rounded-sm transition-colors hover:ring-1 hover:ring-[var(--violet-lite)]"
                    style={{ backgroundColor: squareColor(info.count) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-[var(--text-muted)] font-code">
        <span>less</span>
        <div className="w-[11px] h-[11px] rounded-sm" style={{ backgroundColor: squareColor(0) }} />
        <div className="w-[11px] h-[11px] rounded-sm" style={{ backgroundColor: squareColor(1) }} />
        <div className="w-[11px] h-[11px] rounded-sm" style={{ backgroundColor: squareColor(3) }} />
        <div className="w-[11px] h-[11px] rounded-sm" style={{ backgroundColor: squareColor(5) }} />
        <div className="w-[11px] h-[11px] rounded-sm" style={{ backgroundColor: squareColor(8) }} />
        <span>more</span>
      </div>
    </div>
  );
}

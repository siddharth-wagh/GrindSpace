import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getStreakRoute } from "@/utils/constants";

export default function Streaks({ userId, current, best }) {
  const [currentStreak, setCurrentStreak] = useState(
    current === undefined || current === null ? null : current
  );
  const [bestStreak, setBestStreak] = useState(
    best === undefined || best === null ? null : best
  );

  useEffect(() => {
    let alive = true;
    async function load() {
      const needFetch =
        current === undefined || current === null || best === undefined || best === null;
      if (!needFetch) {
        setCurrentStreak(current);
        setBestStreak(best);
        return;
      }
      if (!userId) return;
      try {
        const res = await apiClient.get(getStreakRoute(userId));
        const data = res.data.data || {};
        if (alive) {
          setCurrentStreak(data.current || 0);
          setBestStreak(data.best || 0);
        }
      } catch (err) {
        if (alive) {
          setCurrentStreak(0);
          setBestStreak(0);
        }
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [userId, current, best]);

  const showCurrent = currentStreak === null ? "-" : currentStreak;
  const showBest = bestStreak === null ? "-" : bestStreak;
  const isHot = currentStreak && currentStreak > 0;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 flex items-center gap-4">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
        style={{
          backgroundColor: isHot ? "rgba(236, 72, 153, 0.15)" : "rgba(124, 58, 237, 0.1)",
        }}
      >
        <Flame
          size={30}
          className={isHot ? "text-[var(--pink)]" : "text-[var(--text-muted)]"}
        />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-code text-[var(--text-primary)]">
            {showCurrent}
          </span>
          <span className="text-sm text-[var(--text-muted)]">day streak</span>
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">
          Best: <span className="text-[var(--violet-lite)] font-code">{showBest}</span> days
        </div>
      </div>
    </div>
  );
}

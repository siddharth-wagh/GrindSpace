import { useState, useEffect } from "react";
import { Trophy, Target, Activity } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getCpDashboardRoute } from "@/utils/constants";
import { rankColor, rankName } from "@/utils/rankColor";
import RankBadge from "@/components/cp/RankBadge";
import Heatmap from "@/components/cp/Heatmap";
import Streaks from "@/components/cp/Streaks";

function CpDashboardContent({ userId }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      return;
    }
    let active = true;
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(getCpDashboardRoute(userId), {
          withCredentials: true,
        });
        if (active && response.status === 200 && response.data) {
          let payload = response.data.data;
          if (!payload) {
            payload = response.data;
          }
          setDashboard(payload);
        }
      } catch {
        if (active) {
          setDashboard(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadDashboard();
    return () => {
      active = false;
    };
  }, [userId]);

  let maxBucketCount = 1;
  if (dashboard && dashboard.ratingBuckets) {
    for (let i = 0; i < dashboard.ratingBuckets.length; i++) {
      if (dashboard.ratingBuckets[i].count > maxBucketCount) {
        maxBucketCount = dashboard.ratingBuckets[i].count;
      }
    }
  }

  let maxTagCount = 1;
  if (dashboard && dashboard.tagCounts) {
    for (let i = 0; i < dashboard.tagCounts.length; i++) {
      if (dashboard.tagCounts[i].count > maxTagCount) {
        maxTagCount = dashboard.tagCounts[i].count;
      }
    }
  }

  let topTags = [];
  if (dashboard && dashboard.tagCounts) {
    topTags = dashboard.tagCounts.slice(0, 12);
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!dashboard) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-10 text-center">
        <p className="text-[var(--text-muted)] text-sm">
          No dashboard data available for this handle.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <HeaderCard dashboard={dashboard} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RatingHistogram
          buckets={dashboard.ratingBuckets || []}
          maxCount={maxBucketCount}
        />
        <TagDistribution tags={topTags} maxCount={maxTagCount} />
      </div>

      <WeakestTags tags={dashboard.weakestTags || []} />

      <RecentContests contests={dashboard.recentContests || []} />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <SectionTitle icon={<Activity className="w-4 h-4" />} text="Activity Heatmap" />
        <div className="mt-4">
          <Heatmap userId={userId} />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <SectionTitle icon={<Trophy className="w-4 h-4" />} text="Streaks" />
        <div className="mt-4">
          <Streaks userId={userId} />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--violet-lite)]">{icon}</span>
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
        {text}
      </h2>
    </div>
  );
}

function HeaderCard({ dashboard }) {
  const peakColor = rankColor(dashboard.maxRating);
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div
        className="h-1.5 w-full"
        style={{ background: "linear-gradient(90deg, var(--violet), var(--pink))" }}
      />
      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Codeforces
          </span>
          <span
            className="font-code text-2xl font-bold"
            style={{ color: rankColor(dashboard.rating) }}
          >
            {dashboard.handle || "—"}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {rankName(dashboard.rating)}
            {dashboard.rank ? ` · ${dashboard.rank}` : ""}
          </span>
          <div className="mt-1">
            <RankBadge rating={dashboard.rating} rank={dashboard.rank} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatTile
            label="Rating"
            value={dashboard.rating || 0}
            color={rankColor(dashboard.rating)}
          />
          <StatTile label="Peak" value={dashboard.maxRating || 0} color={peakColor} />
          <StatTile
            label="Solved"
            value={dashboard.totalSolved || 0}
            color="var(--violet-lite)"
          />
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, color }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-center min-w-[84px]">
      <div className="font-code text-xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-1">
        {label}
      </div>
    </div>
  );
}

function RatingHistogram({ buckets, maxCount }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <SectionTitle icon={<Target className="w-4 h-4" />} text="Rating Distribution" />
      {buckets.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] mt-4">No solved problems yet.</p>
      ) : (
        <div className="mt-6 flex items-end gap-2 h-44">
          {buckets.map((item, idx) => {
            let heightPercent = 0;
            if (maxCount > 0) {
              heightPercent = (item.count / maxCount) * 100;
            }
            if (item.count > 0 && heightPercent < 6) {
              heightPercent = 6;
            }
            const barColor = rankColor(item.bucket);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-[10px] font-code text-[var(--text-muted)] mb-1">
                  {item.count}
                </span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${heightPercent}%`,
                    background: barColor,
                    minHeight: item.count > 0 ? "4px" : "0px",
                  }}
                  title={`${item.bucket}: ${item.count}`}
                />
                <span className="text-[9px] font-code text-[var(--text-muted)] mt-2">
                  {item.bucket}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TagDistribution({ tags, maxCount }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <SectionTitle icon={<Activity className="w-4 h-4" />} text="Tag Distribution" />
      {tags.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] mt-4">No tag data yet.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {tags.map((item, idx) => {
            let widthPercent = 0;
            if (maxCount > 0) {
              widthPercent = (item.count / maxCount) * 100;
            }
            return (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-28 truncate text-xs font-code text-[var(--text-muted)]">
                  {item.tag}
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${widthPercent}%`,
                      background: "linear-gradient(90deg, var(--violet), var(--pink))",
                    }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-code text-[var(--text-primary)]">
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WeakestTags({ tags }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <SectionTitle icon={<Target className="w-4 h-4" />} text="Weakest Tags" />
      {tags.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] mt-4">
          Not enough data to spot weak areas yet.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag, idx) => {
            let label = tag;
            if (tag && typeof tag === "object") {
              label = tag.tag || tag.name || "";
            }
            return (
              <span
                key={idx}
                className="font-code text-xs px-3 py-1.5 rounded-full border"
                style={{
                  borderColor: "var(--pink)",
                  color: "var(--pink)",
                  background: "rgba(37,99,235,0.08)",
                }}
              >
                {label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecentContests({ contests }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <SectionTitle icon={<Trophy className="w-4 h-4" />} text="Recent Contests" />
      {contests.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] mt-4">No rated contests yet.</p>
      ) : (
        <div className="mt-4 flex flex-col divide-y divide-[var(--border)]">
          {contests.map((contest, idx) => {
            const delta = (contest.newRating || 0) - (contest.oldRating || 0);
            let deltaColor = "var(--text-muted)";
            let deltaText = "0";
            if (delta > 0) {
              deltaColor = "#22c55e";
              deltaText = `+${delta}`;
            } else if (delta < 0) {
              deltaColor = "#ef4444";
              deltaText = `${delta}`;
            }
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="flex-1 truncate text-sm text-[var(--text-primary)]">
                  {contest.name}
                </span>
                <span className="font-code text-xs text-[var(--text-muted)] w-20 text-right">
                  rank {contest.rank}
                </span>
                <span
                  className="font-code text-sm font-bold w-16 text-right"
                  style={{ color: deltaColor }}
                >
                  {deltaText}
                </span>
                <span
                  className="font-code text-sm w-12 text-right"
                  style={{ color: rankColor(contest.newRating) }}
                >
                  {contest.newRating}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton h-32 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-60 rounded-2xl" />
        <div className="skeleton h-60 rounded-2xl" />
      </div>
      <div className="skeleton h-24 rounded-2xl" />
      <div className="skeleton h-40 rounded-2xl" />
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  );
}

export default CpDashboardContent;

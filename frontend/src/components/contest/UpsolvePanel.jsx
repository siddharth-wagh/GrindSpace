import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Sparkles, ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getUpsolveRoute } from "@/utils/constants";
import { rankColor } from "@/utils/rankColor";

function UpsolvePanel({ contestId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadUpsolve() {
    setLoading(true);
    try {
      const resp = await apiClient.get(getUpsolveRoute(contestId));
      setItems(resp.data.data || []);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (contestId) loadUpsolve();
  }, [contestId]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={15} className="text-[var(--pink)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Upsolve queue</h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((n) => (
            <div key={n} className="skeleton h-10 w-full rounded-md" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border)] px-3 py-8 text-center text-sm text-[var(--text-muted)]">
          Nothing left to upsolve. You crushed this set.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((problem, i) => (
            <div
              key={problem.contestId + "-" + problem.index + "-" + i}
              className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2"
            >
              <div className="flex items-center gap-3">
                {problem.done ? (
                  <CheckCircle2 size={18} className="text-green-400" />
                ) : (
                  <Circle size={18} className="text-[var(--text-muted)]" />
                )}
                <div>
                  <div className="text-sm text-[var(--text-primary)]">{problem.name}</div>
                  {problem.rating ? (
                    <div
                      className="font-code text-xs"
                      style={{ color: rankColor(problem.rating) }}
                    >
                      {problem.rating}
                    </div>
                  ) : null}
                </div>
              </div>
              {problem.url ? (
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--violet-lite)]"
                >
                  <ExternalLink size={15} />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UpsolvePanel;

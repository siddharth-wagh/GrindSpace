import { useState, useEffect } from "react";
import { ExternalLink, Check, Tag } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { UNFURL_ROUTE, MARK_SOLVED_ROUTE, MY_SOLVES_ROUTE } from "@/utils/constants";
import { rankColor } from "@/utils/rankColor";

function ProblemCard({ contestId, index, meta }) {
  const [problemMeta, setProblemMeta] = useState(meta ? meta : null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(
    function () {
      let alive = true;
      if (!meta) {
        async function fetchMeta() {
          try {
            const res = await apiClient.post(UNFURL_ROUTE, { contestId, index });
            if (alive) {
              setProblemMeta(res.data.data);
            }
          } catch (err) {
            if (alive) {
              setLoadFailed(true);
            }
          }
        }
        fetchMeta();
      }
      return function () {
        alive = false;
      };
    },
    [contestId, index, meta]
  );

  useEffect(function () {
    let alive = true;
    async function loadSolves() {
      try {
        const res = await apiClient.get(MY_SOLVES_ROUTE);
        const list = res.data.data;
        if (alive && Array.isArray(list)) {
          let found = false;
          let i = 0;
          while (i < list.length) {
            const one = list[i];
            if (String(one.contestId) === String(contestId) && one.index === index) {
              found = true;
            }
            i = i + 1;
          }
          if (found) {
            setSolved(true);
          }
        }
      } catch (err) {
        return;
      }
    }
    loadSolves();
    return function () {
      alive = false;
    };
  }, [contestId, index]);

  async function markSolved() {
    if (solved || marking || !problemMeta) {
      return;
    }
    setMarking(true);
    try {
      await apiClient.post(MARK_SOLVED_ROUTE, {
        contestId: contestId,
        index: index,
        name: problemMeta.name,
        rating: problemMeta.rating,
        tags: problemMeta.tags,
      });
      setSolved(true);
    } catch (err) {
      setMarking(false);
      return;
    }
    setMarking(false);
  }

  function reveal() {
    setRevealed(true);
  }

  const problemUrl = "https://codeforces.com/contest/" + contestId + "/problem/" + index;

  if (loadFailed && !problemMeta) {
    return (
      <a
        href={problemUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-code text-[var(--violet-lite)] hover:underline"
      >
        <ExternalLink size={12} />
        {contestId}
        {index}
      </a>
    );
  }

  const name = problemMeta ? problemMeta.name : null;
  const rating = problemMeta ? problemMeta.rating : null;
  const tags = problemMeta && Array.isArray(problemMeta.tags) ? problemMeta.tags : [];
  const solvedCount = problemMeta ? problemMeta.solvedCount : null;

  return (
    <div className="my-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-3 max-w-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-code text-[var(--text-muted)]">
            {contestId}
            {index}
          </div>
          <div className="text-sm font-medium text-[var(--text-primary)] truncate">
            {name ? name : <span className="skeleton inline-block w-32 h-4 rounded" />}
          </div>
        </div>
        <a
          href={problemUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-[var(--text-muted)] hover:text-[var(--violet-lite)]"
        >
          <ExternalLink size={15} />
        </a>
      </div>

      <div
        onClick={reveal}
        onMouseEnter={reveal}
        className={
          "mt-2 flex flex-wrap items-center gap-1.5 cursor-pointer " +
          (revealed ? "" : "blur-sm")
        }
      >
        {rating ? (
          <span
            className="text-xs font-code px-1.5 py-0.5 rounded"
            style={{ color: rankColor(rating), borderColor: rankColor(rating), borderWidth: "1px" }}
          >
            {rating}
          </span>
        ) : null}
        {solvedCount !== null && solvedCount !== undefined ? (
          <span className="text-xs font-code text-[var(--text-muted)]">
            x{solvedCount}
          </span>
        ) : null}
        {tags.map(function (t, idx) {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)]"
            >
              <Tag size={10} />
              {t}
            </span>
          );
        })}
      </div>

      <div className="mt-2">
        <button
          onClick={markSolved}
          disabled={solved || marking}
          className={
            "flex items-center gap-1 text-xs px-2 py-1 rounded border " +
            (solved
              ? "border-green-600 text-green-400"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--violet)] hover:text-[var(--text-primary)]")
          }
        >
          <Check size={13} />
          {solved ? "Solved" : "Mark solved"}
        </button>
      </div>
    </div>
  );
}

export default ProblemCard;

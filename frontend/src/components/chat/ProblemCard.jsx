import { useState, useEffect } from "react";
import { ExternalLink, Check, Tag, Bookmark, BookmarkCheck, Eye, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { UNFURL_ROUTE, MY_SOLVES_ROUTE, REFRESH_MY_SOLVES_ROUTE, ADD_BOOKMARK_ROUTE, getRemoveBookmarkRoute } from "@/utils/constants";
import { rankColor } from "@/utils/rankColor";
import { useAppStore } from "@/store";
import { toast } from "sonner";

function ProblemCard({ contestId, index, meta, messageId, channelId, serverId }) {
  const [problemMeta, setProblemMeta] = useState(meta ? meta : null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [checkingSolve, setCheckingSolve] = useState(false);

  function applySolveList(list) {
    if (!Array.isArray(list)) return;
    let found = false;
    for (let i = 0; i < list.length; i++) {
      const one = list[i];
      if (String(one.contestId) === String(contestId) && one.index === index) {
        found = true;
      }
    }
    if (found) setSolved(true);
  }

  async function reloadSolveStatus() {
    if (checkingSolve) return;
    setCheckingSolve(true);
    try {
      const res = await apiClient.post(REFRESH_MY_SOLVES_ROUTE);
      applySolveList(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not check submissions");
    }
    setCheckingSolve(false);
  }

  const bookmarkedKeys = useAppStore((s) => s.bookmarkedKeys);
  const addBookmarkedKey = useAppStore((s) => s.addBookmarkedKey);
  const removeBookmarkedKey = useAppStore((s) => s.removeBookmarkedKey);
  const bookmarkKey = `${contestId}-${index}`;
  const bookmarked = bookmarkedKeys ? bookmarkedKeys.has(bookmarkKey) : false;

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
        if (alive) applySolveList(res.data.data);
      } catch (err) {
        return;
      }
    }
    loadSolves();
    return function () {
      alive = false;
    };
  }, [contestId, index]);

  function reveal() {
    setRevealed(true);
  }

  async function toggleBookmark() {
    if (bookmarking || !problemMeta) return;
    setBookmarking(true);
    try {
      if (bookmarked) {
        await apiClient.delete(getRemoveBookmarkRoute(contestId, index));
        removeBookmarkedKey(bookmarkKey);
        toast.success("Removed from your list");
      } else {
        await apiClient.post(ADD_BOOKMARK_ROUTE, {
          contestId,
          index,
          name: problemMeta.name,
          rating: problemMeta.rating,
          tags: problemMeta.tags,
          url: problemUrl,
          sourceMessageId: messageId || null,
          channel: channelId || null,
          server: serverId || null,
        });
        addBookmarkedKey(bookmarkKey);
        toast.success("Added to your list");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update your list");
    }
    setBookmarking(false);
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
        <div className={"flex-1 min-w-0 " + (revealed ? "" : "blur-sm")}>
          <div className="text-xs font-code text-[var(--text-muted)]">
            {contestId}
            {index}
          </div>
          <div className="text-sm font-medium text-[var(--text-primary)] truncate">
            {name ? name : <span className="skeleton inline-block w-32 h-4 rounded" />}
          </div>
        </div>
        {!revealed ? (
          <button
            onClick={reveal}
            className="shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--violet)] text-[var(--violet-lite)] hover:bg-[var(--violet)]/10"
          >
            <Eye size={13} />
            Show
          </button>
        ) : null}
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
        className={
          "mt-2 flex flex-wrap items-center gap-1.5 " +
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

      <div className="mt-2 flex items-center gap-2">
        <span
          className={
            "flex items-center gap-1 text-xs px-2 py-1 rounded border " +
            (solved
              ? "border-green-600 text-green-400"
              : "border-[var(--border)] text-[var(--text-muted)]")
          }
        >
          <Check size={13} />
          {solved ? "Solved" : "Not solved yet"}
        </span>
        {!solved ? (
          <button
            onClick={reloadSolveStatus}
            disabled={checkingSolve}
            title="Re-check Codeforces submissions now"
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--violet)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <RefreshCw size={13} className={checkingSolve ? "animate-spin" : ""} />
          </button>
        ) : null}
        <button
          onClick={toggleBookmark}
          disabled={bookmarking || !problemMeta}
          className={
            "flex items-center gap-1 text-xs px-2 py-1 rounded border " +
            (bookmarked
              ? "border-[var(--violet)] text-[var(--violet-lite)]"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--violet)] hover:text-[var(--text-primary)]")
          }
        >
          {bookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          {bookmarked ? "Saved" : "Add to my list"}
        </button>
      </div>
    </div>
  );
}

export default ProblemCard;

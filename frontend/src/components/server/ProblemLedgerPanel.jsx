import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { getLedgerRoute, getSquadLedgerRoute } from "@/utils/constants";
import { rankColor } from "@/utils/rankColor";
import { FileDown, FileText, Search, Inbox, Filter, X } from "lucide-react";

function relativeTime(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  const now = Date.now();
  let diff = Math.floor((now - then) / 1000);
  if (diff < 0) diff = 0;
  if (diff < 60) return diff + "s ago";
  const mins = Math.floor(diff / 60);
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 30) return days + "d ago";
  const months = Math.floor(days / 30);
  if (months < 12) return months + "mo ago";
  const years = Math.floor(months / 12);
  return years + "y ago";
}

function triggerDownload(fileName, fileText, mimeType) {
  const blob = new Blob([fileText], { type: mimeType });
  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export default function ProblemLedgerPanel() {
  const currentChannel = useAppStore((state) => state.currentChannel);
  const currentServer = useAppStore((state) => state.currentServer);
  const ledgerTick = useAppStore((state) => state.ledgerTick);

  const [activeTab, setActiveTab] = useState("room");
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [minRating, setMinRating] = useState("");
  const [maxRating, setMaxRating] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [solvedMode, setSolvedMode] = useState("all");
  const [pastedByFilter, setPastedByFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function loadLedger() {
      if (activeTab === "room" && !currentChannel) {
        setProblems([]);
        return;
      }
      if (activeTab === "squad" && !currentServer) {
        setProblems([]);
        return;
      }
      setLoading(true);
      setLoadError("");
      try {
        let route = "";
        if (activeTab === "room") {
          route = getLedgerRoute(currentChannel._id);
        } else {
          route = getSquadLedgerRoute(currentServer._id);
        }
        const response = await apiClient.get(route);
        let list = [];
        if (response.data && Array.isArray(response.data.data)) {
          list = response.data.data;
        } else if (Array.isArray(response.data)) {
          list = response.data;
        }
        if (!cancelled) {
          setProblems(list);
        }
      } catch (err) {
        if (!cancelled) {
          setProblems([]);
          setLoadError("Could not load the ledger.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLedger();
    return () => {
      cancelled = true;
    };
  }, [activeTab, currentChannel, currentServer, ledgerTick]);

  function toggleTag(tag) {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter((item) => item !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
  }

  function clearFilters() {
    setMinRating("");
    setMaxRating("");
    setActiveTags([]);
    setSolvedMode("all");
    setPastedByFilter("all");
  }

  const allTags = [];
  for (let i = 0; i < problems.length; i++) {
    const tags = problems[i].tags || [];
    for (let j = 0; j < tags.length; j++) {
      if (!allTags.includes(tags[j])) {
        allTags.push(tags[j]);
      }
    }
  }
  allTags.sort();

  const allPasters = [];
  for (let i = 0; i < problems.length; i++) {
    const who = problems[i].firstSeenBy && problems[i].firstSeenBy.username;
    if (who && !allPasters.includes(who)) {
      allPasters.push(who);
    }
  }
  allPasters.sort();

  const filtered = [];
  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    const rating = problem.rating || 0;

    if (minRating !== "" && rating < Number(minRating)) {
      continue;
    }
    if (maxRating !== "" && rating > Number(maxRating)) {
      continue;
    }

    if (activeTags.length > 0) {
      const tags = problem.tags || [];
      let hasAll = true;
      for (let j = 0; j < activeTags.length; j++) {
        if (!tags.includes(activeTags[j])) {
          hasAll = false;
        }
      }
      if (!hasAll) {
        continue;
      }
    }

    const solvedByCount = problem.solvedByCount || 0;
    if (solvedMode === "solved" && solvedByCount === 0) {
      continue;
    }
    if (solvedMode === "unsolved" && solvedByCount !== 0) {
      continue;
    }

    if (pastedByFilter !== "all") {
      const who = problem.firstSeenBy && problem.firstSeenBy.username;
      if (who !== pastedByFilter) {
        continue;
      }
    }

    filtered.push(problem);
  }

  function exportMarkdown() {
    let text = "# Problem Ledger\n\n";
    text += "| Problem | Rating | Tags | Pasted By | Solved |\n";
    text += "| --- | --- | --- | --- | --- |\n";
    for (let i = 0; i < filtered.length; i++) {
      const problem = filtered[i];
      const code = problem.contestId + problem.index;
      const name = problem.name || "";
      const rating = problem.rating || "";
      const tags = (problem.tags || []).join(", ");
      const who = (problem.firstSeenBy && problem.firstSeenBy.username) || "";
      const solved = (problem.solvedByCount || 0) + "/" + (problem.squadSize || 0);
      const link = problem.url || "";
      const nameCell = link ? "[" + code + " " + name + "](" + link + ")" : code + " " + name;
      text += "| " + nameCell + " | " + rating + " | " + tags + " | " + who + " | " + solved + " |\n";
    }
    triggerDownload("problem-ledger.md", text, "text/markdown");
  }

  function exportCsv() {
    let text = "code,name,rating,tags,pastedBy,solved,squadSize,url\n";
    for (let i = 0; i < filtered.length; i++) {
      const problem = filtered[i];
      const code = problem.contestId + problem.index;
      const name = (problem.name || "").split('"').join('""');
      const rating = problem.rating || "";
      const tags = (problem.tags || []).join("; ").split('"').join('""');
      const who = ((problem.firstSeenBy && problem.firstSeenBy.username) || "").split('"').join('""');
      const solved = problem.solvedByCount || 0;
      const squadSize = problem.squadSize || 0;
      const link = (problem.url || "").split('"').join('""');
      text += '"' + code + '","' + name + '","' + rating + '","' + tags + '","' + who + '","' + solved + '","' + squadSize + '","' + link + '"\n';
    }
    triggerDownload("problem-ledger.csv", text, "text/csv");
  }

  function openRow(problem) {
    if (problem.url) {
      window.open(problem.url, "_blank", "noopener,noreferrer");
    }
  }

  const hasActiveFilters =
    minRating !== "" ||
    maxRating !== "" ||
    activeTags.length > 0 ||
    solvedMode !== "all" ||
    pastedByFilter !== "all";

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] border-l border-[var(--border)]">
      <div className="flex items-center gap-1 px-3 pt-3">
        <button
          onClick={() => setActiveTab("room")}
          className={
            "px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors " +
            (activeTab === "room"
              ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border-b-2 border-[var(--violet)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")
          }
        >
          This Room
        </button>
        <button
          onClick={() => setActiveTab("squad")}
          className={
            "px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors " +
            (activeTab === "squad"
              ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border-b-2 border-[var(--violet)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")
          }
        >
          Squad
        </button>
      </div>

      <div className="px-3 py-3 border-y border-[var(--border)] bg-[var(--bg-dark)] space-y-3">
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-[var(--violet-lite)]" />
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
            Filters
          </span>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--pink)]"
            >
              <X size={12} /> clear
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minRating}
            onChange={(event) => setMinRating(event.target.value)}
            placeholder="min"
            className="w-20 px-2 py-1 text-xs rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] font-code focus:outline-none focus:border-[var(--violet)]"
          />
          <span className="text-[var(--text-muted)] text-xs">to</span>
          <input
            type="number"
            value={maxRating}
            onChange={(event) => setMaxRating(event.target.value)}
            placeholder="max"
            className="w-20 px-2 py-1 text-xs rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] font-code focus:outline-none focus:border-[var(--violet)]"
          />
          <span className="text-[11px] text-[var(--text-muted)]">rating</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSolvedMode("all")}
            className={
              "px-2 py-1 text-[11px] rounded transition-colors " +
              (solvedMode === "all"
                ? "bg-[var(--violet)] text-white"
                : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)]")
            }
          >
            All
          </button>
          <button
            onClick={() => setSolvedMode("solved")}
            className={
              "px-2 py-1 text-[11px] rounded transition-colors " +
              (solvedMode === "solved"
                ? "bg-[var(--violet)] text-white"
                : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)]")
            }
          >
            Solved
          </button>
          <button
            onClick={() => setSolvedMode("unsolved")}
            className={
              "px-2 py-1 text-[11px] rounded transition-colors " +
              (solvedMode === "unsolved"
                ? "bg-[var(--violet)] text-white"
                : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)]")
            }
          >
            Unsolved
          </button>
        </div>

        {allPasters.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-muted)]">pasted by</span>
            <select
              value={pastedByFilter}
              onChange={(event) => setPastedByFilter(event.target.value)}
              className="flex-1 px-2 py-1 text-xs rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--violet)]"
            >
              <option value="all">everyone</option>
              {allPasters.map((who) => (
                <option key={who} value={who}>
                  {who}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {allTags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={
                  "px-2 py-0.5 text-[10px] rounded-full font-code transition-colors " +
                  (activeTags.includes(tag)
                    ? "bg-[var(--violet)] text-white"
                    : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)]")
                }
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            onClick={exportMarkdown}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--violet)] transition-colors"
          >
            <FileText size={12} /> Markdown
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--violet)] transition-colors"
          >
            <FileDown size={12} /> CSV
          </button>
          <span className="ml-auto text-[11px] text-[var(--text-muted)] font-code">
            {filtered.length} shown
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            <div className="skeleton h-12 rounded" />
            <div className="skeleton h-12 rounded" />
            <div className="skeleton h-12 rounded" />
            <div className="skeleton h-12 rounded" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 text-[var(--text-muted)]">
            <Search size={28} className="mb-2 opacity-40" />
            <p className="text-sm">{loadError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 text-[var(--text-muted)]">
            <Inbox size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No problems here yet.</p>
            <p className="text-xs mt-1 opacity-70">
              {problems.length === 0
                ? "Paste a Codeforces link to start the ledger."
                : "Try loosening the filters above."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {filtered.map((problem) => {
              const code = problem.contestId + problem.index;
              const who =
                (problem.firstSeenBy && problem.firstSeenBy.username) || "someone";
              const solvedByCount = problem.solvedByCount || 0;
              const squadSize = problem.squadSize || 0;
              const ratingValue = problem.rating || 0;
              const tags = problem.tags || [];
              return (
                <li
                  key={code}
                  onClick={() => openRow(problem)}
                  className="group px-3 py-2.5 cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="font-code text-[11px] text-[var(--violet-lite)] mt-0.5 shrink-0">
                      {code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--text-primary)] truncate">
                          {problem.name || code}
                        </span>
                        {ratingValue ? (
                          <span
                            className="px-1.5 py-0.5 text-[10px] rounded font-code font-semibold blur-[5px] group-hover:blur-none transition-all shrink-0"
                            style={{
                              color: rankColor(ratingValue),
                              backgroundColor: "var(--bg-dark)",
                            }}
                          >
                            {ratingValue}
                          </span>
                        ) : null}
                      </div>

                      {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1 blur-[4px] group-hover:blur-none transition-all">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-[9px] rounded-full font-code bg-[var(--bg-dark)] text-[var(--text-muted)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)]">
                        <span className="truncate">
                          {who} - {relativeTime(problem.firstSeenAt)}
                        </span>
                        <span className="ml-auto font-code shrink-0">
                          <span
                            className={
                              solvedByCount === 0
                                ? "text-[var(--text-muted)]"
                                : solvedByCount >= squadSize && squadSize > 0
                                ? "text-emerald-400"
                                : "text-[var(--violet-lite)]"
                            }
                          >
                            solved {solvedByCount}/{squadSize}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

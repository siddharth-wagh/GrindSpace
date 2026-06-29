import { useState, useEffect } from "react";
import { Trophy, ExternalLink, X, Check, Skull, AlertTriangle, Link2 } from "lucide-react";
import { useAppStore } from "@/store";
import { detectProblemLinks } from "@/utils/cfLinks";

export default function WarRoomDashboard({ socket }) {
  const warRoomActiveProblem = useAppStore((state) => state.warRoomActiveProblem);
  const setWarRoomActiveProblem = useAppStore((state) => state.setWarRoomActiveProblem);
  const warRoomStatus = useAppStore((state) => state.warRoomStatus);
  const members = useAppStore((state) => state.members);
  const activeContest = useAppStore((state) => state.activeContest);
  const channelLedger = useAppStore((state) => state.channelLedger);

  const [urlText, setUrlText] = useState("");
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!activeContest || activeContest.status !== "running" || !activeContest.endTime) {
      setRemaining("");
      return;
    }
    function tick() {
      const end = new Date(activeContest.endTime).getTime();
      const now = Date.now();
      let diff = Math.floor((end - now) / 1000);
      if (diff < 0) diff = 0;
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      function pad(n) {
        if (n < 10) return "0" + n;
        return "" + n;
      }
      if (hours > 0) {
        setRemaining(pad(hours) + ":" + pad(minutes) + ":" + pad(seconds));
      } else {
        setRemaining(pad(minutes) + ":" + pad(seconds));
      }
    }
    tick();
    const handle = setInterval(tick, 1000);
    return () => clearInterval(handle);
  }, [activeContest]);

  function commitProblem(problem) {
    if (!problem) return;
    setWarRoomActiveProblem(problem);
    const channel = useAppStore.getState().currentChannel;
    if (socket && channel) {
      socket.emit("set-active-problem", { channelId: channel._id, problem });
    }
    setUrlText("");
  }

  function handleUrlSubmit() {
    const links = detectProblemLinks(urlText);
    if (links.length === 0) return;
    const first = links[0];
    commitProblem({ contestId: first.contestId, index: first.index });
  }

  function handlePickLedger() {
    if (!channelLedger || channelLedger.length === 0) return;
    const recent = channelLedger[0];
    commitProblem({
      contestId: recent.contestId,
      index: recent.index,
      name: recent.name,
      rating: recent.rating,
      tags: recent.tags,
    });
  }

  if (!warRoomActiveProblem) {
    return (
      <div className="mx-4 mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2 flex-wrap">
          <Trophy size={15} className="text-yellow-400 shrink-0" />
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-code shrink-0">
            War Room
          </span>
          <div className="flex items-center gap-1 flex-1 min-w-[180px]">
            <Link2 size={13} className="text-[var(--text-muted)] shrink-0" />
            <input
              value={urlText}
              onChange={(e) => setUrlText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUrlSubmit();
              }}
              placeholder="paste a Codeforces problem url"
              className="flex-1 min-w-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-code outline-none focus:border-[var(--violet)]"
            />
          </div>
          <button
            onClick={handleUrlSubmit}
            className="text-[11px] px-2 py-1 rounded bg-[var(--violet)]/20 text-[var(--violet-lite)] hover:bg-[var(--violet)]/30 font-code shrink-0"
          >
            Set active
          </button>
          <button
            onClick={handlePickLedger}
            disabled={!channelLedger || channelLedger.length === 0}
            className="text-[11px] px-2 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--violet)] font-code shrink-0 disabled:opacity-40"
          >
            Use latest ledger
          </button>
        </div>
      </div>
    );
  }

  const problem = warRoomActiveProblem;
  let problemUrl = null;
  if (problem.url) {
    problemUrl = problem.url;
  } else if (problem.contestId) {
    problemUrl = "https://codeforces.com/contest/" + problem.contestId + "/problem/" + problem.index;
  }

  const tagList = problem.tags || [];

  return (
    <div className="mx-4 mt-2 rounded-lg border border-[var(--violet)]/40 bg-[var(--bg-card)] px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 flex-wrap">
        <Trophy size={15} className="text-yellow-400 shrink-0" />
        <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-code shrink-0">
          War Room
        </span>
        <span className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[260px]">
          {problem.index ? problem.index + " — " : ""}
          {problem.name || "Problem " + (problem.contestId || "") + problem.index}
        </span>

        {problem.rating && (
          <span
            className="group text-[11px] px-2 py-0.5 rounded-full bg-[var(--violet)]/20 text-[var(--violet-lite)] font-code cursor-default select-none"
            title="hover to reveal rating"
          >
            <span className="blur-[5px] group-hover:blur-0 transition-all">{problem.rating}</span>
          </span>
        )}

        {tagList.length > 0 && (
          <span
            className="group text-[11px] text-[var(--text-muted)] font-code cursor-default select-none max-w-[220px] truncate"
            title="hover to reveal tags"
          >
            <span className="blur-[5px] group-hover:blur-0 transition-all">{tagList.join(", ")}</span>
          </span>
        )}

        {problemUrl && (
          <a
            href={problemUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--violet-lite)] hover:text-[var(--pink)] shrink-0"
            title="open on Codeforces"
          >
            <ExternalLink size={13} />
          </a>
        )}

        {activeContest && activeContest.status === "running" && remaining && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--pink)]/20 text-[var(--pink)] font-code shrink-0">
            {remaining}
          </span>
        )}

        <div className="flex-1" />

        <button
          onClick={() => commitProblem(null)}
          className="text-[var(--text-muted)] hover:text-white shrink-0"
          title="clear active problem"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-1.5 flex items-center gap-3 flex-wrap">
        {members.map((member) => {
          const memberId = member._id;
          const info = warRoomStatus[memberId];
          let icon = null;
          let label = "not started";
          let tone = "text-[var(--text-muted)]";

          if (info && info.verdict === "accepted") {
            icon = <Check size={12} />;
            label = "solved";
            tone = "text-emerald-400";
          } else if (info && (info.verdict === "WA" || info.verdict === "CE")) {
            icon = <Skull size={12} />;
            label = info.verdict;
            tone = "text-red-400";
          } else if (info && (info.verdict === "TLE" || info.verdict === "RE")) {
            icon = <AlertTriangle size={12} />;
            label = info.verdict;
            tone = "text-amber-400";
          } else if (info && info.attempting) {
            label = "attempting";
            tone = "text-[var(--violet-lite)]";
          }

          return (
            <div key={memberId} className={"flex items-center gap-1 text-[11px] font-code " + tone}>
              {icon}
              <span className="text-[var(--text-primary)]">{member.username}</span>
              <span className={tone}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

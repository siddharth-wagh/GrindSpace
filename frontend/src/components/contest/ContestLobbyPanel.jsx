import { useEffect, useState } from "react";
import { CalendarClock, Users, LogIn, LogOut, Loader2, Zap } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { getJoinContestRoute, getLeaveContestRoute } from "@/utils/constants";
import { rankColor } from "@/utils/rankColor";
import CfHandleGate from "./CfHandleGate";

function formatCountdown(ms) {
  if (ms <= 0) return "starting…";
  let total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  total = total - hours * 3600;
  const mins = Math.floor(total / 60);
  const secs = total - mins * 60;
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  if (hours > 0) return pad(hours) + ":" + pad(mins) + ":" + pad(secs);
  return pad(mins) + ":" + pad(secs);
}

// Pre-contest lobby: shows the plan, collects RSVPs, counts down to the
// scheduled start (the server auto-starts it — no button needed).
function ContestLobbyPanel() {
  const activeContest = useAppStore((state) => state.activeContest);
  const setActiveContest = useAppStore((state) => state.setActiveContest);
  const userInfo = useAppStore((state) => state.userInfo);

  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!activeContest) {
    return (
      <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
        No contest scheduled.
      </div>
    );
  }

  const participants = activeContest.participants || [];
  const joined = participants.some(
    (p) => userInfo && String(p._id || p) === String(userInfo._id)
  );
  const startMs = activeContest.scheduledStart
    ? new Date(activeContest.scheduledStart).getTime()
    : 0;
  const remaining = startMs - now;
  const hasHandle = userInfo && userInfo.codeforcesHandle;

  async function handleJoin() {
    setErrorText("");
    setBusy(true);
    try {
      const resp = await apiClient.post(getJoinContestRoute(activeContest._id));
      setActiveContest(resp.data.data);
    } catch (err) {
      const msg =
        err && err.response && err.response.data && err.response.data.message;
      setErrorText(msg || "Could not join.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setErrorText("");
    setBusy(true);
    try {
      const resp = await apiClient.post(getLeaveContestRoute(activeContest._id));
      setActiveContest(resp.data.data);
    } catch (err) {
      const msg =
        err && err.response && err.response.data && err.response.data.message;
      setErrorText(msg || "Could not leave.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
      <div className="rounded-lg border border-[var(--violet)]/40 bg-[var(--violet)]/10 p-3">
        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--violet-lite)]">
          <CalendarClock size={13} /> Scheduled contest
        </div>
        <div className="text-base font-semibold text-[var(--text-primary)]">
          {activeContest.name}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Zap size={15} className="text-[var(--pink)]" />
          <span className="font-code text-lg font-bold text-[var(--text-primary)]">
            {formatCountdown(remaining)}
          </span>
          <span className="text-xs text-[var(--text-muted)]">until start</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Rating" value={activeContest.ratingMin + "–" + activeContest.ratingMax} />
        <Stat label="Problems" value={activeContest.problemCount} />
        <Stat label="Duration" value={activeContest.durationMinutes + "m"} />
      </div>

      {!hasHandle ? <CfHandleGate /> : null}

      {joined ? (
        <button
          onClick={handleLeave}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--pink)] disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
          Leave lobby
        </button>
      ) : (
        <button
          onClick={handleJoin}
          disabled={busy || !hasHandle}
          title={!hasHandle ? "Link your Codeforces handle first" : ""}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--violet)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--violet-lite)] disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
          Join contest
        </button>
      )}

      {errorText ? (
        <div className="text-xs text-[var(--pink)]">{errorText}</div>
      ) : null}

      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          <Users size={13} /> Participants ({participants.length})
        </div>
        <div className="space-y-1.5">
          {participants.map((p) => {
            const id = p._id || p;
            const isOrganiser =
              activeContest.createdBy &&
              String(activeContest.createdBy._id || activeContest.createdBy) ===
                String(id);
            return (
              <div
                key={id}
                className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5"
              >
                {p.profilePic ? (
                  <img
                    src={p.profilePic}
                    className="h-6 w-6 rounded-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-[var(--violet)]/40" />
                )}
                <span className="flex-1 truncate text-sm text-[var(--text-primary)]">
                  {p.username || "player"}
                </span>
                {p.codeforcesHandle ? (
                  <span
                    className="font-code text-[11px]"
                    style={{ color: rankColor(p.cfRating) }}
                  >
                    {p.codeforcesHandle}
                  </span>
                ) : null}
                {isOrganiser ? (
                  <span className="rounded bg-[var(--violet)]/20 px-1.5 py-0.5 text-[10px] text-[var(--violet-lite)]">
                    host
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-2 text-center">
      <div className="font-code text-sm font-bold text-[var(--text-primary)]">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </div>
    </div>
  );
}

export default ContestLobbyPanel;

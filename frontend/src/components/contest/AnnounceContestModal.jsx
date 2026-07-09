import { useState } from "react";
import { X, Loader2, CalendarClock } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { ANNOUNCE_CONTEST_ROUTE } from "@/utils/constants";
import CfHandleGate from "./CfHandleGate";

// Local datetime string (YYYY-MM-DDTHH:mm) for a datetime-local input,
// defaulting to 15 minutes from now.
function defaultStartValue() {
  const d = new Date(Date.now() + 15 * 60 * 1000);
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

function AnnounceContestModal({ channelId, onClose, onAnnounced }) {
  const userInfo = useAppStore((state) => state.userInfo);
  const [name, setName] = useState("");
  const [startAt, setStartAt] = useState(defaultStartValue());
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [minRating, setMinRating] = useState(800);
  const [maxRating, setMaxRating] = useState(1500);
  const [problemCount, setProblemCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");

  const hasHandle = userInfo && userInfo.codeforcesHandle;

  async function handleAnnounce() {
    setErrorText("");
    if (!startAt) {
      setErrorText("Pick a start time.");
      return;
    }
    const when = new Date(startAt);
    if (isNaN(when.getTime())) {
      setErrorText("That start time isn't valid.");
      return;
    }
    if (Number(minRating) > Number(maxRating)) {
      setErrorText("Min rating can't be above max rating.");
      return;
    }
    setBusy(true);
    try {
      const resp = await apiClient.post(ANNOUNCE_CONTEST_ROUTE, {
        channelId,
        name: name || "Virtual Contest",
        scheduledStart: when.toISOString(),
        durationMinutes: Number(durationMinutes),
        ratingMin: Number(minRating),
        ratingMax: Number(maxRating),
        problemCount: Number(problemCount),
      });
      if (onAnnounced) onAnnounced(resp.data.data);
      onClose();
    } catch (err) {
      const msg =
        err && err.response && err.response.data && err.response.data.message;
      setErrorText(msg || "Failed to announce the contest.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
            <CalendarClock size={18} className="text-[var(--violet-lite)]" />
            Schedule a Virtual Contest
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {!hasHandle ? <CfHandleGate /> : null}

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Contest name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Friday Night Grind"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--violet-lite)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Starts at
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--violet-lite)]"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Problems are generated and the contest goes live automatically at
              this time.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Duration
            </label>
            <div className="flex gap-2">
              {[120, 180, 300].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDurationMinutes(mins)}
                  className={
                    "flex-1 rounded-md border px-3 py-2 text-sm " +
                    (durationMinutes === mins
                      ? "border-[var(--violet)] bg-[var(--violet)]/20 text-[var(--text-primary)]"
                      : "border-[var(--border)] bg-[var(--bg-dark)] text-[var(--text-muted)] hover:text-[var(--text-primary)]")
                  }
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
            <div className="mb-2 text-sm text-[var(--text-primary)]">
              Rating bracket & size
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-[var(--text-muted)]">Min</label>
                <input
                  type="number"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-24 rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--violet-lite)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--text-muted)]">Max</label>
                <input
                  type="number"
                  value={maxRating}
                  onChange={(e) => setMaxRating(e.target.value)}
                  className="w-24 rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--violet-lite)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--text-muted)]">
                  Problems
                </label>
                <input
                  type="number"
                  value={problemCount}
                  onChange={(e) => setProblemCount(e.target.value)}
                  className="w-20 rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--violet-lite)]"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Problems in this range that nobody who joins has solved before.
            </p>
          </div>

          {errorText ? (
            <div className="rounded-md border border-[var(--pink)] bg-[var(--pink)]/10 px-3 py-2 text-sm text-[var(--pink)]">
              {errorText}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleAnnounce}
            disabled={busy || !hasHandle}
            title={!hasHandle ? "Link your Codeforces handle first" : ""}
            className="flex items-center gap-2 rounded-md bg-[var(--violet)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--violet-lite)] disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : null}
            Announce
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnnounceContestModal;

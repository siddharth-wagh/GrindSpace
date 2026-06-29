import { useState } from "react";
import { X, Link2, Shuffle, Download, Loader2, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import {
  UNFURL_ROUTE,
  RANDOM_PROBLEMS_ROUTE,
  CREATE_CONTEST_ROUTE,
  IMPORT_CF_CONTEST_ROUTE,
} from "@/utils/constants";
import { rankColor } from "@/utils/rankColor";

function detectProblemLinks(text) {
  const found = [];
  const linkPattern = /codeforces\.com\/(?:contest|problemset\/problem)\/(\d+)\/(?:problem\/)?([A-Za-z0-9]+)/gi;
  let match = linkPattern.exec(text);
  while (match !== null) {
    found.push({ contestId: Number(match[1]), index: match[2].toUpperCase() });
    match = linkPattern.exec(text);
  }
  return found;
}

function VirtualContestModal({ channelId, onClose, onStarted }) {
  const [contestName, setContestName] = useState("");
  const [problems, setProblems] = useState([]);
  const [pasteUrl, setPasteUrl] = useState("");
  const [pasteBusy, setPasteBusy] = useState(false);
  const [minRating, setMinRating] = useState(800);
  const [maxRating, setMaxRating] = useState(1500);
  const [randomCount, setRandomCount] = useState(5);
  const [randomBusy, setRandomBusy] = useState(false);
  const [useImport, setUseImport] = useState(false);
  const [cfContestId, setCfContestId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [errorText, setErrorText] = useState("");

  async function handleAddFromUrl() {
    setErrorText("");
    const links = detectProblemLinks(pasteUrl);
    if (links.length === 0) {
      setErrorText("No valid Codeforces problem link found.");
      return;
    }
    setPasteBusy(true);
    try {
      const next = [];
      for (let i = 0; i < links.length; i++) {
        const one = links[i];
        const resp = await apiClient.post(UNFURL_ROUTE, {
          contestId: one.contestId,
          index: one.index,
        });
        const meta = resp.data.data;
        if (meta) {
          next.push({
            contestId: meta.contestId,
            index: meta.index,
            name: meta.name,
            rating: meta.rating,
          });
        }
      }
      if (next.length > 0) {
        setProblems((prev) => [...prev, ...next]);
        setPasteUrl("");
      } else {
        setErrorText("Could not resolve that problem.");
      }
    } catch (err) {
      setErrorText("Failed to resolve the problem link.");
    } finally {
      setPasteBusy(false);
    }
  }

  async function handleAddRandom() {
    setErrorText("");
    setRandomBusy(true);
    try {
      const resp = await apiClient.post(RANDOM_PROBLEMS_ROUTE, {
        minRating: Number(minRating),
        maxRating: Number(maxRating),
        count: Number(randomCount),
      });
      const fetched = resp.data.data || [];
      const mapped = fetched.map((p) => ({
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating,
      }));
      setProblems((prev) => [...prev, ...mapped]);
    } catch (err) {
      setErrorText("Failed to fetch random problems.");
    } finally {
      setRandomBusy(false);
    }
  }

  function handleRemoveProblem(position) {
    setProblems((prev) => prev.filter((item, i) => i !== position));
  }

  async function handleSubmit() {
    setErrorText("");
    setSubmitBusy(true);
    try {
      let resp;
      if (useImport) {
        if (!cfContestId) {
          setErrorText("Enter a Codeforces contest ID to import.");
          setSubmitBusy(false);
          return;
        }
        resp = await apiClient.post(IMPORT_CF_CONTEST_ROUTE, {
          channelId,
          cfContestId: Number(cfContestId),
          durationMinutes: Number(durationMinutes),
        });
      } else {
        if (problems.length === 0) {
          setErrorText("Add at least one problem.");
          setSubmitBusy(false);
          return;
        }
        resp = await apiClient.post(CREATE_CONTEST_ROUTE, {
          channelId,
          name: contestName || "Virtual Contest",
          problems,
          durationMinutes: Number(durationMinutes),
        });
      }
      const created = resp.data.data;
      if (onStarted) onStarted(created);
      onClose();
    } catch (err) {
      setErrorText("Failed to start the contest.");
    } finally {
      setSubmitBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Start a Virtual Contest
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          <div className="flex gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-1 text-sm">
            <button
              onClick={() => setUseImport(false)}
              className={
                "flex-1 rounded-md px-3 py-1.5 " +
                (!useImport
                  ? "bg-[var(--violet)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")
              }
            >
              Build problem set
            </button>
            <button
              onClick={() => setUseImport(true)}
              className={
                "flex-1 rounded-md px-3 py-1.5 " +
                (useImport
                  ? "bg-[var(--violet)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")
              }
            >
              Import CF contest
            </button>
          </div>

          {!useImport && (
            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  Contest name
                </label>
                <input
                  value={contestName}
                  onChange={(e) => setContestName(e.target.value)}
                  placeholder="Friday Night Grind"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--violet-lite)]"
                />
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
                <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-primary)]">
                  <Link2 size={15} className="text-[var(--violet-lite)]" />
                  Paste a Codeforces problem URL
                </div>
                <div className="flex gap-2">
                  <input
                    value={pasteUrl}
                    onChange={(e) => setPasteUrl(e.target.value)}
                    placeholder="https://codeforces.com/contest/1700/problem/A"
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--violet-lite)] font-code"
                  />
                  <button
                    onClick={handleAddFromUrl}
                    disabled={pasteBusy}
                    className="flex items-center gap-1 rounded-md bg-[var(--violet)] px-3 py-2 text-sm text-white hover:bg-[var(--violet-lite)] disabled:opacity-50"
                  >
                    {pasteBusy ? <Loader2 size={15} className="animate-spin" /> : "Add"}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
                <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-primary)]">
                  <Shuffle size={15} className="text-[var(--pink)]" />
                  Random problems from a rating range
                </div>
                <div className="flex flex-wrap items-end gap-2">
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
                    <label className="mb-1 block text-xs text-[var(--text-muted)]">Count</label>
                    <input
                      type="number"
                      value={randomCount}
                      onChange={(e) => setRandomCount(e.target.value)}
                      className="w-20 rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--violet-lite)]"
                    />
                  </div>
                  <button
                    onClick={handleAddRandom}
                    disabled={randomBusy}
                    className="flex items-center gap-1 rounded-md bg-[var(--bg-dark)] border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-primary)] hover:border-[var(--pink)] disabled:opacity-50"
                  >
                    {randomBusy ? <Loader2 size={15} className="animate-spin" /> : "Add random"}
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  Problem set ({problems.length})
                </div>
                {problems.length === 0 ? (
                  <div className="rounded-md border border-dashed border-[var(--border)] px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                    No problems yet. Paste a link or add random ones.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {problems.map((p, i) => (
                      <div
                        key={p.contestId + "-" + p.index + "-" + i}
                        className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-code text-sm font-bold text-[var(--violet-lite)]">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-sm text-[var(--text-primary)]">
                            {p.contestId}
                            {p.index}. {p.name}
                          </span>
                          {p.rating ? (
                            <span
                              className="font-code text-xs"
                              style={{ color: rankColor(p.rating) }}
                            >
                              {p.rating}
                            </span>
                          ) : null}
                        </div>
                        <button
                          onClick={() => handleRemoveProblem(i)}
                          className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--pink)]"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {useImport && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
              <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <Download size={15} className="text-[var(--violet-lite)]" />
                Codeforces contest ID
              </div>
              <input
                value={cfContestId}
                onChange={(e) => setCfContestId(e.target.value)}
                placeholder="e.g. 1700"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--violet-lite)] font-code"
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                All problems from this contest will be pulled in as the problem set.
              </p>
            </div>
          )}

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
            onClick={handleSubmit}
            disabled={submitBusy}
            className="flex items-center gap-2 rounded-md bg-[var(--violet)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--violet-lite)] disabled:opacity-50"
          >
            {submitBusy ? <Loader2 size={15} className="animate-spin" /> : null}
            Start Contest
          </button>
        </div>
      </div>
    </div>
  );
}

export default VirtualContestModal;

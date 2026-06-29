import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { ORACLE_QUERY } from "@/utils/constants";
import { Sparkles, X, Gauge, Bug, Lightbulb } from "lucide-react";

export default function OraclePanel() {
  const oracleOpen = useAppStore((state) => state.oracleOpen);
  const oracleCode = useAppStore((state) => state.oracleCode);
  const closeOracle = useAppStore((state) => state.closeOracle);

  const [mode, setMode] = useState("complexity");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [spoiler, setSpoiler] = useState(false);

  const runOracle = async (whichMode, expectedValue, actualValue, spoilerValue) => {
    setMode(whichMode);
    setLoading(true);
    setAnswer("");
    try {
      const res = await apiClient.post(ORACLE_QUERY, {
        code: oracleCode,
        mode: whichMode,
        expected: expectedValue,
        actual: actualValue,
        spoiler: spoilerValue,
      });
      setAnswer(res.data.data.answer);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setAnswer(err.response.data.message);
      } else {
        setAnswer("The Oracle could not respond.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (oracleOpen) {
      setMode("complexity");
      setAnswer("");
      setExpected("");
      setActual("");
      setSpoiler(false);
      runOracle("complexity", "", "", false);
    }
  }, [oracleOpen]);

  if (!oracleOpen) return null;

  const pickComplexity = () => {
    setMode("complexity");
    setAnswer("");
    runOracle("complexity", "", "", false);
  };

  const pickBug = () => {
    setMode("bug");
    setAnswer("");
  };

  const pickApproach = () => {
    setMode("approach");
    setAnswer("");
  };

  const askBug = () => {
    runOracle("bug", expected, actual, false);
  };

  const askApproach = () => {
    runOracle("approach", "", "", spoiler);
  };

  let complexityClass = "text-xs px-3 py-1.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)] flex items-center gap-1.5";
  if (mode === "complexity") {
    complexityClass = "text-xs px-3 py-1.5 rounded-md bg-[var(--violet)] text-white flex items-center gap-1.5";
  }

  let bugClass = "text-xs px-3 py-1.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)] flex items-center gap-1.5";
  if (mode === "bug") {
    bugClass = "text-xs px-3 py-1.5 rounded-md bg-[var(--violet)] text-white flex items-center gap-1.5";
  }

  let approachClass = "text-xs px-3 py-1.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)] flex items-center gap-1.5";
  if (mode === "approach") {
    approachClass = "text-xs px-3 py-1.5 rounded-md bg-[var(--violet)] text-white flex items-center gap-1.5";
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeOracle}></div>

      <div className="relative h-full w-full max-w-md flex flex-col bg-[var(--bg-card)] border-l border-[var(--border)] shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--violet-lite)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">The Oracle</h2>
          </div>
          <button onClick={closeOracle}>
            <X size={18} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="flex gap-2">
            <button onClick={pickComplexity} className={complexityClass}>
              <Gauge size={14} />
              Explain complexity
            </button>
            <button onClick={pickBug} className={bugClass}>
              <Bug size={14} />
              Find the bug
            </button>
            <button onClick={pickApproach} className={approachClass}>
              <Lightbulb size={14} />
              Suggest approach
            </button>
          </div>

          {mode === "bug" ? (
            <div className="mt-3 space-y-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-1">
                  Expected output
                </label>
                <input
                  value={expected}
                  onChange={(e) => setExpected(e.target.value)}
                  placeholder="What it should print"
                  className="w-full rounded-md bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] font-code outline-none focus:border-[var(--violet)]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-1">
                  Actual output
                </label>
                <input
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  placeholder="What it actually prints"
                  className="w-full rounded-md bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] font-code outline-none focus:border-[var(--violet)]"
                />
              </div>
              <button
                onClick={askBug}
                disabled={loading}
                className="w-full rounded-md bg-[var(--violet)] hover:bg-[var(--violet-lite)] text-white text-sm font-medium py-2 transition-colors disabled:opacity-50"
              >
                Hunt the bug
              </button>
            </div>
          ) : null}

          {mode === "approach" ? (
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={spoiler}
                  onChange={(e) => setSpoiler(e.target.checked)}
                  className="accent-[var(--violet)]"
                />
                Reveal full approach (spoiler)
              </label>
              {spoiler ? null : (
                <p className="text-xs text-[var(--pink)]">
                  Spoiler is off, so the Oracle will give only a hint, not the full approach.
                </p>
              )}
              <button
                onClick={askApproach}
                disabled={loading}
                className="w-full rounded-md bg-[var(--violet)] hover:bg-[var(--violet-lite)] text-white text-sm font-medium py-2 transition-colors disabled:opacity-50"
              >
                Suggest approach
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Sparkles size={14} className="animate-pulse text-[var(--violet-lite)]" />
              The Oracle is thinking…
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap text-[var(--text-primary)] font-code leading-relaxed">
              {answer || "No response yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

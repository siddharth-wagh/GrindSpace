import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { UPDATE_PROFILE_ROUTE } from "@/utils/constants";

// Inline prompt shown wherever a Codeforces handle is required but missing.
// The whole contest scoreboard is built off the handle, so without it the
// user simply never shows up on the board — this makes that fixable in place.
function CfHandleGate({ children }) {
  const userInfo = useAppStore((state) => state.userInfo);
  const setUserInfo = useAppStore((state) => state.setUserInfo);
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");

  if (userInfo && userInfo.codeforcesHandle) {
    return children ? children : null;
  }

  async function handleSave() {
    const trimmed = handle.trim();
    if (!trimmed) {
      setErrorText("Enter your Codeforces handle.");
      return;
    }
    setErrorText("");
    setBusy(true);
    try {
      const resp = await apiClient.put(
        UPDATE_PROFILE_ROUTE,
        { codeforcesHandle: trimmed },
        { withCredentials: true }
      );
      const updated = resp.data;
      setUserInfo({ ...userInfo, ...updated });
    } catch (err) {
      const msg =
        err && err.response && err.response.data && err.response.data.message;
      setErrorText(msg || "Could not link that handle.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--violet)]/40 bg-[var(--violet)]/10 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
        <Link2 size={15} className="text-[var(--violet-lite)]" />
        Link your Codeforces handle
      </div>
      <p className="mb-2 text-xs text-[var(--text-muted)]">
        You need this to appear on the scoreboard and get your solves tracked.
      </p>
      <div className="flex gap-2">
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
          placeholder="e.g. tourist"
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none font-code focus:border-[var(--violet-lite)]"
        />
        <button
          onClick={handleSave}
          disabled={busy}
          className="flex items-center gap-1 rounded-md bg-[var(--violet)] px-3 py-2 text-sm text-white hover:bg-[var(--violet-lite)] disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : "Link"}
        </button>
      </div>
      {errorText ? (
        <div className="mt-2 text-xs text-[var(--pink)]">{errorText}</div>
      ) : null}
    </div>
  );
}

export default CfHandleGate;

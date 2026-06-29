import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAppStore } from "@/store";
import { Home, LayoutDashboard, ListChecks, Crosshair, Search } from "lucide-react";

function CommandPalette() {
  const navigate = useNavigate();
  const commandPaletteOpen = useAppStore((state) => state.commandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((state) => state.setCommandPaletteOpen);
  const toggleCommandPalette = useAppStore((state) => state.toggleCommandPalette);
  const [query, setQuery] = useState("");

  function jumpToLedger() {
    const store = useAppStore.getState();
    if (store.setRightPanel) {
      store.setRightPanel("problems");
    }
  }

  function jumpToActiveProblem() {
    const target = document.getElementById("warroom");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  useEffect(() => {
    function handleKeyDown(event) {
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) {
        return;
      }
      const pressed = event.key.toLowerCase();
      if (pressed === "k") {
        event.preventDefault();
        toggleCommandPalette();
      } else if (pressed === "/") {
        event.preventDefault();
        jumpToLedger();
      } else if (pressed === "l") {
        event.preventDefault();
        jumpToActiveProblem();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleCommandPalette]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    }
    if (commandPaletteOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
    }
  }, [commandPaletteOpen]);

  function closePalette() {
    setCommandPaletteOpen(false);
  }

  function runAction(action) {
    if (action === "home") {
      navigate("/home");
    } else if (action === "dashboard") {
      navigate("/dashboard");
    } else if (action === "ledger") {
      jumpToLedger();
    } else if (action === "active") {
      jumpToActiveProblem();
    }
    closePalette();
  }

  if (!commandPaletteOpen) {
    return null;
  }

  const allActions = [
    { id: "home", label: "Go to Home", icon: Home },
    { id: "dashboard", label: "Open CP Dashboard", icon: LayoutDashboard },
    { id: "ledger", label: "Toggle Problem Ledger", icon: ListChecks },
    { id: "active", label: "Jump to Active Problem", icon: Crosshair },
  ];

  const lowered = query.trim().toLowerCase();
  let visibleActions = [];
  let i = 0;
  while (i < allActions.length) {
    const current = allActions[i];
    if (lowered === "" || current.label.toLowerCase().includes(lowered)) {
      visibleActions.push(current);
    }
    i = i + 1;
  }

  function onBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closePalette();
    }
  }

  return (
    <div
      onMouseDown={onBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-32"
    >
      <div className="w-full max-w-lg mx-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a command..."
            className="font-code flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
          />
        </div>
        <div className="py-2 max-h-72 overflow-y-auto">
          {visibleActions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-[var(--text-muted)]">
              No matching commands
            </div>
          ) : (
            visibleActions.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => runAction(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <ItemIcon className="w-4 h-4 text-[var(--violet-lite)]" />
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;

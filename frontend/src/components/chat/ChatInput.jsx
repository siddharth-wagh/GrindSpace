import { useRef, useEffect } from "react";
import { looksLikeCode, detectLanguage } from "@/utils/cfLinks";

const MAX_HEIGHT = 220;

function ChatInput({ value, onChange, onSubmit, placeholder, className, autoFocus, onEscape }) {
  const areaRef = useRef(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = next + "px";
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

  function handleKeyDown(e) {
    if (e.key === "Escape" && onEscape) {
      onEscape();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text");
    if (!pasted || !looksLikeCode(pasted)) return;
    if (value.includes("```")) return;

    e.preventDefault();

    const el = areaRef.current;
    const start = el ? el.selectionStart : value.length;
    const end = el ? el.selectionEnd : value.length;
    const before = value.slice(0, start);
    const after = value.slice(end);

    const lang = detectLanguage(pasted);
    const body = pasted.replace(/\s+$/, "");
    const lead = before && !before.endsWith("\n") ? "\n" : "";
    const fenced = lead + "```" + lang + "\n" + body + "\n```\n";

    onChange(before + fenced + after);

    const caret = (before + fenced).length;
    setTimeout(() => {
      if (areaRef.current) areaRef.current.setSelectionRange(caret, caret);
    }, 0);
  }

  return (
    <textarea
      ref={areaRef}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={
        "flex-1 bg-transparent outline-none resize-none placeholder:text-[var(--text-muted)]/50 " +
        (className || "text-sm")
      }
    />
  );
}

export default ChatInput;

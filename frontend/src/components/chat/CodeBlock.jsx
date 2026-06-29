import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, WrapText, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useAppStore } from "@/store";

function CodeBlock({ code, lang }) {
  const safeCode = typeof code === "string" ? code : "";

  let startLang = "cpp";
  if (lang === "python" || lang === "java" || lang === "c" || lang === "javascript" || lang === "cpp") {
    startLang = lang;
  } else if (lang) {
    startLang = "cpp";
  }

  const [activeLang, setActiveLang] = useState(startLang);
  const [softWrap, setSoftWrap] = useState(false);
  const [copied, setCopied] = useState(false);

  const lineCount = safeCode.split("\n").length;
  const isLong = lineCount > 40;
  const [expanded, setExpanded] = useState(!isLong);

  function cycleLang() {
    if (activeLang === "cpp") {
      setActiveLang("python");
    } else if (activeLang === "python") {
      setActiveLang("java");
    } else if (activeLang === "java") {
      setActiveLang("c");
    } else if (activeLang === "c") {
      setActiveLang("javascript");
    } else {
      setActiveLang("cpp");
    }
  }

  function copyCode() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(safeCode);
    }
    setCopied(true);
    setTimeout(function () {
      setCopied(false);
    }, 1500);
  }

  function toggleWrap() {
    setSoftWrap(!softWrap);
  }

  function askOracle() {
    const openOracle = useAppStore.getState().openOracle;
    if (openOracle) {
      openOracle(safeCode);
    }
  }

  function toggleExpanded() {
    setExpanded(!expanded);
  }

  let shownCode = safeCode;
  if (isLong && !expanded) {
    const lines = safeCode.split("\n");
    shownCode = lines.slice(0, 40).join("\n");
  }

  return (
    <div className="my-2 rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg-deepest)]">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-dark)] border-b border-[var(--border)]">
        <button
          onClick={cycleLang}
          className="text-xs font-code px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--violet-lite)] border border-[var(--border)] hover:border-[var(--violet)]"
        >
          {activeLang}
        </button>
        <div className="flex-1" />
        <button
          onClick={toggleWrap}
          className={
            "flex items-center gap-1 text-xs px-2 py-0.5 rounded hover:text-[var(--text-primary)] " +
            (softWrap ? "text-[var(--violet-lite)]" : "text-[var(--text-muted)]")
          }
        >
          <WrapText size={13} />
          wrap
        </button>
        <button
          onClick={askOracle}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded text-[var(--pink)] hover:text-[var(--text-primary)]"
        >
          <Sparkles size={13} />
          Ask Oracle
        </button>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "copied" : "copy"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={activeLang}
          style={oneDark}
          showLineNumbers={true}
          wrapLongLines={softWrap}
          customStyle={{
            margin: 0,
            background: "var(--bg-deepest)",
            fontSize: "0.8rem",
          }}
          codeTagProps={{ className: "font-code" }}
        >
          {shownCode}
        </SyntaxHighlighter>
      </div>

      {isLong ? (
        <button
          onClick={toggleExpanded}
          className="w-full flex items-center justify-center gap-1 text-xs py-1.5 bg-[var(--bg-dark)] border-t border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Show less" : "Show more (" + lineCount + " lines)"}
        </button>
      ) : null}
    </div>
  );
}

export default CodeBlock;

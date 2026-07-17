import CodeBlock from "./CodeBlock";
import ProblemCard from "./ProblemCard";
import { detectProblemLinks, looksLikeCode } from "@/utils/cfLinks";

function MessageContent({ text, edited, problemMetadata, messageId, channelId, serverId }) {
  const source = typeof text === "string" ? text : "";

  const blocks = [];
  const fenceRegex = /```([a-zA-Z0-9+#]*)\n?([\s\S]*?)```/g;
  let lastEnd = 0;
  let match = fenceRegex.exec(source);
  while (match !== null) {
    if (match.index > lastEnd) {
      blocks.push({ kind: "text", value: source.slice(lastEnd, match.index) });
    }
    let fenceLang = match[1];
    if (!fenceLang) {
      fenceLang = "cpp";
    }
    blocks.push({ kind: "code", value: match[2], lang: fenceLang });
    lastEnd = fenceRegex.lastIndex;
    match = fenceRegex.exec(source);
  }
  if (lastEnd < source.length) {
    blocks.push({ kind: "text", value: source.slice(lastEnd) });
  }

  function metaForLink(linkContestId, linkIndex) {
    if (
      problemMetadata &&
      String(problemMetadata.contestId) === String(linkContestId) &&
      problemMetadata.index === linkIndex
    ) {
      return problemMetadata;
    }
    return undefined;
  }

  function renderTextSegment(value, keyBase) {
    if (looksLikeCode(value)) {
      return <CodeBlock key={keyBase + "-code"} code={value} lang="cpp" />;
    }

    const links = detectProblemLinks(value);

    const pieces = [];
    const inlineRegex = /`([^`\n]+)`/g;
    let cursor = 0;
    let partIndex = 0;
    let inlineMatch = inlineRegex.exec(value);
    while (inlineMatch !== null) {
      if (inlineMatch.index > cursor) {
        pieces.push(
          <span key={keyBase + "-t" + partIndex} className="whitespace-pre-wrap">
            {value.slice(cursor, inlineMatch.index)}
          </span>
        );
        partIndex = partIndex + 1;
      }
      pieces.push(
        <span
          key={keyBase + "-i" + partIndex}
          className="font-code text-xs px-1 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--violet-lite)]"
        >
          {inlineMatch[1]}
        </span>
      );
      partIndex = partIndex + 1;
      cursor = inlineRegex.lastIndex;
      inlineMatch = inlineRegex.exec(value);
    }
    if (cursor < value.length) {
      pieces.push(
        <span key={keyBase + "-t" + partIndex} className="whitespace-pre-wrap">
          {value.slice(cursor)}
        </span>
      );
    }

    const cards = links.map(function (link, idx) {
      return (
        <ProblemCard
          key={keyBase + "-p" + idx}
          contestId={link.contestId}
          index={link.index}
          meta={metaForLink(link.contestId, link.index)}
          messageId={messageId}
          channelId={channelId}
          serverId={serverId}
        />
      );
    });

    return (
      <span key={keyBase}>
        <span className="whitespace-pre-wrap break-words">{pieces}</span>
        {cards}
      </span>
    );
  }

  return (
    <div className="text-sm text-[var(--text-primary)] leading-relaxed">
      {blocks.map(function (block, idx) {
        if (block.kind === "code") {
          return <CodeBlock key={"b" + idx} code={block.value} lang={block.lang} />;
        }
        return renderTextSegment(block.value, "b" + idx);
      })}
      {edited ? (
        <span className="ml-1 text-xs text-[var(--text-muted)]">(edited)</span>
      ) : null}
    </div>
  );
}

export default MessageContent;

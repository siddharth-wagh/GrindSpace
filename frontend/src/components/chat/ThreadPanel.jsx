import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { MESSAGE_ROUTES } from "@/utils/constants";
import { useAppStore } from "@/store";
import MessageContent from "./MessageContent";
import ChatInput from "./ChatInput";
import { X, Send, Minus } from "lucide-react";

export default function ThreadPanel({ channelId, messageId, onClose }) {
  const { userInfo } = useAppStore();
  const [replies, setReplies] = useState([]);
  const [text, setText] = useState("");
  const [minimized, setMinimized] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!messageId) return;
    (async () => {
      try {
        const res = await apiClient.get(`${MESSAGE_ROUTES}/thread/${messageId}`);
        setReplies(res.data.data);
        setTimeout(() => endRef.current?.scrollIntoView(), 50);
      } catch (_) {}
    })();
  }, [messageId]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await apiClient.post(`${MESSAGE_ROUTES}/channel/${channelId}`, {
        text: text.trim(),
        parentMessageId: messageId,
      });
      setReplies((prev) => [...prev, res.data.data]);
      setText("");
      setTimeout(() => endRef.current?.scrollIntoView(), 50);
    } catch (_) {}
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] shadow-lg text-xs font-medium hover:border-[var(--violet)]"
      >
        Thread ({replies.length}) — click to reopen
      </button>
    );
  }

  return (
    <div className="w-80 min-w-[280px] border-l border-[var(--border)] bg-[var(--bg-dark)] flex flex-col">
      <div className="h-12 min-h-[48px] flex items-center px-4 border-b border-[var(--border)] gap-2">
        <span className="font-semibold text-sm flex-1">Thread</span>
        <button onClick={() => setMinimized(true)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <Minus size={16} />
        </button>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {replies.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] text-center py-6">
            No replies yet. Start the discussion.
          </p>
        )}
        {replies.map((r) => (
          <div key={r._id} className="flex gap-2">
            <img src={r.sender?.profilePic} className="w-7 h-7 rounded-full object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold">{r.sender?.username}</span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <MessageContent text={r.text} edited={r.edited} problemMetadata={r.problemMetadata} />
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="p-2 border-t border-[var(--border)]">
        <div className="flex items-end gap-1.5 bg-[var(--bg-surface)] rounded-lg px-2 py-1.5 border border-[var(--border)] focus-within:border-[var(--violet)]">
          <ChatInput
            value={text}
            onChange={setText}
            onSubmit={handleSend}
            placeholder="Reply in thread..."
            className="text-xs"
          />
          <button type="submit" disabled={!text.trim()} className="text-[var(--violet)] disabled:opacity-30">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

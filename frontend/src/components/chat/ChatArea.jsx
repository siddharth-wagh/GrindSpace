import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { MESSAGE_ROUTES, getChannelContestRoute } from "@/utils/constants";
import confetti from "canvas-confetti";
import MessageContent from "./MessageContent";
import ChatInput from "./ChatInput";
import ThreadPanel from "./ThreadPanel";
import StartContestButton from "../contest/StartContestButton";
import { Send, Hash, Users, Pencil, Trash2, ChevronUp, Trophy, MessageSquare } from "lucide-react";

export default function ChatArea({ socket }) {
  const {
    currentChannel,
    messages,
    setMessages,
    addMessage,
    removeMessage,
    updateMessage,
    userInfo,
    showMemberSidebar,
    setShowMemberSidebar,
    setActiveContest,
    bumpLedgerTick,
    pendingHighlight,
    setPendingHighlight,
  } = useAppStore();

  const [text, setText] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [openThreadMessageId, setOpenThreadMessageId] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const channelId = currentChannel ? currentChannel._id : null;

  useEffect(() => {
    if (!socket || !channelId) return;
    socket.emit("join-channel", channelId);
    return () => {
      socket.emit("leave-channel", channelId);
    };
  }, [socket, channelId]);

  useEffect(() => {
    if (!channelId) return;
    (async () => {
      try {
        const res = await apiClient.get(`${MESSAGE_ROUTES}/channel/${channelId}`);
        setMessages(res.data.data);
        setHasMore(res.data.hasMore);

        if (pendingHighlight && pendingHighlight.channelId === channelId) {
          const targetId = pendingHighlight.messageId;
          setOpenThreadMessageId(targetId);
          setHighlightedMessageId(targetId);
          setPendingHighlight(null);
          setTimeout(() => {
            document.getElementById(`msg-${targetId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 150);
          setTimeout(() => setHighlightedMessageId(null), 3000);
        } else {
          scrollToBottom();
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    })();
  }, [channelId]);

  // Rehydrate any running contest for this channel so it survives a refresh
  // and is visible to members who weren't connected when it started.
  useEffect(() => {
    if (!channelId) {
      setActiveContest(null);
      return;
    }
    (async () => {
      try {
        const res = await apiClient.get(getChannelContestRoute(channelId));
        setActiveContest(res.data.data || null);
      } catch (err) {
        setActiveContest(null);
      }
    })();
  }, [channelId]);

  useEffect(() => {
    if (!socket || !channelId) return;

    const handleNewMessage = (msg) => {
      addMessage(msg);
      scrollToBottom();
    };
    const handleDeleted = (msgId) => removeMessage(msgId);
    const handleEdited = ({ messageId, text, edited }) =>
      updateMessage(messageId, { text, edited });
    const handleTyping = ({ userId, username }) => {
      if (userId === userInfo?._id) return;
      setTypingUsers((prev) =>
        prev.some((u) => u.userId === userId) ? prev : [...prev, { userId, username }]
      );
    };
    const handleStopTyping = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };
    const handleLedger = () => bumpLedgerTick();
    const handleThreadReply = (reply) => {
      if (reply.parentMessageId) {
        updateMessage(reply.parentMessageId, {
          replyCount: (messages.find((m) => m._id === reply.parentMessageId)?.replyCount || 0) + 1,
        });
      }
    };
    const handleAC = (data) => {
      if (!data.accepted) return;
      const solvedLine =
        data.username +
        " solved " +
        (data.problemIndex ? data.problemIndex + " — " : "") +
        data.problemName +
        (data.timeMs ? " in " + data.timeMs + "ms" : "") +
        (data.lang ? " (" + data.lang + ")" : "") +
        "!";
      addMessage({
        _id: "ac-" + data.userId + "-" + Date.now(),
        system: true,
        text: solvedLine,
        createdAt: new Date().toISOString(),
      });
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 } });
      scrollToBottom();
    };
    const handleContestStarted = ({ contest }) => setActiveContest(contest);
    const handleContestEnded = () => setActiveContest(null);
    const handleContestAnnounced = ({ contest }) => {
      setActiveContest(contest);
      const whenText = contest.scheduledStart
        ? new Date(contest.scheduledStart).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "soon";
      const host =
        contest.createdBy && contest.createdBy.username
          ? contest.createdBy.username
          : "someone";
      addMessage({
        _id: "announce-" + contest._id,
        system: true,
        text:
          "📣 " +
          host +
          " scheduled “" +
          contest.name +
          "” (" +
          contest.ratingMin +
          "–" +
          contest.ratingMax +
          ") for " +
          whenText +
          ". Open the Board tab to join.",
        createdAt: new Date().toISOString(),
      });
      scrollToBottom();
    };
    const handleContestUpdated = ({ contest }) => setActiveContest(contest);

    socket.on("new-message", handleNewMessage);
    socket.on("message-deleted", handleDeleted);
    socket.on("message-edited", handleEdited);
    socket.on("user-typing", handleTyping);
    socket.on("user-stopped-typing", handleStopTyping);
    socket.on("ledger-updated", handleLedger);
    socket.on("new-thread-reply", handleThreadReply);
    socket.on("ac-verdict", handleAC);
    socket.on("contest-started", handleContestStarted);
    socket.on("contest-ended", handleContestEnded);
    socket.on("contest-announced", handleContestAnnounced);
    socket.on("contest-updated", handleContestUpdated);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("message-deleted", handleDeleted);
      socket.off("message-edited", handleEdited);
      socket.off("user-typing", handleTyping);
      socket.off("user-stopped-typing", handleStopTyping);
      socket.off("ledger-updated", handleLedger);
      socket.off("new-thread-reply", handleThreadReply);
      socket.off("ac-verdict", handleAC);
      socket.off("contest-started", handleContestStarted);
      socket.off("contest-ended", handleContestEnded);
      socket.off("contest-announced", handleContestAnnounced);
      socket.off("contest-updated", handleContestUpdated);
    };
  }, [socket, channelId]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const loadOlder = async () => {
    if (!hasMore || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    const oldest = messages[0]._id;
    try {
      const res = await apiClient.get(
        `${MESSAGE_ROUTES}/channel/${channelId}?before=${oldest}`
      );
      setMessages([...res.data.data, ...messages]);
      setHasMore(res.data.hasMore);
    } catch (_) {}
    setLoadingOlder(false);
  };

  const handleTypingEmit = () => {
    socket?.emit("typing-start", {
      channelId: channelId,
      userId: userInfo._id,
      username: userInfo.username,
    });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("typing-stop", { channelId: channelId, userId: userInfo._id });
    }, 2000);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    try {
      await apiClient.post(`${MESSAGE_ROUTES}/channel/${channelId}`, {
        text: text.trim(),
      });
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleEdit = async (messageId) => {
    if (!editText.trim()) return;
    try {
      await apiClient.put(`${MESSAGE_ROUTES}/${messageId}`, { text: editText.trim() });
      setEditingMessage(null);
      setEditText("");
    } catch (_) {}
  };

  const handleDelete = async (messageId) => {
    try {
      await apiClient.delete(`${MESSAGE_ROUTES}/${messageId}`);
    } catch (_) {}
  };

  if (!channelId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-dark)]">
        <div className="text-center">
          <Hash size={48} className="mx-auto text-[var(--text-muted)] mb-2 opacity-40" />
          <p className="text-[var(--text-muted)]">Select a channel to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-w-0">
    <div className="flex-1 flex flex-col bg-[var(--bg-dark)] min-w-0">
      <div className="h-12 min-h-[48px] flex items-center px-4 border-b border-[var(--border)] gap-2">
        <Hash size={20} className="text-[var(--text-muted)] shrink-0" />
        <span className="font-semibold text-sm">{currentChannel.name}</span>
        {currentChannel.topic && (
          <>
            <div className="w-px h-5 bg-[var(--border)] mx-2" />
            <span className="text-xs text-[var(--text-muted)] truncate">{currentChannel.topic}</span>
          </>
        )}
        <div className="flex-1" />
        <StartContestButton channelId={currentChannel._id} />
        <button
          onClick={() => setShowMemberSidebar(!showMemberSidebar)}
          className={`p-1.5 rounded hover:bg-[var(--bg-surface)] transition-colors ${
            showMemberSidebar ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
          }`}
        >
          <Users size={20} />
        </button>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin"
      >
      <div className="min-h-full flex flex-col justify-end space-y-0.5">
        {hasMore && (
          <button
            onClick={loadOlder}
            disabled={loadingOlder}
            className="w-full py-2 text-xs text-[var(--violet-lite)] hover:text-[var(--violet)] flex items-center justify-center gap-1"
          >
            <ChevronUp size={14} /> {loadingOlder ? "Loading..." : "Load older messages"}
          </button>
        )}

        {messages
          .filter((msg) => !msg.parentMessageId)
          .map((msg, i, topLevel) => {
          if (msg.system) {
            return <SystemMessage key={msg._id} msg={msg} />;
          }

          const showHeader =
            i === 0 ||
            topLevel[i - 1].sender?._id !== msg.sender?._id ||
            topLevel[i - 1].system ||
            new Date(msg.createdAt) - new Date(topLevel[i - 1].createdAt) > 5 * 60 * 1000;

          return (
            <MessageBubble
              key={msg._id}
              msg={msg}
              channelId={channelId}
              serverId={currentChannel?.server}
              showHeader={showHeader}
              isOwn={msg.sender?._id === userInfo?._id}
              highlighted={highlightedMessageId === msg._id}
              hovered={hoveredMessage === msg._id}
              onHover={() => setHoveredMessage(msg._id)}
              onLeave={() => setHoveredMessage(null)}
              onEdit={() => {
                setEditingMessage(msg._id);
                setEditText(msg.text || "");
              }}
              onDelete={() => handleDelete(msg._id)}
              onOpenThread={() => setOpenThreadMessageId(msg._id)}
              editing={editingMessage === msg._id}
              editText={editText}
              setEditText={setEditText}
              onEditSubmit={() => handleEdit(msg._id)}
              onEditCancel={() => {
                setEditingMessage(null);
                setEditText("");
              }}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-[var(--text-muted)]">
          <span className="font-medium">{typingUsers.map((u) => u.username).join(", ")}</span>{" "}
          {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}

      <form onSubmit={handleSend} className="px-4 pb-4 pt-1">
        <div className="flex items-end gap-2 bg-[var(--bg-surface)] rounded-lg px-3 py-2 border border-[var(--border)] focus-within:border-[var(--violet)]">
          <ChatInput
            value={text}
            onChange={(next) => {
              setText(next);
              handleTypingEmit();
            }}
            onSubmit={handleSend}
            placeholder={`Message #${currentChannel.name}`}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="text-[var(--violet)] hover:text-[var(--violet-lite)] transition-colors disabled:opacity-30"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
    {openThreadMessageId && (
      <ThreadPanel
        channelId={channelId}
        messageId={openThreadMessageId}
        onClose={() => setOpenThreadMessageId(null)}
      />
    )}
    </div>
  );
}

function SystemMessage({ msg }) {
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-1.5 my-1 mx-2 rounded-md bg-emerald-500/10 border border-emerald-500/30">
      <Trophy size={14} className="text-yellow-400 shrink-0" />
      <span className="text-xs text-emerald-300">{msg.text}</span>
    </div>
  );
}

function MessageBubble({
  msg,
  channelId,
  serverId,
  showHeader,
  isOwn,
  highlighted,
  hovered,
  onHover,
  onLeave,
  onEdit,
  onDelete,
  onOpenThread,
  editing,
  editText,
  setEditText,
  onEditSubmit,
  onEditCancel,
}) {
  const time = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = new Date(msg.createdAt).toLocaleDateString();

  return (
    <div
      id={`msg-${msg._id}`}
      className={`relative group px-2 py-0.5 rounded hover:bg-[var(--bg-surface)]/30 transition-colors ${
        showHeader ? "mt-4" : ""
      } ${highlighted ? "bg-[var(--violet)]/15 ring-1 ring-[var(--violet)]" : ""}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex gap-3">
        {showHeader ? (
          <img
            src={msg.sender?.profilePic}
            className="w-10 h-10 rounded-full object-cover mt-0.5 shrink-0"
          />
        ) : (
          <div className="w-10 shrink-0 flex items-center justify-center">
            <span className="text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100">
              {time}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {showHeader && (
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm hover:underline cursor-pointer">
                {msg.sender?.username}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {date} {time}
              </span>
            </div>
          )}

          {editing ? (
            <div className="mt-1">
              <div className="flex w-full bg-[var(--bg-deepest)] border border-[var(--border)] rounded px-2 py-1 focus-within:border-[var(--violet)]">
                <ChatInput
                  value={editText}
                  onChange={setEditText}
                  onSubmit={onEditSubmit}
                  onEscape={onEditCancel}
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Enter to save, Shift+Enter for a new line, Escape to cancel
              </p>
            </div>
          ) : (
            msg.text && (
              <MessageContent
                text={msg.text}
                edited={msg.edited}
                problemMetadata={msg.problemMetadata}
                messageId={msg._id}
                channelId={channelId}
                serverId={serverId}
              />
            )
          )}

          {!editing && (
            <button
              onClick={onOpenThread}
              className="mt-1 flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--violet-lite)]"
            >
              <MessageSquare size={12} />
              {msg.replyCount > 0 ? `${msg.replyCount} ${msg.replyCount === 1 ? "reply" : "replies"}` : "Reply in thread"}
            </button>
          )}
        </div>
      </div>

      {hovered && !editing && isOwn && (
        <div className="absolute -top-3 right-4 flex items-center bg-[var(--bg-card)] border border-[var(--border)] rounded-md shadow-lg overflow-hidden">
          <ActionBtn icon={Pencil} onClick={onEdit} tooltip="Edit" />
          <ActionBtn icon={Trash2} onClick={onDelete} tooltip="Delete" className="text-red-400" />
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, onClick, tooltip, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] ${className}`}
      title={tooltip}
    >
      <Icon size={16} />
    </button>
  );
}

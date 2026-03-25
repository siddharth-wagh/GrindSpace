import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { MESSAGE_ROUTES, DM_ROUTES } from "@/utils/constants";
import EmojiPicker from "emoji-picker-react";
import {
  Send,
  ImagePlus,
  X,
  Hash,
  Users,
  Smile,
  Reply,
  Pencil,
  Trash2,
  CornerUpRight,
  ChevronUp,
} from "lucide-react";

export default function ChatArea({ socket }) {
  const {
    currentChannel,
    currentConversation,
    activeView,
    messages,
    setMessages,
    addMessage,
    removeMessage,
    updateMessage,
    userInfo,
    showMemberSidebar,
    setShowMemberSidebar,
    replyingTo,
    setReplyingTo,
  } = useAppStore();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [hoveredMessage, setHoveredMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const isChannel = activeView === "server" && currentChannel;
  const isDM = activeView === "dm" && currentConversation;
  const targetId = isChannel ? currentChannel._id : currentConversation?._id;

  // Ensure socket is joined to the right room
  useEffect(() => {
    if (!socket || !targetId) return;
    if (isChannel) socket.emit("join-channel", targetId);
    else if (isDM) socket.emit("join-conversation", targetId);
    return () => {
      if (isChannel) socket.emit("leave-channel", targetId);
      else if (isDM) socket.emit("leave-conversation", targetId);
    };
  }, [socket, targetId]);

  // Fetch messages
  useEffect(() => {
    if (!targetId) return;
    (async () => {
      try {
        const url = isChannel
          ? `${MESSAGE_ROUTES}/channel/${targetId}`
          : `${DM_ROUTES}/${targetId}/messages`;
        const res = await apiClient.get(url);
        setMessages(res.data.data);
        setHasMore(res.data.hasMore);
        scrollToBottom();
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    })();
  }, [targetId]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !targetId) return;

    const handleNewMessage = (msg) => {
      addMessage(msg);
      scrollToBottom();
    };
    const handleDeleted = (msgId) => removeMessage(msgId);
    const handleEdited = ({ messageId, text, edited }) =>
      updateMessage(messageId, { text, edited });
    const handleReaction = ({ messageId, reactions }) =>
      updateMessage(messageId, { reactions });
    const handleTyping = ({ userId, username }) => {
      if (userId === userInfo?._id) return;
      setTypingUsers((prev) =>
        prev.some((u) => u.userId === userId) ? prev : [...prev, { userId, username }]
      );
    };
    const handleStopTyping = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    const msgEvent = isDM ? "dm-message" : "new-message";
    socket.on(msgEvent, handleNewMessage);
    socket.on("message-deleted", handleDeleted);
    socket.on("message-edited", handleEdited);
    socket.on("message-reaction-update", handleReaction);
    socket.on("user-typing", handleTyping);
    socket.on("user-stopped-typing", handleStopTyping);

    return () => {
      socket.off(msgEvent, handleNewMessage);
      socket.off("message-deleted", handleDeleted);
      socket.off("message-edited", handleEdited);
      socket.off("message-reaction-update", handleReaction);
      socket.off("user-typing", handleTyping);
      socket.off("user-stopped-typing", handleStopTyping);
    };
  }, [socket, targetId]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const loadOlder = async () => {
    if (!hasMore || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    const oldest = messages[0]._id;
    try {
      const url = isChannel
        ? `${MESSAGE_ROUTES}/channel/${targetId}?before=${oldest}`
        : `${DM_ROUTES}/${targetId}/messages?before=${oldest}`;
      const res = await apiClient.get(url);
      setMessages([...res.data.data, ...messages]);
      setHasMore(res.data.hasMore);
    } catch (_) {}
    setLoadingOlder(false);
  };

  const handleTypingEmit = () => {
    const payload = isChannel
      ? { channelId: targetId, userId: userInfo._id, username: userInfo.username }
      : { conversationId: targetId, userId: userInfo._id, username: userInfo.username };
    socket?.emit("typing-start", payload);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("typing-stop", isChannel ? { channelId: targetId, userId: userInfo._id } : { conversationId: targetId, userId: userInfo._id });
    }, 2000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;

    try {
      const formData = new FormData();
      if (text.trim()) formData.append("text", text.trim());
      if (image) formData.append("image", image);
      if (replyingTo) formData.append("replyTo", replyingTo._id);

      const url = isChannel
        ? `${MESSAGE_ROUTES}/channel/${targetId}`
        : `${DM_ROUTES}/${targetId}/messages`;
      await apiClient.post(url, formData);

      setText("");
      setImage(null);
      setImagePreview(null);
      setReplyingTo(null);
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

  const handleReaction = async (messageId, emoji) => {
    try {
      await apiClient.post(`${MESSAGE_ROUTES}/${messageId}/reactions`, { emoji });
    } catch (_) {}
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  if (!targetId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-dark)]">
        <div className="text-center">
          <Hash size={48} className="mx-auto text-[var(--text-muted)] mb-2 opacity-40" />
          <p className="text-[var(--text-muted)]">Select a channel to start chatting</p>
        </div>
      </div>
    );
  }

  const channelName = isChannel ? currentChannel.name : currentConversation?.name || "Direct Message";

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-dark)] min-w-0">
      {/* Header */}
      <div className="h-12 min-h-[48px] flex items-center px-4 border-b border-[var(--border)] gap-2">
        {isChannel && <Hash size={20} className="text-[var(--text-muted)] shrink-0" />}
        <span className="font-semibold text-sm">{channelName}</span>
        {isChannel && currentChannel.topic && (
          <>
            <div className="w-px h-5 bg-[var(--border)] mx-2" />
            <span className="text-xs text-[var(--text-muted)] truncate">{currentChannel.topic}</span>
          </>
        )}
        <div className="flex-1" />
        {isChannel && (
          <button
            onClick={() => setShowMemberSidebar(!showMemberSidebar)}
            className={`p-1.5 rounded hover:bg-[var(--bg-surface)] transition-colors ${
              showMemberSidebar ? "text-white" : "text-[var(--text-muted)]"
            }`}
          >
            <Users size={20} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5 scrollbar-thin"
      >
        {hasMore && (
          <button
            onClick={loadOlder}
            disabled={loadingOlder}
            className="w-full py-2 text-xs text-[var(--violet-lite)] hover:text-[var(--violet)] flex items-center justify-center gap-1"
          >
            <ChevronUp size={14} /> {loadingOlder ? "Loading..." : "Load older messages"}
          </button>
        )}

        {messages.map((msg, i) => {
          const showHeader =
            i === 0 ||
            messages[i - 1].sender?._id !== msg.sender?._id ||
            new Date(msg.createdAt) - new Date(messages[i - 1].createdAt) > 5 * 60 * 1000;

          return (
            <MessageBubble
              key={msg._id}
              msg={msg}
              showHeader={showHeader}
              isOwn={msg.sender?._id === userInfo?._id}
              hovered={hoveredMessage === msg._id}
              onHover={() => setHoveredMessage(msg._id)}
              onLeave={() => setHoveredMessage(null)}
              onReply={() => setReplyingTo(msg)}
              onEdit={() => {
                setEditingMessage(msg._id);
                setEditText(msg.text || "");
              }}
              onDelete={() => handleDelete(msg._id)}
              onReaction={(emoji) => handleReaction(msg._id, emoji)}
              editing={editingMessage === msg._id}
              editText={editText}
              setEditText={setEditText}
              onEditSubmit={() => handleEdit(msg._id)}
              onEditCancel={() => { setEditingMessage(null); setEditText(""); }}
              userId={userInfo?._id}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-[var(--text-muted)]">
          <span className="font-medium">{typingUsers.map((u) => u.username).join(", ")}</span>{" "}
          {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[var(--bg-surface)] border-t border-[var(--border)] flex items-center gap-2">
          <Reply size={14} className="text-[var(--violet-lite)] shrink-0" />
          <span className="text-xs text-[var(--text-muted)]">
            Replying to <span className="font-medium text-[var(--text-primary)]">{replyingTo.sender?.username}</span>
          </span>
          <span className="text-xs text-[var(--text-muted)] truncate flex-1">{replyingTo.text}</span>
          <button onClick={() => setReplyingTo(null)}>
            <X size={14} className="text-[var(--text-muted)]" />
          </button>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-2 bg-[var(--bg-surface)] border-t border-[var(--border)]">
          <div className="relative inline-block">
            <img src={imagePreview} className="h-20 rounded-lg" />
            <button
              onClick={() => { setImage(null); setImagePreview(null); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 pb-4 pt-1">
        <div className="flex items-center gap-2 bg-[var(--bg-surface)] rounded-lg px-3 py-2 border border-[var(--border)] focus-within:border-[var(--violet)]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ImagePlus size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTypingEmit();
            }}
            placeholder={`Message ${isChannel ? "#" + currentChannel.name : channelName}`}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]/50"
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Smile size={20} />
            </button>
            {showEmoji && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker
                  theme="dark"
                  onEmojiClick={(emojiData) => {
                    setText((prev) => prev + emojiData.emoji);
                    setShowEmoji(false);
                  }}
                  width={320}
                  height={400}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!text.trim() && !image}
            className="text-[var(--violet)] hover:text-[var(--violet-lite)] transition-colors disabled:opacity-30"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Message Bubble (Discord-style) ──────────────────────────────────────────
function MessageBubble({
  msg,
  showHeader,
  isOwn,
  hovered,
  onHover,
  onLeave,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  editing,
  editText,
  setEditText,
  onEditSubmit,
  onEditCancel,
  userId,
}) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const time = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = new Date(msg.createdAt).toLocaleDateString();

  return (
    <div
      className={`relative group px-2 py-0.5 rounded hover:bg-[var(--bg-surface)]/30 ${
        showHeader ? "mt-4" : ""
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Reply reference */}
      {msg.replyTo && (
        <div className="flex items-center gap-1.5 ml-14 mb-0.5 text-xs text-[var(--text-muted)]">
          <CornerUpRight size={12} className="shrink-0" />
          <span className="font-medium">{msg.replyTo.sender?.username}</span>
          <span className="truncate max-w-[300px]">{msg.replyTo.text}</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
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

        {/* Content */}
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
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onEditSubmit();
                  if (e.key === "Escape") onEditCancel();
                }}
                className="w-full bg-[var(--bg-deepest)] border border-[var(--border)] rounded px-2 py-1 text-sm outline-none focus:border-[var(--violet)]"
                autoFocus
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Press Enter to save, Escape to cancel
              </p>
            </div>
          ) : (
            <>
              {msg.text && (
                <p className="text-sm break-words">
                  {msg.text}
                  {msg.edited && (
                    <span className="text-[10px] text-[var(--text-muted)] ml-1">(edited)</span>
                  )}
                </p>
              )}
              {msg.image && (
                <img
                  src={msg.image}
                  className="mt-1 max-w-[400px] max-h-[300px] rounded-lg object-contain cursor-pointer"
                  onClick={() => window.open(msg.image, "_blank")}
                />
              )}
            </>
          )}

          {/* Reactions */}
          {msg.reactions?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {msg.reactions.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => onReaction(r.emoji)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                    r.users?.some((u) => (u._id || u).toString() === userId)
                      ? "bg-[var(--violet)]/20 border-[var(--violet)] text-[var(--violet-lite)]"
                      : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--violet)]"
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span>{r.users?.length || 0}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover Action Bar */}
      {hovered && !editing && (
        <div className="absolute -top-3 right-4 flex items-center bg-[var(--bg-card)] border border-[var(--border)] rounded-md shadow-lg overflow-hidden">
          <ActionBtn icon={Smile} onClick={() => setShowReactionPicker(true)} tooltip="React" />
          <ActionBtn icon={Reply} onClick={onReply} tooltip="Reply" />
          {isOwn && <ActionBtn icon={Pencil} onClick={onEdit} tooltip="Edit" />}
          {isOwn && <ActionBtn icon={Trash2} onClick={onDelete} tooltip="Delete" className="text-red-400" />}
        </div>
      )}

      {/* Reaction Picker */}
      {showReactionPicker && (
        <div className="absolute -top-[420px] right-4 z-50">
          <EmojiPicker
            theme="dark"
            onEmojiClick={(emojiData) => {
              onReaction(emojiData.emoji);
              setShowReactionPicker(false);
            }}
            width={320}
            height={400}
          />
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setShowReactionPicker(false)}
          />
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

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { getDmMessagesRoute, MY_CONVERSATIONS_ROUTE } from "@/utils/constants";
import MessageContent from "./MessageContent";
import ChatInput from "./ChatInput";
import { Send, MessageCircle } from "lucide-react";

export default function DmChatArea({ socket }) {
  const { currentConversation, userInfo } = useAppStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  const conversationId = currentConversation?._id || null;
  const other = currentConversation?.participants?.find((p) => p._id !== userInfo?._id);

  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit("join-dm", conversationId);
    return () => {
      socket.emit("leave-dm", conversationId);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    (async () => {
      try {
        const res = await apiClient.get(getDmMessagesRoute(conversationId));
        setMessages(res.data.data);
        scrollToBottom();
      } catch (_) {}
    })();
  }, [conversationId]);

  useEffect(() => {
    if (!socket || !conversationId) return;
    const handleNew = (msg) => {
      if (msg.conversation !== conversationId) return;
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    };
    socket.on("new-dm-message", handleNew);
    return () => socket.off("new-dm-message", handleNew);
  }, [socket, conversationId]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    try {
      await apiClient.post(getDmMessagesRoute(conversationId), { text: text.trim() });
      setText("");
    } catch (_) {}
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-dark)]">
        <div className="text-center">
          <MessageCircle size={48} className="mx-auto text-[var(--text-muted)] mb-2 opacity-40" />
          <p className="text-[var(--text-muted)]">Select a friend to start a direct message</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-dark)] min-w-0">
      <div className="h-12 min-h-[48px] flex items-center px-4 border-b border-[var(--border)] gap-2">
        <img src={other?.profilePic} className="w-6 h-6 rounded-full object-cover" />
        <span className="font-semibold text-sm">{other?.username || "Direct Message"}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg._id} className="flex gap-3 px-2 py-0.5">
            <img src={msg.sender?.profilePic} className="w-8 h-8 rounded-full object-cover mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm">{msg.sender?.username}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <MessageContent text={msg.text} edited={msg.edited} problemMetadata={msg.problemMetadata} />
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="px-4 pb-4 pt-1">
        <div className="flex items-end gap-2 bg-[var(--bg-surface)] rounded-lg px-3 py-2 border border-[var(--border)] focus-within:border-[var(--violet)]">
          <ChatInput
            value={text}
            onChange={setText}
            onSubmit={handleSend}
            placeholder={`Message @${other?.username || ""}`}
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
  );
}

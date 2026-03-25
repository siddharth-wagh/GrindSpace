import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { GET_MY_SERVERS, HOST } from "@/utils/constants";
import ServerSidebar from "@/components/server/ServerSidebar";
import ChannelSidebar from "@/components/server/ChannelSidebar";
import MemberSidebar from "@/components/server/MemberSidebar";
import DMSidebar from "@/components/dm/DMSidebar";
import ChatArea from "@/components/chat/ChatArea";
import FriendsPanel from "@/components/friends/FriendsPanel";

export default function Homepage() {
  const {
    userInfo,
    setServers,
    activeView,
    currentServer,
    currentConversation,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
  } = useAppStore();

  const socketRef = useRef(null);

  // Initialize socket
  useEffect(() => {
    if (!userInfo?._id) return;

    const socket = io(HOST || "http://localhost:8000", {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("user-online", userInfo._id);
    });

    socket.on("user-status-change", ({ userId, status }) => {
      if (status === "online") addOnlineUser(userId);
      else removeOnlineUser(userId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userInfo?._id]);

  // Fetch servers on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(GET_MY_SERVERS);
        setServers(res.data.data);
      } catch (err) {
        console.error("Failed to fetch servers:", err);
      }
    })();
  }, []);

  // Join server rooms when servers change
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const { servers } = useAppStore.getState();
    servers.forEach((s) => socket.emit("join-server", s._id));
  }, [useAppStore((s) => s.servers)]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const socket = socketRef.current;
  const showFriendsPanel = activeView === "dm" && !currentConversation;

  return (
    <div
      className="h-screen w-screen flex overflow-hidden"
      style={{ position: "fixed", inset: 0, background: "var(--bg-deepest)" }}
    >
      {/* Far left: server icons */}
      <ServerSidebar />

      {/* Second column: channel list or DM list */}
      {activeView === "server" && currentServer ? (
        <ChannelSidebar socket={socket} />
      ) : activeView === "dm" ? (
        <DMSidebar socket={socket} />
      ) : (
        <div className="w-60 min-w-[240px] bg-[var(--bg-dark)] border-r border-[var(--border)] flex items-center justify-center">
          <p className="text-sm text-[var(--text-muted)]">Select a server</p>
        </div>
      )}

      {/* Main area: chat or friends panel */}
      {showFriendsPanel ? (
        <FriendsPanel socket={socket} />
      ) : (
        <ChatArea socket={socket} />
      )}

      {/* Right panel: member list (server view only) */}
      {activeView === "server" && currentServer && <MemberSidebar />}
    </div>
  );
}

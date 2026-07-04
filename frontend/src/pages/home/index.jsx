import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { GET_MY_SERVERS, HOST } from "@/utils/constants";
import ServerSidebar from "@/components/server/ServerSidebar";
import ChannelSidebar from "@/components/server/ChannelSidebar";
import RightPanel from "@/components/server/RightPanel";
import ChatArea from "@/components/chat/ChatArea";
import FriendsPanel from "@/components/friends/FriendsPanel";

export default function Homepage() {
  const {
    userInfo,
    setServers,
    activeView,
    currentServer,
    addOnlineUser,
    removeOnlineUser,
  } = useAppStore();

  const socketRef = useRef(null);

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

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const { servers } = useAppStore.getState();
    servers.forEach((s) => socket.emit("join-server", s._id));
  }, [useAppStore((s) => s.servers)]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const socket = socketRef.current;

  return (
    <div
      className="h-screen w-screen flex overflow-hidden"
      style={{ position: "fixed", inset: 0, background: "var(--bg-deepest)" }}
    >
      <ServerSidebar />

      {activeView === "friends" ? (
        <FriendsPanel socket={socket} />
      ) : currentServer ? (
        <>
          <ChannelSidebar socket={socket} />
          <ChatArea socket={socket} />
          <RightPanel />
        </>
      ) : (
        <>
          <div className="w-60 min-w-[240px] bg-[var(--bg-dark)] border-r border-[var(--border)] flex items-center justify-center">
            <p className="text-sm text-[var(--text-muted)]">Select a squad</p>
          </div>
          <ChatArea socket={socket} />
        </>
      )}
    </div>
  );
}

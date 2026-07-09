import { create } from "zustand";

export const useAppStore = create((set, get) => ({
  userInfo: null,
  setUserInfo: (userInfo) => set({ userInfo }),

  servers: [],
  setServers: (servers) => set({ servers }),
  addServer: (server) =>
    set((state) => ({ servers: [...state.servers, server] })),
  removeServer: (serverId) =>
    set((state) => ({
      servers: state.servers.filter((s) => s._id !== serverId),
    })),

  currentServer: null,
  setCurrentServer: (server) => set({ currentServer: server }),

  channels: [],
  setChannels: (channels) => set({ channels }),
  addChannel: (channel) =>
    set((state) => ({ channels: [...state.channels, channel] })),
  removeChannel: (channelId) =>
    set((state) => ({
      channels: state.channels.filter((c) => c._id !== channelId),
    })),

  currentChannel: null,
  setCurrentChannel: (channel) => set({ currentChannel: channel }),

  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== messageId),
    })),
  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, ...updates } : m
      ),
    })),

  members: [],
  setMembers: (members) => set({ members }),

  onlineUsers: new Set(),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  addOnlineUser: (userId) =>
    set((state) => {
      const updated = new Set(state.onlineUsers);
      updated.add(userId);
      return { onlineUsers: updated };
    }),
  removeOnlineUser: (userId) =>
    set((state) => {
      const updated = new Set(state.onlineUsers);
      updated.delete(userId);
      return { onlineUsers: updated };
    }),

  activeView: "server",
  setActiveView: (view) => set({ activeView: view }),

  friends: [],
  setFriends: (friends) => set({ friends }),
  friendRequests: { incoming: [], outgoing: [] },
  setFriendRequests: (friendRequests) => set({ friendRequests }),
  friendsView: "online",
  setFriendsView: (view) => set({ friendsView: view }),

  channelLedger: [],
  setChannelLedger: (list) => set({ channelLedger: list }),
  addLedgerProblem: (problem) =>
    set((state) => {
      const rest = state.channelLedger.filter((p) => p._id !== problem._id);
      return { channelLedger: [problem, ...rest] };
    }),
  ledgerTick: 0,
  bumpLedgerTick: () => set((state) => ({ ledgerTick: state.ledgerTick + 1 })),

  activeContest: null,
  setActiveContest: (contest) => set({ activeContest: contest }),
  scoreboard: [],
  setScoreboard: (rows) => set({ scoreboard: rows }),

  socket: null,
  setSocket: (socket) => set({ socket }),

  showMemberSidebar: true,
  setShowMemberSidebar: (show) => set({ showMemberSidebar: show }),
  rightPanelTab: "members",
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  reset: () =>
    set({
      userInfo: null,
      servers: [],
      currentServer: null,
      channels: [],
      currentChannel: null,
      messages: [],
      members: [],
      onlineUsers: new Set(),
      activeView: "server",
      friends: [],
      friendRequests: { incoming: [], outgoing: [] },
      friendsView: "online",
      channelLedger: [],
      ledgerTick: 0,
      activeContest: null,
      scoreboard: [],
      socket: null,
      showMemberSidebar: true,
      rightPanelTab: "members",
      isLoading: false,
      error: null,
    }),
}));

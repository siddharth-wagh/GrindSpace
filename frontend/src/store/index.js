import { create } from "zustand";

export const useAppStore = create((set, get) => ({
  // ── Auth ───────────────────────────────────────────────────────────────────
  userInfo: null,
  setUserInfo: (userInfo) => set({ userInfo }),

  // ── Servers ────────────────────────────────────────────────────────────────
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

  // ── Channels ───────────────────────────────────────────────────────────────
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

  // ── Messages ───────────────────────────────────────────────────────────────
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

  // ── Members ────────────────────────────────────────────────────────────────
  members: [],
  setMembers: (members) => set({ members }),

  // ── Online Users ───────────────────────────────────────────────────────────
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

  // ── Active View ────────────────────────────────────────────────────────────
  activeView: "server", // "server" | "dm"
  setActiveView: (view) => set({ activeView: view }),

  // ── DM / Conversations ────────────────────────────────────────────────────
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  currentConversation: null,
  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation }),

  // ── Friends ────────────────────────────────────────────────────────────────
  friends: [],
  setFriends: (friends) => set({ friends }),
  friendRequests: { incoming: [], outgoing: [] },
  setFriendRequests: (friendRequests) => set({ friendRequests }),
  friendsView: "online", // "online" | "all" | "pending" | "add"
  setFriendsView: (view) => set({ friendsView: view }),

  // ── Voice ──────────────────────────────────────────────────────────────────
  currentVoiceChannel: null,
  setCurrentVoiceChannel: (channel) => set({ currentVoiceChannel: channel }),
  voiceParticipants: {},
  setVoiceParticipants: (channelId, participants) =>
    set((state) => ({
      voiceParticipants: { ...state.voiceParticipants, [channelId]: participants },
    })),
  isMuted: false,
  setIsMuted: (muted) => set({ isMuted: muted }),
  isDeafened: false,
  setIsDeafened: (deafened) => set({ isDeafened: deafened }),

  // ── Reply ──────────────────────────────────────────────────────────────────
  replyingTo: null,
  setReplyingTo: (message) => set({ replyingTo: message }),

  // ── Problem Ledger ─────────────────────────────────────────────────────────
  channelLedger: [],
  setChannelLedger: (list) => set({ channelLedger: list }),
  addLedgerProblem: (problem) =>
    set((state) => {
      const rest = state.channelLedger.filter((p) => p._id !== problem._id);
      return { channelLedger: [problem, ...rest] };
    }),
  ledgerTick: 0,
  bumpLedgerTick: () => set((state) => ({ ledgerTick: state.ledgerTick + 1 })),

  // ── War Room (live AC) ──────────────────────────────────────────────────────
  warRoomActiveProblem: null,
  setWarRoomActiveProblem: (problem) => set({ warRoomActiveProblem: problem }),
  recentACs: [],
  addRecentAC: (ac) =>
    set((state) => ({ recentACs: [ac, ...state.recentACs].slice(0, 20) })),
  warRoomStatus: {},
  setWarRoomMemberStatus: (userId, info) =>
    set((state) => ({
      warRoomStatus: { ...state.warRoomStatus, [userId]: info },
    })),
  clearWarRoomStatus: () => set({ warRoomStatus: {} }),

  // ── Virtual Contest ─────────────────────────────────────────────────────────
  activeContest: null,
  setActiveContest: (contest) => set({ activeContest: contest }),
  scoreboard: [],
  setScoreboard: (rows) => set({ scoreboard: rows }),

  // ── Command Palette ─────────────────────────────────────────────────────────
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  // ── Oracle ──────────────────────────────────────────────────────────────────
  oracleOpen: false,
  oracleCode: "",
  oracleAnswer: "",
  oracleLoading: false,
  oracleMode: "complexity",
  openOracle: (code) =>
    set({ oracleOpen: true, oracleCode: code, oracleAnswer: "", oracleMode: "complexity" }),
  closeOracle: () => set({ oracleOpen: false }),
  setOracleAnswer: (answer) => set({ oracleAnswer: answer }),
  setOracleLoading: (loading) => set({ oracleLoading: loading }),
  setOracleMode: (mode) => set({ oracleMode: mode }),

  // ── UI ─────────────────────────────────────────────────────────────────────
  showMemberSidebar: true,
  setShowMemberSidebar: (show) => set({ showMemberSidebar: show }),
  rightPanelTab: "members",
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // ── Reset ──────────────────────────────────────────────────────────────────
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
      conversations: [],
      currentConversation: null,
      friends: [],
      friendRequests: { incoming: [], outgoing: [] },
      friendsView: "online",
      currentVoiceChannel: null,
      voiceParticipants: {},
      isMuted: false,
      isDeafened: false,
      replyingTo: null,
      showMemberSidebar: true,
      rightPanelTab: "members",
      channelLedger: [],
      warRoomActiveProblem: null,
      recentACs: [],
      warRoomStatus: {},
      activeContest: null,
      scoreboard: [],
      commandPaletteOpen: false,
      oracleOpen: false,
      oracleCode: "",
      oracleAnswer: "",
      isLoading: false,
      error: null,
    }),
}));

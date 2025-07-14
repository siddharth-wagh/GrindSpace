  import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // User state
  userInfo: null,
  setUserInfo: (userInfo) => set({ userInfo }),

  // Group state
  currentGroup: null,
  setCurrentGroup: (group) => set({ currentGroup: group }),

  // Messages state
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  // UI state
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  
  error: null,
  setError: (error) => set({ error }),

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({
    userInfo: null,
    currentGroup: null,
    messages: [],
    isLoading: false,
    error: null
  })

  //users in current group
  , groupUsers: [],
  setGroupUsers: (users) => set({ groupUsers: users }),

  showGroupDesc:false,
  setshowGroupDesc: (show) => set({ showGroupDesc: show }),
  addlistener : false,
  setAddListener: (listener) => set({ addlistener: listener })
}));
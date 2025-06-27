  import { create } from 'zustand';
  import { createAuthSlice } from "@/store/slices/authslice.js";


  export const useAppStore = create((set,get) => ({
      userInfo: null,
    setUserInfo: (user) => { set({ userInfo: user }) },

    messages:null,
    setMessages:(msg)=>{set({messages:msg})},
    currentGroup:null,
    setCurrentGroup:(grp)=>{
   
      set({currentGroup:grp})
      
    }
  }));
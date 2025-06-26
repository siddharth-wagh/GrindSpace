import { create } from 'zustand';
import { createAuthSlice } from "@/store/slices/authslice.js";


export const useAppStore = create((set,get) => ({
    userInfo: null,
  setUserInfo: (user) => {
   
    set({ userInfo: user })},
}

));
import { create } from 'zustand';
import { createAuthSlice } from "@/store/slices/authslice.js";


export const useAppStore = create((...args) => ({
  ...createAuthSlice(...args),
}));
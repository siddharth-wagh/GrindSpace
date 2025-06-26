export const createAuthSlice = (set, get) => ({
  userInfo: null,
  setUserInfo: (user) => {
   
    set({ userInfo: user })},
});
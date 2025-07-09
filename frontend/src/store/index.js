  import { create } from 'zustand';



  export const useAppStore = create((set,get) => ({
      userInfo: null,
    setUserInfo: (user) => { set({ userInfo: user }) },

    messages:[],
    setMessages:(msg)=>{

      set({messages:msg})
    
    },
    currentGroup:null,
    setCurrentGroup:(grp)=>{
   
      set({currentGroup:grp})
      
    }
  }));
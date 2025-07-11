import React from "react";
import { MessageCircle } from "lucide-react";
import { useAppStore } from "../../store/index.js";
import Sidebar from "../../components/Sidebar.jsx";
import MainFrame from "../../components/MainFrame.jsx";




const Homepage = () => {
  const {currentGroup, setCurrentGroup} = useAppStore();

   React.useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Sidebar placeholder */}
      <div className="w-80 bg-slate-800">
        <div className="p-4 text-white"> <Sidebar/> </div>
      </div>
      
      {currentGroup ? (
        <div className="flex-1 bg-slate-700">
          <div className="p-4 text-white"><MainFrame/></div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to ChatHub
            </h2>
            <p className="text-gray-600 max-w-md">
              Select a group from the sidebar to start chatting or create a new group to begin your conversation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
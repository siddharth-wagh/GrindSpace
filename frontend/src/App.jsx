import Auth from "./pages/auth"
import Homepage from './pages/home'
import Profile from './pages/profile'
import { useAppStore } from "./store";
import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { GET_USER_INFO } from "./utils/constants";
import { apiClient } from "./lib/api-client"; // make sure this is imported
import "./App.css";

function App() {
  const userInfo = useAppStore((state) => state.userInfo);
const setUserInfo = useAppStore((state) => state.setUserInfo);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userInfo !== null) return; 
    const getUserData = async () => {
      try {
        const response = await apiClient.get(GET_USER_INFO, {
          withCredentials: true,
        });
        if (response.status === 200 && response.data._id) {
          setUserInfo(response.data);
         
        } else {
          setUserInfo(undefined);
         
        }
      } catch (error) {
        console.log(error);
        setUserInfo(undefined);
      } finally {
        setLoading(false);
      }
    };

    getUserData(); 
  }, []); 

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <BrowserRouter>
        
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Homepage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

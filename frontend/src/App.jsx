import Auth from "./pages/auth"
import Homepage from './pages/home'
import Profile from './pages/profile'
import { useAppStore } from "./store";
import {} from "./utils/constants";
import { useState ,useEffect} from "react";
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from 'react-router-dom'

import "./App.css";

function App() {
  const { userInfo, setUserInfo } = useAppStore();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await apiClient.get(GET_USER_INFO, {
          withCredentials: true,
        });
        if (response.status === 200 && response.data.user.id) {
          setUserInfo(response.data.user);
        } else {
          setUserInfo(undefined);
        }
        console.log({ response });
      } catch (error) {
        setUserInfo(undefined);
      } finally {
        setLoading(false);
      }
    };
    if (!userInfo) {
      getUserData();
    } else {
      setLoading(false);
    }
  }, [userInfo, setUserInfo]);

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route
            path="/auth"
            element={
             
                <Auth />
              
            }
          />
          <Route
            path="/home"
            element={
              
                
                <Homepage />
              
            }
          />
          <Route
            path="/profile"
            element={
              
                <Profile />
              
            }
          />
          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

import Auth from "./pages/auth";
import Homepage from "./pages/home";
import Profile from "./pages/profile";
import { useAppStore } from "./store";
import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { GET_USER_INFO } from "./utils/constants";
import { apiClient } from "./lib/api-client";
import "./App.css";

const Loader = () => (
  <div
    className="min-h-screen flex flex-col items-center justify-center gap-4"
    style={{ background: "#07070d" }}
  >
    <div className="relative w-14 h-14">
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          border: "3px solid rgba(124,58,237,0.15)",
          borderTopColor: "#7c3aed",
        }}
      />
    </div>
    <p className="text-sm text-slate-500 font-medium tracking-wide">
      Loading GrindSpace...
    </p>
  </div>
);

const PrivateRoute = ({ children }) => {
  const userInfo = useAppStore((state) => state.userInfo);
  if (userInfo === null) return <Loader />;
  return userInfo ? children : <Navigate to="/auth" replace />;
};

const PublicRoute = ({ children }) => {
  const userInfo = useAppStore((state) => state.userInfo);
  if (userInfo === null) return <Loader />;
  return userInfo ? <Navigate to="/home" replace /> : children;
};

function App() {
  const setUserInfo = useAppStore((state) => state.setUserInfo);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      } catch {
        setUserInfo(undefined);
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  if (loading) return <Loader />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Homepage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

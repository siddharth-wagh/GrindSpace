import { SIGNUP_ROUTE, LOGIN_ROUTE } from "@/utils/constants"
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { apiClient } from "@/lib/api-client"; // Add this import

const Auth = () => {
    const navigate = useNavigate();
    const { setUserInfo, userInfo } = useAppStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup
    
    const validateSignup = () => {
        if (!email.length) {
            toast.error("Email is required");
            return false;
        }
        if (!password.length) {
            toast.error("Password is required");
            return false;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return false;
        }
        return true;
    };

    const validateLogin = () => {
        if (!email.length) {
            toast.error("Email is required");
            return false;
        }
        if (!password.length) {
            toast.error("Password is required");
            return false;
        }
        return true;
    };

    const handleLogin = async () => {
        if (validateLogin()) {
            setLoading(true);
            try {
                const response = await apiClient.post(
                    LOGIN_ROUTE,
                    { email, password },
                    { withCredentials: true }
                );
                if (response.status === 200 && response.data.user.id) { // Fixed: was 'res.status'
                    setUserInfo({ ...response.data.user, token: response.data.token }); 
                    if (response.data.user.profileSetup) {
                        navigate("/homepage");
                    } else {
                        navigate("/profile");
                    }
                } else {
                    setUserInfo(undefined);
                }
                console.log({ response });
            } catch (error) {
                setUserInfo(undefined);
                toast.error("Login failed. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleRegister = async () => {
        if (validateSignup()) {
            setLoading(true);
            try {
                const response = await apiClient.post(
                    SIGNUP_ROUTE,
                    { email, password },
                    { withCredentials: true }
                );
                if (response.status === 201) {
                    setUserInfo({ ...response.data.user, token: response.data.token });
                    navigate("/profile");
                }
                console.log(response);
            } catch (error) {
                toast.error("Registration failed. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    const isAuthenticated = !!userInfo;
    
    return isAuthenticated ? (
        <Navigate to="/homepage" /> // Fixed: was 'Navigtate'
    ) : (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Animated background card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
                    {/* Animated gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 animate-pulse"></div>
                    
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {isLogin ? "Welcome Back" : "Create Account"}
                            </h2>
                            <p className="text-white/70">
                                {isLogin ? "Sign in to your account" : "Join us today"}
                            </p>
                        </div>

                        {/* Toggle Tabs */}
                        <div className="flex bg-white/10 rounded-lg p-1 mb-6">
                            <button
                                onClick={() => setIsLogin(true)}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                                    isLogin
                                        ? "bg-white text-purple-600 shadow-lg"
                                        : "text-white/70 hover:text-white"
                                }`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setIsLogin(false)}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                                    !isLogin
                                        ? "bg-white text-purple-600 shadow-lg"
                                        : "text-white/70 hover:text-white"
                                }`}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Form */}
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            {/* Email Field */}
                            <div>
                                <label className="block text-white/80 text-sm font-medium mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Enter your email"
                                        required
                                    />
                                    <svg className="absolute right-3 top-3.5 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-white/80 text-sm font-medium mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <svg className="absolute right-3 top-3.5 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Confirm Password Field (only for signup) */}
                            {!isLogin && (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <label className="block text-white/80 text-sm font-medium mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Confirm your password"
                                            required
                                        />
                                        <svg className="absolute right-3 top-3.5 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="button"
                                onClick={isLogin ? handleLogin : handleRegister}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </div>
                                ) : (
                                    <>
                                        {isLogin ? "Sign In" : "Create Account"}
                                        <svg className="inline-block ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-6 text-center">
                            <p className="text-white/60 text-sm">
                                {isLogin ? "Don't have an account?" : "Already have an account?"}
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="ml-2 text-purple-300 hover:text-purple-200 font-medium transition-colors duration-200"
                                >
                                    {isLogin ? "Sign up" : "Sign in"}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
import { SIGNUP_ROUTE, LOGIN_ROUTE } from "@/utils/constants"
import { toast } from "sonner";
import { useAppStore } from "../../store/index.js";
import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { Eye, EyeOff, Mail, User, Lock, Sparkles, Shield, ArrowRight } from "lucide-react";

const Auth = () => {
    const navigate = useNavigate();
    const userInfo = useAppStore((state) => state.userInfo);
    const setUserInfo = useAppStore((state) => state.setUserInfo);

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [loginIdentifier, setLoginIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [authCheckComplete, setAuthCheckComplete] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await apiClient.get("/api/auth/check", {
                    withCredentials: true,
                });
                if (res.status === 200 && res.data._id) {
                    setUserInfo(res.data);      // Update global state
                    if (res.data.profileSetup === false) {
                        navigate("/profile");
                    } else {
                        navigate("/home");          // Redirect to home if logged in
                    }
                }
            } catch (err) {
                console.log("Not authenticated or error:", err.message);
            } finally {
                setAuthCheckComplete(true);     // Proceed to render form
            }
        };

        checkAuth();
    }, []);

    const validateSignup = () => {
        if (!email.length) {
            toast.error("Email is required");
            return false;
        }
        if (!username.length) {
            toast.error("Username is required");
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
        if (!loginIdentifier.length) {
            toast.error("Email or username is required");
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
                const isEmail = loginIdentifier.includes("@");
                const response = await apiClient.post(
                    LOGIN_ROUTE,
                    isEmail
                        ? { email: loginIdentifier, password }
                        : { username: loginIdentifier, password },
                    { withCredentials: true }
                );
                if (response.status === 200 && response.data._id) {
                    setUserInfo({ ...response.data });
                    if (response.data.profileSetup === false) {
                        navigate("/profile");
                    } else {
                        navigate("/home");
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
                    { email, username, password },
                    { withCredentials: true }
                );
                if (response.status === 201 && response.data._id) {
                    setUserInfo({ ...response.data });
                    // New users always need profile setup
                    navigate("/profile");
                }
            } catch (error) {
                toast.error("Registration failed. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    if (!authCheckComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-slate-200 rounded-full animate-spin border-t-blue-600 mx-auto mb-4"></div>
                        <div className="absolute inset-0 w-20 h-20 border-4 border-blue-400/30 rounded-full animate-ping mx-auto"></div>
                    </div>
                    <p className="text-slate-500 text-lg font-medium">Checking authentication...</p>
                </div>
            </div>
        );
    }

    const isAuthenticated = !!userInfo;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-50 rounded-full blur-3xl animate-pulse delay-2000"></div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-10 left-10 text-blue-300 animate-bounce">
                <Sparkles size={24} />
            </div>
            <div className="absolute bottom-10 right-10 text-blue-300 animate-bounce delay-1000">
                <Shield size={28} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Glassmorphism Card */}
                <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-slate-200 p-8 transform transition-all duration-700 hover:scale-105">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Lock className="text-white" size={28} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">
                            {isLogin ? "Welcome Back" : "Join Us Today"}
                        </h2>
                        <p className="text-slate-500 text-sm">
                            {isLogin ? "Sign in to continue your journey" : "Create your account and start exploring"}
                        </p>
                    </div>

                    {/* Toggle Tabs */}
                    <div className="flex bg-slate-100 rounded-2xl p-1 mb-8 border border-slate-200">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${isLogin
                                ? "bg-blue-600 text-white shadow-lg"
                                : "text-slate-500 hover:text-slate-900 hover:bg-white"
                                }`}
                        >
                            <span className="relative">Login</span>
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${!isLogin
                                ? "bg-blue-600 text-white shadow-lg"
                                : "text-slate-500 hover:text-slate-900 hover:bg-white"
                                }`}
                        >
                            <span className="relative">Sign Up</span>
                        </button>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        {/* Email / Username Field */}
                        {isLogin ? (
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                    {loginIdentifier.includes("@") ? <Mail size={20} /> : <User size={20} />}
                                </div>
                                <input
                                    type="text"
                                    value={loginIdentifier}
                                    onChange={(e) => setLoginIdentifier(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-900 placeholder-slate-400"
                                    placeholder="Email or username"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-900 placeholder-slate-400"
                                    placeholder="Email address"
                                    required
                                />
                            </div>
                        )}

                        {/* Username Field (only for signup) */}
                        {!isLogin && (
                            <div className="relative transform transition-all duration-500">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-900 placeholder-slate-400"
                                    placeholder="Username"
                                    required
                                />
                            </div>
                        )}

                        {/* Password Field */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                <Lock size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-900 placeholder-slate-400"
                                placeholder="Password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {/* Confirm Password Field (only for signup) */}
                        {!isLogin && (
                            <div className="relative transform transition-all duration-500">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-900 placeholder-slate-400"
                                    placeholder="Confirm password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="button"
                            onClick={isLogin ? handleLogin : handleRegister}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl group relative overflow-hidden"
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
                                <div className="flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                    <span className="mr-2">{isLogin ? "Sign In" : "Create Account"}</span>
                                    <ArrowRight size={20} />
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </p>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="mt-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 hover:underline"
                        >
                            {isLogin ? "Create one now" : "Sign in instead"}
                        </button>
                    </div>
                </div>

                {/* Bottom decorative text */}
                <div className="text-center mt-8">
                    <p className="text-slate-400 text-xs">
                        Secure • Fast • Beautiful
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
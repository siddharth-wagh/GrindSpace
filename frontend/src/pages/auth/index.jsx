import { SIGNUP_ROUTE, LOGIN_ROUTE } from "@/utils/constants"
import { toast } from "sonner";
import { useAppStore } from "../../store/index.js";
import { useState ,useEffect} from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { apiClient } from "@/lib/api-client";

const Auth = () => {
    const navigate = useNavigate();
    const userInfo = useAppStore((state) => state.userInfo);
const setUserInfo = useAppStore((state) => state.setUserInfo);

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    
    const [authCheckComplete, setAuthCheckComplete] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await apiClient.get("/api/auth/check", {
                    withCredentials: true,
                });

                if (res.status === 200 && res.data._id) {
                    setUserInfo(res.data);      // Update global state
                    navigate("/home");          // Redirect to home if logged in
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
                if (response.status === 200 && response.data._id) {
                    setUserInfo({ ...response.data}); 
                    
                        navigate("/home");
                   
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
                    setUserInfo({ ...response.data});
                                       
                        navigate("/home");
                    
                }
                // console.log(response);
            } catch (error) {
                toast.error("Registration failed. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };
    if (!authCheckComplete) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white">
            Checking authentication...
        </div>
    );
}

    const isAuthenticated = !!userInfo;
    
    return  (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            {isLogin ? "Welcome Back" : "Create Account"}
                        </h2>
                        <p className="text-gray-600">
                            {isLogin ? "Sign in to your account" : "Join us today"}
                        </p>
                    </div>

                    {/* Toggle Tabs */}
                    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                isLogin
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                !isLogin
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form */}
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        {/* Email Field */}
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Email address"
                                required
                            />
                        </div>

                        {/* Username Field (only for signup) */}
                        {!isLogin && (
                            <div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Username"
                                    required
                                />
                            </div>
                        )}

                        {/* Password Field */}
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Password"
                                required
                            />
                        </div>

                        {/* Confirm Password Field (only for signup) */}
                        {!isLogin && (
                            <div>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Confirm password"
                                    required
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="button"
                            onClick={isLogin ? handleLogin : handleRegister}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                isLogin ? "Sign In" : "Create Account"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="ml-2 text-blue-600 hover:text-blue-500 font-medium"
                            >
                                {isLogin ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
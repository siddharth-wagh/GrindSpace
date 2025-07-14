import axios from "axios";

export const apiClient = axios.create({
    baseURL: import.meta.env.MODE==="development"? "http://localhost:8000":"/api", // <-- Updated to match backend port
    withCredentials: true,
});
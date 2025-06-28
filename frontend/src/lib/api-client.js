import axios from "axios";

export const apiClient = axios.create({
    baseURL: "http://localhost:8000", // <-- Updated to match backend port
    withCredentials: true,
});
import axios from "axios";
import { toast } from "sonner";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || "http://localhost:8000",
  withCredentials: true,              // Important: keeps cookies in request
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || "Something went wrong";
    if (err.response?.status !== 401) {
      toast.error(message);
    }
    return Promise.reject(err);
  }
);

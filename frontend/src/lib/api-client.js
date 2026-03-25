import axios from "axios";

export const apiClient = axios.create({
  baseURL:"http://localhost:8000", // Replace with your IP
  withCredentials: true,              // Important: keeps cookies in request
});

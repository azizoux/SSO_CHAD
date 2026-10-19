import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

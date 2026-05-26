import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const stored = JSON.parse(localStorage.getItem("employee"));
  if (stored?.token) {
    config.headers.Authorization = `Bearer ${stored.token}`;
  }
  return config;
});

export default API;
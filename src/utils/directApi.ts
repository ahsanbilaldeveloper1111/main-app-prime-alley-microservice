import axios from "axios";

/**
 * Same target as the main axios instance — kept as a separate client only
 * for callers that need a different default Content-Type (form-urlencoded).
 */
const directApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3001/api/",
  timeout: 1_000_000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

export default directApi;

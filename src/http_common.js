import axios from "axios";
import config from "./config";
export default axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true, // 允许携带cookie
  headers: {
    "Content-type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0"
  }
});

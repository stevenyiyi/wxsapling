import axios from "axios";

export default axios.create({
  baseURL: "http://localhost/",
  withCredentials: true, // 允许携带cookie
  headers: {
    "Content-type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0"
  }
});

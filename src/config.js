export default {
  apiBaseUrl:
    process.env.NODE_ENV === "production"
      ? "https://wx.anylooker.com/"
      : "https://localhost/",
  resBaseUrl:
    process.env.NODE_ENV === "production"
      ? "https://anylooker.com/"
      : "https://localhost/",
  wssGroupChatUrl:
    process.env.NODE_ENV === "production"
      ? "wss://anylooker.com/ws_group_chat"
      : "wss://localhost/ws_group_chat"
};

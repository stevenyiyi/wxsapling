export default {
  apiBaseUrl:
    process.env.NODE_ENV === "production"
      ? "https://localhost/"///"https://wx.anylooker.com/"
      : "https://localhost/",
  resBaseUrl:
    process.env.NODE_ENV === "production"
      ? "https://localhost/"///"https://anylooker.com/"
      : "https://localhost/",
  wssGroupChatUrl:
    process.env.NODE_ENV === "production"
      ? "wss://localhost/ws_group_chat" ///wss://anylooker.com/ws_group_chat"
      : "wss://localhost/ws_group_chat"
};

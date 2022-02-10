export default {
  apiBaseUrl:
    process.env.NODE_ENV === "production"
      ? "https://a.anylooker.com/"
      : "https://localhost/",
  resBaseUrl:
    process.env.NODE_ENV === "production"
      ? "https://anylooker.com"
      : "https://localhost/",
  googleWebClientId:
    "947434104376-39t4p666elc7s9tlc5ac7hnec6g3oips.apps.googleusercontent.com"
};

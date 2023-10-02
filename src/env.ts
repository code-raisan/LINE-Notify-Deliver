import utils from "./utils";

export default {
  LINE_NOTIFY_OAUTH_CLIENT_ID: process.env.LINE_NOTIFY_OAUTH_CLIENT_ID ?? "XXXXXXXXXX",
  LINE_NOTIFY_OAUTH_CLIENT_SECRET: process.env.LINE_NOTIFY_OAUTH_CLIENT_SECRET ?? "XXXXXXXXXX",
  LINE_NOTIFY_OAUTH_CALLBACK: process.env.LINE_NOTIFY_OAUTH_CALLBACK ?? "http://localhost:3000/oauth/callback",
  REDIS: {
    HOST: process.env.REDIS_HOST ?? "redis",
    PORT: Number(process.env.REDIS_PORT) ?? 6379
  },

  // Should not edit below
  APP_NAME: "LINE Notify Deliver",
  VERSION: utils.DefVal(process.env.npm_package_version, "1.0.0"),
  LINE_NOTIFY_OAUTH_API_ENDPOINT: "https://notify-bot.line.me",
  LINE_NOTIFY_API_ENDPOINT: "https://notify-api.line.me"
}

const { Telegraf } = require("telegraf");
const { handleStart } = require("./app/handlers/botHandlers");
require("dotenv").config();

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const ADMIN_ID = process.env.MY_TELEGRAM_ID;

// Register handlers
bot.start(handleStart);

// Start bot
bot.launch();
console.log("🤖 Bot is running...");
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

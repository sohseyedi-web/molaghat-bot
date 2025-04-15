const characters = require("./app/constant/characters");
const { Telegraf, session } = require("telegraf");
require("dotenv").config();

const {
  handleStart,
  onShowMoreCharacters,
  onWriteCharacters,
  onMainSelection,
  onHelpCommand,
  onShowMainMenu,
  onPreviousCharacters,
  handleMessage,
} = require("./app/handlers/botHandlers");

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const ADMIN_ID = process.env.MY_TELEGRAM_ID;

bot.use(session({ defaultSession: () => ({ page: 0 }) }));

// Register handlers
bot.start(handleStart);
bot.hears("شخصیت های دیگر", onShowMoreCharacters);
bot.hears("/personas", onShowMoreCharacters);
bot.command("help", onHelpCommand);
bot.hears("بازگشت", onPreviousCharacters);
bot.hears("منو اصلی", onShowMainMenu);
bot.hears("شخصیت‌ها", (ctx) => onMainSelection(ctx));
bot.hears("پیشنهاد شخصیت", (ctx) => onMainSelection(ctx));
bot.hears("خرید اشتراک", (ctx) => onMainSelection(ctx));
bot.hears("راهنمای ربات", (ctx) => onMainSelection(ctx));

// Use character selection and message handling
bot.on("text", handleMessage);

// Start bot
bot.launch();
console.log("🤖 Bot is running...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

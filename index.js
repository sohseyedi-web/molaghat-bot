const characters = require("./app/constant/characters");
const { Telegraf } = require("telegraf");
require("dotenv").config();

const {
  handleStart,
  onShowMoreCharacters,
  onWriteCharacters,
  onMainSelection,
} = require("./app/handlers/botHandlers");

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const ADMIN_ID = process.env.MY_TELEGRAM_ID;

// Register handlers
bot.start(handleStart);
bot.hears("شخصیت های دیگر", onShowMoreCharacters);
bot.hears("/personas", onShowMoreCharacters);
bot.hears(/.*/, onMainSelection);
bot.on("text", onWriteCharacters);

characters.forEach((name) => {
  bot.hears(name, (ctx) => {
    ctx.reply(`تو انتخاب کردی: ${name} ✅\nحالا سوالت رو از ${name} بپرس.`);
  });
});

// Start bot
bot.launch();
console.log("🤖 Bot is running...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

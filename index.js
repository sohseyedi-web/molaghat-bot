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
bot.hears(/.*/, onMainSelection);
bot.hears("بازگشت", onPreviousCharacters);
bot.hears("منو اصلی", onShowMainMenu);
bot.on("text", (ctx) => {
  if (characters.includes(ctx.message.text)) {
    ctx.reply(`تو انتخاب کردی: ${ctx.message.text} ✅\nحالا سوالت رو بپرس.`);
  } else {
    onMainSelection(ctx);
    onWriteCharacters(ctx);
  }
});

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

const Fuse = require("fuse.js");
const { Markup } = require("telegraf");
const characters = require("../constant/characters");
const { chunk } = require("../utils/functions");

const fuse = new Fuse(characters, {
  includeScore: true,
  threshold: 0.4,
});

let page = 0;

function handleStart(ctx) {
  const name = ctx.from.first_name || "دوست عزیز";
  const buttons = chunk(characters.slice(0, 9), 3);
  buttons.push(["شخصیت های دیگر"]);

  ctx.reply(
    `سلام ${name} 👋\n\n` +
      `به ربات ما خوش اومدی!\n` +
      `این ربات بهت کمک می‌کنه تا با شخصیت‌های معروف گفت‌وگو کنی و سوالات خودت رو ازشون بپرسی.`,
    Markup.keyboard(buttons).resize().oneTime()
  );
}

function onShowMoreCharacters(ctx) {
  page += 1;
  const nextCharacters = characters.slice(page * 9, (page + 1) * 9);
  if (nextCharacters.length > 0) {
    const buttons = chunk(nextCharacters, 3);
    buttons.push(["شخصیت های دیگر"]);

    ctx.reply("شخصیت‌های بیشتر:", Markup.keyboard(buttons).resize().oneTime());
  } else {
    ctx.reply("دیگه شخصیتی برای نمایش وجود نداره.");
  }
}

function onWriteCharacters(ctx) {
  const input = ctx.message.text.trim();

  const exactMatch = characters.find((c) => c === input);
  if (exactMatch) {
    ctx.reply(
      `شما شخصیت "${exactMatch}" رو انتخاب کردید! حالا می‌تونی سوالت رو بپرسی `
    );
    return;
  }

  const results = fuse.search(input);
  if (results.length === 0) {
    ctx.reply("شخصیتی با این اسم پیدا نشد \nلطفاً دوباره تلاش کن.");
    return;
  }

  const suggestions = results.slice(0, 4).map((result) => result.item);
  ctx.reply(
    "آیا منظور شما یکی از این شخصیت‌هاست؟",
    Markup.keyboard(suggestions.map((item) => [item]))
      .oneTime()
      .resize()
  );
}

module.exports = {
  handleStart,
  onShowMoreCharacters,
  onWriteCharacters,
};

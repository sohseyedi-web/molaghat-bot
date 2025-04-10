const Fuse = require("fuse.js");
const { Markup } = require("telegraf");
const characters = require("../constant/characters");
const { chunk } = require("../utils/functions");

const fuse = new Fuse(characters, {
  includeScore: true,
  threshold: 0.4,
});

const userPages = new Map();

function handleStart(ctx) {
  const name = ctx.from.first_name || "دوست عزیز";

  const welcomeMessage =
    `سلام ${name} 👋\n\n` +
    `به ربات ما خوش اومدی!\n` +
    `این ربات بهت کمک می‌کنه تا با شخصیت‌های معروف گفت‌وگو کنی و سوالات خودت رو ازشون بپرسی.`;

  ctx.reply(welcomeMessage, {
    reply_markup: {
      keyboard: [
        [{ text: "پیشنهاد شخصیت" }, { text: "شخصیت‌ها" }],
        [{ text: "خرید اشتراک" }, { text: "راهنمای ربات" }],
      ],
      resize_keyboard: true,
    },
  });

  userPages.set(ctx.from.id, 0);
}

function showCharactersPage(ctx, page) {
  const userId = ctx.from.id;
  const currentCharacters = characters.slice(page * 9, (page + 1) * 9);
  if (currentCharacters.length > 0) {
    const buttons = chunk(currentCharacters, 3);
    buttons.push(["شخصیت های دیگر"]);
    if (page > 0) buttons.push(["بازگشت"]);
    buttons.push(["منو اصلی"]);

    ctx.reply("لیست شخصیت‌ها:", Markup.keyboard(buttons).resize());
    userPages.set(userId, page);
  } else {
    ctx.reply("دیگه شخصیتی برای نمایش وجود نداره.");
  }
}

function onShowMoreCharacters(ctx) {
  const userId = ctx.from.id;
  const currentPage = userPages.get(userId) || 0;
  const nextPage = currentPage + 1;
  const nextCharacters = characters.slice(nextPage * 9, (nextPage + 1) * 9);

  if (nextCharacters.length > 0) {
    showCharactersPage(ctx, nextPage);
  } else {
    ctx.reply("شخصیت جدیدی برای نمایش وجود نداره.");
  }
}

function onPreviousCharacters(ctx) {
  const userId = ctx.from.id;
  const currentPage = userPages.get(userId) || 0;

  if (currentPage > 0) {
    showCharactersPage(ctx, currentPage - 1);
  } else {
    ctx.reply("شما در صفحه اول هستید.");
    showCharactersPage(ctx, 0);
  }
}

function onShowMainMenu(ctx) {
  ctx.reply("به منوی اصلی برگشتید.", {
    reply_markup: {
      keyboard: [
        [{ text: "پیشنهاد شخصیت" }, { text: "شخصیت‌ها" }],
        [{ text: "خرید اشتراک" }, { text: "راهنمای ربات" }],
      ],
      resize_keyboard: true,
    },
  });

  userPages.set(ctx.from.id, 0);
}

function onHelpCommand(ctx) {
  const helpText = `
📖 راهنمای ربات:

این ربات بهت کمک می‌کنه با شخصیت‌های معروف (تاریخی، علمی، هنری و...) گفت‌وگو کنی.

✅ منو اصلی شامل گزینه‌های زیره:
🔹 شخصیت‌ها: لیستی از شخصیت‌های موجود رو بهت نشون می‌ده. می‌تونی یکی رو انتخاب کنی و سوالتو بپرسی.
🔹 پیشنهاد شخصیت: اگه شخصیتی مد نظرت بود که تو لیست نیست، می‌تونی بهمون پیشنهاد بدی.
🔹 خرید اشتراک: برای دسترسی بیشتر یا سریع‌تر می‌تونی اشتراک بگیری.
🔹 راهنمای ربات: همین بخشه که الان داخلش هستی

📌 نکات مهم:
- برای برگشت از لیست شخصیت‌ها می‌تونی از دکمه "بازگشت" استفاده کنی.
- دکمه "منو اصلی" همیشه تو رو به منوی اول برمی‌گردونه.
- اگه اسم شخصیتی رو نوشتی که دقیق پیدا نشد، سیستم سعی می‌کنه حدس بزنه منظورت کیه.

🤖 هر زمان خواستی، با نوشتن دستور /help این راهنما رو دوباره ببین.

پیشنهاداتت رو هم با کمال میل می‌شنویم!
  `;
  ctx.reply(helpText, {
    reply_markup: {
      keyboard: [["بازگشت"]],
      resize_keyboard: true,
    },
  });
}

function onMainSelection(ctx) {
  const text = ctx.message.text;
  const userId = ctx.from.id;

  if (characters.includes(text)) {
    ctx.reply(`تو انتخاب کردی: ${text} ✅\nحالا سوالت رو از ${text} بپرس.`);
    return;
  }

  switch (text) {
    case "شخصیت‌ها":
      return showCharactersPage(ctx, 0);
    case "شخصیت های دیگر":
      return onShowMoreCharacters(ctx);
    case "پیشنهاد شخصیت":
      return ctx.reply(
        "شما می‌تونید شخصیت پیشنهادی خودتون رو برامون ارسال کنید. 😊"
      );
    case "خرید اشتراک":
      return ctx.reply(
        "برای خرید اشتراک لطفاً به لینک زیر مراجعه کنید:\nhttps://example.com"
      );
    case "راهنمای ربات":
      return onHelpCommand(ctx);
    case "بازگشت":
      return onPreviousCharacters(ctx);
    case "منو اصلی":
      return onShowMainMenu(ctx);
    default:
      return ctx.reply(
        "دستور نامشخصه. لطفاً یکی از گزینه‌های منو رو انتخاب کن."
      );
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
  onMainSelection,
  onHelpCommand,
  onPreviousCharacters,
  onShowMainMenu,
};

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

  const welcomeMessage =
    `سلام ${name} 👋\n\n` +
    `به ربات ما خوش اومدی!\n` +
    `این ربات بهت کمک می‌کنه تا با شخصیت‌های معروف گفت‌وگو کنی و سوالات خودت رو ازشون بپرسی.`;

  ctx.reply(welcomeMessage, {
    reply_markup: {
      keyboard: [
        [{ text: "پیشنهاد شخصیت" }, { text: "شخصیت‌ها" }],
        [
          {
            text: "خرید اشتراک",
          },
          { text: "راهنمای ربات" },
        ],
      ],
      resize_keyboard: true,
    },
  });

  page = 0;
}

function onShowMoreCharacters(ctx) {
  page += 1;
  const nextCharacters = characters.slice(page * 9, (page + 1) * 9);
  if (nextCharacters.length > 0) {
    const buttons = chunk(nextCharacters, 3);

    buttons.push(["شخصیت های دیگر"]);
    buttons.push(["بازگشت", "منو اصلی"]);

    ctx.reply("شخصیت‌های بیشتر:", Markup.keyboard(buttons).resize().oneTime());
  } else {
    const buttons = [["بازگشت", "منو اصلی"]];
    ctx.reply(
      "دیگه شخصیتی برای نمایش وجود نداره.",
      Markup.keyboard(buttons).resize().oneTime()
    );
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

  page = 0;
}

function onPreviousCharacters(ctx) {
  if (page === 1) {
    page = 0;
    onShowMainMenu(ctx);
    return;
  }

  if (page > 1) {
    page -= 1;
    const prevCharacters = characters.slice(page * 9, (page + 1) * 9);
    const buttons = chunk(prevCharacters, 3);
    buttons.push(["بازگشت", "منو اصلی"]);
    buttons.push(["شخصیت های دیگر", "بازگشت", "منو اصلی"]);

    ctx.reply(
      "بازگشت به شخصیت‌های قبلی:",
      Markup.keyboard(buttons).resize().oneTime()
    );
  } else {
    onShowMainMenu(ctx);
  }
}

function onHelpCommand(ctx) {
  const helpText = `
📖 راهنمای ربات:

این ربات بهت کمک می‌کنه با شخصیت‌های معروف (تاریخی، علمی، هنری و...) گفت‌وگو کنی.

✅ منو اصلی شامل گزینه‌های زیره:
🔹 شخصیت‌ها: لیستی از شخصیت‌های موجود رو بهت نشون می‌ده. می‌تونی یکی رو انتخاب کنی و سوالتو بپرسی.
🔹 پیشنهاد شخصیت: اگه شخصیتی مد نظرت بود که تو لیست نیست، می‌تونی بهمون پیشنهاد بدی.
🔹 خرید اشتراک: برای دسترسی بیشتر یا سریع‌تر می‌تونی اشتراک بگیری.
🔹 راهنمای ربات: همین بخشه که الان داخلش هستی 😊

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

  switch (text) {
    case "شخصیت‌ها":
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
};

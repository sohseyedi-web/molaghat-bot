const Fuse = require("fuse.js");
const { Markup } = require("telegraf");
const characters = require("../constant/characters");
const {
  chunk,
  isPersianText,
  containsProfanity,
} = require("../utils/functions");
const { getCharacterReply } = require("../utils/openClient");

const fuse = new Fuse(characters, {
  includeScore: true,
  threshold: 0.4,
  keys: ["name"],
});

const userPages = new Map();
const userConversations = new Map();
const allUsers = new Map();
const broadcastMode = new Map();

function handleStart(ctx) {
  const name = ctx.from.first_name || "دوست عزیز";
  const userId = ctx.from.id;

  // Store user information
  allUsers.set(userId, {
    id: userId,
    firstName: ctx.from.first_name || "",
    lastName: ctx.from.last_name || "",
    username: ctx.from.username || "",
    joinedAt: new Date(),
  });

  const welcomeMessage =
    `سلام ${name} 👋\n\n` +
    `به ربات ما خوش اومدی!\n` +
    `این ربات بهت کمک می‌کنه تا با شخصیت‌های معروف گفت‌وگو کنی و سوالات خودت رو ازشون بپرسی.`;

  // Create different markup for admin vs regular users
  if (userId.toString() === process.env.MY_TELEGRAM_ID) {
    ctx.reply(welcomeMessage, {
      reply_markup: {
        keyboard: [
          [{ text: "پیشنهاد شخصیت" }, { text: "شخصیت‌ها" }],
          [{ text: "خرید اشتراک" }, { text: "راهنمای ربات" }],
          [{ text: "ارسال پیام" }],
        ],
        resize_keyboard: true,
      },
    });
  } else {
    ctx.reply(welcomeMessage, {
      reply_markup: {
        keyboard: [
          [{ text: "پیشنهاد شخصیت" }, { text: "شخصیت‌ها" }],
          [{ text: "خرید اشتراک" }, { text: "راهنمای ربات" }],
        ],
        resize_keyboard: true,
      },
    });
  }

  userPages.set(ctx.from.id, 0);
}

function showCharactersPage(ctx, page) {
  const userId = ctx.from.id;
  const currentCharacters = characters.slice(page * 9, (page + 1) * 9);

  if (currentCharacters.length > 0) {
    const names = currentCharacters.map((c) => c.name);
    const buttons = chunk(names, 3);
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
  const userId = ctx.from.id;

  // Different menu for admin
  if (userId.toString() === process.env.MY_TELEGRAM_ID) {
    ctx.reply("به منوی اصلی برگشتید.", {
      reply_markup: {
        keyboard: [
          [{ text: "پیشنهاد شخصیت" }, { text: "شخصیت‌ها" }],
          [{ text: "خرید اشتراک" }, { text: "راهنمای ربات" }],
          [{ text: "ارسال پیام" }],
        ],
        resize_keyboard: true,
      },
    });
  } else {
    ctx.reply("به منوی اصلی برگشتید.", {
      reply_markup: {
        keyboard: [
          [{ text: "پیشنهاد شخصیت" }, { text: "شخصیت‌ها" }],
          [{ text: "خرید اشتراک" }, { text: "راهنمای ربات" }],
        ],
        resize_keyboard: true,
      },
    });
  }

  userPages.set(ctx.from.id, 0);
  broadcastMode.delete(userId);
}

function onHelpCommand(ctx) {
  const helpText = `
📖 راهنمای ربات:

این ربات بهت کمک می‌کنه با شخصیت‌های معروف (تاریخی، علمی، هنری و...) گفت‌وگو کنی.

✅ منو اصلی شامل گزینه‌های زیره:
🔹 شخصیت‌ها: لیستی از شخصیت‌های موجود رو بهت نشون می‌ده.
🔹 پیشنهاد شخصیت: اگه شخصیتی مد نظرت بود که تو لیست نیست، می‌تونی بهمون پیشنهاد بدی.
🔹 خرید اشتراک: برای دسترسی بیشتر یا سریع‌تر می‌تونی اشتراک بگیری.
🔹 راهنمای ربات: همین بخشه که الان داخلش هستی

📌 نکات مهم:
- دکمه "منو اصلی" همیشه تو رو به منوی اول برمی‌گردونه.
- اگه اسم شخصیتی رو نوشتی که دقیق پیدا نشد، سیستم سعی می‌کنه حدس بزنه منظورت کیه.

🤖 هر زمان خواستی، با نوشتن دستور /help این راهنما رو دوباره ببین.
  `;
  ctx.reply(helpText, {
    reply_markup: {
      keyboard: [["بازگشت"]],
      resize_keyboard: true,
    },
  });
}

function onCharacterSelection(ctx, text) {
  const userId = ctx.from.id;
  userConversations.set(userId, text);

  ctx.reply(`تو انتخاب کردی: ${text} ✅\nحالا سوالت رو از ${text} بپرس.`, {
    reply_markup: {
      keyboard: [[{ text: "بازگشت" }]],
      resize_keyboard: true,
    },
  });
}

function onMenuSelection(ctx, text) {
  const userId = ctx.from.id;

  switch (text) {
    case "شخصیت‌ها":
      return showCharactersPage(ctx, 0);
    case "شخصیت های دیگر":
      return onShowMoreCharacters(ctx);
    case "پیشنهاد شخصیت":
      return ctx.reply("شخصیت پیشنهادی‌تون رو برامون ارسال کنید. 😊");
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
    case "ارسال پیام":
      // Only admin can use this feature
      if (userId.toString() === process.env.MY_TELEGRAM_ID) {
        broadcastMode.set(userId, true);
        return ctx.reply(
          "لطفا پیامی که میخواهید برای همه کاربران ارسال شود را بنویسید:",
          {
            reply_markup: {
              keyboard: [[{ text: "لغو ارسال" }]],
              resize_keyboard: true,
            },
          }
        );
      }
      return ctx.reply("شما دسترسی به این بخش را ندارید.");
    case "لغو ارسال":
      if (userId.toString() === process.env.MY_TELEGRAM_ID) {
        broadcastMode.delete(userId);
        return onShowMainMenu(ctx);
      }
      return;
    default:
      return ctx.reply(
        "دستور نامشخصه. لطفاً یکی از گزینه‌های منو رو انتخاب کن."
      );
  }
}

function onMainSelection(ctx) {
  const text = ctx.message.text.trim();
  const userId = ctx.from.id;

  const character = characters.find((c) => c.name === text);
  if (character) {
    return onCharacterSelection(ctx, text);
  }

  const result = fuse.search(text);
  if (result.length > 0) {
    const suggested = result.slice(0, 4).map((r) => r.item.name);
    return ctx.reply(
      `شخصیت‌های مشابه با «${text}» رو پیدا کردم 👇 لطفاً یکی رو انتخاب کن:`,
      {
        reply_markup: {
          keyboard: [
            ...suggested.map((name) => [{ text: name }]),
            [{ text: "بازگشت" }],
          ],
          resize_keyboard: true,
        },
      }
    );
  }

  return onMenuSelection(ctx, text);
}

function onWriteCharacters(ctx) {
  const input = ctx.message.text.trim();

  const match = characters.find((c) => c.name === input);
  if (match) {
    ctx.reply(
      `شما شخصیت "${match.name}" رو انتخاب کردید! حالا می‌تونی سوالت رو بپرسی`
    );
    return;
  }

  const results = fuse.search(input);
  if (results.length === 0) {
    ctx.reply("شخصیتی با این اسم پیدا نشد \nلطفاً دوباره تلاش کن.");
    return;
  }

  const suggestions = results.slice(0, 4).map((result) => result.item.name);
  ctx.reply(
    "آیا منظور شما یکی از این شخصیت‌هاست؟",
    Markup.keyboard(suggestions.map((item) => [item]))
      .oneTime()
      .resize()
  );
}

async function handleMessage(ctx) {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();

  // Store user in the map if not already
  if (!allUsers.has(userId)) {
    allUsers.set(userId, {
      id: userId,
      firstName: ctx.from.first_name || "",
      lastName: ctx.from.last_name || "",
      username: ctx.from.username || "",
      joinedAt: new Date(),
      lastActive: new Date(),
    });
  } else {
    // Update last active time
    const userData = allUsers.get(userId);
    userData.lastActive = new Date();
    allUsers.set(userId, userData);
  }

  // Check if admin is in broadcast mode
  if (
    userId.toString() === process.env.MY_TELEGRAM_ID &&
    broadcastMode.get(userId) &&
    text !== "لغو ارسال"
  ) {
    await ctx.reply("در حال ارسال پیام به همه کاربران...");
    let successCount = 0;
    let failCount = 0;

    const broadcastPromises = [];
    for (const [recipientId, user] of allUsers.entries()) {
      if (recipientId !== userId) {
        // Don't send to yourself
        const promise = ctx.telegram
          .sendMessage(recipientId, `پیام از مدیریت ربات:\n\n${text}`)
          .then(() => {
            successCount++;
          })
          .catch((err) => {
            console.error(
              `Failed to send message to user ${recipientId}:`,
              err.message
            );
            failCount++;
          });
        broadcastPromises.push(promise);
      }
    }

    await Promise.allSettled(broadcastPromises);

    const resultMessage = `✅ پیام با موفقیت به ${successCount} کاربر ارسال شد.\n❌ ارسال به ${failCount} کاربر ناموفق بود.`;
    await ctx.reply(resultMessage);
    broadcastMode.delete(userId);
    return onShowMainMenu(ctx);
  }

  // Check if the message is in Persian
  if (text !== "بازگشت" && !isPersianText(text)) {
    return ctx.reply("لطفا به زبان فارسی بنویسید.", {
      reply_markup: {
        keyboard: [[{ text: "بازگشت" }]],
        resize_keyboard: true,
      },
    });
  }

  // Check for profanity in message
  if (containsProfanity(text)) {
    return ctx.reply(
      "استفاده از کلمات نامناسب مجاز نیست. لطفا از ادبیات مناسب استفاده کنید.",
      {
        reply_markup: {
          keyboard: [[{ text: "بازگشت" }]],
          resize_keyboard: true,
        },
      }
    );
  }

  const character = userConversations.get(userId);

  if (character && text !== "بازگشت") {
    const loadingMessage = await ctx.reply(
      `${character} به سوالت داره فکر میکنه ...`
    );

    try {
      const answer = await getCharacterReply(character, text);
      await ctx.deleteMessage(loadingMessage.message_id);
      await ctx.reply(answer);
    } catch (err) {
      console.error(err);
      await ctx.deleteMessage(loadingMessage.message_id);
      ctx.reply("❌ مشکلی پیش اومد. لطفاً دوباره تلاش کن.");
    }

    return;
  }

  if (text === "بازگشت") {
    userConversations.delete(userId);
    return onShowMainMenu(ctx);
  }

  return onMainSelection(ctx);
}

// Function to handle admin commands
function handleAdminCommand(ctx) {
  const userId = ctx.from.id;
  if (userId.toString() !== process.env.MY_TELEGRAM_ID) {
    return ctx.reply("شما دسترسی به این دستور را ندارید.");
  }

  const userCount = allUsers.size;
  const activeUsersLast24h = [...allUsers.values()].filter(
    (user) => new Date() - user.lastActive < 24 * 60 * 60 * 1000
  ).length;

  ctx.reply(
    `📊 آمار ربات:\n\n👥 تعداد کل کاربران: ${userCount}\n👤 کاربران فعال در 24 ساعت گذشته: ${activeUsersLast24h}`
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
  handleMessage,
  handleAdminCommand,
};

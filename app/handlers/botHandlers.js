function handleStart(ctx) {
  const name = ctx.from.first_name || "دوست عزیز";
  ctx.reply(
    `سلام ${name} 👋\n\n` +
      `به ربات ما خوش اومدی!\n` +
      `این ربات بهت کمک می‌کنه تا با شخصیت‌های معروف گفت‌وگو کنی و سوالات خودت رو ازشون بپرسی.`
  );
}

module.exports = {
  handleStart,
};

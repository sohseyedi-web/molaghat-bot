const OpenAI = require("openai");
const characters = require("../constant/characters");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
  baseURL: process.env.OPENAI_URL,
});

async function getCharacterReply(characterName, userQuestion) {
  const character = characters.find((c) => c.name === characterName);
  if (!character) {
    return "این شخصیت در لیست وجود ندارد.";
  }

  const prompt = `
تو در نقش ${character.name} هستی. ${character.style}

کاربر از تو سوالی می‌پرسد. با لحن و دیدگاه ${character.name} پاسخ بده. پاسخ باید مختصر (۲ تا ۳ خط) ولی عمیق و مفهومی باشد.

سوال: ${userQuestion}
پاسخ:
  `;

  const res = await openai.completions.create({
    model: "gpt-4o-mini",
    prompt,
    max_tokens: 300,
    temperature: 0.9,
  });

  return res.choices[0].text.trim();
}

module.exports = { getCharacterReply };

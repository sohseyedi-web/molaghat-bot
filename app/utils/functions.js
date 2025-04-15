const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const profanityList = require("../constant/profanity");

function toPersianNumbersWithComma(n) {
  const numWithCommas = numberWithCommas(n);
  const persianNumber = toPersianNumbers(numWithCommas);
  return persianNumber;
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toPersianNumbers(n) {
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
}

// Function to check if text is Persian/Farsi
function isPersianText(text) {
  // Persian Unicode range: \u0600-\u06FF
  // Additional Persian characters: \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF
  const persianRegex =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return persianRegex.test(text);
}

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Function to check for profanity and inappropriate content in Persian
function containsProfanity(text) {
  if (!text || typeof text !== "string") return false;

  const normalizedText = text.replace(/\s+/g, " ").trim().toLowerCase();

  const profanityListWithoutSpaces = profanityList.map((word) =>
    word.replace(/\s+/g, "")
  );

  for (let word of profanityList) {
    if (normalizedText.includes(word)) {
      console.log(`Found profanity: "${word}" in text: "${normalizedText}"`);
      return true;
    }
  }

  const textWithoutSpaces = normalizedText.replace(/\s+/g, "");
  for (let word of profanityListWithoutSpaces) {
    if (textWithoutSpaces.includes(word)) {
      console.log(
        `Found profanity (no spaces): "${word}" in text: "${textWithoutSpaces}"`
      );
      return true;
    }
  }

  return false;
}

module.exports = {
  toPersianNumbersWithComma,
  toPersianNumbers,
  chunk,
  isPersianText,
  containsProfanity,
};

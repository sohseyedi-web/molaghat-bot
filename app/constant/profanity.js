require("dotenv").config();

const profanityList = process.env.PROFANITY_LIST
  ? process.env.PROFANITY_LIST.split(",").map((word) => word.trim())
  : [];

module.exports = profanityList;

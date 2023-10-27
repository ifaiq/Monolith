/* eslint-disable no-console */
const LanguageDetect = require("languagedetect");
const langDetector = new LanguageDetect();
const { LANGUAGES: { EN, UR, AR } } = require("./Constants");
const moment = require("moment");

/**
 * Detect language of text
 * @param {String} text
 * @returns {String} language
 */
const detectLanguage = text => {
  let detectedLanguage = "";
  const languages = langDetector.detect(text);
  for (const language of languages) {
    if (language[0] === EN) {
      detectedLanguage = EN;
      break;
    }
    if (language[0] === UR) {
      detectedLanguage = UR;
      break;
    }
    if (language[0] === AR) {
      detectedLanguage = AR;
      break;
    }
  }
  return detectedLanguage;
};

/**
 * function responsible to split path and check for request params and reconstruct path if there are any
 * @param {string} path
 * @returns path
 */
const getPath = async path => {
  // check if the path has some integers
  const re = /^\d+$/;
  let splitPath = path.split("/");

  for (const val of splitPath) {
    if (re.test(val)) {
      const indexOfInteger = splitPath.indexOf(val);
      splitPath[indexOfInteger] = "?";
    }
  }

  splitPath = splitPath.join("/");
  return splitPath;
};


/** *
 * function return datetime with timeOffset added
 */
const currentDateTimeWithTimeOffSet = clientTimeOffset =>
  moment(new Date())
    .add(clientTimeOffset % (60 * 24), "m")
    .utc();
module.exports = {
  detectLanguage,
  getPath,
  currentDateTimeWithTimeOffSet,
};

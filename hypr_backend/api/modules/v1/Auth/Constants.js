const constants = {
  COMPANY_CODE: "RET",
};

const LANGUAGES = {
  "en-Us": 1,
  "ur-Us": 2,
  "ar-Us": 3,
  "ru-Us": 4,
  getKeyFromValue: value => Object.keys(LANGUAGES).find(key => LANGUAGES[key] === value),
};

const APPS = {
  CONSUMER: "CONSUMER",
  HISAAB: "HISAAB",
};

module.exports = {
  constants,
  LANGUAGES,
  APPS,
};

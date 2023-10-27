const { setLanguage } = require("../../utils/languageAccessor");

module.exports = async function (req, res, next) {
  const { headers: { language} } = req;
  language ? setLanguage(language) : setLanguage(sails.config.i18n.defaultLocale);
  next();
};

/**
 * This function gets language and sets it sails
 * @param {Number} language
 */
const setLanguage = (language) => sails.hooks.i18n.setLocale(language);


/**
 * This function returns language from sails
 * @returns {Array} products
 */
const getLanguage = () => sails.hooks.i18n.getLocale();

module.exports = {
  setLanguage,
  getLanguage,
};
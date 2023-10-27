
const { MultiLingualAttributes } = require("../../../constants/enums");
const { getLanguage } = require("../../../../utils/languageAccessor");
/**
 * Mapper to extract essential attributes from the database object
 *
 * @param {Object} category
 * OR
 * @param {Object} brand
 *
 * @returns {Object} response brand OR category
 */
const toGetFunnelResponse = obj => {
  let localName;
  if (obj.multilingual) {
    localName = obj.multilingual.find(
      item =>
        item.language === getLanguage() &&
        item.attributeName === MultiLingualAttributes.NAME,
    );
  }
  return ({
    id: obj.id,
    name: localName ? localName.value : obj.name,
    imageUrl: obj.imageUrl,
    priority: obj.priority,
  });
};

module.exports = {
  toGetFunnelResponse,
};

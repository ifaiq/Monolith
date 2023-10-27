const { errors: { BUSINESS_UNIT_NOT_FOUND } } = require("./Errors");
const snakecaseKeys = require("snakecase-keys");
const camelcaseKeys = require("camelcase-keys");
const businessUnitExtractionService = require("../../../config_service_extraction/businessUnitExtraction");

/**
 * This function takes the id and return business unit.
 *
 * @param {Number} id
 * @returns {Object} business unit
 */
const findById = async id => await findByCheckedId(id);

/**
 * Function finds a business unit
 * @param {object} criteria
 * @returns {business_unit{}}
 */
const findOne = criteria => businessUnitExtractionService.findOne(criteria);

/**
* This function takes the id and return business unit.
*
* @param {Number} id
* @returns {business unit} business unit
*/
const findByCheckedId = async id => {
  const businessUnit = await businessUnitExtractionService.findOne({ id });
  if (_.isEmpty(businessUnit)) {
    throw BUSINESS_UNIT_NOT_FOUND;
  }
  return camelcaseKeys(businessUnit);
};

/**
* This function takes criteria and returns business unit.
*
* @param {Number} criteria
* @returns {business unit} business unit
*/
const findByCriteria = async criteria =>
  camelcaseKeys(
    await businessUnitExtractionService.find(snakecaseKeys(criteria)),
  );

module.exports = {
  findById,
  findOne,
  findByCriteria,
};

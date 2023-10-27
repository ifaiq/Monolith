const { errors: { LOCATION_NOT_FOUND } } = require("./Errors");
const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");
const locationExtractionService = require("../../../config_service_extraction/locationsExtraction");

/**
 * This function takes the id and return location.
 *
 * @param {Number} id
 * @returns {Object} location
 */
const findByCheckedId = async id => {
  const location = await locationExtractionService.findOne({ id });
  if (_.isEmpty(location)) {
    throw LOCATION_NOT_FOUND();
  }
  return camelcaseKeys(location);
};

/**
 * This function takes the id and return location.
 *
 * @param {Number} id
 * @returns {Object} location
 */
const find = async id => await findByCheckedId(id);

/**
 * This function takes the skip, limit and return locations.
 *
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Location[]} locations
 */
const findAll = async (skip, limit) => await Location.find().skip(skip).limit(limit);

/**
 * This function takes the criteria and return locations count.
 *
 * @param {Object} criteria
 * @returns {Number} total location
 */
const count = async criteria => await Location.count(criteria);

/**
 * This function takes the id, location and return updated location.
 *
 * @param {Number} id
 * @param {Object} location
 * @returns {Object} location
 */
const update = async (id, location) => await Location.updateOne({ id }, location);

/**
 * This function takes the location and return new location.
 *
 * @param {Object} location
 * @returns {Object} location
 */
const create = async location => await Location.create(location);

/**
* This function takes criteria and returns business unit.
*
* @param {Number} criteria
* @returns {business unit} business unit
*/
const findByCriteria = async criteria =>
  camelcaseKeys(
    await locationExtractionService.find(snakecaseKeys(criteria)),
  );

module.exports = {
  findAll,
  create,
  update,
  count,
  find,
  findByCriteria,
};

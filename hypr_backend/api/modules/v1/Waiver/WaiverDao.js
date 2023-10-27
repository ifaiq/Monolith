const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");

/**
 * This function takes the criteria and return waiver.
 *
 * @param {Object} criteria
 * @returns {Object} waiver
 */
const findbyCriteria = async criteria => camelcaseKeys(await Waiver.findOne(snakecaseKeys(criteria)));

module.exports = {
  findbyCriteria,
};

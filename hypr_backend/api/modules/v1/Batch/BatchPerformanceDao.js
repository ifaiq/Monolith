const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");

/**
 * This function takes the performance data and return new batch performance.
 *
 * @param {Object} batch performance
 * @returns {Object} batch performance
 */
const create = async data => await BatchPerformance.create(snakecaseKeys(data));

/**
 * This function takes the criteria and return batch performance.
 *
 * @param {Number} criteria
 * @returns {Object} batch performance
 */
const findByCriteria = async criteria => {
  const performance = await BatchPerformance.find(snakecaseKeys(criteria));
  if (performance?.length) {
    return camelcaseKeys(performance[0]);
  }
  return {};
};

module.exports = {
  create,
  findByCriteria,
};

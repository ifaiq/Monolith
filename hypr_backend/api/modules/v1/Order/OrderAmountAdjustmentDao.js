const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");

/**
 * This function takes the criteria and return Order Amount Adjustment.
 *
 * @param {Object} criteria
 * @returns {Object} OrderAmountAdjustment
 */
const findbyCriteria = async criteria => {
  const orderAmountAdjustment = await OrderAmountAdjustment.findOne(snakecaseKeys(criteria));
  return camelcaseKeys(orderAmountAdjustment);
};

module.exports = {
  findbyCriteria,
};

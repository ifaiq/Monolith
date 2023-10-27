const { DIFFERENCE_REASONS, RETURN_RESONS, NON_CASH_TYPES } = require("./Constants");
/**
 * method to return validated differenceReason
 * @param {Number} differenceReason
 * @returns {Boolean}
 */
const validateDifferenceReason = differenceReason =>
  Object.keys(DIFFERENCE_REASONS).find(
    key => DIFFERENCE_REASONS[key] === differenceReason,
  );

/**
 * method to return validated returnReason
 * @param {Number} returnReason
 * @returns {Boolean}
 */
const validateReturnReason = returnReason =>
  Object.keys(RETURN_RESONS).find(key => RETURN_RESONS[key] === returnReason);

/**
 * method to return validated nonCashType
 * @param {Number} nonCashType
 * @returns {Boolean}
 */
const validateNonCashType = nonCashType => Object.keys(NON_CASH_TYPES).find(key => NON_CASH_TYPES[key] === nonCashType);

/**
 * method to return validated nonCashType
 * @param {Array[]<object>} items
 * @returns {object}
 */
const convertIntoKeyValuePair = (
  items,
  key,
) => {
  const keyValuePair = {};
  items.forEach(item => {
    keyValuePair[item[key]] = item;
  });
  return keyValuePair;
};


module.exports = {
  validateDifferenceReason,
  validateReturnReason,
  validateNonCashType,
  convertIntoKeyValuePair,
};

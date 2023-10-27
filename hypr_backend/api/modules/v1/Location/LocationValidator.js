const { errors: { LOCATION_INVALID } } = require("./Errors");

/**
 * Function validates if business unit takes the businessUnitIdCustomer, businessUnitIdLocation and throw exception
 *
 * @param {*} businessUnitIdCustomer
 * @param {*} businessUnitIdLocation
 */
const validateCustomerLocation = (businessUnitIdCustomer, businessUnitIdLocation) => {
  if (businessUnitIdCustomer !== businessUnitIdLocation) {
    throw LOCATION_INVALID();
  }
};
/**
 *
 * @param {*} agentLocationIds
 * @param {*} customerLocationId
 */
const validateSalesAgentLocation = (agentLocationIds, customerLocationId) => {
  if (!agentLocationIds.includes(customerLocationId)) {
    throw { data: LOCATION_INVALID() };
  }
};

module.exports = {
  validateCustomerLocation,
  validateSalesAgentLocation,
};

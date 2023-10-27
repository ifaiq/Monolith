const { findCustomerById: findCustomerByCustomerId } = require("./CustomerRetailerLocationDao");

/**
 * Function takes customerId and returns customerLocation
 * @param {Number} customerId
 * @returns [{Object}] customerLocation
 */
const findCustomerById = async customerId =>
  await findCustomerByCustomerId(customerId);

module.exports = { findCustomerById };

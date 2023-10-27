const customerExtractionService = require("../../../user_service_extraction/customerService");

/**
 * This function takes the id and returns customer.
 *
 * @param {Number} id
 * @returns {Object} customer
 */
const findCustomer = async id => await customerExtractionService.findOne({ id });

/**
 * This function takes the id and update customer.
 *
 * @param {Number} id
 * @returns {Object} customer
 */
const updateCustomer = async (id, customer) => await customerExtractionService.update({ id }, customer);

module.exports = {
  findCustomer,
  updateCustomer,
};

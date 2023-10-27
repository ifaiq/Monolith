const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");
const customerAddressExtraction = require("../../../user_service_extraction/customerAddressService");
const { errors: { ADDRESS_NOT_FOUND } } = require("./Errors");
/**
 * This file is responsible for communication between service
 * and database customer_addresses.
 */

/**
 * This method is responsible for adding a customer's address
 * @param customerAddress to be saved
 */
const createCustomerAddress = async customerAddress => await CustomerAddress.create(customerAddress);

/**
 * This method is responsible for fetching customer address by customerId
 * @param customerId whom address to be fetched
 * @returns customerAddress
 */
const findAddressByCustomerId = async customerId => await customerAddressExtraction.find({ customerId, limit: 1 });

/**
* This function takes the customerId and return customerAddress.
*
* @param {Number} customerId
* @returns {customerAddress} customerAddress
*/
const findByCheckedId = async customerId => {
  // TODO Need to change the schema and update the find() with findOne()
  const customerAddresses = await customerAddressExtraction.find({ customerId, limit: 1 });
  if (_.isEmpty(customerAddresses)) {
    throw ADDRESS_NOT_FOUND();
  }
  return camelcaseKeys(customerAddresses[0]);
};

/**
 * This method is responsible for updating a customer's address
 * @param customerId
 * @param customerAddress to be updated
 */
const updateCustomerAddress = async (customerId, customerAddress) =>
  await CustomerAddress.updateOne(snakecaseKeys({ customerId }), customerAddress);


module.exports = {
  createCustomerAddress,
  findAddressByCustomerId,
  findByCheckedId,
  updateCustomerAddress,
};

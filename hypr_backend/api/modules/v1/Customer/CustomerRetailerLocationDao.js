const { errors: { CUSTOMER_RETAILER_LOCATION_NOT_FOUND } } = require("./Errors");
const camelcaseKeys = require("camelcase-keys");


/**
 * Function finds customerLocation by Id
 * @param {Number} id
 * @returns {Object} customerLocation
 */
const findByCheckedId = async id => {
  const customerLocation = await CustomerRetailerLocations.findOne({ id });
  if (_.isEmpty(customerLocation)) {
    throw CUSTOMER_RETAILER_LOCATION_NOT_FOUND();
  }
  return customerLocation;
};

/**
 * Function takes id and returns customerRetailerLocation entity
 * @param {Number} id
 * @returns {Object} customerRetailerLocation entity
 */
const find = async id => await findByCheckedId(id);

/**
 * Function finds all customerLocations
 * @param {Number} skip
 * @param {Number} limit
 * @returns {customerLocations[]}
 */
const findAll = async (skip, limit) => await CustomerRetailerLocations.find().skip(skip).limit(limit);

/**
 * Function takes the criteria and return coupon count.
 * @param {Object} criteria
 * @returns {Number} total customer_retailer_locations
 */
const count = async criteria => await CustomerRetailerLocations.count(criteria);

/**
 * Function takes id and customerLocation and returns updated customerLocation
 * @param {Number} id
 * @param {Object} customerLocation
 * @returns {Object} customerLocation
 */
const update = async (id, customerLocation) => await CustomerRetailerLocations.updateOne({ id }, customerLocation);

/**
 * Function takes customerLocation entity and returns created customerLocation
 * @param {Object} customerLocation
 * @returns {Object} customerLocation
 */
const create = async customerLocation => await CustomerRetailerLocations.create(customerLocation);

/**
 * Function finds customerLocation by customerId
 * @param {Number} customerId
 * @returns {Object} customerLocation
 */
const findCustomerById = async customerId => {
  const customer = await Customer.find({ customerId });
  if (_.isEmpty(customer)) {
    // TODO improve this msg
    throw CUSTOMER_RETAILER_LOCATION_NOT_FOUND();
  }
  return camelcaseKeys(customer);
};
module.exports = {
  findAll,
  create,
  update,
  count,
  find,
  findCustomerById,
};

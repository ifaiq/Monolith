const camelcaseKeys = require("camelcase-keys");

/**
 * This method is responsible to find customer enabled features list
 * @param customerId for whom feature list to be fetched
 * @returns {Promise<*>} feature list
 */
const findCustomerFeaturesList = async customerId =>
  camelcaseKeys(
    await CustomerFeatureJunction.find({ customer_id: customerId }).populate(
      "feature_id",
    ),
  );

module.exports = {
  findCustomerFeaturesList,
};

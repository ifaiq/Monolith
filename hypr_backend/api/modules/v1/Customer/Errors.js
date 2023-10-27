const errors = {

  CUSTOMER_RETAILER_LOCATION_NOT_FOUND: () => ({
    code: 1400,
    message: sails.__("CUSTOMER_RETAILER_LOCATION_NOT_FOUND"),
  }),
};
module.exports = { errors };

const errors = {

  CART_NOT_FOUND: () => ({
    code: 1200,
    message: sails.__("CART_NOT_FOUND"),
  }),
  MULTIPLE_SHIPMENTS_ON_COD_WALLET: () => ({
    code: 1202,
    // TODO: add localized error strings
    message: sails.__("MULTIPLE_SHIPMENTS_ON_COD_WALLET"),
  }),
};

module.exports = { errors };

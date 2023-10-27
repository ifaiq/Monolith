const errors = {
  INVALID_THERMAL_INVOICE_ORDER_STATUS: () => ({
    code: 2100,
    message: sails.__("INVALID_THERMAL_INVOICE_ORDER_STATUS"),
  }),
  INVOICE_NOT_FOUND: () => ({
    code: 2101,
    message: sails.__("INVOICE_NOT_FOUND"),
  }),

};
module.exports = { errors };

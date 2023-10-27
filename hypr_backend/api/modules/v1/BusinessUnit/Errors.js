const errors = {
  BUSINESS_UNIT_NOT_FOUND: () => ({
    code: 2200,
    message: sails.__("BUSINESS_UNIT_NOT_FOUND"),
  }),
};

module.exports = { errors };

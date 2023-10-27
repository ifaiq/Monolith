const errors = {

  LOCATION_NOT_FOUND: () => ({
    code: 1900,
    message: sails.__("LOCATION_NOT_FOUND"),
  }),
  LOCATION_INVALID: () => ({
    code: 1901,
    message: sails.__("LOCATION_INVALID"),
  }),
  LOCATION_BANNER_NOT_FOUND: () => ({
    code: 1902,
    message: sails.__("LOCATION_BANNER_NOT_FOUND"),
  }),
};

module.exports = {errors};

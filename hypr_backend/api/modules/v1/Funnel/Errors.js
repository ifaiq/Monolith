const errors = {
  CATEGORY_NOT_FOUND: () => ({
    code: 1500,
    message: sails.__("CATEGORY_NOT_FOUND"),
  }),
  SUBCATEGORIES_NOT_FOUND: () => ({
    code: 1501,
    message: sails.__("SUBCATEGORIES_NOT_FOUND"),
  }),
  LOCATION_CATEGORIES_NOT_FOUND: () => ({
    code: 1502,
    message: sails.__("LOCATION_CATEGORIES_NOT_FOUND"),
  }),
  SUBBRANDS_NOT_FOUND: () => ({
    code: 1503,
    message: sails.__("SUBBRANDS_NOT_FOUND"),
  }),
  LOCATION_BRANDS_NOT_FOUND: () => ({
    code: 1504,
    message: sails.__("LOCATION_BRANDS_NOT_FOUND"),
  }),
  FUNNELS_NOT_FOUND: () => ({
    code: 1505,
    message: sails.__("FUNNELS_NOT_FOUND"),
  }),
};

module.exports = { errors };

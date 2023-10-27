const errors = {

  ORDER_NOT_FOUND: () => ({
    code: 1000,
    statusCode: 404,
    message: sails.__("ORDER_NOT_FOUND"),
  }),
  ORDER_ITEM_NOT_FOUND: () => ({
    code: 1001,
    message: sails.__("ORDER_ITEM_NOT_FOUND"),
  }),
  ORDER_TOTAL_LESS_THAN_MIN_LIMIT: () => ({
    code: 1003,
    message: sails.__("ORDER_TOTAL_LESS_THAN_MIN_LIMIT"),
  }),
  ORDER_TOTAL_MORE_THAN_MAX_LIMIT: limit => ({
    code: 1004,
    message: sails.__("ORDER_TOTAL_MORE_THAN_MAX_LIMIT", limit),
  }),
  ORDER_HISTORY_NOT_FOUND: () => ({
    code: 1005,
    message: sails.__("ORDER_HISTORY_NOT_FOUND"),
  }),
  ORDER_STATUS_HISTORY_NOT_FOUND: () => ({
    code: 1006,
    message: sails.__("ORDER_STATUS_HISTORY_NOT_FOUND"),
  }),
  INVALID_ORDER_STATUS: () => ({
    code: 1007,
    message: sails.__("INVALID_ORDER_STATUS"),
  }),
  MISSING_ORDER_ITEMS: () => ({
    code: 1008,
    message: sails.__("MISSING_ORDER_ITEMS"),
  }),
  MISSING_CUSTOMER_ID: () => ({
    code: 1009,
    message: sails.__("MISSING_CUSTOMER_ID"),
  }),
  UNABLE_TO_PLACE_ORDER: () => ({
    code: 1010,
    message: sails.__("UNABLE_TO_PLACE_ORDER"),
  }),
  INVALID_CUSTOMER_LOCATION: () => ({
    code: 1011,
    message: sails.__("INVALID_CUSTOMER_LOCATION"),
  }),
  INVALID_USER_ID: () => ({
    code: 1012,
    message: sails.__("INVALID_USER_ID"),
  }),
  SPOT_PRODUCT_NOT_FOUND: () => ({
    code: 1013,
    statusCode: 404,
    message: sails.__("SPOT_PRODUCT_NOT_FOUND"),
  }),
};

module.exports = {errors};

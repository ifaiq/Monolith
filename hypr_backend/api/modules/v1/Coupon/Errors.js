const errors = {

  COUPON_NOT_FOUND: () => ({
    code: 1100,
    message: sails.__("COUPON_NOT_FOUND"),
  }),
  MORE_THAN_ONE_ACTIVE_COUPON: () => ({
    code: 1101,
    message: sails.__("MORE_THAN_ONE_ACTIVE_COUPON"),
  }),
  COUPON_EXPIRY: () => ({
    code: 1102,
    message: sails.__("COUPON_EXPIRY"),
  }),
  COUPON_DISABLED: () => ({
    code: 1103,
    message: sails.__("COUPON_DISABLED"),
  }),
  COUPON_NOT_STARTED: () => ({
    code: 1104,
    message: sails.__("COUPON_NOT_STARTED"),
  }),
  NO_PRODUCTS_ELIGIBLE: () => ({
    code: 1105,
    message: sails.__("NO_PRODUCTS_ELIGIBLE"),
  }),
  MIN_VALUE_FOR_COUPON: couponLimit => ({
    code: 1106,
    message: sails.__("MIN_VALUE_FOR_COUPON", couponLimit),
  }),
  COUPON_NOT_VALID_FOR_LOCATION: () => ({
    code: 1107,
    message: sails.__("COUPON_NOT_VALID_FOR_LOCATION"),
  }),
  COUPON_USAGE_LIMIT_EXHAUSTED: () => ({
    code: 1108,
    message: sails.__("COUPON_USAGE_LIMIT_EXHAUSTED"),
  }),
  COUPON_NOT_VALID_FOR_ROLE: () => ({
    code: 1109,
    message: sails.__("COUPON_NOT_VALID_FOR_ROLE"),
  }),
  COUPON_NOT_VALID_FOR_CUSTOMER: () => ({
    code: 1110,
    message: sails.__("COUPON_NOT_VALID_FOR_CUSTOMER"),
  }),
  MIN_VALUE_FOR_COUPON_WL_BL: () => ({
    code: 1111,
    message: sails.__("MIN_VALUE_FOR_COUPON_WL_BL"),
  }),
  INVALID_COUPON_PRODUCTS: (couponId, productListType) => ({
    code: 1112,
    message: sails.__("INVALID_COUPON_PRODUCTS", couponId, productListType),
  }),
  COUPON_SERVICE_ERROR: () => ({
    code: 1113,
    message: sails.__("COUPON_SERVICE_ERROR"),
  }),
  MIN_COUPON_LIMIT_BATCH_FLOW: couponLimit => ({
    code: 1114,
    message: sails.__("MIN_COUPON_LIMIT_BATCH_FLOW", couponLimit),
  }),

};

module.exports = { errors };

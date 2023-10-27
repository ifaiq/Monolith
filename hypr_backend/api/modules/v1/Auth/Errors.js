const errors = {

  IMPLEMENTATION_MISSING: () => ({
    code: 1601,
    message: sails.__("IMPLEMENTATION_MISSING"),
  }),
  CUSTOMER_INFO_MISSING: () => ({
    code: 1602,
    message: sails.__("CUSTOMER_INFO_MISSING"),
  }),
  SHOP_INFO_MISSING: () => ({
    code: 1603,
    message: sails.__("SHOP_INFO_MISSING"),
  }),
  SUPERVISOR_ID_NULL: () => ({
    code: 165,
    message: sails.__("SUPERVISOR_ID_NULL"),
  }),
  CUSTOMER_ALREADY_EXIST: () => ({
    code: 1606,
    message: sails.__("CUSTOMER_ALREADY_EXIST"),
  }),
  COMPANY_NOT_FOUND: () => ({
    code: 1607,
    message: sails.__("COMPANY_NOT_FOUND"),
  }),
  LOCATION_NOT_FOUND: () => ({
    code: 1608,
    message: sails.__("LOCATION_NOT_FOUND"),
  }),
  USER_NOT_FOUND: () => ({
    code: 1610,
    message: sails.__("USER_NOT_FOUND"),
  }),
  CUSTOMER_NOT_FOUND: () => ({
    code: 1611,
    message: sails.__("CUSTOMER_NOT_FOUND"),
  }),
  SHOP_NAME_MISSING: () => ({
    code: 1612,
    message: sails.__("SHOP_NAME_MISSING"),
  }),
  SHOP_TYPE_MISSING: () => ({
    code: 1613,
    message: sails.__("SHOP_TYPE_MISSING"),
  }),
  SHOP_LOCATION_MISSING: () => ({
    code: 1614,
    message: sails.__("SHOP_LOCATION_MISSING"),
  }),
  ACCOUNT_DISABLED: () => ({
    code: 1615,
    message: sails.__("ACCOUNT_DISABLED"),
  }),
  PIN_CODE_NOT_SET: () => ({
    code: 1616,
    message: sails.__("PIN_CODE_NOT_SET"),
  }),
  CUSTOMER_NOT_VERIFIED: () => ({
    code: 1617,
    message: sails.__("CUSTOMER_NOT_VERIFIED"),
  }),
  BAD_CREDENTIALS: () => ({
    code: 1618,
    message: sails.__("BAD_CREDENTIALS"),
  }),
  ADDRESS_NOT_FOUND: () => ({
    code: 1619,
    message: sails.__("ADDRESS_NOT_FOUND"),
  }),
  ADDRESS_LINE_1_NOT_FOUND: () => ({
    code: 1620,
    message: sails.__("ADDRESS_LINE_1_NOT_FOUND"),
  }),
  COORDINATES_NOT_FOUND: () => ({
    code: 1621,
    message: sails.__("COORDINATES_NOT_FOUND"),
  }),
  USER_DISABLED: () => ({
    code: 1622,
    message: sails.__("USER_DISABLED"),
  }),
  TOKEN_ERROR: () => ({
    code: 1624,
    message: sails.__("TOKEN_ERROR"),
  }),
  DELIVERED_COORDINATES_NOT_FOUND: () => ({
    code: 16229,
    message: sails.__("DELIVERED_COORDINATES_NOT_FOUND"),
  }),
  ORDER_MODE_NOT_FOUND: () => ({
    code: 1630,
    message: sails.__("ORDER_MODE_NOT_FOUND"),
  }),
  INVALID_LANGUAGE_SELECTION: () => ({
    code: 1631,
    message: sails.__("INVALID_LANGUAGE_SELECTION"),
  }),
  CUSTOMER_DISABLED: () => ({
    code: 1632,
    message: sails.__("CUSTOMER_DISABLED"),
  }),
  AUTH_STORE_NOT_FOUND: () => ({
    code: 1633,
    message: sails.__("AUTH_STORE_NOT_FOUND"),
  }),
  CUSTOMER_UNVERIFIED: () => ({
    code: 1634,
    message: sails.__("CUSTOMER_UNVERIFIED"),
  }),
  USER_ALREADY_EXIST_WITH_SAME_NUMBER: () => ({
    code: 1635,
    message: sails.__("USER_ALREADY_EXIST_WITH_SAME_NUMBER"),
  }),
  ACCESS_DENIED: () => ({
    code: 1646,
    message: sails.__("ACCESS_DENIED"),
  }),
  INVALID_TAX_ID: () => ({
    code: 1647,
    message: sails.__("INVALID_TAX_ID"),
  }),
  TAX_ID_EXISTS: () => ({
    code: 1648,
    message: sails.__("TAX_ID_EXISTS"),
  }),
  TAX_ID_SHOULD_BE_15_CH: () => ({
    code: 1649,
    message: sails.__("TAX_ID_SHOULD_BE_15_CH"),
  }),
  CUSTOMER_PROFILE_UPDATE_REQUIRED: () => ({
    code: 1634,
    message: sails.__("CUSTOMER_PROFILE_UPDATE_REQUIRED"),
  }),
};
module.exports = { errors };

/**
 * This file is responsible for validation of user's request for different APIs
 */
const {
  errors: {
    CUSTOMER_INFO_MISSING,
    ADDRESS_NOT_FOUND,
    SHOP_INFO_MISSING,
    // SUPERVISOR_ID_NULL,
    SHOP_NAME_MISSING,
    SHOP_TYPE_MISSING,
    SHOP_LOCATION_MISSING,
    ADDRESS_LINE_1_NOT_FOUND,
    COORDINATES_NOT_FOUND,
    DELIVERED_COORDINATES_NOT_FOUND,
    ORDER_MODE_NOT_FOUND,
    TAX_ID_EXISTS,
    INVALID_TAX_ID,
    ACCESS_DENIED,
  },
} = require("./Errors");

/**
 * This method is responsible to validate customer's details in the request
 * @param customer to be validated
 */
const validateCustomer = customer => {
  if (_.isEmpty(customer)) {
    throw CUSTOMER_INFO_MISSING();
  }

  const { orderMode, address } = customer;

  /**
   * According to Document, this validation shouldn't be in place as supervisor id is optional

  if (_.isEmpty(selfSignUp) && !selfSignUp && !supervisorId) {
    throw SUPERVISOR_ID_NULL();
  }
  */

  if (!orderMode) {
    throw ORDER_MODE_NOT_FOUND();
  }

  if (_.isEmpty(address)) {
    throw ADDRESS_NOT_FOUND();
  }

  const { addressLine1, coordinates, deliveredLocationCordinates } = address;
  if (_.isEmpty(addressLine1)) {
    throw ADDRESS_LINE_1_NOT_FOUND();
  }

  if (_.isEmpty(coordinates)) {
    throw COORDINATES_NOT_FOUND();
  }

  if (_.isEmpty(deliveredLocationCordinates)) {
    throw DELIVERED_COORDINATES_NOT_FOUND();
  }
};

/**
 * This method is responsible to validate shop object in the request
 * @param shop to be validated
 */
const validateShop = shop => {
  if (_.isEmpty(shop)) {
    throw SHOP_INFO_MISSING();
  }

  const { name, typeId, location } = shop;

  if (_.isEmpty(name)) {
    throw SHOP_NAME_MISSING();
  }

  if (!typeId) {
    throw SHOP_TYPE_MISSING();
  }

  if (_.isEmpty(location)) {
    throw SHOP_LOCATION_MISSING();
  }
};

/**
 * Function takes the userId and customerId and checks if they match.
 * @param {Number} userId
 * @param {Number} customerId
 */
const validateCustomerTaxId = taxId => {
  if (taxId) {
    if (taxId === 0 || Number(taxId) < 0 || _.uniq(String(taxId)).length === 1 || String(taxId).charAt(0) === "0") {
      throw { data: INVALID_TAX_ID() };
    }
  }
};

/**
 * This method is responsible to validate customer's signUp request
 * @param body to be validated
 */
const validateCustomerSignUp = body => {
  const { customer, shop } = body;
  validateCustomerTaxId(body.taxId);
  validateCustomer(customer);
  validateShop(shop);
};

const validateTaxId = taxId => {
  if (taxId) {
    // eslint-disable-next-line no-throw-literal
    throw { data: TAX_ID_EXISTS() };
  }
};

/**
 * Function takes the userId and customerId and checks if they match.
 * @param {Number} userId
 * @param {Number} customerId
 */
const validateUser = (userId, customerId) => {
  if (userId !== customerId) {
    throw ACCESS_DENIED();
  }
};

module.exports = {
  validateCustomerSignUp,
  validateTaxId,
  validateUser,
  validateCustomerTaxId,
};

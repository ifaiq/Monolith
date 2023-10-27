/**
 * This file is responsible for communication between service
 * and database table customers.
 */
const camelcaseKeys = require("camelcase-keys");
const customerExtractionService = require("../../../user_service_extraction/customerService");
const notificationExtractionService = require("../../../notification_service_extraction/userNotificationService");
const {
  errors: {
    CUSTOMER_ALREADY_EXIST,
    CUSTOMER_NOT_FOUND,
    CUSTOMER_DISABLED,
    PIN_CODE_NOT_SET,
    CUSTOMER_NOT_VERIFIED,
    TAX_ID_EXISTS,
  },
} = require("./Errors");

/**
 * This method is responsible to return customer if exists by phone
 * Otherwise returns null
 * @param phone to be checked
 * @returns {Promise<*>} customer
 */
const findCustomerByPhone = async (phone, companyId) => (await customerExtractionService.find({ phone, companyId }))[0];


/**
 * This method is responsible to create a new customer
 * @param customer to be created
 * @returns {customer} newly created customer
 */
const createCustomer = customer => customerExtractionService.create(customer);

/**
 * This method is responsible to update customer's credentials
 * @param id customer to update
 * @param pinCode new pinCode
 * @param verificationCode new verificationCode
 * @returns {Promise<*>} nothing
 */
const updateCredentials = async (id, pinCode, verificationCode) => await customerExtractionService.update({ id }, {
  pin_code: pinCode,
  verification_code: verificationCode,
});

/**
 * This method verifies that customer does not exist in table
 * If exists, it will throw exception CUSTOMER_ALREADY_EXIST
 * @param phone to be checked
 * @returns {Promise<void>} nothing
 */
const verifyCustomerNotExists = async (phone, companyId) => {
  const customer = (await customerExtractionService.find({ phone, companyId }))[0];
  if (customer) {
    throw CUSTOMER_ALREADY_EXIST();
  }
};

/**
 * This method verifies that customer does not exist in table
 * If exists, it will throw exception TAX_ID_EXISTS
 * @param taxId to be checked
 * @returns {Promise<void>} nothing
 */
const verifyTaxIdNotExists = async taxId => {
  const customer = (await customerExtractionService.find({ taxId }))[0];
  if (customer) {
    throw TAX_ID_EXISTS();
  }
};

/**
 * This method is responsible to returned checked customer.
 * If customer not found, it throws exception CUSTOMER_NOT_FOUND
 * @param phone to be checked
 * @returns {Promise<*>} customer
 */
const findCustomerByPhoneChecked = async (phone, companyId) => {
  const customer = await findCustomerByPhone(phone, companyId);

  if (!customer) {
    throw CUSTOMER_NOT_FOUND();
  }

  return customer;
};

/**
 * This method is responsible to fetch a customer that is not disabled, verified, pin_code is set
 * In short, it is ready to place an order
 * @param phone to be find out
 * @returns {Promise<{verified_at}|{pin_code}|*>} customer
 */
const findActiveCustomerByPhoneChecked = async phone => {
  const customer = await findCustomerByPhoneChecked(phone);

  if (customer.disabled) {
    throw CUSTOMER_DISABLED();
  }

  if (customer.pin_code === null) {
    throw PIN_CODE_NOT_SET();
  }

  if (customer.verified_at === null) {
    throw CUSTOMER_NOT_VERIFIED();
  }

  return customer;
};

/**
 * This method is responsible to update customer based on criteria
 * @param criteria
 * @param customer
 * @returns {Promise<|*>} customer
 */
const update = async (criteria, customer) => await customerExtractionService.update(criteria, customer);

/**
 * This function takes the id and returns customer.
 *
 * @param {Number} id
 * @returns {Array} customer
 */
const findCustomerById = async id => camelcaseKeys(await customerExtractionService.findOne({ id }));

/**
 * This function takes the cnic and returns customerId.
 *
 * @param {Number} cnic
 * @returns {Number} customerId
 */
const findCustomerIdByPhone = async (phone, companyId) => {
  const customer = (await customerExtractionService.find({ phone, companyId }))[0];

  if (!customer) {
    sails.log.info(`No customer found against phone ${phone}`);
    throw CUSTOMER_NOT_FOUND();
  }

  return customer.id;
};

/**
 * This function takes the customerId and returns playerIds.
 *
 * @param {Number} customerId
 * @returns {Object} customer with populated player id's
 */
const findCustomerWithPlayerIds = async id => {
  const customer = await customerExtractionService.findOne({ id });
  if (!customer) {
    throw CUSTOMER_NOT_FOUND();
  }
  customer.notification_ids = await notificationExtractionService.find({ customer_id: id });

  return camelcaseKeys(customer, { deep: true });
};

module.exports = {
  verifyCustomerNotExists,
  findCustomerByPhone,
  findCustomerByPhoneChecked,
  findActiveCustomerByPhoneChecked,
  createCustomer,
  updateCredentials,
  findCustomerById,
  update,
  findCustomerIdByPhone,
  verifyTaxIdNotExists,
  findCustomerWithPlayerIds,
};

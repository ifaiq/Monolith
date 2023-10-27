/**
 * This file is responsible for handling all the requests related to users[For any role].
 */
const {
  createCustomerAddress,
  findByCheckedId,
  updateCustomerAddress,
} = require("./CustomerAddressDao");

const {
  createShop,
  findShopByCustomerId,
  updateShop,
} = require("./CustomerShopDao");

const {
  validateCustomerSignUp,
  validateTaxId,
} = require("./UserValidator");

const {
  findCustomerByPhoneChecked,
  findCustomerIdByPhone,
  findCustomerByPhone: getCustomerByPhone,
  verifyCustomerNotExists,
  createCustomer,
  update: updateCustomer,
  findCustomerById,
  verifyTaxIdNotExists,
} = require("./CustomerDao");

const {
  verifyUserNotExistWithSamePhone,
} = require("./UserDao");

const {
  findCompanyByCodeChecked,
} = require("./CompanyDao");

const {
  deleteSessionByCustomerId,
  deleteSessionBySessionUuId,
} = require("./SessionDao");

const {
  findCustomerFeaturesList,
} = require("./CustomerFeatureDao");

const {
  customerToSendSMS,
  customerPinSMSBody,
  toCustomer,
  toCustomerShopDetails,
  toCustomerAddress,
  toCustomerDto,
  toUserDto,
  toCustomerDetailsDto,
  toFeatureIdsDto,
  toFeatureCustomersDto,
} = require("./UserMapper");

const {
  randomCode,
} = require("./Utils");

const {
  getStoresForLocation,
} = require("../../../services/LocationService");

const {
  hashPassword,
  comparePinCode,
  verifyToken,
  comparePassword,
} = require("../../../services/CipherService");

const {
  sendClientMessage,
} = require("../../../services/SmsService");

const {
  errors: {
    IMPLEMENTATION_MISSING,
    BAD_CREDENTIALS,
    USER_DISABLED,
    ACCOUNT_DISABLED,
    CUSTOMER_UNVERIFIED,
    ACCESS_DENIED,
    CUSTOMER_NOT_FOUND,
  },
} = require("./Errors");

const {
  constants: {
    CUSTOMER_SIGNUP_API_MSG,
    SESSION_CLOSED_MSG,
    NEW_PIN_SENT_MSG,
  },
} = require("./Messages");

const {
  constants: { COMPANY_CODE },
  LANGUAGES,
  APPS: { CONSUMER, HISAAB },
} = require("./Constants");
const { LANGUAGE } = require("../../../services/Constants");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const { HyprRoles: {
  CONSUMER: CONSUMER_ROLE,
  SUPERVISOR,
  ADMIN },
} = require("../../../services/Constants");

const {
  UserNotificationService: {
    deleteUserNotificationCustomerIdPlayerId,
  },
} = require("../UserNotification");
const { findHierarchyFeaturesByBusinessUnitId } = require("../HierarchyFeatures");
const { errors: { USER_NOT_FOUND } } = require("./Errors");
const userExtractionService = require("../../../user_service_extraction/userService");
const { businessUnitService: {
  getBusinessUnitById,
} } = require("../BusinessUnit");
const { default: axios } = require("axios");
const { BNPL_WALLET, PAYMENT_WALLET, OTP_SERVICE } = require("../../../constants/account_deletion");
const orderDao = require("../Order/OrderDao");
const { ORDER_STATES: {
  IN_TRANSIT, RESERVED, ON_HOLD, PACKED, PARTIAL_DELIVERED, DELIVERED,
} } = require("../Order/Constants");
const { findBatchDetailsByOrderId } = require("../Batch/BatchOrderDao");
const {  BATCH_STATES: { CLOSED }, USECASE, SERVICE_NAME } = require("../Batch/Constants");
const { createServiceToken } = require("@development-team20/auth-library/dist");
const userRolesExtractionService = require("../../../rbac_service_extraction/userRolesService");
const authStoreExtractionService = require("../../../rbac_service_extraction/authStoreService");

/**
 * This method is responsible to create a new user
 * @param appType which app hit the API
 * @param body request details
 * @returns basic info of newly created user
 */
const signUp = async (appType, body) => {
  const logIdentifier = `API version: ${v1}, Context: UserService.sigclearnUp(),`;
  sails.log(`${logIdentifier}`);
  if (appType === CONSUMER) {
    return customerSignUp(body);
  } else if (appType === HISAAB) {
    return customerHisaabSignUp(body);
  }
  sails.log.error(`${logIdentifier} Error: signUp error: ${IMPLEMENTATION_MISSING()}`);
  throw IMPLEMENTATION_MISSING();
};

/**
 * This method is responsible to create a new session of user
 * @param appType which app hit the API
 * @param body request details
 * @returns session details
 */
const signIn = async (appType, body) => {
  const logIdentifier = `API version: ${v1}, Context: UserService.signIn(),`;
  sails.log(`${logIdentifier}`);
  if ((appType === CONSUMER)) {
    const response = await customerSignIn(body, false);
    if (response.customerNotFound) {
      return acquisitionUserSignIn(body);
    }
    return response;
  }
  sails.log.error(`${logIdentifier} Error: signIn error: ${IMPLEMENTATION_MISSING()}`);
  throw IMPLEMENTATION_MISSING();
};

/**
 * This method is responsible to terminate session of user
 * @param appType which app hit the API
 * @param authorization token to be expired
 * @returns session terminated successfully.
 */
const signOut = (appType, authorization, { playerId }) => {
  const logIdentifier = `API version: ${v1}, Context: UserService.signOut(),`;
  sails.log(`${logIdentifier}`);
  if (appType === CONSUMER) {
    return customerSignOut(authorization, playerId);
  }
  sails.log.error(`${logIdentifier} Error: signOut error: ${IMPLEMENTATION_MISSING()}`);
  throw IMPLEMENTATION_MISSING();
};

/**
 * This method is responsible to clear user's current session and generate a new pinCode and
 * verificationCode and send an SMS to customer's phone
 * @param appType which app hit the API
 * @param body request details
 * @returns {Promise<{message}>}
 */
const forgotPassword = (appType, body) => {
  const logIdentifier = `API version: ${v1}, Context: UserService.forgotPassword(),`;
  sails.log(`${logIdentifier}`);
  if (appType === CONSUMER || appType === HISAAB) {
    return customerForgotPassword(body, appType);
  }
  sails.log.error(`${logIdentifier} Error: forgotPassword error: ${IMPLEMENTATION_MISSING()}`);
  throw IMPLEMENTATION_MISSING();
};

/**
 * Responsible to fetch customer details by phone
 * @param phone to be searched
 * @returns customer details DTO
 * @private
 */
const findCustomerByPhone = async (phoneFromQuery, role, phoneFromToken) => {
  const logIdentifier = `API version: V1, Context: userService.findCustomerByPhone(),`;
  sails.log(`${logIdentifier}`);
  // ADDITIONAL STEP TO CHECK VALID USER ROLE
  if (![CONSUMER_ROLE, SUPERVISOR].includes(role)) {
    sails.log.error(`${logIdentifier} Error: Access Denied ${ACCESS_DENIED()}`);
    throw ACCESS_DENIED();
  }
  /**
   * CASE: SUPERVISOR/SALES_AGENT phone_from_token => SUPERVISOR, phone_from_query => CONSUMER
   * CASE: CONSUMER phone_from_token => CONSUMER, phone_from_query => UNDEFINED
  */
  sails.log.info(`role: ${role}, phone_from_token: ${phoneFromToken}, phone_from_query: ${phoneFromQuery}`);
  const phone = role === CONSUMER_ROLE ? phoneFromToken : phoneFromQuery;
  const company = await findCompanyByCodeChecked(COMPANY_CODE);
  sails.log(`${logIdentifier} company: ${JSON.stringify(company)}`);
  const customer = await findCustomerByPhoneChecked(phone, company.id);

  customer.role = Constants.HyprRolesObject.CONSUMER;
  sails.log(`${logIdentifier} customer: ${JSON.stringify(customer)}`);

  if (_.isEmpty(customer)) {
    sails.log.error(`${logIdentifier} Error: Customer Not Found ${JSON.stringify(CUSTOMER_NOT_FOUND())}`);
    return { data: CUSTOMER_NOT_FOUND() };
  }
  if (customer.disabled) {
    sails.log.error(`${logIdentifier} Error: Customer Disabled ${JSON.stringify(ACCOUNT_DISABLED())}`);
    throw { data: ACCOUNT_DISABLED() };
  }
  if (!customer.verified_at) {
    sails.log.error(`${logIdentifier} Error: Customer Unverified ${JSON.stringify(CUSTOMER_UNVERIFIED)}`);
    throw { data: CUSTOMER_UNVERIFIED() };
  }

  const address = await findByCheckedId(customer.id);
  const shop = await findShopByCustomerId(customer.id);
  const coords = JSON.parse(shop.shop_location);
  sails.log(
    `${logIdentifier} address: ${JSON.stringify(
      address,
    )}, shop: ${JSON.stringify(shop)}, coordinates: ${JSON.stringify(coords)}`,
  );
  /**
  * TODO
  * In tech debt this function will be removed from here and locationId pass in
  * req.user object using policy
  */
  const locations = await getStoresForLocation("", { lat: coords.latitude, lng: coords.longitude }, company.id);
  const features = await findHierarchyFeaturesByBusinessUnitId(locations && locations[0]?.business_unit_id);

  return toCustomerDetailsDto(customer, address, shop, _.isEmpty(locations) ? [] : locations[0], features);
};

/**
 * This method is responsible for customer's signUp
 * @param customer request details
 * @returns basic info of newly created customer
 */
const customerSignUp = async customer => {
  const { phone, taxId } = customer;
  const logIdentifier = `API version: V1, Context: userService.customerSignUp(),`;
  const company = await findCompanyByCodeChecked(COMPANY_CODE);
  sails.log(`${logIdentifier} company: ${JSON.stringify(company)}`);
  validateCustomerSignUp(customer);
  await verifyCustomerNotExists(phone, company.id); // to avoid conflict with other companies data

  // check if user exists ( other then customer role ) with the same phone number
  await verifyUserNotExistWithSamePhone(phone);

  if (taxId) {
    // check if user exists ( other then customer role ) with the same tax id
    await verifyTaxIdNotExists(taxId);
  }

  let businessUnitId = null;
  // TODO: We'll update this when we'll update location service
  const coords = JSON.parse(customer.customer.address.coordinates);
  /**
    * TODO
           * In tech debt this function will be removed from here and locationId pass in
           * req.user object using policy
           */
  const locations = await getStoresForLocation(
    "",
    {
      lat: coords.latitude,
      lng: coords.longitude,
    },
    company.id,
  );
  if (Array.isArray(locations) && locations.length > 0) {
    businessUnitId = locations[0].business_unit_id;
  }

  const verificationCode = randomCode();
  const pinCode = await hashPassword(verificationCode);
  const mappedCustomer = toCustomer(
    customer,
    verificationCode,
    pinCode,
    company.id,
    businessUnitId,
    taxId,
  );
  const createdCustomer = await createCustomer(mappedCustomer);

  sails.log.info(
    `${logIdentifier} customer created: ${JSON.stringify(createdCustomer)}`,
  );
  let shop = toCustomerShopDetails(createdCustomer.id, customer);
  shop = await createShop(shop);

  sails.log.info(
    `${logIdentifier} customerId: ${createdCustomer.id
    } customer shop created: ${JSON.stringify(shop)}`,
  );
  let customerAddress = toCustomerAddress(
    createdCustomer.id,
    customer.customer.address,
  );
  customerAddress = await createCustomerAddress(customerAddress);

  const features = await findHierarchyFeaturesByBusinessUnitId(businessUnitId);

  sails.log.info(
    `${logIdentifier} customerId: ${createdCustomer.id
    } customer address created: ${JSON.stringify(customerAddress)}`,
  );
  sendClientMessage(
    customerToSendSMS(createdCustomer),
    customerPinSMSBody(company.name, verificationCode),
  );

  sendCustomerSignupEmail(customer, company);

  return {
    message: CUSTOMER_SIGNUP_API_MSG(),
    customerId: createdCustomer.id,
    shopId: shop.id,
    customerAddressId: customerAddress.id,
    features: toFeatureIdsDto(features),
  };
};

/**
 * This method sends an email on customer signup
 * @param body request details
 * @param company
 */
const sendCustomerSignupEmail = async (body, company, hisaab = false) => {
  // const recipients = JSON.parse(company.emails);
  const logIdentifier = `API version: V1, Context: userService.sendCustomerSignupEmail(),`;
  const subject =
    company.name +
    " Customer On-Board Notification - " +
    new Date();

  sails.log(`${logIdentifier} subject: ${subject}`);
  // const bodyHtml = hisaab ?
  //   `<h2>New Customer OnBoarded through hisaab<h2>
  //   <br><p> - Customer Phone: ${body.phone} </p>` :
  //   `<h2>New Customer OnBoarded<h2>
  //   <br><p> - Customer Name: ${body.name} </p>
  //   <br><p> - Customer Area: ${body.customer.address.cityArea} </p>
  //   <br><p> - Shop Name: ${body.shop.name} </p>
  //   <br><p> - Shop Lat/Lng: ${body.shop.location}</p><br>`;

  // MailerService.sendEmailThroughAwsSes(recipients, subject, bodyHtml);
};

/**
 * This method is responsible to find a user by phone and has a role of SUPERVISOR
 * @param phone to be fetched
 * @returns {Promise<void>} user
 */
// Deprecated function
const findAcquisitionUserByPhoneChecked = async phone => {
  const users = await userExtractionService.getAll({ phone });
  const userRoles = await userRolesExtractionService.find({
    userId: users.map(user => user.id),
    select: "userId,roleId",
  });
  users.map(user => {
    const role = (userRoles.find(userRole => userRole.user_id === user.id)).role_id;
    user.role_id = role;
    return user;
  });
  if (!users) {
    throw USER_NOT_FOUND();
  }

  let acquisitionUser = await users.filter(u => u.role_id === Constants.HyprRoles.SUPERVISOR)[0];
  if (!acquisitionUser) {
    throw USER_NOT_FOUND();
  }
  /**
   * purpose of fetching it again is to utilize toJson ORM function, results from
   * query will fail on toJson, either we refactor the create token flow, which is not
   * being refactored or do this change below
   */
  acquisitionUser = await userExtractionService.getOne({ id: acquisitionUser.id });
  return acquisitionUser;
};

/**
 * This method is responsible for acquisitionUser to signIn on Consumer App
 * @param body request details
 * @returns new token along with some customer's details
 */
const acquisitionUserSignIn = async (body, tokenNotRequired = false) => {
  const { username: phone, password } = body;
  const logIdentifier = `API version: V1, Context: userService.acquisitionUserSignIn(),`;
  const acquisitionUser = await findAcquisitionUserByPhoneChecked(phone);
  sails.log(`${logIdentifier} user found: ${JSON.stringify(acquisitionUser)}`);
  if (acquisitionUser.disabled) {
    sails.log.error(`${logIdentifier} Error: User Disabled ${USER_DISABLED()}`);
    throw USER_DISABLED();
  }
  if (!await comparePassword(password, acquisitionUser)) {
    sails.log.error(`${logIdentifier} Error: Bad Credentials ${BAD_CREDENTIALS()}`);
    throw BAD_CREDENTIALS();
  }
  acquisitionUser.role = Constants.HyprRolesObject.SUPERVISOR;
  let token;
  if (!tokenNotRequired) {
    token = await AuthService.createTokenAndCache(acquisitionUser);
  }
  return toUserDto(token, acquisitionUser);
};

/**
 * This method is responsible for customer to signIn
 * @param customerInfo request details
 * @returns new token along with some customer's details
 */
const customerSignIn = async (customerInfo, tokenNotRequired = false) => {
  const { username: phone, password: pin_code } = customerInfo;
  const logIdentifier = `API version: V1, Context: userService.customerSignIn(),`;
  const company = await findCompanyByCodeChecked(COMPANY_CODE);
  const customer = await getCustomerByPhone(phone, company.id);
  if (_.isEmpty(customer)) {
    return { customerNotFound: true };
  }
  if (customer.disabled) {
    sails.log.error(`${logIdentifier} Error: Account Disabled ${ACCOUNT_DISABLED()}`);
    throw ACCOUNT_DISABLED();
  }
  if (!customer.verified_at) {
    sails.log.error(`${logIdentifier} Error: Customer Unverified ${CUSTOMER_UNVERIFIED()}`);
    throw { data: CUSTOMER_UNVERIFIED() };
  }

  sails.log(`${logIdentifier} customer: ${JSON.stringify(customer)}`);
  const customerShop = await findShopByCustomerId(customer.id);
  const customerAddress = customerShop ? await findCheckedCustomerAddressByCustomerId(customer.id) : null;
  let store = null;
  if (customerShop) {
    const coords = JSON.parse(customerShop.shop_location);
    /**
           * TODO
           * In tech debt this function will be removed from here and locationId pass in
           * req.user object using policy
           */
    const locations = await getStoresForLocation(
      "",
      {
        lat: coords.latitude,
        lng: coords.longitude,
      },
      customer.company_id,
    );
    if (locations && locations.length > 0) {
      store = locations[0];
    }
  }

  if (!await comparePinCode(pin_code, customer)) {
    sails.log.error(`${logIdentifier} Error: Bad Credentials ${BAD_CREDENTIALS()}`);
    throw BAD_CREDENTIALS();
  }

  const features = await findHierarchyFeaturesByBusinessUnitId(store && store.business_unit_id);

  customer.role = Constants.HyprRolesObject.CONSUMER;
  let token;
  if (!tokenNotRequired) {
    token = await AuthService.createTokenAndCache(customer);
  }

  customer.shopDetails = customerShop;
  customer.address = customerAddress;
  sails.log(`${logIdentifier} customer details: ${JSON.stringify(customer)}`);

  const response = toCustomerDto(token, customer, store, features);
  if (!customerShop) response.incompleteProfile = true;
  return response;
};

/**
 * This method is responsible for termination of customerSignOut
 * @param authorization session to be terminated
 * @returns session closed successfully
 */
const customerSignOut = async (authorization, playerId) => {
  const logIdentifier = `API version: V1, Context: userService.customerSignOut(),`;
  sails.log(`${logIdentifier} customer sign out called!`);
  const user = await verifyToken(authorization);
  if (_.isEmpty(user) || _.isEmpty(user.session_uuid)) {
    return {
      message: SESSION_CLOSED_MSG(),
    };
  }
  /**
  * Need to call this function only when receiving the playerId because removing from userNotification
  *on the bases on userId and PlayerId
  */
  if (playerId) { await deleteUserNotificationCustomerIdPlayerId(user.id, playerId); }

  deleteSessionBySessionUuId(user.session_uuid);
  return {
    message: SESSION_CLOSED_MSG(),
  };
};

/**
 * This method is responsible for generating new pin and verification code for customer.
 * And sends details to customer's phone via SMS
 * @param customerInfo request details
 * @returns {Promise<{message: string}>}
 */
const customerForgotPassword = async (customerInfo, appType = CONSUMER) => {
  const { username: phone } = customerInfo;
  const hisaab = appType === HISAAB ? true : false;
  const logIdentifier = `API version: V1, Context: userService.customerForgotPassword(),`;
  const company = await findCompanyByCodeChecked(COMPANY_CODE);
  const customer = await findCustomerByPhoneChecked(phone, company.id);

  sails.log(`${logIdentifier} customer: ${JSON.stringify(customer)}`);
  await deleteSessionByCustomerId(customer.id);

  sails.log(`${logIdentifier} sending client message!`);
  sendClientMessage(
    customerToSendSMS(customer),
    customerPinSMSBody(company.name, customer.verification_code, hisaab),
  );

  return {
    message: NEW_PIN_SENT_MSG(),
  };
};

/**
 * Responsible to update customer profile
 * @param id to be searched
 * @returns customer
 * @private
 */
const updateProfile = async (id, customer) => {
  const logIdentifier = `API version: V1, Context: userService.updateProfile(),`;
  // Have to do it here, as auth service needs a revisit in terms of generic handling
  customer.language = LANGUAGES[customer.language];
  const company = await findCompanyByCodeChecked(COMPANY_CODE);
  sails.log(`${logIdentifier} company: ${JSON.stringify(company)}`);
  if (customer.taxId) {
    const { taxId: existingTaxId } = await findCustomerById(id);
    validateTaxId(existingTaxId);
  }
  let store = null;
  let updatedCustomer = null;
  let updatedOrCreatedAddress = null;
  let updatedOrCreatedShop = null;
  if (customer.customer && customer.customer.address) {
    const coords = JSON.parse(customer.customer.address.coordinates);
    const locations = await getStoresForLocation("", { lat: coords.latitude, lng: coords.longitude }, company.id);
    if (Array.isArray(locations) && locations.length > 0) {
      customer.businessUnitId = locations[0].business_unit_id;
      store = locations[0];
    }
  }
  updatedCustomer = await updateCustomer(id, customer);
  if (customer.customer && customer.customer.address && customer.shop) {
    const shop = await findShopByCustomerId(updatedCustomer.id);
    const address = shop ? await findByCheckedId(updatedCustomer.id) : null;

    updatedOrCreatedShop = toCustomerShopDetails(updatedCustomer.id, customer);
    if (shop) {
      updatedOrCreatedShop = await updateShop(updatedCustomer.id, updatedOrCreatedShop);
      sails.log.info(
        `${logIdentifier} customerId: ${updatedCustomer.id
        } customer shop updated while profile update: ${JSON.stringify(updatedOrCreatedShop)}`,
      );
    } else {
      updatedOrCreatedShop = await createShop(updatedOrCreatedShop);
      sails.log.info(
        `${logIdentifier} customerId: ${updatedCustomer.id
        } customer shop created while profile update: ${JSON.stringify(updatedOrCreatedShop)}`,
      );
    }
    updatedOrCreatedAddress = toCustomerAddress(
      updatedCustomer.id,
      customer.customer.address,
    );
    if (address) {
      updatedOrCreatedAddress = await updateCustomerAddress(updatedCustomer.id, updatedOrCreatedAddress);
      sails.log.info(
        `${logIdentifier} customerId: ${updatedCustomer.id
        } customer address updated while profile update: ${JSON.stringify(updatedOrCreatedAddress)}`,
      );
    } else {
      updatedOrCreatedAddress = await createCustomerAddress(updatedOrCreatedAddress);

      sails.log.info(
        `${logIdentifier} customerId: ${updatedCustomer.id
        } customer address created while profile update: ${JSON.stringify(updatedOrCreatedAddress)}`,
      );
    }
  }
  if (updatedCustomer) updatedCustomer.role = Constants.HyprRolesObject.CONSUMER;
  updatedCustomer.shopDetails = updatedOrCreatedShop;
  updatedCustomer.address = updatedOrCreatedAddress;
  sails.log(
    `${logIdentifier} updated customer: ${JSON.stringify(updatedCustomer)}`,
  );
  const features = await findHierarchyFeaturesByBusinessUnitId(store && store.business_unit_id);
  // keep response generic for login and update so the app recieves the same information
  return updatedCustomer ? toCustomerDto(null, updatedCustomer, store, features) : {};
};

/**
 * This function takes the customerId and return customerAddress.
 *
 * @param {Number} customerId
 * @returns {CustomerAddress} customerAddress
 */
const findCheckedCustomerAddressByCustomerId = async customerId => await findByCheckedId(customerId);


/**
 * This function takes the cnic and return customerId.
 *
 * @param {Number} cnic
 * @returns {CustomerId} number
 */
const getCustomerIdByPhone = async phone => {
  const { id: companyId } = await findCompanyByCodeChecked(COMPANY_CODE);
  const customerId = await findCustomerIdByPhone(phone, companyId);
  return customerId;
};

/**
 * This function takes the customerId and return enabled features.
 *
 * @param {Number} customerId
 * @param {Number} role
 * @returns {Object} enabled features
 */

const getCustomerFeatures = async (customerId, role) => {
  const featureListResponse = {};
  if (role === CONSUMER_ROLE) {
    const featureList = await findCustomerFeaturesList(customerId);
    featureList.map(feature => {
      featureListResponse[feature.featureId.name] = !feature.disabled;
    });
  }
  return featureListResponse;
};

/**
 * This function returns all customers enabled with specific feature
 * @param apiCallingCustomerId
 * @param userRole
 * @param featureName
 * @param skip
 * @param limit
 * @param startDateParam
 * @param endDateParam
 * @param customerId
 * @param phone
 * @param countryCode
 * @returns {Promise<*>}
 */
const getFeatureCustomersList = async (
  apiCallingCustomerId,
  userRole,
  featureName,
  skip = 0,
  limit = 1,
  startDateParam,
  endDateParam,
  customerId,
  phone,
  countryCode,
) => {
  const { id: featureId } = await Feature.findOne({ name: featureName });
  const queryParams = [];
  const limitQueryParams = [];
  const selectionQuery = `SELECT cfj.*,feats.name,cust.phone,cust.name`;
  const countQuery = `SELECT count(*) as totalCount`;
  let query =
    ` FROM ((customer_feature_junction as cfj
    INNER JOIN features as feats ON cfj.feature_id=feats.id)
    INNER JOIN customers as cust ON cfj.customer_id=cust.id)`;
  if (countryCode) {
    query += ` INNER JOIN business_units as bu ON bu.id = cust.business_unit_id
    WHERE bu.country_code LIKE $${queryParams.length + 1}`;
    queryParams.push(`${countryCode}%`);
    query += ` AND cfj.feature_id = $${queryParams.length + 1}`;
    queryParams.push(featureId);
  } else {
    query += ` WHERE cfj.feature_id = $${queryParams.length + 1}`;
    queryParams.push(featureId);
  }
  if (startDateParam) {
    const startDate = new Date(startDateParam);
    startDate.setHours(0, 0, 0, 0);
    query += ` AND cfj.created_at >= $${queryParams.length + 1}`;
    queryParams.push(startDate);
  }
  if (endDateParam) {
    const endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 59);
    query += ` AND cfj.created_at <= $${queryParams.length + 1}`;
    queryParams.push(endDate);
  }
  if (userRole === CONSUMER_ROLE) {
    query += ` AND cfj.customer_id = $${queryParams.length + 1}`;
    queryParams.push(apiCallingCustomerId);
  } else if (customerId) {
    query += ` AND cfj.customer_id = $${queryParams.length + 1}`;
    queryParams.push(customerId);
  }
  if (phone) {
    query += ` AND cust.phone = $${queryParams.length + 1}`;
    queryParams.push(phone);
  }
  query += ` ORDER BY cfj.updated_at DESC`;
  const limitQuery = ` LIMIT $${queryParams.length + 1}, $${queryParams.length + 2}`;
  limitQueryParams.push(skip, limit);
  const { rows: featureList }
    = await sails.sendNativeQuery(selectionQuery + query + limitQuery, [ ...queryParams, ...limitQueryParams ]);
  const { rows: countResult }
    = await sails.sendNativeQuery(countQuery + query, queryParams);
  return {
    list: featureList.map(_featureJunction => toFeatureCustomersDto(_featureJunction)),
    totalCount: countResult[0].totalCount,
  };
};


/**
 * This function takes the username and return user data.
 *
 * @param {String} username
 * @returns {Object} user data
 */
const getDataForIdentityService = async (appType, body) => {
  if (appType === HISAAB) {
    return await customerHisaabSignIn(body);
  }
  const response = await customerSignIn(body, tokenNotRequired = true);
  if (response.customerNotFound) {
    return acquisitionUserSignIn(body, true);
  }
  return response;
};


/**
 * This function returns retailo company object
 *
 * @returns {Number} company id
 */
const getRetailoCompany = async () => {
  const logIdentifier = `API version: V1, Context: userService.getRetailoCompany(),`;
  const company = await findCompanyByCodeChecked(COMPANY_CODE);
  sails.log(`${logIdentifier} company: ${company.id}`);
  return company;
};

/**
 * This function removes player id
 */
const removePlayerId = async (customerId, playerId = null) => {
  const logIdentifier = `API version: V1, Context: userService.removePlayerId(),`;
  sails.log(`${logIdentifier} going to remove record for customer - ${customerId} and playerID - ${playerId}`);
  return await deleteUserNotificationCustomerIdPlayerId(customerId, playerId);
};

/**
 * Responsible to fetch customer details by phone
 * @param phone to be searched
 * @returns customer details DTO
 * @private
 */
const getCustomerById = async customerId => {
  const logIdentifier = `API version: V1, Context: userService.getCustomerById(),`;
  sails.log(`${logIdentifier}`);
  const customer = await findCustomerById(customerId);
  const company = await findCompanyByCodeChecked(COMPANY_CODE);
  customer.role = Constants.HyprRolesObject.CONSUMER;
  if (_.isEmpty(customer)) {
    sails.log.error(`${logIdentifier} Error: Customer Not Found ${JSON.stringify(CUSTOMER_NOT_FOUND())}`);
    return { data: CUSTOMER_NOT_FOUND() };
  }
  const customerDto = toCustomerDto(null, customer).user;
  customerDto.companyName = company.name;
  if (customer.businessUnitId) {
    customerDto.countryCode = (await getBusinessUnitById(customer.businessUnitId))?.countryCode;
  }
  return customerDto;
};


/**
 * This method is responsible for customer's signUp on hisaab app
 * @param customer request details
 * @returns basic info of newly created customer
 */
const customerHisaabSignUp = async customer => {
  const { phone, customer: { language } } = customer;
  const logIdentifier = `API version: V1, Context: userService.customerHisaabSignUp(),`;
  const company = await findCompanyByCodeChecked(COMPANY_CODE);
  sails.log(`${logIdentifier} company: ${JSON.stringify(company)}`);
  await verifyCustomerNotExists(phone, company.id); // to avoid conflict with other companies data

  // check if user exists ( other then customer role ) with the same phone number
  await verifyUserNotExistWithSamePhone(phone);

  const verificationCode = randomCode();
  const pinCode = hashPassword(verificationCode);
  const createdCustomer = await createCustomer({
    phone,
    verificationCode: verificationCode.toString(),
    pinCode,
    verifiedAt: new Date(),
    companyId: company.id,
    language: LANGUAGES[language],
  });

  sails.log.info(
    `${logIdentifier} customer created: ${JSON.stringify(createdCustomer)}`,
  );

  sendClientMessage(
    customerToSendSMS(createdCustomer),
    customerPinSMSBody(company.name, verificationCode, true),
  );

  sendCustomerSignupEmail(customer, company, true);

  return {
    message: CUSTOMER_SIGNUP_API_MSG("Hisaab"),
    customerId: createdCustomer.id,
  };
};

/**
 * This method is responsible for customer to signIn on hisaab app
 * @param customerInfo request details
 * @returns some customer's details
 */
const customerHisaabSignIn = async customerInfo => {
  const { username: phone } = customerInfo;
  const logIdentifier = `API version: V1, Context: userService.customerHisaabSignIn(),`;
  const company = await findCompanyByCodeChecked(COMPANY_CODE);
  const customer = await getCustomerByPhone(phone, company.id);
  if (_.isEmpty(customer)) {
    return { customerNotFound: true };
  }
  if (customer.disabled) {
    sails.log.error(`${logIdentifier} Error: Account Disabled ${ACCOUNT_DISABLED()}`);
    throw ACCOUNT_DISABLED();
  }
  if (!customer.verified_at) {
    sails.log.error(`${logIdentifier} Error: Customer Unverified ${CUSTOMER_UNVERIFIED()}`);
    throw { data: CUSTOMER_UNVERIFIED() };
  }

  sails.log(`${logIdentifier} customer: ${JSON.stringify(customer)}`);
  customer.role = Constants.HyprRolesObject.CONSUMER;
  return toCustomerDto(null, customer, null, null);
};

/**
 * This method is responsible for deleting session(s) against a customer
 * @param customerId customer ID against which sessions are to be deleted
 * @returns {Number} deletedSessions count of deleted sessions
 */
const deleteCustomerSession = async customerId => {
  const logIdentifier = `API version: V1, Context: userService.deleteCustomerSession(),`;
  sails.log(`${logIdentifier} customerId: ${JSON.stringify(customerId)}. Deleting customer session!`);
  const deletedSessions = await deleteSessionByCustomerId(customerId);
  return {
    customerId,
    deletedSessions: deletedSessions.length,
  };
};

/** Method to check whether role is allowed to access specific resource
 * @param roleId request details
 * @param api API path
 * @param method HTTP method
 * @param roleName request details
 * @returns boolean if role is allowed to access API
 */

// [NOTE]: this should call RBAC service and not db directly - @salman-mehmood
const checkRolePermission = async (roleId, api, method, roleName = "service") => {
  // eslint-disable-next-line no-unreachable
  const logIdentifier = "API version: V1, Context: userService.checkRolePermission(),";

  if (parseInt(roleId) === ADMIN) {
    sails.log.info(`${logIdentifier} - admin role returning as admin has access to all resources`);
    return true;
  }
  const query = process.env.TEST_DB_ADDRESS !== "db" ?
    "select * from retailo_rbac.permissions p inner join retailo_rbac.role_permissions rp on rp.permission_id = p.id " +
    "where rp.role_id = $1 and api = $2 and method = $3"
    :
    "select * from permissions inner join role_permissions on role_permissions.permission_id = permissions.id " +
    "where role_permissions.role_id = $1 and api = $2 and method = $3";
  const queryParams = [roleId, api, method];
  const userRequest = await sails.sendNativeQuery(query, queryParams);
  if (userRequest && userRequest.rows && userRequest.rows.length > 0) {
    return true;
  }
  sails.log.info(`${logIdentifier} - Role ${roleId}-[${roleName}] is not allowed to access ${api} resource`);
  return false;
};

const clearUserSessions = async userId => {
  sails.log.info(`Context: UserService.clearUserSessions user_id: ${userId}`);
  return await AuthService.clearSessions({ user_id: userId });
};
// Needs to be moved to RBAC service
const fetchUserLocation = async user => {
  sails.log.info(`Context: UserService.fetchUserLocation user_id: ${user}`);
  const authStore = await authStoreExtractionService.find({ user });
  sails.log.info(`locations found for user - ${user}, location: ${JSON.stringify(authStore)}`);
  // sending back zeroth element since supervisor account locations are all related to same businessUnit
  return authStore[0].location;
};
/**
 * It makes a GET request to the payment wallet service to get the payment wallet details of a user
 * @param authToken - The token you get from the login API.
 * @param userId - The user's ID.
 */
const getUserPaymentWalletData = async  (authToken, userId) => {
  const logIdentifier = "API version: V1, Context: userService.getUserPaymentWalletData(),";
  const currency = "PKR";
  try {
    const { data: { data } } = await axios({
      url: `${PAYMENT_WALLET.baseUrl}${PAYMENT_WALLET.endPoints.paymentWalletDetails}${userId}?currency=${currency}`,
      method: "GET",
      headers: {
        Authorization: authToken,
      }},
    );
    sails.log(`${logIdentifier} ---> wallet fetched successfully ${JSON.stringify(data)}`);
    if(data && data?.amount === 0) {
      return true;
    }
    return false;
  } catch (error) {
    sails.log.error(`${logIdentifier} ---> error while fetching payment wallet data ${JSON.stringify(error)}`);
    throw error;
  }
};

/**
 * It makes a GET request to the BNPL_WALLET
 * endpoint, and returns the user wallet data
 */
const getUserBnplWalletData = async  authToken => {
  const logIdentifier = "API version: V1, Context: userService.getUserBnplWalletData(),";
  try {
    const { data: { data } } = await axios({
      url: `${BNPL_WALLET.baseUrl}${BNPL_WALLET.endPoints.bnplWalletDetails}`,
      method: "GET",
      headers: {
        Authorization: authToken,
      }},
    );
    sails.log(`${logIdentifier} ---> bnpl wallet fetched successfully ${JSON.stringify(data)}`);
    if(data && data?.overdueLiabilities?.length === 0 && data?.outstandingLiabilities?.length === 0) {
      return true;
    }
    return false;
  } catch (error) {
    sails.log.error(`${logIdentifier} ---> error while fetching bnpl wallet ${JSON.stringify(error)}`);
    throw error;
  }
};


/**
 * It fetches all the orders of a user and checks if all the batches of those orders are closed
 * @returns A boolean value
 */
const getUserOrdersBatchesStatus = async customerId => {
  const logIdentifier = "API version: V1, Context: userService.getUserPendingOrders(),";
  const criteria = {
    customerId,
    statusId: {in: [ IN_TRANSIT, ON_HOLD, PACKED, RESERVED, PARTIAL_DELIVERED, DELIVERED ]},
  };
  try {
    const orders = await orderDao.findAll(criteria);
    const ordersNotInEndState = orders.filter(order => !([PARTIAL_DELIVERED, DELIVERED].includes(order?.statusId)));
    const orderIds = orders.map(data => data.id);
    const prepareFetchOrderBatches = orderIds.map(orderId => findBatchDetailsByOrderId(orderId));
    const ordersBatches = await Promise.all(prepareFetchOrderBatches);
    const batchStatuses = ordersBatches.map(batchData =>
      batchData?.batchId?.status_id).filter(batchStatus => typeof batchStatus === "number");
    sails.log(`${logIdentifier} batch statuses    ----> ${JSON.stringify(batchStatuses)}`);
    const isEveryBatchClosed = batchStatuses.every(status => status === CLOSED);
    if(ordersNotInEndState?.length === 0 && isEveryBatchClosed) {
      return true;
    }
    return false;
  } catch (error) {
    sails.log.error(`${logIdentifier} ---> error ${JSON.stringify(error)}`);
    throw error;
  }
};


/**
 * It makes three API calls to three different services and returns the response
 * @param authToken - The auth token of the user.
 * @param customerId - The customer ID of the user who is trying to delete their account.
 */
const validateUserDeletion = async (authToken, customerId) => {
  const logIdentifier = "API version: V1, Context: userService.validateUserDeletion(),";
  try {
    const response = await Promise.allSettled([
      getUserPaymentWalletData(authToken, customerId),
      getUserBnplWalletData(authToken),
      getUserOrdersBatchesStatus(customerId),
    ]);


    response.forEach((data, index) => {
      if(data.status === "rejected" && index === 0) {
        throw new Error(`Payment service is down!`);
      }
      if(data.status === "rejected" && index === 1) {
        throw new Error(`BNPL service is down!`);
      }
      if(data.status === "rejected" && index === 2) {
        throw new Error(`Order service is down!`);
      }
    });
    const prepareResponse = {
      PAYMENT: response[0].value,
      BNPL: response[1].value,
      ORDERS: response[2].value,

    };

    return prepareResponse;
  } catch (error) {
    sails.log.error(`${logIdentifier} ---> error while validating user required data ${JSON.stringify(error)}`);
    throw error;
  }
};

/**
 * It makes API call to send the OTP to code to Customer
 * @param customerId - The customer ID of the user to whom OTP is sent.
 */
const sendOTPtoCustomer = async (customerId, resend) => {
  const logIdentifier = "API version: V1, Context: userService.sendOTPtoCustomer(),";
  try {
    const { data: { data } } = await axios({
      url: `${OTP_SERVICE.baseUrl}${resend ? OTP_SERVICE.endPoints.resend : OTP_SERVICE.endPoints.send}`,
      method: "POST",
      headers: {
        Authorization: await createServiceToken(),
        LANGUAGE: LANGUAGE.EN,
      },
      data: {
        useCase: USECASE,
        serviceName: SERVICE_NAME,
        customerId,
      },
    },
    );
    return {...data, sent: true, customerId};
  } catch (error) {
    sails.log.error(`${logIdentifier} ---> error while sending OTP ${JSON.stringify(error?.response?.data)}`);
    throw error?.response?.data;
  }
};

/**
 * It makes API call to send the OTP to code to Customer
 * @param customerId - The customer ID of the user to whom OTP is sent.
 * @param otpCode -  The OTP code to verify.
 */
const verifyCustomerOTP = async (customerId, code) => {
  const logIdentifier = "API version: V1, Context: userService.verifyCustomerOTP(),";
  try {
    const { data: { data } } = await axios({
      url: `${OTP_SERVICE.baseUrl}${OTP_SERVICE.endPoints.verify}`,
      method: "POST",
      headers: {
        Authorization: await createServiceToken(),
        LANGUAGE: LANGUAGE.EN,
      },
      data: {
        useCase: USECASE,
        serviceName: SERVICE_NAME,
        customerId,
        code,
      },
    },
    );
    return {...data, verified: true, customerId};
  } catch (error) {
    sails.log.error(`${logIdentifier} ---> error while verifying OTP ${JSON.stringify(error?.response?.data)}`);
    throw error?.response?.data;
  }
};

module.exports = {
  signUp,
  signIn,
  signOut,
  forgotPassword,
  findCustomerByPhone,
  updateProfile,
  findCheckedCustomerAddressByCustomerId,
  getCustomerIdByPhone,
  getCustomerFeatures,
  getFeatureCustomersList,
  getDataForIdentityService,
  getRetailoCompany,
  removePlayerId,
  getCustomerById,
  deleteCustomerSession,
  checkRolePermission,
  clearUserSessions,
  sendCustomerSignupEmail,
  fetchUserLocation,
  validateUserDeletion,
  sendOTPtoCustomer,
  verifyCustomerOTP,
};

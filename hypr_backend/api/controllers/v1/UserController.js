const UserService = require("../../modules/v1/Auth/UserService");
const {
  constructCustomerKycProfile,
  constructCustomerProfile,
  getCustomerKycProfile,
} = require("../../modules/v1/Kyc");
const {
  constants: {
    ACCOUNT_CREATED,
    LOGGED_IN,
    LOGGED_OUT,
    VERIFICATION_CODE_SENT,
    PROFILE_UPDATED_SUCCESSFULLY,
  },
} = require("../../modules/v1/Auth/Messages");
const utilsServices = require("../../../utils/services");
const AppType = "app-type";
const {
  HyprRoles: { SUPERVISOR, CONSUMER },
} = require("../../services/Constants");
const { getPath } = require("../../modules/v1/Utils/Utils");

// const DeviceId = "device_id";
// const Authorization = "authorization";
const signUp = async (req, res) => {
  const logIdentifier = `API version: V1, context: UserController.signUp(),`;
  try {
    const { body, headers } = req;
    const os = headers.os ? headers.os.toLowerCase() : "android";
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const result = await UserService.signUp(headers[AppType], { ...body, os });
    res.ok(result, { userMessage: ACCOUNT_CREATED() });
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

const signIn = async (req, res) => {
  const logIdentifier = `API version: V1, context: UserController.signIn(),`;
  try {
    const { body, headers } = req;
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    // eslint-disable-next-line dot-notation
    const result = await UserService.signIn(headers[AppType], body, headers["DeviceId"]);
    res.ok(result, { userMessage: LOGGED_IN() });
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

const signOut = async (req, res) => {
  const logIdentifier = `API version: V1, context: UserController.signOut(),`;
  try {
    const { headers } = req;
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const params = req.allParams();
    const result = await UserService.signOut(headers[AppType], headers[Authorization], params);

    res.ok(result, { userMessage: LOGGED_OUT() });
  } catch (error) {
    // TODO: investigate error.stack is logged properly or not later
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error)}`);
    res.error(error);
  }
};

const forgotPassword = async (req, res) => {
  const logIdentifier = `API version: V1, context: UserController.forgotPassword(),`;
  try {
    const { body, headers } = req;
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const result = await UserService.forgotPassword(headers[AppType], body);
    res.ok(result, { userMessage: VERIFICATION_CODE_SENT() });
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * Responsible to find customer by phone
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const findCustomerByPhone = async (req, res) => {
  const { query: { phone }, user: { id, role } } = req;
  const logIdentifier = `API version: V1, context: UserController.findCustomerByPhone(), UserId: ${id}, Role: ${role},`;
  try {
    const { locals: { userData: { phone: customerPhone } } } = res;
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    /**
     * change request 3-SEP-2021
     * checking for token user as well if customer directly requesting for the info
     */
    const result = await UserService.findCustomerByPhone(phone, role, customerPhone);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * Responsible to update customer profile
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const updateProfile = async (req, res) => {
  const { user: { id, role }, body } = req;
  const logIdentifier = `API version: V1, context: UserController.updateProfile(), UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const result = await UserService.updateProfile(id, body);
    res.ok(result, { userMessage: PROFILE_UPDATED_SUCCESSFULLY() });
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * Responsible to validate customer
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const validateToken = async (req, res) => {
  sails.log.error("Legacy API, unused routes called with heaeders :"
    , JSON.stringify(req.headers), "\n params :", JSON.stringify(req.allParams()));
  return res.notFound("Legacy API, unused routes");
  // const { user: { id, role } } = req;
  // const logIdentifier = `API version: V1, context: UserController.validateToken(), UserId: ${id}, Role: ${role},`;
  // sails.log.info(`${logIdentifier} validating customer token for external service`);
  // // sending back user id
  // res.ok(id);
};


/**
 * Responsible to return customer details to kyc service
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const generateCustomerProfileForKyc = async (req, res) => {
  const { user: { id, role }, body } = req;
  const logIdentifier = `API version: V1,
  context: UserController.generateCustomerProfileForKyc(),
  UserId: ${id},
  Role: ${role},`;
  try {
    sails.log.info(`${logIdentifier} fetching customer data for kyc service`);
    const result = await constructCustomerKycProfile(id, body);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * Responsible to return customer id to lms service against cnic
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const getCustomerIdFromPhone = async (req, res) => {
  const { query: { phone } } = req;
  const logIdentifier = `API version: V1, context: UserController.getCustomerIdByPhone(),`;
  try {
    sails.log.info(`${logIdentifier} fetching customer id from phone - ${phone}`);
    const result = await UserService.getCustomerIdByPhone(phone);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * Responsible to return all features enabled on system for a customer
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const getCustomerFeatures = async (req, res) => {
  const { user: { id: userId, role } } = req;
  let { customerId } = req.allParams();
  if (!customerId) {
    customerId = userId;
  }
  const logIdentifier = `API version: V1, context: UserController.getCustomerFeatures(),`;
  try {
    sails.log.info(`${logIdentifier} fetching customer features from id - ${customerId}`);
    const result = await UserService.getCustomerFeatures(customerId, CONSUMER);
    // TODO Remove after force update. Globally Enabling JIT for every user.
    result.JIT = true;
    if (role === SUPERVISOR) {
      delete result.BNPL;
    }
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * Responsible to return all features enabled on system for a customer
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const getFeatureCustomersList = async (req, res) => {
  const {
    query: { page, perPage, featureName, startDate, endDate, customerId, phone, countryCode },
    user: { id: apiCallingCustomerId, role },
  } = req;
  const logIdentifier = `API version: V1, context: UserController.getFeatureCustomersList(),`;
  try {
    sails.log.info(`${logIdentifier} fetching feature customers from feature name - ${featureName}`);
    const { skip, limit } = utilsServices.getPagination(page, perPage);
    const result = await UserService.getFeatureCustomersList(
      apiCallingCustomerId,
      role,
      featureName,
      skip,
      limit,
      startDate,
      endDate,
      customerId,
      phone,
      countryCode);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};


/**
 * Responsible to generate data for identity service
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const getDataForIdentityService = async (req, res) => {
  const logIdentifier = `API version: V1, context: UserController.getDataForIdentityService(),`;
  try {
    const { body, headers } = req;
    sails.log.info(`${logIdentifier} fetching user data - ${JSON.stringify(body)}`);
    const result = await UserService.getDataForIdentityService(headers[AppType], body);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * Responsible to return company to services
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const getRetailoCompany = async (req, res) => {
  const logIdentifier = `API version: V1, context: UserController.getRetailoCompany(),`;
  try {
    sails.log.info(`${logIdentifier} fetching company`);
    const result = await UserService.getRetailoCompany();
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * Responsible to remove playerId
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const removePlayerId = async (req, res) => {
  const logIdentifier = `API version: V1, context: UserController.removePlayerId(),`;
  try {
    const { body: { playerId }, user: { id: customerId } } = req;
    sails.log.info(`${logIdentifier} removing playerId`);
    const result = await UserService.removePlayerId(customerId, playerId);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * Responsible to find customer by Id
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const findCustomerById = async (req, res) => {
  const {
    query: { customerId },
  } = req;
  const logIdentifier = `API version: V1, context: UserController.findCustomerById(), UserId: ${customerId}`;
  try {
    const customer = await UserService.getCustomerById(customerId);
    res.ok(customer);
  } catch (error) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`,
    );
    res.error(error);
  }
};

/**
 * Responsible to get customer-data for kyc info by Id
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const getCustomerDataById = async (req, res) => {
  const {
    query: { customerId },
  } = req;
  const logIdentifier = `API version: V1,
  context: UserController.getCustomerDataById(),
  UserId: ${customerId}`;
  try {
    sails.log.info(`${logIdentifier} fetching customer profile data`);
    const result = await constructCustomerProfile(customerId);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * BIMODAL API
 * Returns customer details to kyc service if request body has payload key
 * Returns customer-data for kyc info by customer ID if request body does not have payload key
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const getCustomerDataByIdForUserService = async (req, res) => {
  const { user, body } = req;
  const logIdentifier = `API version: V1,
  context: UserController.getCustomerDataByIdForUserService(),
  User: ${JSON.stringify(user)}`;
  try {
    const result = await getCustomerKycProfile(body.customer, body.payload);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * Responsible for deleting session(s) against provided customer Id
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const deleteCustomerSession = async (req, res) => {
  const {
    query: { customerId },
  } = req;
  const logIdentifier = `API version: V1,
  context: UserController.deleteCustomerSession(),
  UserId: ${customerId}`;
  try {
    sails.log.info(`${logIdentifier} deleting customer session`);
    const result = await UserService.deleteCustomerSession(customerId);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};
/**
 * Responsible to check if role has permission to access API path and method
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const checkRolePermission = async (req, res) => {
  const {
    params: { id: roleId },
    query: { api, method },
  } = req;
  const logIdentifier = "API version: V1, context: UserController.checkRolePermission()";
  try {
    const apiPath = await getPath(api);
    const result = await UserService.checkRolePermission(
      roleId,
      apiPath,
      method,
    );
    if (!result) {
      return res.unauthorized("Role is not allowed to access this resource");
    }

    return res.ok();
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    return res.error(error);
  }
};

/**
* Route to clear user sessions
* @param req
* @param res
* @returns {Promise<void>}
* @private
*/
const clearUserSession = async (req, res) => {
  const { body: { userId } } = req;
  const logIdentifier = "API version: V1, context: UserController.clearUserSession()";
  try {
    await UserService.clearUserSessions(userId);
    return res.ok();
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    return res.error(error);
  }
};

/**
* Responsible for sending customer signup email
* @param req
* @param res
* @returns {Promise<void>}
* @private
*/
const sendSignupEmail = async (req, res) => {
  const { body: { customer, company, hisaab } } = req;
  const logIdentifier = "API version: V1, context: UserController.sendSignupEmail()";
  try {
    await UserService.sendCustomerSignupEmail(customer, company, hisaab);
    return res.ok();
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    return res.error(error);
  }
};

/**
* Responsible for sending user location back
* @param req
* @param res
* @returns {Promise<void>}
* @private
*/
const fetchUserLocation = async (req, res) => {
  const { id: userId } = req.query;
  const logIdentifier = "API version: V1, context: UserController.  fetchUserLocation()";
  try {
    const locationId = await UserService.fetchUserLocation(userId);
    return res.ok(locationId);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    return res.error(error);
  }
};

/**
 * It validates the user deletion request and returns the result
 * @param req - The request object.
 * @param res - The response object.
 * @returns The result of the UserService.validateUserDeletion() function.
 */
const deleteUser = async (req, res) => {
  const { headers: { authorization, user_id } } = req;
  const logIdentifier = "API version: V1, context: UserController.sendSignupEmail()";
  try {
    const result = await UserService.validateUserDeletion(authorization, user_id);
    return res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    return res.error(error);
  }
};

/**
 * Responsible to send OTP code to customer
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const sendOTP = async (req, res) => {
  const { body: { customerId, resend } } = req;
  const logIdentifier = `API version: V1, context: UserController.sendOTP(),`;
  try {
    sails.log.info(`${logIdentifier} sending OTP to customer - ${customerId}`);
    const result = await UserService.sendOTPtoCustomer(customerId, resend);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * Responsible to verify OTP code sent to customer
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const verifyOTP = async (req, res) => {
  const { body: { customerId, otpCode } } = req;
  const logIdentifier = `API version: V1, context: UserController.verifyOTP(),`;
  try {
    sails.log.info(`${logIdentifier} verifying OTP against customer - ${customerId}`);
    const result = await UserService.verifyCustomerOTP(customerId, otpCode);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

module.exports = {
  signUp,
  signIn,
  signOut,
  forgotPassword,
  findCustomerByPhone,
  updateProfile,
  validateToken,
  generateCustomerProfileForKyc,
  getCustomerIdFromPhone,
  getCustomerFeatures,
  getFeatureCustomersList,
  getRetailoCompany,
  removePlayerId,
  getDataForIdentityService,
  findCustomerById,
  getCustomerDataById,
  getCustomerDataByIdForUserService,
  deleteCustomerSession,
  checkRolePermission,
  clearUserSession,
  sendSignupEmail,
  fetchUserLocation,
  deleteUser,
  sendOTP,
  verifyOTP,
};

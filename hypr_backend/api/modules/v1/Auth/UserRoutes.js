const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const controller = `${v1}/UserController`;
const userSwagger = require("./UserSwagger");

module.exports = {
  publicRoutes: {
    "POST /sign-up": {
      controller,
      action: "signUp",
      validate: "signUpValidation",
    },
    "POST /sign-in": {
      controller,
      action: "signIn",
      validate: "signInValidation",
    },
    "POST /sign-out": {
      controller,
      action: "signOut",
      validate: "signOutValidation",
    },
    "POST /forgot-password": {
      controller,
      action: "forgotPassword",
      validate: "forgotPasswordValidation",
    },
    "DELETE /customer-session": {
      controller,
      action: "deleteCustomerSession",
      validate: "",
    },
  },
  privateRoutes: {

    "GET /findCustomerById": {
      controller,
      action: "findCustomerById",
      validate: "",
    },
    "GET /": {
      controller,
      action: "findCustomerByPhone",
      validate: "customerByPhoneValidation",
    },
    "PUT /profile": {
      controller,
      action: "updateProfile",
      validate: "customerProfileUpdateValidation",
    },
    "GET /validate": { controller, action: "validateToken" },
    "POST /customer-data": {
      controller,
      action: "generateCustomerProfileForKyc",
      validate: "generateCustomerProfileValidation",
    },
    "GET /customer-data": {
      controller,
      action: "getCustomerDataById",
      validate: "",
    },
    "POST /construct-profile": {
      controller,
      action: "getCustomerDataByIdForUserService",
      validate: "",
    },
    "GET /customerId": {
      controller,
      action: "getCustomerIdFromPhone",
      validate: "getCustomerIdFromPhoneValidation",
    },
    "GET /getCustomerFeatures": { controller, action: "getCustomerFeatures" },
    "GET /featureCustomersList": { controller, action: "getFeatureCustomersList" },
    "POST /userData": {
      controller,
      action: "getDataForIdentityService",
      validate: "",
    },
    "GET /company": {
      controller,
      action: "getRetailoCompany",
      validate: "",
    },
    "POST /removePlayerId": {
      controller,
      action: "removePlayerId",
      validate: "signOutValidation",
    },
    "GET /role/:id/check-permission": {
      controller,
      action: "checkRolePermission",
      validate: "",
    },
    "GET /role": {
      controller,
      action: "getUsersByRoleAndLocation",
      validate: "",
    },
    "GET /getAllUsers": {
      controller,
      action: "getAllUsers",
      swagger: userSwagger.getAllUsers,
    },
    "POST /clearSessions": {
      controller,
      action: "clearUserSession",
      validate: "",
    },
    "POST /send-signup-email": {
      controller,
      action: "sendSignupEmail",
      validate: "sendSignupEmailValidation",
    },
    "GET /userLocation": {
      controller,
      action: "fetchUserLocation",
      validate: "",
    },
    "GET /validate-user-deletion": {
      controller,
      action: "deleteUser",
      validate: "",
    },
    "POST /send-otp": {
      controller,
      action: "sendOTP",
      validate: "sendOTPValidation",
    },
    "POST /verify-otp": {
      controller,
      action: "verifyOTP",
      validate: "verifyOTPValidation",
    },
  },
};

const constants = {
  CUSTOMER_SIGNUP_API_MSG: (appType = "Retailo") => sails.__("CUSTOMER_SIGNUP_API_MSG", appType),
  SESSION_CLOSED_MSG: () => sails.__("SESSION_CLOSED_MSG"),
  NEW_PIN_SENT_MSG: () => sails.__("NEW_PIN_SENT_MSG"),
  ACCOUNT_CREATED: () => sails.__("ACCOUNT_CREATED"),
  LOGGED_IN: () => sails.__("LOGGED_IN"),
  LOGGED_OUT: () => sails.__("LOGGED_OUT"),
  VERIFICATION_CODE_SENT: () => sails.__("VERIFICATION_CODE_SENT"),
  PROFILE_UPDATED_SUCCESSFULLY: () => sails.__("PROFILE_UPDATED_SUCCESSFULLY"),
};
module.exports = { constants };

/**
 * 401 (Unauthorized) Response
 *
 * Similar to 403 Forbidden.
 * Specifically for use when authentication is possible but has failed or not yet been provided.
 * Error code response for missing or invalid authentication token.
 */

const localize = require("../../utils/localize");

module.exports = function (message, options, root) {
  var response = _.assign(
    {
      code: "E_UNAUTHORIZED",
      message: message || "Missing or invalid authentication token",
      userMessage: "You are not authorized to perform this operation",
      data: {},
      success: false
    },
    root
  );
  // this will/can also overwrite the default values above, if sent (code, message, data. success)
  if (options) {
    Object.keys(options).forEach(function (key) {
      response[key] = options[key];
    });
  }

  this.req._sails.log.silly("Sent (401 UNAUTHORIZED)\n", response);

  this.res.status(401);
  this.res.json(response);
  // this.res.json(localize(response, this.res));
};

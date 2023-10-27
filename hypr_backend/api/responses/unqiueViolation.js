/**
 * Unique key violation
 *
 * General status code. Most common code used to indicate success.
 * The actual response will depend on the request method used.
 * In a GET request, the response will contain an entity corresponding to the requested resource.
 * In a POST request the response will contain an entity describing or containing the result of the action.
 */

const localize = require("../../utils/localize");

module.exports = function (message, options, root) {
  var response = _.assign(
    {
      code: "E_UNIQUE_FIELD_VIOLATION",
      message: message || "The value already exists",
      userMessage: "This resource already exists, please try again with a different one",
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

  this.req._sails.log.silly("Sent unique key violation \n", response);

  this.res.status(200);
  this.res.json(response);
  // this.res.json(localize(response, this.res));
};

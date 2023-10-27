/**
 * 404 (Not Found) Response
 *
 * The requested resource could not be found but may be available again in the future.
 * Subsequent requests by the client are permissible.
 * Used when the requested resource is not found, whether it doesn't exist.
 */

const localize = require("../../utils/localize");

module.exports = function (message, options, root) {
  var response = _.assign(
    {
      code: "E_NOT_FOUND",
      message: message || "The requested resource could not be found but may be available again in the future",
      userMessage: "The requested resource could not be found but may be available again in the future",
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

  this.req._sails.log.silly("Sent (404 NOT FOUND)\n", response);

  this.res.status(404);
  this.res.json(response);
  // this.res.json(localize(response, this.res));
};

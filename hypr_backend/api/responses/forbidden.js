/**
 * 403 (Forbidden) Response
 *
 * The request was a legal request, but the server is refusing to respond to it.
 * Unlike a 401 Unauthorized response, authenticating will make no difference.
 * Error code for user not authorized to perform the operation or the resource is unavailable for some reason.
 */

const localize = require("../../utils/localize");

module.exports = function (data, options, root) {
  var response = _.assign(
    {
      code: "E_FORBIDDEN",
      message: "User not authorized to perform the operation",
      userMessage: "You are not authorized to perform this operation",
      data: data || {},
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

  this.req._sails.log.silly("Sent (403 FORBIDDEN)\n", response);

  this.res.status(403);
  this.res.json(response);
  // this.res.json(localize(response, this.res));
};

/**
 * 400 (Bad Request) Response
 *
 * The request cannot be fulfilled due to bad syntax.
 * General error when fulfilling the request would cause an invalid state.
 * Domain validation errors, missing data, etc.
 */

const localize = require("../../utils/localize");

var dateTime = require("node-datetime");

module.exports = function (message, options, root) {
  var response = _.assign(
    {
      code: "E_BAD_REQUEST",
      message: message || "The request cannot be fulfilled due to bad syntax",
      userMessage: "Something is amiss, Please try with different parameters",
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

  this.req._sails.log.info(
    `${dateTime.create().format("Y-m-d H:M:S")} - ${(new Error().stack.split("at ")[2]).trim()} Sent (400 BAD REQUEST) ${JSON.stringify(response)}`,
  );

  this.res.status(400);
  this.res.json(response);
  // this.res.json(localize(response, this.res));
};

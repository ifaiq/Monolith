/**
 * 500 (Internal Server Error) Response
 *
 * A generic error message, given when no more specific message is suitable.
 * The general catch-all error when the server-side throws an exception.
 */
const Sentry = require("@sentry/node");

const localize = require("../../utils/localize");

var dateTime = require("node-datetime");

module.exports = function (info, options, root) {
  if (info.name === 'AdapterError') {
    info = "Database adapter error occured!"
  }
  var response = _.assign(
    {
      code: "E_INTERNAL_SERVER_ERROR",
      message: info || "Something went wrong, Please try again later",
      trace: info || {},
      data: {},
      success: false,
    },
    root
  );
  // this will/can also overwrite the default values above, if sent (code, message, data. success)
  if (options) {
    Object.keys(options).forEach(function (key) {
      response[key] = options[key];
    });
  }

  Sentry.captureException(info);

  this.req._sails.log.error(
    dateTime.create().format("Y-m-d H:M:S") +
      " - Sent (500 INTERNAL SERVER ERROR)\n",
    info ? info : ""
  );

  this.res.status(500);
  this.res.json(response);
  // this.res.json(localize(response, this.res));
};

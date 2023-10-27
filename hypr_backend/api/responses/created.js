/**
 * 201 (Created) Response
 *
 * The request has been fulfilled and resulted in a new resource being created.
 * Successful creation occurred (via either POST or PUT).
 * Set the Location header to contain a link to the newly-created resource (on POST).
 * Response body content may or may not be present.
 */

const localize = require("../../utils/localize");

module.exports = function (data, options, root) {
  var response = _.assign(
    {
      code: "CREATED",
      message: "The request has been fulfilled and resulted in a new resource being created",
      userMessage: "Your request has been processed successfully",
      data: data || {},
      success: true
    },
    root
  );
  // this will/can also overwrite the default values above, if sent (code, message, data. success)
  if (options) {
    Object.keys(options).forEach(function (key) {
      response[key] = options[key];
    });
  }

  this.req._sails.log.info("Sent (201 CREATED)\n", response);

  this.res.status(201);
  this.res.json(localize(response, this.res));
};

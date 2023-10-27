/**
* 204 (NoContent) Response
*
* General status code. Most common code used to indicate delete success.
* The actual response will depend on the request method used.
*/

const localize = require("../../utils/localize");

module.exports = function (data, code, message, root) {
  var response = _.assign({
    code: code || 'NO_CONTENT',
    message: message || 'Operation is successfully executed',
    userMessage: "Your request has been processed successfully",
    data: data || {}
  }, root);

  this.req._sails.log.silly('Sent (204 NoContent)\n', response);

  this.res.status(204);
  this.res.json(response);
  // this.res.json(localize(response, this.res));
};

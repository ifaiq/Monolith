const HttpStatus = require("http-status-codes");

const localize = require("../../utils/localize");

module.exports = function reply(optionalData = {}) {
  let req = this.req;
  let res = this.res;

  let data = typeof optionalData.data === "undefined" ? {} : optionalData.data;
  let statusCode =
    typeof optionalData.statusCode === "undefined"
      ? 200
      : optionalData.statusCode;
  let message =
    typeof optionalData.message === "undefined"
      ? generateMessage(statusCode)
      : optionalData.message;

  let statusCodeText = HttpStatus.getStatusText(statusCode);
  message = message !== null ? message : statusCodeText;

  const result = localize({
    success: false,
    status: statusCodeText.toUpperCase().split(" ").join("_"),
    message: message,
  }, res);

  if (statusCode >= 300) {
    return res
      .status(statusCode)
      .send({ ...result, success: false, error: data });
  }
  return res.status(statusCode).send({ ...result, success: true, data: data });
};

function generateMessage(code) {
  let message = common_messages.hasOwnProperty(code)
    ? common_messages[code]
    : null;
  return message;
}

let common_messages = {
  "200": "Request processed successfully.",
  "201": "New entry has been created.",
  "400":
    "Invalid request params",
  "401":
    "The client is not allowed to access resources, and should re-request with the required credentials.",
  "403": "The client is not allowed access the resource.",
  "404": "The requested resource is not available.",
  "500":
    "Request can not be processed due to unexpected internal server error.",
  "503": "Server is down or unavailable to receive and process the request",
};

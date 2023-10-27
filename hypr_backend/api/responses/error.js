const Sentry = require("@sentry/node");

const localize = require("../../utils/localize");

module.exports = function error(optionalData) {
  let req = this.req;
  let res = this.res;

  let statusCodeToSet = 500;

  if (optionalData && typeof optionalData === "object") {
      statusCodeToSet = optionalData.stack ? (optionalData.statusCode || 500) : 400;
  }

  if(optionalData.stack && (statusCodeToSet < 200 || statusCodeToSet > 409)) {
    Sentry.captureException(optionalData);
  }

  const reply = localize({
    statusCode: statusCodeToSet,
    data: (optionalData && (optionalData.stack || optionalData.data)) || {},
    message: (optionalData && optionalData.message) || undefined,
  }, res);

  return res.reply(reply);
};

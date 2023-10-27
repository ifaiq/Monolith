const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");

const controller = `${v1}/UserNotificationController`;

module.exports = {
  "POST /upsertUserNotification": {
    controller,
    action: "upsertUserNotification",
    validate: "upsertNotificationValidation",
  },
  "POST /": { controller, action: "sendCustomerNotification" },
};

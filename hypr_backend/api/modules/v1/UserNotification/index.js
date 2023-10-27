const UserNotificationService = require("./UserNotificationService");
const userNotificationRoutes = require("./UserNotificationRoutes");
const { addPrefixWithRoutes } = require("../../../../utils/routes");
const { constants: { request: { VERSIONING: { v1, prefix } } } } = require("../../../constants/http");
const userNotificationJoiValidation = require("./UserNotificationJoiValidation");

module.exports = {
  userNotificationRoutes: addPrefixWithRoutes(`/${prefix}/${v1}/notification`, userNotificationRoutes),
  UserNotificationService,
  userNotificationJoiValidation,
};

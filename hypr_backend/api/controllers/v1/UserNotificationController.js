const { UserNotificationService:
  {
    upsertNotification,
    sendCustomerNotification: sendNotification,
  },
} = require("../../modules/v1/UserNotification");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../constants/http");

/**
 * UserNotification controller to create notification or update if exists
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Success} return ok 200 response
 */
const upsertUserNotification = async (req, res) => {
  const { body, userId, user: { role } } = req;
  const logIdentifier = `API version: ${v1}, 
  context: UserNotificationController.upsertUserNotification(),
  UserId: ${userId}, 
  Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(body)}`);
    await upsertNotification(body, userId);
    res.ok(true);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

/**
 * Responsible to send customer notification
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const sendCustomerNotification = async (req, res) => {
  const { body: { customerId, message } } = req;
  const logIdentifier = `API version: V1, context: UserController.sendCustomerNotification(),`;
  try {
    sails.log.info(`${logIdentifier} sending customer notification against customer - ${customerId}`);
    const result = await sendNotification(customerId, message);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

module.exports = {
  upsertUserNotification,
  sendCustomerNotification,

};

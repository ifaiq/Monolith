const {
  destroyByCriteria,
  findUserNotifications,
  createUserNotification,
  updateUserNotification,
} = require("./UserNotificationDao");
const {
  findCustomerWithPlayerIds,
} = require("../Auth/CustomerDao");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");

const deleteUserNotificationCustomerIdPlayerId = async (customerId, playerId) =>
  destroyByCriteria({ customerId, playerId });

const upsertNotification = async ({ playerId, version }, customerId) => {
  const logIdentifier = `API version: ${v1}, Context: UserNotificationService.upsertNotification(),`;
  sails.log(`${logIdentifier}`);
  let criteria = { playerId, customerId };
  const sortOptions = [{ id: "DESC" }];
  const payload = { playerId, customerId, version };
  const userNotification = await findUserNotifications(criteria, sortOptions, 1);
  if (!_.isEmpty(userNotification)) {
    // Need to use [0], because getting Array from the findUserNotifications().
    // We need only leatest record.This is added for temporary.
    criteria = { id: userNotification[0].id };
    await updateUserNotification(criteria, payload);
  } else {
    await createUserNotification(payload);
  }
};

/**
 * This function takes the customerId and sends notification
 *
 * @param {Number} customerId
 * @returns {CustomerId} number
 */
const sendCustomerNotification = async (customerId, message) => {
  const customer = await findCustomerWithPlayerIds(customerId);
  if (customer.notificationIds) {
    sails.log.info(`Going to send notification to customer ${customer.phone}`);
    playerIds = customer.notificationIds.map(not => not.playerId);
    NotificationService.sendCustomerNotification(
      message,
      playerIds,
      {},
      customer.companyId,
    );
  }
  return;
};


module.exports = {
  deleteUserNotificationCustomerIdPlayerId,
  upsertNotification,
  sendCustomerNotification,
};

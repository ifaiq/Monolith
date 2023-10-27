const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");
const notificationExtractionService = require("../../../notification_service_extraction/userNotificationService");

/**
 * @deprecated moved to notification service
 * This function take criteria and payload to update a record
 *
 * @param {Obejct} criteria
 * @param {Object} payload
 * @return {Array} userNotification
 */
const updateUserNotification = async (criteria, payload) =>
  camelcaseKeys(
    await UserNotifications.update(
      snakecaseKeys(criteria),
      snakecaseKeys(payload),
    ),
  );

/**
 * @deprecated moved to notification service
 * This function takes criteria, sort options and limit to find user notification
 *
 * @param {Object} criteria
 * @param {Array} sortOptions In sorting option passing an array of objects
 * @param {Number} limit
 * @returns {Array}
 */
const findUserNotifications = async (criteria, sortOptions, limit) =>
  camelcaseKeys(
    await UserNotifications.find(snakecaseKeys(criteria))
      .sort(sortOptions)
      .limit(limit),
  );

/**
 * This function takes criteria, sort options and limit to find user notification
 * @param {Object} criteria
 * @returns {Array}
 */
const findAllUserNotifications = async criteria => await notificationExtractionService.find(criteria);

/**
 * This function create usernotification
 * @param {Obejct} payload
 * @returns {Promise}
 */
const createUserNotification = async payload => await notificationExtractionService.create(payload);

/**
 * This function takes the criteria and destroys user notifications against it
 *
 * @param {Object} criteria
 * @returns {Array} userNotification
 */
const destroyByCriteria = async criteria => await notificationExtractionService.deleteByCriteria(criteria);

module.exports = {
  createUserNotification,
  findUserNotifications,
  updateUserNotification,
  findAllUserNotifications,
  destroyByCriteria,
};

const { makeParamsForNotificationService } = require("./helper");
const { URLS: {
  NOTIFICATION_SERVICE_BASE_URL,
  USER_NOTIFICATIONS,
  DELETE_BY_CRITERIA,
} } = require("./constants");
const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");
const { createServiceToken } = require("@development-team20/auth-library/dist");
const { get, post, delete: axiosDelete } = require("../clients/AxiosClient");
const fileLogIdentifier = "Extraction Service: Notification Service";

const find = async params => {
  const logIdentifier = `${fileLogIdentifier} Context: find`;
  try {
    const response = await get({
      url: `${NOTIFICATION_SERVICE_BASE_URL}/${USER_NOTIFICATIONS}`,
      params: camelcaseKeys(makeParamsForNotificationService(params)),
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return snakecaseKeys(response[response.keyName]);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error finding notifications. Error: ${JSON.stringify(error)}`);
    throw error;
  }
};

const create = async params => {
  const logIdentifier = `${fileLogIdentifier} Context: create`;
  try {
    const response = await post({
      url: `${NOTIFICATION_SERVICE_BASE_URL}/${USER_NOTIFICATIONS}`,
      data: camelcaseKeys(makeParamsForNotificationService(params)),
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return snakecaseKeys(response[response.keyName]);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error creating notification. Error: ${JSON.stringify(error)}`);
    throw error;
  }
};

const deleteByCriteria = async params => {
  const logIdentifier = `${fileLogIdentifier} Context: deleteByCriteria`;
  try {
    const response = await axiosDelete({
      url: `${NOTIFICATION_SERVICE_BASE_URL}/${USER_NOTIFICATIONS}/${DELETE_BY_CRITERIA}`,
      data: camelcaseKeys(makeParamsForNotificationService(params)),
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return response[response.keyName];
  } catch (error) {
    sails.log.error(`${logIdentifier} Error deleting notification by criteria. Error: ${JSON.stringify(error)}`);
    throw error;
  }
};

module.exports = {
  find,
  create,
  deleteByCriteria,
};

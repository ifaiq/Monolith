const { makeParamsForRbacService } = require("./helper");
const { get, post } = require("../clients/AxiosClient");
const { URLS: {
  RBAC_SERVICE_BASE_URL,
  USER_ROLES,
} } = require("./constants");
const snakecaseKeys = require("snakecase-keys");
const camelcaseKeys = require("camelcase-keys");
const { createServiceToken } = require('@development-team20/auth-library/dist');

const find = async params => {
  try {
    const response = await get({
      url: `${RBAC_SERVICE_BASE_URL}/${USER_ROLES}`,
      params: makeParamsForRbacService(params),
      headers: {
        Authorization: await createServiceToken()
      },
    });
    return snakecaseKeys(response[response.keyName], { deep: true });
  } catch (error) {
    throw error;
  }
};

const create = async params => {
  try {
    const response = await post({
      url: `${RBAC_SERVICE_BASE_URL}/${USER_ROLES}`,
      data: camelcaseKeys(params),
      headers: {
        Authorization: await createServiceToken()
      },
    });
    return snakecaseKeys(response[response.keyName]);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  find,
  create,
};

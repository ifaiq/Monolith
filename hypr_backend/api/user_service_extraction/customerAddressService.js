const axios = require('../clients/AxiosClient');
const userServiceBaseApis = require('./constants');
const { makeParamsForUserService } = require('./helper');
const { createServiceToken } = require('@development-team20/auth-library/dist');
const snakecaseKeys = require("snakecase-keys");

const find = async (criteria) => {
  try {
    const res = await axios.get({
      url: `${userServiceBaseApis.URLS.USER_SERVICE_BASE_URL}/${userServiceBaseApis.URLS.CUSTOMER_ADDRESS}`,
      params: makeParamsForUserService(criteria),
      headers: {
        Authorization: await createServiceToken()
      },
    });
    return snakecaseKeys(res[res.keyName], { deep: true });
  } catch (e) {
    throw e;
  }
}

const findOne = async ({ id }) => {
  try {
    const res = await axios.get({
      url: `${userServiceBaseApis.URLS.USER_SERVICE_BASE_URL}/${userServiceBaseApis.URLS.CUSTOMER_ADDRESS}/${id}`,
      params: {},
      headers: {
        Authorization: await createServiceToken()
      },
    });
    return snakecaseKeys(res[res.keyName], { deep: true });
  } catch (e) {
    // TODO: need to revist - temp workaround for regression block
    return null;
    // throw error;
  }
}

module.exports = {
  find,
  findOne
}

const { makeParamsForUserService } = require("./helper");
const { get, post } = require("../clients/AxiosClient");
const { URLS: {
  USER_SERVICE_BASE_URL,
  USER,
} } = require("./constants");
const snakecaseKeys = require("snakecase-keys");
const camelcaseKeys = require("camelcase-keys");
const { createServiceToken } = require('@development-team20/auth-library/dist');

const getAll = async params => {
  try {
    const response = await get({
      url: `${USER_SERVICE_BASE_URL}/${USER}`,
      params: makeParamsForUserService(params),
      headers: {
        Authorization: await createServiceToken()
      },
    });
    return snakecaseKeys(response[response.keyName]);
  } catch (error) {
    throw error;
  }
};

const getOne = async params => {
  try {
    const { id, ...rest } = makeParamsForUserService(params);
    const response = await get({
      url: `${USER_SERVICE_BASE_URL}/${USER}/${id}`,
      params: rest,
      headers: {
        Authorization: await createServiceToken()
      },
    });
    return snakecaseKeys(response[response.keyName]);
  } catch (error) {
    // TODO: need to revist - temp workaround for regression block
    return null;
    // throw error;
  }
};

const create = async params => {
  try {
    const response = await post({
      url: `${USER_SERVICE_BASE_URL}/${USER}`,
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
  getAll,
  getOne,
  create,
};

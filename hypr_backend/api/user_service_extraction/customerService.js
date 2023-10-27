const { makeParamsForUserService } = require("./helper");
const { URLS: {
  USER_SERVICE_BASE_URL,
  CUSTOMER,
} } = require("./constants");
const { get, put, post } = require("../clients/AxiosClient");
const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");
const { createServiceToken } = require('@development-team20/auth-library/dist');

const find = async params => {
  try {
    const response = await get({
      url: `${USER_SERVICE_BASE_URL}/${CUSTOMER}`,
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

const findOne = async params => {
  try {
    const { id, ...rest } = makeParamsForUserService(params);
    const response = await get({
      url: `${USER_SERVICE_BASE_URL}/${CUSTOMER}/${id}`,
      params: rest,
      headers: {
        Authorization: await createServiceToken()
      },
    });
    return snakecaseKeys(response[response.keyName]);
  } catch (error) {
    sails.log.error(`customerService.findOne() encountered an error: ${JSON.stringify(error.stack || error)}`);
    // TODO: need to revist - temp workaround for regression block
    return null;
    // throw error;
  }
};

const update = async ({ id }, data) => {
  try {
    const response = await put({
      url: `${USER_SERVICE_BASE_URL}/${CUSTOMER}/${id}`,
      data: camelcaseKeys(data),
      params: {},
      headers: {
        Authorization: await createServiceToken()
      },
    });
    return snakecaseKeys(response[response.keyName]);
  } catch (error) {
    throw error;
  }
}

const create = async data => {
  try {
    const response = await post({
      url: `${USER_SERVICE_BASE_URL}/${CUSTOMER}`,
      data: camelcaseKeys(data),
      headers: {
        Authorization: await createServiceToken()
      },
    });
    return snakecaseKeys(response[response.keyName]);
  } catch (error) {
    throw error;
  }
};

const getCountByCriteria = async criteria => {
  try {
    const response = await get({
      url: `${USER_SERVICE_BASE_URL}/${CUSTOMER}`,
      params: makeParamsForUserService({ ...criteria, limit: 1 }),
      headers: {
        Authorization: await createServiceToken()
      },
    });
    return response.pagination.totalCount;
  } catch (error) {
    throw error;
  }
};

// [INTERIM CONTROLLER]: should be removed once coupon service went live
const findAll = async (params, body) => {
  try {
    sails.log.info(`CUSTOMER EXTRACTION SERVICE ( INTERIM FIND ALL ): BODY - ${JSON.stringify(body)}`)
    const response = await post({
      url: `${USER_SERVICE_BASE_URL}/${CUSTOMER}/${CUSTOMER}s`,
      params: makeParamsForUserService(params),
      data: body,
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
  findOne,
  update,
  create,
  getCountByCriteria,
  findAll
};

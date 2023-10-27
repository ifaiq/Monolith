const axios = require("../clients/AxiosClient");
const userServiceBaseApis = require("./constants");
const { makeParamsForUserService } = require("./helper");
const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");
const { createServiceToken } = require('@development-team20/auth-library/dist');

const findOne = async (criteria) => {
  criteria = Object.assign(criteria, { limit: 1 });
  try {
    const res = await axios.get({
      url: `${userServiceBaseApis.URLS.USER_SERVICE_BASE_URL}/${userServiceBaseApis.URLS.SHOP_DETAIL}`,
      params: camelcaseKeys(makeParamsForUserService(criteria)),
      headers: {
        Authorization: await createServiceToken()
      },
    });
    return snakecaseKeys(res[res.keyName][0]);
  } catch (e) {
    sails.log.error(`customerRetailerShopDetailService.findOne() encountered an error: ${JSON.stringify(e.stack || e)}`);
    // TODO: need to revist - temp workaround for regression block
    return null;
    // throw error;
  }
}

module.exports = {
  findOne
}

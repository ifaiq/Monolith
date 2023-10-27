const axios = require("../clients/AxiosClient");
const configServiceBaseApis = require("./configServiceConstants");
const { makeParamsForUserService } = require("./helper");
const { createServiceToken } = require("@development-team20/auth-library/dist");
const snakecaseKeys = require("snakecase-keys");
const camelcaseKeys = require("camelcase-keys");

const fileLogIdentifier = "Extraction Service: Location";

const find = async (criteria, requiresPagination = false) => {
  const logIdentifier = `${fileLogIdentifier} Context: find`;
  try {
    const res = await axios.get({
      url: `${configServiceBaseApis.URLS.CONFIG_SERVICE_BASE_URL}/${configServiceBaseApis.URLS.LOCATION}`,
      params: makeParamsForUserService(camelcaseKeys(criteria)),
      headers: {
        Authorization: await createServiceToken(),
      },
    });

    if (requiresPagination) {
      return {
        data: snakecaseKeys(res.data, { deep: true }),
        pagination: res.pagination,
      };
    }

    return snakecaseKeys(res[res.keyName], { deep: true });
  } catch (e) {
    sails.log.error(`${logIdentifier} Error: ${JSON.stringify(e.stack || e)}`);
    throw e;
  }
};

const findOne = async ({ id, ...args }) => {
  const logIdentifier = `${fileLogIdentifier} Context: findOne`;
  if (!id) {
    return null;
  }

  try {
    const res = await axios.get({
      url: `${configServiceBaseApis.URLS.CONFIG_SERVICE_BASE_URL}/${configServiceBaseApis.URLS.LOCATION}/${id}`,
      params: makeParamsForUserService(camelcaseKeys(args)),
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return snakecaseKeys(res[res.keyName], { deep: true });
  } catch (e) {
    sails.log.error(`${logIdentifier} Error: ${JSON.stringify(e.stack || e)}`);
    throw e;
  }
};

const getStore = async (lat, lng) => {
  const logIdentifier = `${fileLogIdentifier} Context: getStore`;
  try {
    const res = await axios.get({
      url: `${configServiceBaseApis.URLS.CONFIG_SERVICE_BASE_URL}/${configServiceBaseApis.URLS.LOCATION}/getStore?lat=${lat}&lng=${lng}`,
      headers: {
        Authorization: await createServiceToken(),
      },
    });

    return snakecaseKeys(res[res.keyName], { deep: true });
  } catch (e) {
    sails.log.error(`${logIdentifier} Error: ${JSON.stringify(e.stack || e)}`);
    throw e;
  }
};

module.exports = {
  find,
  findOne,
  getStore,
};

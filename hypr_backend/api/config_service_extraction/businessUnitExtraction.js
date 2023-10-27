
const axios = require("../clients/AxiosClient");
const configServiceBaseApis = require("./configServiceConstants");
const { makeParamsForUserService } = require("./helper");
const { createServiceToken } = require("@development-team20/auth-library/dist");
const snakecaseKeys = require("snakecase-keys");
const camelcaseKeys = require("camelcase-keys");

const fileLogIdentifier = "Extraction Service: Business Unit";

const find = async criteria => {
  const logIdentifier = `${fileLogIdentifier} Context: find`;
  try {
    const res = await axios.get({
      url: `${configServiceBaseApis.URLS.CONFIG_SERVICE_BASE_URL}/${configServiceBaseApis.URLS.BUSINESS_UNIT}`,
      params: makeParamsForUserService(camelcaseKeys(criteria)),
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return snakecaseKeys(res[res.keyName], { deep: true });
  } catch (e) {
    sails.log.error(`${logIdentifier} Error fetching Business Units. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};

const findOne = async ({ id }) => {
  const logIdentifier = `${fileLogIdentifier} Context: findOne`;
  if (!id) {
    return null;
  }
  try {
    const res = await axios.get({
      url: `${configServiceBaseApis.URLS.CONFIG_SERVICE_BASE_URL}/${configServiceBaseApis.URLS.BUSINESS_UNIT}/${id}`,
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return snakecaseKeys(res[res.keyName], { deep: true });
  } catch (e) {
    sails.log.error(`${logIdentifier} Error finding one Business Unit. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};

// The API which uses this is moved to config service
// Todo remove this once the rerouting is setup
const count = async criteria => {
  const logIdentifier = `${fileLogIdentifier} Context: count`;
  try {
    return await BusinessUnit.count(criteria);
  } catch (e) {
    sails.log.error(`${logIdentifier} Error counting business units. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};

// The API which uses this is moved to config service
// Todo remove this once the rerouting is setup
const create = async bu => {
  const logIdentifier = `${fileLogIdentifier} Context: create`;
  try {
    return await BusinessUnit.create(bu).fetch();
  } catch (e) {
    sails.log.error(`${logIdentifier} Error creating Business Unit. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};

module.exports = {
  find,
  findOne,
  count,
  create,
};

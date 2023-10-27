
const axios = require("../clients/AxiosClient");
const configServiceBaseApis = require("./configServiceConstants");
const { makeParamsForUserService } = require("./helper");
const { createServiceToken } = require("@development-team20/auth-library/dist");
const snakecaseKeys = require("snakecase-keys");
const camelcaseKeys = require("camelcase-keys");

const fileLogIdentifier = "Extraction Service: App Version";

const find = async criteria => {
  const logIdentifier = `${fileLogIdentifier} Context: find`;
  try {
    const res = await axios.get({
      url: `${configServiceBaseApis.URLS.CONFIG_SERVICE_BASE_URL}/${configServiceBaseApis.URLS.APP_VERSION}`,
      params: makeParamsForUserService(camelcaseKeys(criteria)),
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return snakecaseKeys(res[res.keyName], { deep: true });
  } catch (e) {
    sails.log.error(`${logIdentifier} Error fetching AppVersions. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};


module.exports = {
  find,
};

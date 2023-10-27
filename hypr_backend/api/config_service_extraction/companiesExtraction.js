const axios = require("../clients/AxiosClient");
const configServiceBaseApis = require("./configServiceConstants");
const { createServiceToken } = require("@development-team20/auth-library/dist");
const snakecaseKeys = require("snakecase-keys");

const fileLogIdentifier = "Extraction Service: Companies";

const retailoCompanyCode = 'RET';
let company = null;

const find = async criteria => {
  const logIdentifier = `${fileLogIdentifier} Context: find`;
  try {
    return [await fetchCompany()];
  } catch (e) {
    sails.log.error(`${logIdentifier} Error fetching Companies. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};

const findOne = async criteria => {
  const logIdentifier = `${fileLogIdentifier} Context: findOne`;
  try {
    return await fetchCompany();
  } catch (e) {
    sails.log.error(`${logIdentifier} Error finding one Company. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};

const fetchCompany = async () => {
  const logIdentifier = `${fileLogIdentifier} Context: fetchCompany`;
  try {
    if (company) { // Returning memoized company
      return company;
    }
    const res = await axios.get({
      url:
        `${configServiceBaseApis.URLS.CONFIG_SERVICE_BASE_URL}/${configServiceBaseApis.URLS.COMPANY}/getRetailoCompany`,
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    company = snakecaseKeys(res[res.keyName], { deep: true });
    return company;
  } catch (e) {
    sails.log.error(`${logIdentifier} Error fetching company. Error: ${JSON.stringify(e)}`);
    throw e;
  }
};


module.exports = {
  find,
  findOne,
};

const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");
const { getS2sAuthToken } = require("../Utils/s2sAuthHelper");
const axios = require("../../../clients/AxiosClient");

const FEATURE_SERVICE_BASE_URL = process.env.FEATURE_SERVICE_BASE_URL || "https://dev.retailo.me/feature";

/**
* This function takes the businessUnitId and return features list.
*
* @param {Number} businessUnitId
* @returns {feature[]} features
*/
const findFeaturesByBusinessUnitId = async businessUnitId => {
  const hierarchyFeatures = await HierarchyFeatures.find(snakecaseKeys({ businessUnitId })).populate("feature_id");
  return camelcaseKeys(hierarchyFeatures);
};

const findFeaturesByLocationId = async locationId => {
  try {
    const authToken = await getS2sAuthToken();
    const result = await axios.get(
      {
        url: `${FEATURE_SERVICE_BASE_URL}/hierarchy-feature`,
        headers: {
          Authorization: authToken,
        },
        params: {
          relations: "feature",
          locationId: locationId,
        },

      },
    );

    return camelcaseKeys(result.data);
  } catch (error) {
    sails.log.error(`HierarchyFeaturesDao.findFeaturesByLocationId Error: ${JSON.stringify(error)}`);
    return [];
  }
};

module.exports = {
  findFeaturesByBusinessUnitId,
  findFeaturesByLocationId,
};

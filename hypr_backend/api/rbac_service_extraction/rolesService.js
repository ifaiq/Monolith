const { makeParamsForRbacService } = require("./helper");
const { get, post } = require("../clients/AxiosClient");
const {
  URLS: { RBAC_SERVICE_BASE_URL, ROLES },
} = require("./constants");
const snakecaseKeys = require("snakecase-keys");
const { createServiceToken } = require("@development-team20/auth-library/dist");

const findOne = async (params) => {
  try {
    const response = await get({
      url: `${RBAC_SERVICE_BASE_URL}/${ROLES}/${params.id}`,
      params: {},
      headers: {
        Authorization: await createServiceToken(),
      },
    });
    return snakecaseKeys(response[response.keyName], { deep: true });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  findOne,
};

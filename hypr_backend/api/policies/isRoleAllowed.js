/* eslint-disable consistent-return */
const axios = require("../clients/AxiosClient");
const { URLS: {
  RBAC_SERVICE_BASE_URL,
  ROLE_PERMISSIONS
} } = require("../rbac_service_extraction/constants");
const { createServiceToken } = require('@development-team20/auth-library/dist');

module.exports = async function (req, res, next) {
  const { locals: { userData: { role: { id: roleId } }, authenticated } } = res;
  if (authenticated) {
    try {
      await axios.get({
        url: `${RBAC_SERVICE_BASE_URL}/${ROLE_PERMISSIONS}/${roleId}/check-permission`,
        params: {
          api: req.path,
          method: req.method
        },
        headers: {
          Authorization: await createServiceToken(),
        },
      });
      return next();
    } catch (e) {
      console.log(`isRoleAllowed: error occured - ${JSON.stringify(e)}`)
      return res.unauthorized("Role is not allowed to access this resource");
    }
  } else {
    return res.unauthorized("User not authenticated");
  }
};
// Auth Library Import
const { verifyUserToken } = require('@development-team20/auth-library/dist');
// Constants Import
const { constants } = require("../constants/http");
const userRolesExtractionService = require("../rbac_service_extraction/userRolesService");

module.exports = async function (req, res, next) {
  const token = req.header("Authorization");
  const app_version = req.header("app_version") || '';
  if (token) {
    try {
      let { tokenPayload: verify, token: updatedToken } = await verifyUserToken(token, app_version);
      console.log(`Request path: ${req.path} - payload: ${JSON.stringify(verify)}`)
      if (updatedToken !== token) {
        console.log(`request and response tokens were different, sending back x-auth-token`);
        res.set(constants.response.HEADER.updatedToken, updatedToken);
      }
      if (verify) {
        /**
         * TODO
         * In Retailo we are not using multiple roles for a single user.
         * Please update find() with findOne() while auth refactoring.
         * user_roles table will be deprecated because user and roles have a one-to-one relationship.
         * introduce role_id in the user table as FK to achieve a one-to-one relationship.
         *  */

        let db_user_roles = await userRolesExtractionService.find({
          userId: verify.id,
        });
        let user_role_ids = db_user_roles.map((role) => role.role_id);
        if (
          verify.role.id != Constants.HyprRoles.CONSUMER &&
          !user_role_ids.includes(verify.role.id)
        ) {
          console.log(`sending unauthorized as role criteria wasn't passed. role: ${verify.role.id} - user role ids = ${JSON.stringify(user_role_ids)}`);
          return res.unauthorized('sending unauthorized as role criteria wasnt passed');
        } else {
          // adding a simplified object to be used in new refactored flows till auth service is in place
          req.user = { id: verify.id, role: verify.role.id, phone: verify.phone, cnic: verify.cnic };
          // adding customer_id to headers for logging at response level
          req.headers.user_id = verify.id;
          req.headers.user_type = Constants.HyprRoles.getKeyFromValue(verify.role.id);
          req.userId = verify.id;
          res.locals.userData = verify;
          res.locals.authenticated = true;
          req = await crossCheckParams(req, res);
          next();
        }
      }
    } catch (err) {
      console.log(`error occured while processing token ${JSON.stringify(err)}`);
      return res.unauthorized('error occured while processing token');
    }
  } else {
    console.log(`token was not sent with request headers!`);
    return res.unauthorized('token was not sent with request headers');
  }
};

/**
 * function is responsible to check query/body param ID's and match them with token, if mismatch, override
 * @param {*} req
 * @param {*} res
 */
const crossCheckParams = async (req, res) => {
  const logIdentifier = 'CROSS CHECK PARAMS:';
  const { locals: { userData: { role: { id: tokenRole }, id: tokenUser } } } = res;
  const { role_id, roleId, customerId, customer_id, agentId, delivery_boy_id } = req.allParams();
  const allowedApisForRoleIdInQuery = ['/user/getAllUsers', '/user/getUserByRoles','/api/v1/rolesAppVersion']; // we need to check if this api is allowed to recieve role_id in query params
  const roleIdInParams = role_id || roleId;
  const customerIdInParams = customer_id || customerId;
  const deliveryAgentIdInParams = agentId || delivery_boy_id;
  sails.log.info(`invoked cross checked params`);
  if (roleIdInParams && roleIdInParams !== tokenRole && !allowedApisForRoleIdInQuery.includes(req.path)) {
    sails.log.info(`${logIdentifier} role id found in params`);
    if (req.query) {
      req.query.role_id = tokenRole.toString();
      req.query.roleId = tokenRole.toString();
    }
    if (req.body) {
      req.body.role_id = tokenRole;
      req.body.roleId = tokenRole;
    }
  }
  if (customerIdInParams && tokenRole === Constants.HyprRoles.CONSUMER && customerIdInParams !== tokenUser) {
    sails.log.info(`${logIdentifier} customer id found in params`);
    if (req.query) {
      if (req.query.customer_id) req.query.customer_id = tokenUser.toString();
      if (req.query.customerId) req.query.customerId = tokenUser.toString();
    }
    if (req.body) {
      if (req.body.customer_id) req.body.customer_id = tokenUser;
      if (req.body.customerId) req.body.customerId = tokenUser;
    }
  }
  if (deliveryAgentIdInParams && deliveryAgentIdInParams !== tokenUser) {
    sails.log.info(`${logIdentifier} delivery agent id found in params`);
    if (req.query) {
      req.query.agentId = tokenUser.toString();
      req.query.delivery_boy_id = tokenUser.toString();
    }
    if (req.body) {
      req.body.agentId = tokenUser;
      req.body.delivery_boy_id = tokenUser;
    }
  }
  return req;
}

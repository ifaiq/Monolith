const uuid4 = require("uuid4");
const { HyprRoles: { DELIVERY } } = require("../services/Constants");
const { isNewerVersion } = require("../../utils/controller/index")
const userExtractionService = require('../user_service_extraction/userService');
const accountSettingExtractionService = require("../config_service_extraction/accountSettingsExtraction");
const appVersionExtractionService = require("../config_service_extraction/appVersionExtractionService");
const userRolesExtractionService = require("../rbac_service_extraction/userRolesService");

module.exports = {
  validate_required_hirarchy(role, params, validate) {
    if (role == Constants.HyprRoles.ADMIN) {
      validate.isAdminUser = true;
      // no validations required
    } else if (
      [
        Constants.HyprRoles.COMPANY_OWNER,
        Constants.HyprRoles.CARE,
        Constants.HyprRoles.GROWTH_SALES,
        Constants.HyprRoles.LEADS,
        Constants.HyprRoles.COMMERCIAL,
        Constants.HyprRoles.LOGISTICS,
        Constants.HyprRoles.MONTREAL_INTERN,
      ].includes(typeof role == "string" ? parseInt(role) : role)
    ) {
      validate.isCompanyUser = true;
      if (
        !params.companies ||
        !Array.isArray(params.companies) ||
        !params.companies.length
      ) {
        validate.errors.push("Missing parameter 'companies' is required");
      }
    } else if (role == Constants.HyprRoles.BU_MANAGER) {
      validate.isBUUser = true;
      if (
        !params.business_units ||
        !Array.isArray(params.business_units) ||
        !params.business_units.length
      ) {
        validate.errors.push("Missing parameter 'business_units' is required");
      }
    } else {
      validate.isLocationUser = true;
      if (
        !params.locations ||
        !Array.isArray(params.locations) ||
        !params.locations.length
      ) {
        validate.errors.push("Missing parameter 'locations' is required");
      }
    }
    return validate;
  },
  validate_signup: function (params) {
    let validate = {
      success: true,
      errors: [],
    };
    if (params.roles && params.roles.length == 1) {
      validate = AuthService.validate_required_hirarchy(
        params.roles[0],
        params,
        validate
      );
    } else {
      // only location users can have multiple roles
      params.roles.forEach(function (role) {
        if (
          [
            Constants.HyprRoles.COMPANY_OWNER,
            Constants.HyprRoles.CARE,
            Constants.HyprRoles.GROWTH_SALES,
            Constants.HyprRoles.LEADS,
            Constants.HyprRoles.COMMERCIAL,
            Constants.HyprRoles.LOGISTICS,
            Constants.HyprRoles.BU_MANAGER,
            Constants.HyprRoles.MONTREAL_INTERN,
          ].includes(typeof role == "string" ? parseInt(role) : role)
        ) {
          validate.errors.push("Invalid roles entered");
        }
      });
    }
    validate.success = !(validate.errors.length > 0);
    return validate;
  },
  getUserAccountSettings: function (user, company_id) {
    console.log("GOING TO ADD ACCOUNT SETTINGS FOR USER - ", user.id);
    return new Promise(async (resolve, reject) => {
      try {
        const settings = await accountSettingExtractionService.findOne({ company_id: company_id });
        if (settings) {
          // custom object for settings
          var settingsObj = {
            currency: settings.currency,
            language: settings.language,
            timezone: settings.timezone,
          };
          user["settings"] = settingsObj;
          resolve(user);
        } else {
          // if settings are not saved
          user["settings"] = {};
          resolve(user);
        }
      } catch (e) {
        reject(e);
      }
    });
  },
  createTokenAndCache: async function (user) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        sails.log.info(
          `Context: AuthService.createTokenAndCache user: ${JSON.stringify(
            user
          )}`
        );
        user["session_uuid"] = uuid4();
        token = CipherService.createToken(user, false);
        // do these two things in parallel
        let dbSession = await Sessions.create({
          token: token,
          session_uuid: user["session_uuid"],
          user_id:
            user.role.id != Constants.HyprRoles.CONSUMER ? user.id : null,
          customer_id:
            user.role.id == Constants.HyprRoles.CONSUMER ? user.id : null,
        });
        sails.log(
          `Context: AuthService.createTokenAndCache DB session created: ${JSON.stringify(
            dbSession
          )}`
        );
        let tokenQuery = `${RedisService.FILTER_NAMES.token}_*${JSON.stringify(
          token
        )}_*`;
        sails.log(
          `Context: AuthService.createTokenAndCache tokenQuery: ${tokenQuery}`
        );
        RedisService.client.set(tokenQuery, "1");
        sails.log(
          `Context: AuthService.createTokenAndCache token: ${JSON.stringify(
            token
          )}`
        );
        resolve(token);
      } catch (err) {
        sails.log.error(
          `Context: AuthService.createTokenAndCache Failed to create token for ${user.phone
          } Error: ${JSON.stringify(err)}`
        );
        reject();
      }
    });
    return response;
  },
  validateToken: async function (token) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        sails.log.info(
          `Context: AuthService.validateToken token: ${JSON.stringify(token)}`
        );
        let tokenUser = await CipherService.verifyToken(token);
        if (tokenUser) {
          sails.log(
            `Context: AuthService.validateToken tokenUser: ${JSON.stringify(
              tokenUser
            )}`
          );
          let tokenQuery = `${RedisService.FILTER_NAMES.token
            }_*${JSON.stringify(token)}_*`;
          sails.log(
            `Context: AuthService.validateToken tokenQuery: ${tokenQuery}`
          );
          let userData = await RedisService.client.get(tokenQuery);
          if (userData) {
            sails.log(
              `Context: AuthService.validateToken Redis token: ${userData}`
            );
            resolve(tokenUser);
          } else {
            let dbSession = await Sessions.findOne({
              token: token,
              session_uuid: tokenUser.session_uuid,
              user_id:
                tokenUser.role.id != Constants.HyprRoles.CONSUMER
                  ? tokenUser.id
                  : null,
              customer_id:
                tokenUser.role.id == Constants.HyprRoles.CONSUMER
                  ? tokenUser.id
                  : null,
            });
            if (dbSession) {
              sails.log(
                `Context: AuthService.validateToken DB session: ${JSON.stringify(
                  dbSession
                )}`
              );
              RedisService.client.set(tokenQuery, "1");
              resolve(tokenUser);
            } else {
              sails.log.info(
                `Context: AuthService.validateToken No token found for ${tokenUser.phone}`
              );
              reject();
            }
          }
        }
      } catch (err) {
        sails.log.error(
          `Context: AuthService.validateToken Failed to validate token ${JSON.stringify(
            token
          )}`
        );
        reject();
      }
    });
    return response;
  },
  clearSessions: async function (clearObj) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        if (clearObj.customer_id || clearObj.user_id) {
          sails.log.info(
            `Context: AuthService.clearSessions clearObj: ${JSON.stringify(
              clearObj
            )}}`
          );
          let sessions = await Sessions.find({
            session_uuid: clearObj.session_uuid,
            user_id: clearObj.user_id ? clearObj.user_id : null,
            customer_id: clearObj.customer_id ? clearObj.customer_id : null,
          });
          let destroyIds = [];
          sails.log(
            `Context: AuthService.clearSessions Sessions ${sessions.length}`
          );
          sessions.forEach(function (session) {
            destroyIds.push(session.id);
          });
          await Sessions.destroy(destroyIds);
          resolve();
        } else {
          sails.log.error(
            `Context: AuthService.clearSessions No customer_id or user_id in clearObj: ${JSON.stringify(
              clearObj
            )}`
          );
          reject("No customer_id or user_id in clearObj");
        }
      } catch (err) {
        sails.log.error(
          `Context: AuthService.clearSessions Error: ${JSON.stringify(err)}`
        );
        reject(err);
      }
    });
    return response;
  },
  checkLogisticsAppVersion: async (appVersion, roleId) => {
    if (!(roleId instanceof Array) && parseInt(roleId) === DELIVERY) {
      const logisticsApp = (await appVersionExtractionService.find({ name: "Logistics" }))[0];
      const versionCheck = logisticsApp.current_version && isNewerVersion(logisticsApp.current_version, appVersion);
      if (!versionCheck) {
        throw "Please update your app to the latest version";
      }
    }
  },
  getUsernameFromPhone: async function (phone, role_id) {
    let users = await userExtractionService.getAll({ phone: phone });
    const userRoles = await userRolesExtractionService.find({ userId: users.map(user => user.id), roleId: role_id, select: 'userId,roleId' });
    const userIds = userRoles.map(userRole => userRole.user_id);
    users = users.filter(user => userIds.includes(user.id));
    users.forEach(user => user.role_id = userRoles.find(userRole => userRole.user_id === user.id).role_id);
    if (!users.length) {
      return null;
    }
    let filteredRow = [];
    if (users.length > 1) {
      filteredRow = users.filter(
        (row) => row.role_id == Constants.HyprRoles.STORE_MANAGER
      );
    } else filteredRow = users;
    const user = filteredRow[0];
    return user.username;
  },
};

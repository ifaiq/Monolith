const appVersionExtractionService = require("../config_service_extraction/appVersionExtractionService");
const _ = require('@sailshq/lodash');

module.exports = {
  getAppByRoleAndCompany: async function (role_id, company_id) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let query =
          "SELECT app_versions.* FROM app_versions inner join app_roles " +
          "on app_versions.id = app_roles.app_id where app_roles.role_id = $1 " +
          "and app_versions.company_id = $2 ";
        sails.log.info(`logging QUERY for notification: ${query}`);
        let query_result = await sails.sendNativeQuery(query, [
          role_id,
          company_id,
        ]);
        let app = query_result.rows[0];
        resolve({
          success: true,
          app: app,
        });
      } catch (e) {
        console.log(e);
        reject({
          success: false,
        });
      }
    });
    return response;
  },
  getCustomerAppByCompanyId: async function (company_id) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        const app = (await appVersionExtractionService.find({ company_id, is_customer: true }))[0];
        resolve({
          success: true,
          app: app,
        });
      } catch (e) {
        sails.log.error(JSON.stringify(e));
        reject({
          success: false,
        });
      }
    });
    return response;
  },
  getAppVersionsByCompany: async function (company_id) {
    return await new Promise(async (resolve, reject) => {
      try {
        const apps = await appVersionExtractionService.find({ company_id });
        resolve({
          success: true,
          apps: apps.map(app => _.pick(app, ["id", "current_version", "name", "is_customer"])),
        });
      } catch (e) {
        sails.log.error(JSON.stringify(e));
        reject({
          success: false,
        });
      }
    });
  },
};

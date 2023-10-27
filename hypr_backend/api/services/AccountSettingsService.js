const accountSettingExtractionService = require("../config_service_extraction/accountSettingsExtraction");
const businessUnitExtractionService = require("../config_service_extraction/businessUnitExtraction");

module.exports = {
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  getAccountSettings: async function (options) {
    // ASSUMPTIONS: company_id, business_unit_id and location_id keys in options will always contain either a number or JS object
    return new Promise(async function (resolve, reject) {
      try {
        let account_settings = null;
        let criteria = {};
        // options should have company_id, business_unit_id or location_id. Throw exception otherwise
        if (options.location_id) {
          criteria.location_id = options.location_id;
          if (typeof options.location_id != "number")
            criteria.location_id = options.location_id.id;
        } else if (options.business_unit_id) {
          criteria.business_unit_id = options.business_unit_id;
          if (typeof options.business_unit_id != "number")
            criteria.business_unit_id = options.business_unit_id.id;
        } else if (options.company_id) {
          criteria.company_id = options.company_id;
          if (typeof options.company_id != "number")
            criteria.company_id = options.company_id.id;
        } else {
          reject("Missing required param");
        }
        // find Account Setting for company/bu/location coming in param
        account_settings = await accountSettingExtractionService.find(criteria);
        // if found, return the first instance
        if (account_settings && account_settings.length > 0) {
          account_settings = account_settings[0];
        }
        // else if location came in as param, iterate up to see if config for its bu or company exists
        else if (options.location_id) {
          let location = options.location_id;
          if (typeof options.location_id == "number") {
            location = await Location.findOne({
              id: options.location_id,
            });
          }
          account_settings = await accountSettingExtractionService.find({
            or: [
              { business_unit_id: location.business_unit_id },
              { company_id: location.company_id },
            ],
          }, [{ business_unit_id: "ASC" }, { company_id: "ASC" }]);
          // sort by bu first, then company so that if for bu and company both found, bu takes precedence when returning first instance
          if (account_settings && account_settings.length > 0) {
            account_settings = account_settings[0];
          }
        }
        // else if bu came in as param, iterate up to see if config for its company exists
        else if (options.business_unit_id) {
          let bu = options.business_unit_id;
          if (typeof options.business_unit_id == "number") {
            bu = await businessUnitExtractionService.findOne({
              id: options.business_unit_id,
            });
          }
          account_settings = await accountSettingExtractionService.findOne({
            company_id: bu.company_id,
          });
        }
        // ADD country_code to account settings json for sms service
        if (typeof account_settings.business_unit_id == "number") {
          account_settings.country_code = (await businessUnitExtractionService.findOne({
            id: account_settings.business_unit_id,
          })).country_code;
        }
        resolve(account_settings);
      } catch (err) {
        reject(err);
      }
    });
  },
};

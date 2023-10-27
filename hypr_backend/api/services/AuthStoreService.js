const businessUnitExtractionService = require("../config_service_extraction/businessUnitExtraction");
const locationExtractionService = require("../config_service_extraction/locationsExtraction");
const companyExtractionService = require("../config_service_extraction/companiesExtraction");
const authStoreExtractionService = require("../rbac_service_extraction/authStoreService");

const AUTH_TIER = {
  ADMIN: 0,
  COMPANY_OWNER: 1,
  LOGISTICS: 1,
  CARE: 1,
  COMMERCIAL: 1,
  GROWTH_SALES: 1,
  LEADS: 1,
  MONTREAL_INTERN: 1,
  BU_MANAGER: 2,
  ENVERYONE_ELSE: 3,
};
const verify_user_access = function (hierarchy_id, user) {
  let result = true;
  let accessHierarchy = null;
  let to_check_id = null;
  if (user.accessHierarchy == "*") {
    return true;
  } else if (hierarchy_id.location_id) {
    accessHierarchy = user.accessHierarchy.locations;
    to_check_id = "location_id";
  } else if (hierarchy_id.business_unit_id) {
    accessHierarchy = user.accessHierarchy.business_units;
    to_check_id = "business_unit_id";
  } else if (hierarchy_id.company_id) {
    accessHierarchy = user.accessHierarchy.companies;
    to_check_id = "company_id";
  }
  if (typeof hierarchy_id[to_check_id] != "object") {
    result = to_check_id
      ? accessHierarchy.includes(parseInt(hierarchy_id[to_check_id]))
      : false;
  } else {
    hierarchy_id[to_check_id].forEach(function (id) {
      if (!accessHierarchy.includes(parseInt(id))) {
        result = false;
      }
    });
  }
  return result;
};

const populateHierarchyAccess = async (user) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        user.accessHierarchy.companies &&
        user.accessHierarchy.companies.length > 0
      ) {
        user.accessHierarchy["companies"] = await companyExtractionService.find({
          id: user.accessHierarchy.companies,
        });
      }
      if (
        user.accessHierarchy.business_units &&
        user.accessHierarchy.business_units.length > 0
      ) {
        user.accessHierarchy["business_units"] = await businessUnitExtractionService.find({
          id: user.accessHierarchy.business_units, allData: true
        });
      }
      if (
        user.accessHierarchy.locations &&
        user.accessHierarchy.locations.length > 0
      ) {
        user.accessHierarchy["locations"] = await locationExtractionService.find({
          id: user.accessHierarchy.locations, allData: true
        });
      }
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
};
const getRoleMapping = (role_id) => {
  let role = Object.entries(Constants.HyprRoles).find(
    ([key, value]) => value == role_id
  );
  if (!role) {
    return null;
  } else {
    return {
      key: role[0],
      id: role[1],
    };
  }
};

const getAuthTier = (roleName) => {
  return AuthStoreService.AUTH_TIER.hasOwnProperty(roleName)
    ? AUTH_TIER[roleName]
    : 3;
};

const checkUserAuthZandParamInject = async (user, params) => {
  console.log(`AUTHZ: param injection for user: ${JSON.stringify((user && user.id) ? user.id : null)}`);
  let locations = [];
  let flag = true;
  if (!GeneralHelper.emptyOrAllParam(params.location_id, true)) {
    console.log(`LOCATION CHECK: location exist in params - ${params.location_id}`);
    locations = GeneralHelper.mapToIds(params.location_id);
    locations.forEach((loc) => {
      console.log("CHECKING FOR " + loc);
      if (!user.accessHierarchy.locations.includes(parseInt(loc))) {
        console.log(`FLAG SET FALSE: inside location check`);
        flag = false;
      }
    });
  } else {
    if (!GeneralHelper.emptyOrAllParam(params.business_unit_id, true)) {
      console.log("HAS BU PARAM");
      let locs = await locationExtractionService.find({
        business_unit_id: params.business_unit_id,
        disabled: false,
        allData: true
      });
      locs.forEach((loc) => {
        if (!user.accessHierarchy.locations.includes(parseInt(loc.id))) {
          console.log(`FLAG SET FALSE: inside business unit check and checking for locations in access hierarchy`);
          flag = false;
        }
        locations.push(loc.id);
      });
      let bus = await businessUnitExtractionService.find({
        id: params.business_unit_id,
        disabled: false,
        allData: true
      });
      bus.forEach((bu) => {
        if (!user.accessHierarchy.business_units.includes(parseInt(bu.id))) {
          console.log(`FLAG SET FALSE: inside business unit check and checking for business units in access hierarchy`);
          flag = false;
        }
      });
    } else if (!GeneralHelper.emptyOrAllParam(params.company_id, true)) {
      console.log("COMPANY CHECK: inside store auth service");
      let locs = await locationExtractionService.find({
        company_id: params.company_id,
        disabled: false,
        allData: true
      });

      locs.forEach((loc) => {
        if (!user.accessHierarchy.locations.includes(parseInt(loc.id))) {
          console.log(`FLAG SET FALSE: inside company check and checking for locations in access hierarchy`);
          flag = false;
        }
        locations.push(loc.id);
      });
      let comps = await companyExtractionService.find({
        id: params.company_id,
        disabled: false
      });
      console.log("company found inside store auth");
      comps.forEach((comp) => {
        if (!user.accessHierarchy.companies.includes(parseInt(comp.id))) {
          console.log(`FLAG SET FALSE: inside company check and checking for company in access hierarchy`);
          flag = false;
        }
      });
    }
    if (locations.length > 0) {
      params.location_id = locations;
    }
  }
  console.log(`RETURNING FLAG: ${flag}`);
  return flag;
};

const getUserAccessHierarchy = async (user) => {
  try {
    let role = AuthStoreService.getRoleMapping(user.role.id);
    if (!role) throw Error("Invalid role");
    let authTier = getAuthTier(role.key);
    console.log("AuthTier:", authTier, "Role:", role, "User", user.id);
    let access = {
      companies: [],
      business_units: [],
      locations: [],
    };
    if (authTier === 0) {
      return "*";
    } else if (authTier === 1) {
      // Populate company, bu and locations
      let companies = [];
      let business_units = [];
      let locations = [];

      companies = await authStoreExtractionService.find({
        user: user.id,
      });

      companies = companies.map((e) => e.company);

      let bus = await businessUnitExtractionService.find({
        company_id: companies,
        //disabled: false,
        allData: true
      });
      let locs = [];
      if (bus.length) {
        let bu = bus.map((el) => el.id);
        business_units.push(...bu);
        locs = await locationExtractionService.find({
          business_unit_id: business_units,
          //disabled: false,
          allData: true
        });
      }
      if (locs.length) {
        let loc = locs.map((el) => el.id);
        locations.push(...loc);
      }
      access = {
        companies,
        business_units,
        locations,
      };
    } else if (authTier === 2) {
      // Populate bu and locations
      let companies = [];
      let business_units = [];
      let locations = [];

      business_units = await authStoreExtractionService.find({
        user: user.id,
      });
      business_units = business_units.map((e) => e.business_unit);

      let locs = await locationExtractionService.find({
        business_unit_id: business_units,
        //disabled: false,
        allData: true
      });
      if (locs.length) {
        let loc = locs.map((el) => el.id);
        locations.push(...loc);
      }
      access = {
        companies,
        business_units,
        locations,
      };
    } else if (authTier === 3) {
      // Populate locations
      // Populate bu and locations
      let companies = [];
      let business_units = [];
      let locations = [];

      locations = await authStoreExtractionService.find({
        user: user.id,
      });
      locations = locations.map((e) => e.location);
      access = {
        companies,
        business_units,
        locations,
      };
    }
    return access;
  } catch (err) {
    sails.log.error(`ReqID: reqId, UserID: userId, Error in getUserAccessHierarchy -> [${JSON.stringify(err.stack)}]`);
    return null;
  }
};

module.exports = {
  getUserAccessHierarchy,
  populateHierarchyAccess,
  getRoleMapping,
  AUTH_TIER,
  getAuthTier,
  checkUserAuthZandParamInject,
  verify_user_access,
};

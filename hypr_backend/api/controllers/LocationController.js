const locationExtractionService = require("../config_service_extraction/locationsExtraction");
module.exports = {
  getAllLocationsForHierarchy: async function (req, res, next) {
    var params = req.allParams();
    var findCriteria = {};
    let isFilter = false;
    if (params.id) {
      findCriteria["id"] = params.id;
      isFilter = true;
    } else if (params.location_id) {
      findCriteria["id"] = params.location_id;
      isFilter = true;
    }
    if (params.company_id) {
      findCriteria["companyId"] = params.company_id;
      isFilter = true;
    }
    if (params.business_unit_id) {
      findCriteria["businessUnitId"] = params.business_unit_id;
      isFilter = true;
    }
    if (
      !isFilter &&
      res.locals.userData &&
      res.locals.userData.role.id != Constants.HyprRoles.ADMIN
    ) {
      if (
        res.locals.userData.accessHierarchy &&
        res.locals.userData.accessHierarchy.companies.length > 0
      ) {
        findCriteria["companyId"] =
          res.locals.userData.accessHierarchy.companies;
      } else if (
        res.locals.userData.accessHierarchy &&
        res.locals.userData.accessHierarchy.business_units.length > 0
      ) {
        findCriteria["businessUnitId"] =
          res.locals.userData.accessHierarchy.business_units;
      } else if (
        res.locals.userData.accessHierarchy &&
        res.locals.userData.accessHierarchy.locations.length > 0
      ) {
        findCriteria["id"] =
          res.locals.userData.accessHierarchy.locations;
      } else {
        findCriteria["id"] = 0;
      }
    }
    if (!params.per_page) {
      params.per_page = 10;
    }
    if (!params.page) {
      params.page = 1;
    }
    findCriteria['relations'] = 'businessUnit,company';
    findCriteria.pageNo = params.page;
    findCriteria.limit = params.per_page;
    try {
      const result = await locationExtractionService.find(findCriteria, true);
      const returnedLocations = result.data.map(loc => {
        loc.business_unit_id = loc.business_unit;
        loc.company_id = loc.company;
        delete loc.company;
        delete loc.business_unit;
        return loc;
      });
      return res.ok({ locations: returnedLocations, totalCount: result.pagination.totalCount });
    } catch (err) {
      console.log(`error occured while fetching locations - ${JSON.stringify(err)}`);
      return res.serverError(err);
    }
  },
};

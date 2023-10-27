const setLocationParam = async function (params, user_locations, req) {
  let locations = [0];
  let location_param_exists = !GeneralHelper.emptyOrAllParam(
    params.location_id,
    true
  );
  // if req body is array ob obj, loop through each to check for location param
  // TODO Location param logic will be in a separate middleware.
  if (req.method == "POST") {
    if (Array.isArray(req.body)) {
      req.body.forEach(function (p) {
        if (!GeneralHelper.emptyOrAllParam(p.location_id, true)) {
          location_param_exists = true;
        }
      });
    } else {
      if (!GeneralHelper.emptyOrAllParam(req.body.location_id, true)) {
        location_param_exists = true;
      }
    }
  }
  if (!location_param_exists) {
    console.log("LOCATION PARAM INVALID");
    if (!GeneralHelper.emptyOrAllParam(params.business_unit_id, true)) {
      console.log("GETTING LOC FOR BU");
      locations = await LocationService.getEnabledLocationsIds(null, [params.business_unit_id], null);
    } else if (!GeneralHelper.emptyOrAllParam(params.company_id, true)) {
      console.log("GETTING LOC FOR COMPANY");
      locations = await LocationService.getEnabledLocationsIds([params.company_id], null, null);
    } else {
      locations = await LocationService.getEnabledLocationsIds(null, null, user_locations);
    }
    req.query.location_id = locations;
  }
  return req;
};
module.exports = async function (req, res, next) {
  // added dor testing only
  req.query.clientTimeOffset
    ? req.query.clientTimeOffset
    : (req.query.clientTimeOffset = -300);
  if (res.locals.authenticated) {
    var params = req.allParams();
    if (res.locals.userData.role.id === Constants.HyprRoles.ADMIN) {
      let locations = [0];
      let location_param_exists = !GeneralHelper.emptyOrAllParam(
        params.location_id,
        true
      );
      // if req body is array ob obj, loop through each to check for location param
      if (req.method == "POST") {
        if (Array.isArray(req.body)) {
          req.body.forEach(function (p) {
            if (!GeneralHelper.emptyOrAllParam(p.location_id, true)) {
              location_param_exists = true;
            }
          });
        } else {
          if (!GeneralHelper.emptyOrAllParam(req.body.location_id, true)) {
            location_param_exists = true;
          }
        }
      }
      if (!location_param_exists) {
        console.log("LOCATION PARAM INVALID");
        if (!GeneralHelper.emptyOrAllParam(params.business_unit_id, true)) {
          console.log("GETTING LOC FOR BU");
          locations = await LocationService.getEnabledLocationsIds(null, [params.business_unit_id], null);
        } else if (!GeneralHelper.emptyOrAllParam(params.company_id, true)) {
          console.log("GETTING LOC FOR COMPANY");
          locations = await LocationService.getEnabledLocationsIds([params.company_id], null, null);
        } else {
          locations = await LocationService.getEnabledLocationsIds(null, null, null);
        }
        req.query.location_id = locations;
      }
      return next();
    } else {
      if (res.locals.userData.role.id == Constants.HyprRoles.CONSUMER)
        return next();
      req = await setLocationParam(
        params,
        res.locals.userData.accessHierarchy.locations,
        req
      );
      let flag = await AuthStoreService.checkUserAuthZandParamInject(
        res.locals.userData,
        params
      );
      if (flag) {
        return next();
      } else {
        console.log(`FLAG FALSE: criteria failed for request: ${req.path}`);
        return res.unauthorized('FLAG FALSE: criteria failed for request');
      }
    }
  }
};

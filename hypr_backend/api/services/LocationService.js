const businessUnitExtractionService = require("../config_service_extraction/businessUnitExtraction");
const companyExtractionService = require("../config_service_extraction/companiesExtraction");
const locationExtractionService = require("../config_service_extraction/locationsExtraction");
const accountSettingExtractionService = require("../config_service_extraction/accountSettingsExtraction");

function differenceOfStoreEvents(events_array_1, events_array_2) {
  var diff = [];
  events_array_1.forEach((item) => {
    var index = events_array_2.map((e) => e.id).indexOf(item.id);
    if (index == -1) {
      diff.push(item.id);
    }
  });
  return diff;
}
async function removeStoreEvents(location_id, saved_events) {
  try {
    let events_from_db = await StoreEvents.find({ location_id: location_id });
    let ids = differenceOfStoreEvents(events_from_db, saved_events);
    await StoreEvents.destroy(ids);
  } catch (err) {
    console.log(err);
  }
}
module.exports = {
  arePointsNear: function (checkPoint, centerPoint, m) {
    var km = m / 1000;
    var ky = 40000 / 360;
    var kx = Math.cos((Math.PI * centerPoint.lat) / 180.0) * ky;
    var dx = Math.abs(centerPoint.lng - checkPoint.lng) * kx;
    var dy = Math.abs(centerPoint.lat - checkPoint.lat) * ky;
    return Math.sqrt(dx * dx + dy * dy) <= km;
  },
  getAllLocations: async (reqID, company_id) => {
    return new Promise(async (resolve, reject) => {
      try {
        sails.log.info(
          `reqID: ${reqID}, context: LocationService.getAllLocations Fetching locations data from database`
        );
        const criteria = {
          disabled: false,
          company_id: company_id,
          allData: true,
          relations: ["company", "businessUnit"],
        };
        const locations = await locationExtractionService.find(criteria);
        sails.log.info(
          `reqID: ${reqID}, context: LocationService.getAllLocations Locations count: ${locations.length}`
        );
        let databaseLocationsData = [];
        async.eachSeries(
          locations,
          async function (location, callback) {
            location.company_id = location.company;
            location.business_unit_id = location.business_unit;
            let currentLocation = {};
            if (location.polygon_coords) {
              try {
                currentLocation.polygon_coords = JSON.parse(
                  location.polygon_coords
                );
              } catch (e) {
                currentLocation.polygon_coords = null;
              }
            }
            currentLocation.location_id = location.id;
            currentLocation.name = location.name;
            currentLocation.company_name = location.company_id.name;
            currentLocation.longitude = parseFloat(location.longitude);
            currentLocation.latitude = parseFloat(location.latitude);
            currentLocation.min_order_limit = location.min_order_limit;
            currentLocation.order_limit = location.min_order_limit;
            currentLocation.max_order_limit = location.max_order_limit;
            currentLocation.phone = location.phone
              ? JSON.parse(location.phone)
              : null;
            currentLocation.image_url = location.image_url;
            currentLocation.currency = location.business_unit_id.currency;
            currentLocation.business_unit_id =
              location.business_unit_id.id;
            const companyDetails = await accountSettingExtractionService.findOne({
              where: { company_id: location.company_id.id },
            });
            if (companyDetails) {
              currentLocation.companyDetails = _.pick(companyDetails, [
                "currency",
                "language",
                "product_led",
              ]);
              currentLocation.companyDetails.company_code =
                location.company_id.code;
            }
            databaseLocationsData.push(currentLocation);
            callback(null);
          },
          function (err) {
            if (err) {
              sails.log.warn(
                `reqID: ${reqID}, context: LocationService.getAllLocations Error in getting locations or locations data from database. Error: ${JSON.stringify(
                  err.stack
                )}`
              );
              resolve({locations: [], count: 0});
            } else {
              sails.log.error(
                `reqID: ${reqID}, context: LocationService.getAllLocations Locations to return: ${JSON.stringify(
                  databaseLocationsData
                )}`
              );
              resolve({locations: databaseLocationsData, count: databaseLocationsData.length});
            }
          }
        );
      } catch (err) {
        sails.log.error(
          `reqID: ${reqID}, context: LocationService.getAllLocations Error in getting locations or locations data from database. Error: ${JSON.stringify(
            err.stack
          )}`
        );
        resolve({locations: [], count: 0});
      }
    });
  },
  getStoresForLocation: async (reqID, coords, company_id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const locationsData = await LocationService.getAllLocations(
          reqID,
          company_id
        );
        const locations = locationsData.locations;
        if (locations.length > 0) {
          let locationsToReturn = [];
          for (let i = 0; i < locations.length; i++) {
            if (locations[i].polygon_coords) {
              let isInsidePolygon = PolygonService.isPointInsidePolygon(
                locations[i].polygon_coords,
                {
                  lat: coords.lat,
                  lng: coords.lng,
                }
              );
              if (isInsidePolygon) {
                delete locations[i].polygon_coords;
                locationsToReturn.push(locations[i]);
              }
            }
          }
          resolve(locationsToReturn);
        } else {
          sails.log.info(
            `reqID: ${reqID}, context: LocationService.getStoresForLocation No locations found`
          );
          resolve([]);
        }
      } catch (err) {
        sails.log.error(
          `reqID: ${reqID}, context: LocationService.getStoresForLocation Error: ${JSON.stringify(err.stack)}`
        );
        resolve([]);
      }
    });
  },
  getEnabledLocationsIds: async function (companyIds, buIds, locationIds) {
    try {
      const companyCriteria = { disabled: false };
      if (companyIds) {
        companyCriteria.id = companyIds;
      }
      const enabledCompanyIds = (await companyExtractionService.find(companyCriteria)).map(comp => comp.id);
      const buCriteria = { disabled: false, company_id: enabledCompanyIds, allData: true };
      if (buIds) {
        buCriteria.id = buIds;
      }
      const enabledBuIds = (await businessUnitExtractionService.find(buCriteria)).map(bu => bu.id);
      const locationCriteria = {
        disabled: false,
        company_id: enabledCompanyIds,
        business_unit_id: enabledBuIds,
        allData: true,
      };
      if (locationIds) {
        locationCriteria.id = locationIds;
      }
      const enabledLocationIds = (await locationExtractionService.find(locationCriteria)).map(loc => loc.id);
      return [0, ...enabledLocationIds];
    } catch (e) {
      sails.log.error(`Error fetching enabled location IDs. Error: ${JSON.stringify(e)}`);
      return [0];
    }
  },
  updateStoreEvents: async function (location, events) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let saved_events = [];
        async.each(
          events,
          async function (event, callback) {
            try {
              if (!event.id) {
                let temp_event = await StoreEvents.create({
                  location_id: location.id,
                  start_date: event.start_date,
                  end_date: event.end_date,
                  start_time: event.start_time,
                  end_time: event.end_time,
                  disabled: event.disabled ? true : false,
                });
                saved_events.push(temp_event);
              } else {
                let temp_event = await StoreEvents.update(
                  { id: event.id },
                  {
                    start_date: event.start_date,
                    end_date: event.end_date,
                    start_time: event.start_time,
                    end_time: event.end_time,
                    disabled: event.disabled ? true : false,
                  }
                );
                saved_events.push(temp_event[0]);
              }
              callback();
            } catch (err) {
              callback(err);
            }
          },
          async function (err, data) {
            if (err) reject(err);
            else {
              removeStoreEvents(
                location.id,
                JSON.parse(JSON.stringify(saved_events))
              );
              resolve(saved_events);
            }
          }
        );
      } catch (err) {
        reject(err);
      }
    });
    return response;
  },
  updateOperatingDays: async function (location, operating_days_data) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let operating_days = [];
        async.each(
          operating_days_data,
          async function (day, callback) {
            try {
              let operating_day = await StoreOperatingDays.update(
                { id: day.id },
                {
                  day_id: day.day_id,
                  location_id: location.id,
                  start_time: day.start_time,
                  end_time: day.end_time,
                  disabled: day.disabled ? true : false,
                }
              );
              operating_days.push(operating_day[0]);
              callback();
            } catch (err) {
              callback(err);
            }
          },
          function (err, data) {
            if (err) reject(err);
            else resolve(operating_days);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
    return response;
  },
  isStoreOpen: async function (
    location,
    store_events_timing,
    store_operating_days
  ) {
    try {
      sials.log.info(
        `ReqID: reqId, UserID: userId, context: "context", In isStoreOpen()`
      );
      let store_info = await LocationService.StoreTimeInfo(
        location,
        store_events_timing,
        store_operating_days
      );
      return store_info.is_open;
    } catch (err) {
      sails.log.error(
        `ReqID: reqId, UserID: userId, context: "context", Error in isStoreOpen() -> [${JSON.stringify(
          err.stack
        )}]`
      );
      return Error(err);
    }
  },
  StoreTimeInfo: async function (
    location,
    store_events_timing,
    store_operating_days
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        let today = new Date();
        let start_time = null,
          end_time = null;
        if (!location.delivery_time) {
          location.delivery_time = "12:00:00";
        }
        if (!GeneralHelper.emptyOrAllParam(location.delivery_time)) {
          let delivery_time = location.delivery_time.split(":");
          /*// NOTE: adding delivery time of store to current time to check if store is open
          let now = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            parseInt(today.getHours()) + parseInt(delivery_time[0]),
            parseInt(today.getMinutes()) + parseInt(delivery_time[1]),
            parseInt(today.getSeconds()) + parseInt(delivery_time[2])
          );*/
          let now = new Date();
          // The getDay() method returns the day of the week (from 0 to 6) for the specified date.
          // Note: Sunday is 0, Monday is 1, and so on.
          // Constants We have defined are 1-7 so adding 1
          let current_day = now.getDay() + 1;
          if (delivery_time.length == 3) {
            store_events_timing = store_events_timing
              ? store_events_timing
              : await StoreEvents.find({
                  location_id: location.id,
                  start_date: { ">=": now },
                  end_date: { "<": now },
                });
            // if entry found in store_events_timing but disabled is true, store is closed on this day
            if (
              store_events_timing &&
              store_events_timing[0] &&
              store_events_timing[0].disabled
            ) {
              resolve({
                is_open: false,
                start_time: "-",
                end_time: "-",
              });
            }
            // else if  entry found in store_events_timing and not disabled, use these store timings
            else if (
              store_events_timing &&
              store_events_timing.length > 0 &&
              store_events_timing[0].start_date &&
              store_events_timing[0].end_date &&
              store_events_timing[0].start_time &&
              store_events_timing[0].end_time
            ) {
              start_time = store_events_timing[0].start_time;
              end_time = store_events_timing[0].end_time;
            }
            //  else check for generic weekdays/store operating days
            else {
              store_operating_days = store_operating_days
                ? store_operating_days
                : location.events
                ? location.events.filter(function (day) {
                    return day.day_id == current_day;
                  })
                : await StoreOperatingDays.find({
                    location_id: location.id,
                    day_id: current_day,
                  });
              // if entry found in store_operating_days but disabled is true, store is closed on this day
              if (
                store_operating_days &&
                store_operating_days[0] &&
                store_operating_days[0].disabled
              ) {
                resolve({
                  is_open: false,
                  start_time: "-",
                  end_time: "-",
                });
              }
              if (
                store_operating_days &&
                store_operating_days.length > 0 &&
                store_operating_days[0].start_time &&
                store_operating_days[0].end_time
              ) {
                start_time = store_operating_days[0].start_time;
                end_time = store_operating_days[0].end_time;
              } else {
                resolve({
                  is_open: false,
                  start_time: "-",
                  end_time: "-",
                });
              }
            }
            if (start_time && end_time) {
              t_end_time = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                parseInt(end_time.split(":")[0]),
                parseInt(end_time.split(":")[1]),
                parseInt(end_time.split(":")[2])
              );
              if (t_end_time > now) {
                resolve({
                  is_open: true,
                  start_time: start_time,
                  end_time: end_time,
                });
              } else {
                resolve({
                  is_open: false,
                  start_time: start_time,
                  end_time: end_time,
                });
              }
            }
          } else {
            resolve({ is_open: false, start_time: "-", end_time: "-" });
          }
        } else {
          resolve({ is_open: false, start_time: "-", end_time: "-" });
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  findAndUpdateOldLocationPriority: async function (location, tobeUpdateLoc) {
    return new Promise(async (resolve, reject) => {
      if (tobeUpdateLoc) {
        let maxPriorityQuery =
          "SELECT MAX(priority) as maxpriority, MIN(priority) as minpriority from `locations` where company_id= " +
          location.company_id;

        try {
          Location.query(maxPriorityQuery, async (err, maxPriority) => {
            if (err) return err;
            maxPriority = maxPriority.rows[0];
            if (location.priority > maxPriority.maxpriority) {
              reject("MAX PRIORITY " + maxPriority.maxpriority + " ALLOWED");
            } else if (maxPriority.minpriority > location.priority.priority) {
              reject("MIN PRIORITY " + maxPriority.minpriority + " ALLOWED");
            } else {
              var whereCondition = {
                company_id: location.company_id,
              };
              let inc =
                location.priority > tobeUpdateLoc.priority ? false : true;
              let priorObject =
                location.priority > tobeUpdateLoc.priority
                  ? {
                      ">": tobeUpdateLoc.priority || 0,
                      "<=": location.priority || 0,
                    }
                  : {
                      ">=": location.priority || 0,
                      "<": tobeUpdateLoc.priority || 0,
                    };
              whereCondition["priority"] = priorObject;
              whereCondition = { where: whereCondition, sort: "priority asc" };
              let oldPrioritoryLocations = await Location.find(whereCondition);
              var updateValue;
              if (oldPrioritoryLocations && oldPrioritoryLocations.length > 0) {
                async.eachSeries(
                  oldPrioritoryLocations,
                  async function (loc, callback) {
                    if (inc) updateValue = loc.priority + 1;
                    else {
                      updateValue = loc.priority - 1;
                    }
                    try {
                      let updatedPriority = await Location.update(
                        { id: loc.id },
                        {
                          priority: updateValue,
                        }
                      );
                      callback();
                    } catch (err) {
                      callback(err);
                    }
                  },
                  async function (err, success) {
                    if (err) {
                      reject(err);
                    } else {
                      let updatedLoc = await LocationService.updateLocationForHierarchyWithSamePriority(
                        location
                      );

                      resolve(updatedLoc);
                    }
                  }
                );
              } else
                resolve({
                  success: true,
                });
            }
          });
        } catch (err) {
          reject(err);
        }
      } else {
        resolve({
          message: "LOCATION NOT FOUND",
          type: ErrorTypes.BAD_REQUEST,
          success: false,
        });
      }
    });
  },
  updateLocationForHierarchyWithSamePriority: async function (params) {
    return new Promise(async (resolve, reject) => {
      let operating_days_data = JSON.parse(
        JSON.stringify(params["operating_days"])
      );
      let events_data = JSON.parse(JSON.stringify(params["events"]));
      delete params["operating_days"];
      delete params["events"];
      Location.update({ id: params.id }, params).exec(async function (
        err,
        location
      ) {
        if (err) {
          if (
            err.code == "E_NON_ERROR" &&
            !GeneralHelper.emptyOrAllParam(err.message)
          ) {
            reject({ message: err.message });
          }
          elsereject(err);
        } else {
          try {
            let loc = location[0];
            let operating_days = await LocationService.updateOperatingDays(
              loc,
              operating_days_data
            );
            loc["operating_days"] = operating_days;
            let events = await LocationService.updateStoreEvents(
              loc,
              events_data
            );
            loc["events"] = events;
            resolve(loc);
          } catch (err) {
            console.log(err);
            reject(err);
          }
        }
      });
    });
  },
};

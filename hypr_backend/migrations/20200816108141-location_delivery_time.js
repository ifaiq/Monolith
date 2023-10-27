"use strict";

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.addColumn(
    "locations",
    "is_day_wise_time",
    { type: "boolean", defaultValue: 0 },
    (err) => {
      if (err)
        console.log("ERROR AT ADDING DAY WISE COLUMN IN LOCATIONS");
      else {
        return db.addColumn(
          "locations",
          "delivery_time",
          { type: "time", defaultValue: 0 },
          (err) => {
            if (err)
              console.log(
                "ERROR AT ADDING delivery_time COLUMN IN LOCATIONS"
              );
            else {
            }
          }
        );
      }
    }
  );
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};

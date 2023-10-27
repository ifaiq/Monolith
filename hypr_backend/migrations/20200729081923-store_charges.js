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
    "delivery_charge_type",
    { type: "string", defaultValue: null },
    (err) => {
      if (err) console.log("ERROR AT delivery_charge_type COLUMN IN LOCATIONS");
      else {
        return db.addColumn(
          "locations",
          "delivery_charge_value",
          { type: "decimal", precision: 10, scale: 2 },
          (err) => {
            if (err)
              console.log("ERROR AT delivery_charge_value COLUMN IN LOCATIONS");
            else {
              return db.addColumn(
                "locations",
                "service_charge_type",
                { type: "string", defaultValue: null },
                (err) => {
                  if (err)
                    console.log(
                      "ERROR AT service_charge_type COLUMN IN LOCATIONS"
                    );
                  else {
                    return db.addColumn(
                      "locations",
                      "service_charge_value",
                      { type: "decimal", precision: 10, scale: 2 },
                      (err) => {
                        if (err)
                          console.log(
                            "ERROR AT service_charge_value COLUMN IN LOCATIONS"
                          );
                        else {
                        }
                      }
                    );
                  }
                }
              );
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

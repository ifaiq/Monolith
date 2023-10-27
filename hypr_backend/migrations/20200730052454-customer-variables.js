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
    "customers",
    "disabled",
    { type: "boolean", defaultValue: 0 },
    (err) => {
      if (err) console.log("ERROR AT ADDING DISABLED COLUMN IN CUSTOMERS");
      else {
        return db.addColumn(
          "customers",
          "app_name",
          { type: "string", defaultValue: null },
          (err) => {
            if (err)
              console.log("ERROR AT ADDING APP NAME COLUMN IN CUSTOMERS");
            else {
              return db.addColumn(
                "customers",
                "app_version",
                { type: "string", defaultValue: null },
                (err) => {
                  if (err)
                    console.log(
                      "ERROR AT ADDING APP VERSION COLUMN IN CUSTOMERS"
                    );
                  else {
                    return db.addColumn(
                      "customers",
                      "device_name",
                      { type: "string", defaultValue: null },
                      (err) => {
                        if (err)
                          console.log(
                            "ERROR AT ADDING DEVICE NAME COLUMN IN CUSTOMERS"
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

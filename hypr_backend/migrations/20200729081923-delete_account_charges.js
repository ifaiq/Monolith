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
  return db.removeColumn("account_settings", "delivery_charge_type", (err) => {
    if (err) console.log("ERROR AT REMOVING delivery_charge_type COLUMN IN account_settings");
    else {
      return db.removeColumn("account_settings", "delivery_charge_value", (err) => {
        if (err) console.log("ERROR AT REMOVING delivery_charge_value COLUMN IN account_settings");
        else {
          return db.removeColumn("account_settings", "service_charge_type", (err) => {
            if (err) console.log("ERROR AT REMOVING service_charge_type COLUMN IN account_settings");
            else {
              return db.removeColumn(
                "account_settings",
                "service_charge_value",
                (err) => {
                  if (err) console.log("ERROR AT REMOVING service_charge_value COLUMN IN account_settings");
                  else {
                  }
                }
              );
            }
          });
        }
      });
    }
  });
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};

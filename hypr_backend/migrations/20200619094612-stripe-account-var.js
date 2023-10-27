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
    "account_settings",
    "stripe_secret",
    { type: "string", defaultValue: null },
    (err) => {
      if (err) console.log("ERROR AT ADDING STRIPE SECRET COLUMN IN CUSTOMERS");
      else {
        return db.addColumn(
          "account_settings",
          "stripe_key",
          { type: "string", defaultValue: null },
          (err) => {
            if (err)
              console.log("ERROR AT ADDING STRIPE KEY COLUMN IN CUSTOMERS");
            else {
              return db.addColumn(
                "orders",
                "refund_id",
                { type: "string", defaultValue: null },
                (err) => {
                  if (err)
                    console.log("ERROR AT ADDING REFUND ID COLUMN IN ORDERS");
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
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};

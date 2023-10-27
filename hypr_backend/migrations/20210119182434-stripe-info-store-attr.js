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
    "store_card_info",
    { type: "boolean", defaultValue: 1 },
    (err) => {
      if (err)
        console.log("ERROR AT ADDING store_card_info COLUMN IN customers");
      else {
        console.log("ADDED store_card_info COLUMN IN customers");
        return db.addColumn(
          "orders",
          "card_reference",
          { type: "string", defaultValue: null },
          (err) => {
            if (err)
              console.log("ERROR AT ADDING card_reference COLUMN IN orders");
            else {
              console.log("ADDED card_reference COLUMN IN orders");
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

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
    "order_limit",
    { type: "decimal", precision: 10, scale: 2 },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("ADDED ORDER LIMIT COLUMN IN LOCATION TABLE");
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

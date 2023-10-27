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
  // type:'decimal', precision: 10, scale: 2
  return db.changeColumn(
    "order_items",
    "volume_based_price",
    { type: "decimal", precision: 10, scale: 2 },
    function (err) {
      if (err) {
        console.log(err);
      }
      return Promise.resolve();
    }
  );
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};

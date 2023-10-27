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
  return db.runSql(
    "INSERT INTO coupon_discount_types (id, name, value, created_at, updated_at) VALUES ('1', 'Percentage Discount', 'percentage', now(), now()), ('2', 'Fixed Amount', 'fixed',  now(), now())",
    [],
    function (err) {
      if (err) {
        console.log("ERROR AT ADDING COUPON TYPE VALUES");
        console.log(err);
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

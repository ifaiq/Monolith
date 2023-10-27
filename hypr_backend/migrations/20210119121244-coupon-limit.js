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
    "coupons",
    "min_coupon_limit",
    { type: "int", defaultValue: 0 },
    (err) => {
      if (err)
        console.log(
          "ERROR AT ADDING min_coupon_limit COLUMN IN coupons"
        );
      else {
        console.log(
          "ADDED min_coupon_limit COLUMN IN coupons"
        );
        return db.addColumn(
          "coupons",
          "max_discount_value",
          { type: "int", defaultValue: 0 },
          (err) => {
            if (err)
              console.log(
                "ERROR AT ADDING max_discount_value COLUMN IN coupons"
              );
            else {
              console.log(
                "ADDED max_discount_value COLUMN IN coupons"
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

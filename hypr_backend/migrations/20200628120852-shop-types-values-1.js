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
    "INSERT INTO customer_retailer_shop_types (id, name) SELECT 5, 'Mart' WHERE not exists(SELECT * FROM customer_retailer_shop_types WHERE id=5)",
    [],
    function (err) {
      if (err) console.log(err);
      else {
        return db.runSql(
          "INSERT INTO customer_retailer_shop_types (id, name) SELECT 6, 'Wholeseller' WHERE not exists(SELECT * FROM customer_retailer_shop_types WHERE id=6)",
          [],
          function (err) {
            if (err) console.log(err);
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

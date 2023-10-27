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
    "order_history",
    "total_price",
    { type: type.DECIMAL, defaultValue: 0.0 },
    (err) => {
      if (err) console.log("ERROR AT total_price COLUMN IN ORDER_HISTORY");
      else {
        return db.addColumn(
          "order_history",
          "oldOrderJSON",
          { type: "JSON", defaultValue: null },
          (err) => {
            if (err) console.log("ERROR AT OLD_ORDER COLUMN IN ORDER_HISTORY");
            else {
              return db.addColumn(
                "order_history",
                "newOrderJSON",
                { type: "JSON", defaultValue: null },
                (err) => {
                  if (err)
                    console.log(
                      "ERROR AT newOrderJSON COLUMN IN ORDER_HISTORY"
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
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};

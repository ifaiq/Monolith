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
    "orders",
    "rejection_reason_id",
    { type: "int", defaultValue: null },
    (err) => {
      if (err) console.log("ERROR AT ADDING REJECTION REASON COLUMN IN ORDERS");
      else {
        return db.addForeignKey(
          "orders",
          "order_rejection_reason",
          "order_rejection_reason_id_fk",
          {
            rejection_reason_id: "id",
          },
          { onDelete: "CASCADE", onUpdate: "RESTRICT" },
          (err) => {
            if (err)
              console.log(
                "ERROR AT CREATING REJECTION REASON FOREIGN KEY FOR ORDERS",
                err
              );
            else {
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

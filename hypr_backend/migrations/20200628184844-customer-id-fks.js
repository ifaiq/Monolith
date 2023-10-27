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
    "customer_retailer_shop_details",
    "customer_id",
    { type: "int" },
    (err) => {
      if (err)
        console.log(
          "ERROR AT ADDING Customer ID COLUMN IN CUSTOMER SHOP DETAILS"
        );
      else {
        return db.addForeignKey(
          "customer_retailer_shop_details",
          "customers",
          "customer_retailer_shop_details_id_fk",
          {
            customer_id: "id",
          },
          { onDelete: "CASCADE", onUpdate: "RESTRICT" },
          (err) => {
            if (err)
              console.log(
                "ERROR AT CREATING CUSTOMER FOREIGN KEY FOR SHOP DETAILS",
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

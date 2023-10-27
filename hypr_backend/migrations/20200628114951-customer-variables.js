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
    "has_smart_phone",
    { type: "boolean", defaultValue: 0 },
    (err) => {
      if (err)
        console.log("ERROR AT ADDING has_smart_phone COLUMN IN CUSTOMERS");
      else {
        return db.addColumn(
          "customers",
          "order_mode",
          {
            type: "int",
            foreignKey: {
              name: "order_mode_customer_fk",
              table: "customer_retailer_order_modes",
              rules: {
                onDelete: "CASCADE",
                onUpdate: "RESTRICT",
              },
              mapping: "id",
            },
          },
          (err) => {
            if (err)
              console.log("ERROR AT ADDING ORDER MODE COLUMN IN CUSTOMERS");
            else {
              return db.addColumn(
                "customers",
                "secondary_phone",
                { type: "string", defaultValue: null },
                (err) => {
                  if (err)
                    console.log(
                      "ERROR AT ADDING SECONDARY PHONE COLUMN IN CUSTOMERS"
                    );
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

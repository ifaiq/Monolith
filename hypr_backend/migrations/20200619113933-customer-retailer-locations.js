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
  return db.createTable(
    "customer_retailer_locations",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      customer_id: {
        type: "int",
        foreignKey: {
          name: "customer_retailer_locations_customer_id_fk",
          table: "customers",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      location_id: {
        type: "int",
        foreignKey: {
          name: "customer_retailer_locations_location_id_fk",
          table: "locations",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
    },
    function (err) {
      if (err) {
        console.log("ERROR AT CREATING CUSTOMER RETAILER TABLE");
      } else {
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

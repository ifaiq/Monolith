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
    "customer_addresses",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      customer_id: {
        type: "int",
        foreignKey: {
          name: "customer_addresses_customer_id_fk",
          table: "customers",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      address: { type: "string", defaultValue: null },
      address_line_1: { type: "string", defaultValue: null },
      address_line_2: { type: "string", defaultValue: null },
      location_cordinates: { type: "string", defaultValue: null }, // stringified JSON
      delivered_location_cordinates: { type: "string", defaultValue: null }, // for delivered location stringified JSON
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    (err) => {
      if (err) console.log("ERROR AT CREATE ORDERS", err);
      else {
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

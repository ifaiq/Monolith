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
    "order_items",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      order_id: {
        type: "int",
        foreignKey: {
          name: "order_items_order_id_fk",
          table: "orders",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      product_id: {
        type: "int",
        foreignKey: {
          name: "order_items_product_id_fk",
          table: "products",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      quantity: { type: "int", defaultValue: null },
      original_quantity: { type: "int", defaultValue: null },
      price: { type: type.DECIMAL, defaultValue: 0.0 },
      packed_quantity: { type: "int", defaultValue: null },
      removed: { type: "boolean", defaultValue: 0 },
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

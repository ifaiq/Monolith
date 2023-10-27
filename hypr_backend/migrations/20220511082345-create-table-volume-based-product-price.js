/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
"use strict";

let dbm;
let type;
let seed;

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
    "volume_based_product_price",
    {
      id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: {
        type: type.INTEGER,
        foreignKey: {
          name: "volume_based_product_price_fk",
          table: "products",
          mapping: "id",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
        },
        notNull: true,
      },
      price: { type: type.DECIMAL, notNull: true },
      quantity_from: { type: type.INTEGER, notNull: true },
      quantity_to: { type: type.INTEGER, notNull: true },
      disabled: { type: type.BOOLEAN, notNull: true },
      created_at: { type: type.DATE_TIME, defaultValue: null },
      updated_at: { type: type.DATE_TIME, defaultValue: null },
    },
    err => {
      if (err) {
        console.log("An error occurred", err);
        return db.dropTable("volume_based_product_price");
      }

      return Promise.resolve();
    },
  );
};

exports.down = function (db) {
  return db.dropTable("volume_based_product_price");
};

exports._meta = {
  version: 1,
};

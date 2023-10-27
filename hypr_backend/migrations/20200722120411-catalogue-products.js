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
    "catalogue_products",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      name: { type: "string", defaultValue: null, length: "1000" },
      sku: { type: "string", defaultValue: null },
      image_url: { type: "string", defaultValue: null },
      description: { type: "string", defaultValue: null, length: "1000" },
      catalogue_id: {
        type: "int",
        foreignKey: {
          name: "catalogue_id_fk",
          table: "catalogue",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      price: { type: type.DECIMAL, defaultValue: 0.0 },
      cost_price: { type: type.DECIMAL, defaultValue: 0.0 },
      market_price: { type: type.DECIMAL, defaultValue: 0.0 },
      size: { type: "string", defaultValue: null },
      unit: { type: "string", defaultValue: null },
      brand: { type: "string", defaultValue: null },
      urdu_name: { type: "string", defaultValue: null },
      urdu_unit: { type: "string", defaultValue: null },
      urdu_size: { type: "string", defaultValue: null },
      urdu_brand: { type: "string", defaultValue: null },
      disabled: { type: "boolean", defaultValue: 0 },
      deleted_by: { type: "int" },
      updated_by: { type: "int" },
      barcode: { type: "string", defaultValue: null },
      consent_required: { type: "boolean", defaultValue: 0 },
      tax_percent: { type: type.DECIMAL, defaultValue: 0.0 },
      tax_inclusive: { type: "boolean", defaultValue: 0 },
      category_level_one: { type: "string", defaultValue: null },
      category_level_two: { type: "string", defaultValue: null },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    (err) => {
      if (err) console.log("ERROR AT CREATE PRODUCT", err);
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

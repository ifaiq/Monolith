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
    "coupons",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      name: { type: "string", defaultValue: null },
      start_date: { type: "date", defaultValue: null },
      end_date: { type: "date", defaultValue: null },
      discount_value: { type: "int", defaultValue: null },
      discount_type: {
        type: "int",
        foreignKey: {
          name: "coupons_discount_type_fk",
          table: "coupon_discount_types",
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
          name: "coupons_location_id_fk",
          table: "locations",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      business_unit_id: {
        type: "int",
        foreignKey: {
          name: "coupons_business_unit_id_fk",
          table: "business_units",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      company_id: {
        type: "int",
        foreignKey: {
          name: "coupons_company_id_fk",
          table: "companies",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      disabled: { type: "boolean", defaultValue: 0 },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null }
    },
    (err) => {
      if (err) console.log("ERROR AT CREATE coupons", err);
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
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
    "coupon_usage_history",
    {
      id: {
        type: "int",
        primaryKey: true,
        autoIncrement: true,
      },
      coupon_id: {
        type: "int",
        foreignKey: {
          name: "coupon_usage_history_coupon_id_fk",
          table: "coupons",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      customer_id: {
        type: "int",
        foreignKey: {
          name: "coupon_usage_history_customer_id_fk",
          table: "customers",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      order_id: {
        type: "int",
        foreignKey: {
          name: "coupon_usage_history_order_id_fk",
          table: "orders",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      discount_value: { type: "int", defaultValue: null },
      discount_type: {
        type: "int",
        foreignKey: {
          name: "coupon_usage_history_coupons_discount_type_fk",
          table: "coupon_discount_types",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      date: { type: "date", defaultValue: null },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    (err) => {
      if (err) console.log("ERROR AT CREATING coupon_usage_history", err);
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

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
    "coupon_customers",
    {
      id: {
        type: "int",
        primaryKey: true,
        autoIncrement: true,
      },
      coupon_id: {
        type: "int",
        foreignKey: {
          name: "coupon_customers_coupon_id_fk",
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
          name: "coupon_customers_customer_id_fk",
          table: "customers",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null }
    },
    (err) => {
      if (err) console.log("ERROR AT CREATING coupon_customers", err);
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
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
    "orders",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      customer_id: {
        type: "int",
        foreignKey: {
          name: "orders_customer_id_fk",
          table: "customers",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      sales_agent_id: {
        type: "int",
        foreignKey: {
          name: "orders_sales_agent_id_fk",
          table: "users",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      total_price: { type: type.DECIMAL, defaultValue: 0.0 },
      status_id: {
        type: "int",
        foreignKey: {
          name: "orders_status_id_fk",
          table: "order_statuses",
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
          name: "orders_location_id_fk",
          table: "locations",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      cash_received: { type: type.DECIMAL, defaultValue: 0.0 },
      delivery_boy_id: {
        type: "int",
        foreignKey: {
          name: "orders_delivery_boy_id_fk",
          table: "users",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      packer_id: {
        type: "int",
        foreignKey: {
          name: "orders_packer_id_fk",
          table: "users",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      disabled: { type: "boolean", defaultValue: 0 },
      retailo_order_id: { type: "string", defaultValue: null },
      deleted_by: {
        type: "int",
        foreignKey: {
          name: "orders_deleted_by_fk",
          table: "users",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      packing_time: { type: "datetime", defaultValue: null },
      placed_at: { type: "datetime", defaultValue: null },
      delivery_time: { type: "datetime", defaultValue: null },
      customer_address_id: { type: "int", defaultValue: null },
      payment_type: { type: "string", defaultValue: null },
      payment_reference: { type: "string", defaultValue: null },
      uuid: { type: "string", defaultValue: null }, // for redis purpose
      delivered_time: { type: "string", defaultValue: null },
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

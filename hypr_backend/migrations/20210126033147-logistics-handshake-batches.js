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
    "delivery_batch_statuses",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      name: { type: "string", defaultValue: null },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },

    },
    (err) => {
      if (err) console.log("ERROR AT CREATE DELIVERY BATCH STATUSES", err);
      else {
        console.log("CREATED DELIVERY BATCH STATUSES TABLE");
        return db.createTable(
          "delivery_batches",
          {
            id: { type: "int", primaryKey: true, autoIncrement: true },
            status_id: {
              type: "int",
              defaultValue: 1,
              allowNull: false,
              foreignKey: {
                name: "delivery_batch_status_id_fk",
                table: "delivery_batch_statuses",
                rules: {
                  onDelete: "SET NULL",
                  onUpdate: "CASCADE",
                },
                mapping: "id",
              },
            },
            location_id: { type: "int", defaultValue: null },
            products: { type: "JSON", defaultValue: null },
            assigned_to: { type: "int", defaultValue: null },
            completed_at: { type: "datetime", defaultValue: null },
            created_at: { type: "datetime", defaultValue: null },
            updated_at: { type: "datetime", defaultValue: null },
            deleted_at: { type: "datetime", defaultValue: null },
          },
          (err) => {
            if (err) console.log("ERROR AT CREATE DELIVERY BATCHES TABLE");
            else {
              console.log("CREATED DELIVERY BATCHES TABLE");
              return db.createTable(
                "delivery_batch_orders",
                {
                  id: { type: "int", primaryKey: true, autoIncrement: true },
                  order_id: { type: "int", allowNull: false },
                  batch_id: {
                    type: "int",
                    allowNull: false,
                    foreignKey: {
                      name: "delivery_batch_id_fk",
                      table: "delivery_batches",
                      rules: {
                        onDelete: "SET NULL",
                        onUpdate: "CASCADE",
                      },
                      mapping: "id",
                    }
                  },
                  delivery_priority: { type: "int", allowNull: true },
                  created_at: { type: "datetime", defaultValue: null },
                  updated_at: { type: "datetime", defaultValue: null },
                  deleted_at: { type: "datetime", defaultValue: null },
                },
                (err) => {
                  if (err) console.log("ERROR AT CREATE DELIVERY BATCH ORDERS TABLE");
                  else console.log("CREATED DELIVERY BATCH ORDERS TABLE");
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
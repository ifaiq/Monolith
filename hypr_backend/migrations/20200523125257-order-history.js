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
    "order_history",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      order_id: {
        type: "int",
        foreignKey: {
          name: "order_history_order_id_fk",
          table: "orders",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      status_id: {
        type: "int",
        foreignKey: {
          name: "order_history_status_id_fk",
          table: "order_statuses",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    (err) => {
      if (err) console.log("ERROR AT CREATE ORDERS", err);
      else {
        console.log('ORDER_HISTORY TABLE CREATED');
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

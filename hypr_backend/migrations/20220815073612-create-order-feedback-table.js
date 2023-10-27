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
  return db.createTable("order_feedbacks", {
    id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
    order_id: {
      type: type.INTEGER,
      foreignKey: {
        name: "orders_order_feedbacks_fk",
        table: "orders",
        rules: {
          onDelete: "CASCADE",
        },
        mapping: "id",
      },
    },
    customer_id: { type: type.INTEGER, default: 0 },
    is_satisfied: { type: type.BOOLEAN, default: true },
    notes: { type: type.STRING, default: "" },
    dismissed: { type: type.BOOLEAN, default: false },
    created_at: { type: "datetime", defaultValue: null },
    updated_at: { type: "datetime", defaultValue: null },
    deleted_at: { type: "datetime", defaultValue: null },
  });
};

exports.down = function (db) {
  return db.dropTable("order_feedbacks");
};

exports._meta = {
  version: 1,
};

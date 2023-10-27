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

const TABLE_NAME = "sku_deactivation_reason_junction";

exports.up = function (db) {
  return db.createTable(TABLE_NAME, {
    id: { type: "int", primaryKey: true, autoIncrement: true },
    reason: { type: "string", notNull: true },
    is_deactivated: { type: "boolean", defaultValue: 0 },
    product_id: {
      type: "int",
      unsigned: true,
      notNull: true,
      product_id: {
        type: "int",
        foreignKey: {
          name: "sdr_junction_product_id_fk",
          table: "products",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
    },
    created_at: { type: "datetime", defaultValue: null },
    updated_at: { type: "datetime", defaultValue: null },
    deleted_at: { type: "datetime", defaultValue: null },
  });
};

exports.down = function (db) {
  return db.dropTable(TABLE_NAME);
};

exports._meta = {
  version: 1,
};

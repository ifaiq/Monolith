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
    "product_audit_history",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      product_id: {
        type: "int",
        foreignKey: {
          name: "product_audit_history_product_id_fk",
          table: "products",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      source: { type: "string", defaultValue: null },
      new_JSON: { type: "JSON", defaultValue: null },
      old_JSON: { type: "JSON", defaultValue: null },
      updated_by: {
        type: "int",
        foreignKey: {
          name: "user_audit_id_fk",
          table: "users",
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
      if (err) console.log("ERROR AT CREATING PRODUCT AUDIT HISTORY", err);
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

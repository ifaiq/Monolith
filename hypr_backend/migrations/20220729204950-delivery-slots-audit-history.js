/* eslint-disable no-console */
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
const TABLE_NAME = "delivery_slots_audit_history";

exports.up = async function (db) {
  await db.createTable(
    TABLE_NAME,
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      delivery_slots_id: {
        type: "int",
        foreignKey: {
          name: "delivery_slots_audit_history_delivery_slots_id_fk",
          table: "delivery_slots",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      new_JSON: { type: "JSON", defaultValue: null },
      old_JSON: { type: "JSON", defaultValue: null },
      updated_by: { type: "int" },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    });
  /**
* Create multi column unique index
* https://db-migrate.readthedocs.io/en/latest/API/SQL/#addindextablename-indexname-columns-unique-callback
* */
  await db.addIndex(TABLE_NAME, "delivery_slots_audit_history_delivery_slots_id_fk", ["delivery_slots_id"], true);
  return Promise.resolve();
};

exports.down = function (db) {
  return db.dropTable(TABLE_NAME);
};

exports._meta = {
  version: 1,
};

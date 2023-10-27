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
const TABLE_NAME = "delivery_slots";

exports.up = async function (db) {
  await db.createTable(
    TABLE_NAME,
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      location_id: { type: "int" },
      date: { type: "date" },
      cut_off: { type: "datetime" },
      touchpoint_capacity: { type: "int" },
      disabled: { type: "boolean", defaultValue: 0 },
      manually_overridden: { type: "boolean", defaultValue: 0 },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    });

  /**
   * Create multi column unique index
   * https://db-migrate.readthedocs.io/en/latest/API/SQL/#addindextablename-indexname-columns-unique-callback
   * */
  await db.addIndex(
    TABLE_NAME,
    "disabled_location_idx",
    ["disabled", "location_id"],
    true,
  );
  await db.runSql(
    "ALTER TABLE delivery_slots ADD constraint `date_location_unique` UNIQUE (`date` ,`location_id` )",
    [],
    true,
  );
  return Promise.resolve();
};

exports.down = function (db) {
  return db.dropTable(TABLE_NAME);
};

exports._meta = {
  version: 1,
};

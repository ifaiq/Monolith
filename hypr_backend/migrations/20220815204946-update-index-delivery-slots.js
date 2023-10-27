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
  await db.removeIndex(
    TABLE_NAME,
    "disabled_location_idx");

  await db.addIndex(
    TABLE_NAME,
    "disabled_location_idx",
    ["disabled", "location_id"],
    false,
  );
  return Promise.resolve();
};

exports._meta = {
  version: 1,
};

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

const TABLE_NAME = "deeplink_events";

exports.up = async function (db) {
  await db.createTable(
    TABLE_NAME,
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      session_id: { type: "string", defaultValue: null },
      source: { type: "string", defaultValue: 0 },
      medium: { type: "string", defaultValue: null },
      campaign: { type: "string", defaultValue: null },
      screen: { type: "string", defaultValue: null },
      category_id: { type: "string", defaultValue: null },
      subcategory_id: { type: "string", defaultValue: null },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    });
  return Promise.resolve();
};

exports.down = async  db => {
  await db.dropTable(TABLE_NAME);
  return null;
};


exports._meta = {
  version: 1,
};

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

const TABLE_NAME = "location_banners";
const COLUMN_NAME = "launch_url";

exports.up = async function (db) {
  await db.addColumn(TABLE_NAME, COLUMN_NAME, {
    type: "string",
    allowNull: true,
  });
  return Promise.resolve();
};

exports.down = async function (db) {
  await db.removeColumn(TABLE_NAME, COLUMN_NAME);
  return Promise.resolve();
};

exports._meta = {
  version: 1,
};

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

const TABLE_NAME = "invoices";
const COLUMN_NAME = "thermal_pdf";

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

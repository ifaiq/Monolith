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

const TABLE_NAME = "location_banners";
const COLUMN_NAME = "category_id";
const COLUMN_NAME_SUBCAT = "subcategory_id";


exports.up = async function (db) {
  await db.addColumn(TABLE_NAME, COLUMN_NAME, { type: "varchar(50)", defaultValue: null });

  await db.addColumn(TABLE_NAME, COLUMN_NAME_SUBCAT, { type: "varchar(50)", defaultValue: null });

  return Promise.resolve();
};

exports.down = async  db => {
  await db.removeColumn(TABLE_NAME, COLUMN_NAME);
  await db.removeColumn(TABLE_NAME, COLUMN_NAME_SUBCAT);
  return Promise.resolve();
};

exports._meta = {
  version: 1,
};

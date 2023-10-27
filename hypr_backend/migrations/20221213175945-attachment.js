"use strict";

let dbm;
let type;
// eslint-disable-next-line no-unused-vars
let seed;

const TABLE_NAME = "non_cash_closing";

const COLUMN_NAMES = {
  attachment: "attachment",
};


/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.addColumn(TABLE_NAME, COLUMN_NAMES.attachment, { type: "JSON", defaultValue: null });
};

exports.down = async db => await db.dropTable(TABLE_NAME);

exports._meta = {
  version: 1,
};

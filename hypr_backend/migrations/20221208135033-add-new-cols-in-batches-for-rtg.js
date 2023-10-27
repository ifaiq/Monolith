"use strict";

let dbm;
let type;
// eslint-disable-next-line no-unused-vars
let seed;

const TABLE_NAME = "delivery_batches";

const COLUMN_NAMES = {
  MISSING: "missing",
  DAMAGES: "damages",
  INVENTORY_LOSS: "inventory_loss",
  RTG_START_TIME: "rtg_start_time",
  RTG_END_TIME: "rtg_end_time",
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
  await db.addColumn(TABLE_NAME, COLUMN_NAMES.MISSING, { type: type.INTEGER, defaultValue: null });
  await db.addColumn(TABLE_NAME, COLUMN_NAMES.DAMAGES, { type: type.INTEGER, defaultValue: null });
  await db.addColumn(TABLE_NAME, COLUMN_NAMES.INVENTORY_LOSS, { type: type.DECIMAL, defaultValue: null });
  await db.addColumn(TABLE_NAME, COLUMN_NAMES.RTG_START_TIME, { type: "datetime", defaultValue: null });
  await db.addColumn(TABLE_NAME, COLUMN_NAMES.RTG_END_TIME, { type: "datetime", defaultValue: null });
};

exports.down = async db => await db.dropTable(TABLE_NAME);

exports._meta = {
  version: 1,
};

"use strict";

let dbm;
let type;
// eslint-disable-next-line no-unused-vars
let seed;

const TABLE_NAME = "delivery_batches";

const COLUMN_NAMES = {
  RTG_AGENT_ID: "rtg_agent_id",
  RTG_STATUS_ID: "rtg_status_id",
  IS_RED: "is_red",
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
  await db.addColumn(TABLE_NAME, COLUMN_NAMES.RTG_AGENT_ID, { type: type.INTEGER, defaultValue: null });
  await db.addColumn(TABLE_NAME, COLUMN_NAMES.RTG_STATUS_ID,
    {
      type: type.INTEGER,
      defaultValue: null,
      foreignKey: {
        name: "delivery_batches_rtg_status_id_fk",
        table: "rtg_status",
        rules: {
          onDelete: "CASCADE",
        },
        mapping: "id",
      },
    },
  );

  await db.addColumn(TABLE_NAME, COLUMN_NAMES.IS_RED, { type: type.BOOLEAN, defaultValue: null });
};

exports.down = async db => await db.dropTable(TABLE_NAME);

exports._meta = {
  version: 1,
};

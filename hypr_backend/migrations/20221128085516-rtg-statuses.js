"use strict";

let dbm;
let type;
// eslint-disable-next-line no-unused-vars
let seed;

const TABLE_NAME = "rtg_status";


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
  await db.createTable(TABLE_NAME, {
    id: { type: type.INTEGER, notNull: true, primaryKey: true, autoIncrement: true },
    status: { type: type.STRING, notNull: true },
    created_at: { type: "datetime", defaultValue: null },
    updated_at: { type: "datetime", defaultValue: null },
    deleted_at: { type: "datetime", defaultValue: null },
  });

  await db.runSql(`INSERT INTO ${TABLE_NAME} (status, created_at, updated_at) VALUES ('DONE', now(), now())`, []);
  // eslint-disable-next-line max-len
  await db.runSql(`INSERT INTO ${TABLE_NAME} (status, created_at, updated_at) VALUES ('IN_PROGRESS', now(), now())`, []);
  await db.runSql(`INSERT INTO ${TABLE_NAME} (status, created_at, updated_at) VALUES ('LOCKED', now(), now())`, []);
};

exports.down = async db => await db.dropTable(TABLE_NAME);

exports._meta = {
  version: 1,
};

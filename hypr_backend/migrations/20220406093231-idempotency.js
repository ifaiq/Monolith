'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'idempotency';

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
    id: { type: type.INTEGER, unsigned: true, notNull: true, primaryKey: true, autoIncrement: true },
    idempotency_key: { type: type.STRING, notNull: true, unique: true },
    status_code: { type: type.INTEGER, notNull: true },
    response: { type: "json", notNull: true },
    created_at: { type: "datetime", defaultValue: null },
    updated_at: { type: "datetime", defaultValue: null },
    deleted_at: { type: "datetime", defaultValue: null },
  });
};

exports.down = async db => await db.dropTable(TABLE_NAME);

exports._meta = {
  version: 1,
};
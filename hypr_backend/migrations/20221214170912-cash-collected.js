"use strict";
let dbm;
let type;
let seed;
const TABLE_NAME = "cash_collected";
/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};
exports.up = async function (db) {
  await db.createTable(TABLE_NAME, {
    id: { type: type.INTEGER, unsigned: true, notNull: true, primaryKey: true, autoIncrement: true },
    batch_id: {
      type: type.INTEGER, notNull: true, foreignKey: {
        name: "cash_collected_delivery_batches_id_fk",
        table: "delivery_batches",
        rules: {
          onDelete: "CASCADE",
        },
        mapping: "id",
      },
    },
    amount: { type: type.INTEGER, notNull: true },
    created_at: { type: "datetime", defaultValue: null },
    updated_at: { type: "datetime", defaultValue: null },
    deleted_at: { type: "datetime", defaultValue: null },
  });
};
exports.down = async db => await db.dropTable(TABLE_NAME);

exports._meta = {
  version: 1,
};

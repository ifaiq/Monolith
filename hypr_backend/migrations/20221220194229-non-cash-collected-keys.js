"use strict";
let dbm;
let type;
let seed;
const TABLE_NAME = "non_cash_collected_keys";
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
    non_cash_id: {
      type: type.INTEGER, unsigned: true, notNull: true, foreignKey: {
        name: "non_cash_collected_keys_non_cash_collected_id_fk",
        table: "non_cash_collected",
        rules: {
          onDelete: "CASCADE",
        },
        mapping: "id",
      },
    },
    attachment_id: {
      type: type.INTEGER, unsigned: true, notNull: true, foreignKey: {
        name: "non_cash_collected_keys_non_cash_attachment_id_fk",
        table: "non_cash_attachment",
        rules: {
          onDelete: "CASCADE",
        },
        mapping: "id",
      },
    },
    created_at: { type: "datetime", defaultValue: null },
    updated_at: { type: "datetime", defaultValue: null },
    deleted_at: { type: "datetime", defaultValue: null },
  });
};
exports.down = async db => await db.dropTable(TABLE_NAME);

exports._meta = {
  version: 1,
};

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

const TABLE_NAME = "roles_app_versions";
const COLUMN_NAME = "general_app_version";

exports.up = async (db) => {
  await db.addColumn(TABLE_NAME, COLUMN_NAME, {
    type: "int",
    allowNull: false,
    foreignKey: {
      name: "general_appversion_fk",
      table: "app_versions",
      rules: {
        onDelete: "CASCADE",
      },
      mapping: "id",
    },
  });

  return Promise.resolve();
};

exports.down = async (db) => {
  await db.removeColumn(TABLE_NAME, COLUMN_NAME);
};

exports._meta = {
  version: 1,
};


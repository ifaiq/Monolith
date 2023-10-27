'use strict';

let dbm;
let type;
let seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */

let tableName = 'order_amount_adjustments';

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.createTable(tableName, {
    id: {type: type.INTEGER, unsigned: true, notNull: true, primaryKey: true, autoIncrement: true},
    order_id: { type: type.INTEGER, unsigned: true, notNull: true },
    context_id: { type: type.INTEGER, unsigned: true, notNull: true },
    created_at: {type: type.DATE_TIME, defaultValue: null},
    updated_at: {type: type.DATE_TIME, defaultValue: null},
    deleted_at: {type: type.DATE_TIME, defaultValue: null},
  });
  await db.runSql(
    `ALTER TABLE ${tableName} ADD COLUMN context_name ENUM('WAIVER') DEFAULT NULL`, []);
  return Promise.resolve();
};

exports.down = async db => {
  await db.dropTable(tableName);
  return null;
};

exports._meta = {
  version: 1
};

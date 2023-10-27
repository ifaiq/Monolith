'use strict';

let dbm;
let type;
let seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */

// TODO Need to create constants for table.
let tableName = 'tag_associations';
let context_name_enum = { PRODUCT: 'product' };

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.createTable(tableName, {
    id: { type: type.INTEGER, unsigned: true, notNull: true, primaryKey: true, autoIncrement: true },
    tag_id: { type: type.INTEGER, unsigned: true, notNull: true },
    context_id: { type: type.INTEGER, notNull: true },
    // TODO Need consistency for disabled into every table, Right now it is not consistent. 
    disabled: { type: type.BOOLEAN, defaultValue: false },
    created_at: { type: type.DATE_TIME, defaultValue: null },
    updated_at: { type: type.DATE_TIME, defaultValue: null },
    deleted_at: { type: type.DATE_TIME, defaultValue: null },
  });
  // TODO get tags table name from the constanst.
  await db.addForeignKey(
    tableName,
    'tags',
    'tag_tag_associations_id_foreign',
    { 'tag_id': 'id' },
    { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
  );
  /**
   * We need to use raw query to create ENUM because `node-db-migrate` don't give support for creating ENUMS.
   * Issue is created on the github https://github.com/db-migrate/node-db-migrate/pull/177
   * */
   await db.runSql(
    `ALTER TABLE ${tableName} ADD COLUMN context_name ENUM('${context_name_enum['PRODUCT']}') NULL DEFAULT NULL`, []);

  /** 
   * Create multi column unique index
   * https://db-migrate.readthedocs.io/en/latest/API/SQL/#addindextablename-indexname-columns-unique-callback
   * */ 
  await db.addIndex(tableName, 'index_tag_id_context_id', ['tag_id','context_id','context_name'], true);
  
  return Promise.resolve();
};

exports.down = async db => {
  await db.dropTable(tableName);
  return null;
};

exports._meta = {
  version: 1
};

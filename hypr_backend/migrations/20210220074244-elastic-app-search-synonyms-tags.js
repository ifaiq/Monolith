'use strict';

let dbm;
let type;
let seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */

// TODO Need to create constants for table.
let tableName = 'elastic_app_search_synonyms_tags';

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.createTable(tableName, {
    id: { type: type.INTEGER, unsigned: true, notNull: true, primaryKey: true, autoIncrement: true },
    tag_id: { type: type.INTEGER, unsigned: true, notNull: true },
    synonyms_id: { type: type.STRING, notNull: true, },
    created_at: { type: type.DATE_TIME, defaultValue: null },
    updated_at: { type: type.DATE_TIME, defaultValue: null },
    deleted_at: { type: type.DATE_TIME, defaultValue: null },
  });  
  return Promise.resolve();
};

exports.down = async db => {
  await db.dropTable(tableName);
  return null;
};

exports._meta = {
  version: 1
};

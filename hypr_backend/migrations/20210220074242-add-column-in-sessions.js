'use strict';

let dbm;
let type;
let seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */

const TABLE_NAME = 'sessions';
const CONTEXT_NAME = 'context_name';

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.addColumn(TABLE_NAME, CONTEXT_NAME, {type: 'string', defaultValue: null});
  return Promise.resolve();
};

exports.down = async db => {
  await db.removeColumn(TABLE_NAME, CONTEXT_NAME);
  return null;
};

exports._meta = {
  version: 1
};

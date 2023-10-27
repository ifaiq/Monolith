'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const TABLE_NAME = 'odoo_history';

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.addColumn(TABLE_NAME, 'failure', { type: type.BOOLEAN, defaultValue: false });
  return Promise.resolve();
};

exports.down = async db => {
  await db.removeColumn(TABLE_NAME, 'failure');
  return Promise.resolve();
};

exports._meta = {
  "version": 1
};

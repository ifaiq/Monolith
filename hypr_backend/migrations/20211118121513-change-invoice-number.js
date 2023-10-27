'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'invoices';
const COLUMN_NAME = 'invoice_number';

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
  await db.runSql(`ALTER TABLE ${TABLE_NAME} MODIFY COLUMN ${COLUMN_NAME} VARCHAR(255);`, []);
  return Promise.resolve();
};

exports.down = async db => {
  await db.runSql(`ALTER TABLE ${TABLE_NAME} MODIFY COLUMN ${COLUMN_NAME} DECIMAL(10,2);`, []);
  return null;
};

exports._meta = {
  "version": 1
};

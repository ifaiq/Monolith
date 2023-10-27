'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const TABLE_NAME = 'coupons';

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.addColumn(TABLE_NAME, 'products_list_type', { type: type.INTEGER, unsigned: true, notNull: true });
  return Promise.resolve();
};

exports.down = async db => await db.removeColumn(TABLE_NAME, 'products_list_type');

exports._meta = {
  "version": 1
};
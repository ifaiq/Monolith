
'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const TABLE_NAME = 'order_items';

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.addColumn(TABLE_NAME, 'tax_category', {type: type.INTEGER});
  return Promise.resolve();
};

exports.down = async db => {
  await db.removeColumn(TABLE_NAME, 'tax_category');
  return Promise.resolve();
};

exports._meta = {
  "version": 1
};
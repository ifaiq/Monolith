"use strict";

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
  await db.addColumn(TABLE_NAME, 'user_type', { type: type.STRING, defaultValue: null });
  return Promise.resolve();
};

exports.down = async db => {
  await db.removeColumn(TABLE_NAME, 'user_type');
  return Promise.resolve();
};

exports._meta = {
  version: 1,
};

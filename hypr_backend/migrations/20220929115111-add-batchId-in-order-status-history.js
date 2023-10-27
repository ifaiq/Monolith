'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  // return db.addColumn('order_status_history', 'batch_id', {
  //   type: type.INTEGER,
  //   defaultValue: null,
  // }, callback);
  return null;
};

exports.down = function (db, callback) {
  return db.removeColumn('order_status_history', 'batch_id', callback);
};

exports._meta = {
  "version": 1
};

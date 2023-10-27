'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  return db.addColumn('order_status_history', 'device_id', {
    type: 'string',
    defaultValue: null
  }, callback);
};

exports.down = function (db, callback) {
  return db.removeColumn('order_status_history', 'device_id', callback);
};

exports._meta = {
  "version": 1
};

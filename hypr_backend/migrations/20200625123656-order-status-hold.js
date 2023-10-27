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

exports.up = function(db) {
  return db.runSql(
    "INSERT INTO order_statuses (id, name) SELECT 12, 'ON HOLD' WHERE not exists(SELECT * FROM order_statuses WHERE id=12)",
    [],
    function (err) {
      if (err) console.log(err);
    }
  );
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};

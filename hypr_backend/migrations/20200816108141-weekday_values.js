"use strict";

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

exports.up = function (db) {
  return db.runSql(
    "INSERT INTO week_days (id, name, created_at, updated_at) VALUES ('1', 'Sunday', now(), now()), ('2', 'Monday', now(), now()),('3', 'Tuesday', now(), now()),('4', 'Wednesday', now(), now()),('5', 'Thrusday', now(), now()),('6', 'Friday', now(), now()),('7', 'Saturday', now(), now())",
    [],
    function (err) {
      if (err) console.log(err);
    }
  );
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};

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
    "ALTER TABLE `notification_messages` ADD COLUMN `company_id` INT(11) NULL AFTER `deleted_at`",
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

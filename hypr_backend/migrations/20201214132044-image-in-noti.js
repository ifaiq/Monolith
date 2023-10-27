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
    "ALTER TABLE `notification_messages` ADD COLUMN `image_url` VARCHAR(500) NULL AFTER `company_id`",
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

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
    "ALTER TABLE products ADD UNIQUE INDEX `sku_location_id_UNIQUE` (`sku` ,`location_id` )",
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

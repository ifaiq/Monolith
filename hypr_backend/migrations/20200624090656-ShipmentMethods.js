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
    "INSERT INTO shipment_methods (id, name, created_at, updated_at) SELECT 1, 'SELF DELIVERY',now(), now()  WHERE not exists(SELECT * FROM app_types WHERE id=1)",
    [],
    function (err) {
      if (err) console.log(err);
      return db.runSql(
        "INSERT INTO shipment_methods (id, name, created_at, updated_at) SELECT 2, 'PARTNER DELIVERY',now(), now()  WHERE not exists(SELECT * FROM app_types WHERE id=2)",
        [],
        function (err) {
          if (err) console.log(err);
        }
      );
    }
  );
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};

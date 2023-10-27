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
    "INSERT INTO order_statuses (id, name) SELECT 1, 'SALE ORDER' WHERE not exists(SELECT * FROM order_statuses WHERE id=1)",
    [],
    function (err) {
      if (err) console.log(err);
      return db.runSql(
        "INSERT INTO order_statuses (id, name) SELECT 2, 'RESERVED' WHERE not exists(SELECT * FROM order_statuses WHERE id=2)",
        [],
        function (err) {
          if (err) console.log(err);
          return db.runSql(
            "INSERT INTO order_statuses (id, name) SELECT 3, 'PACKER ASSIGNED' WHERE not exists(SELECT * FROM order_statuses WHERE id=3)",
            [],
            function (err) {
              if (err) console.log(err);
              else {
                return db.runSql(
                  "INSERT INTO order_statuses (id, name) SELECT 4, 'PACKED' WHERE not exists(SELECT * FROM order_statuses WHERE id=4)",
                  [],
                  function (err) {
                    if (err) console.log(err);
                    else {
                      return db.runSql(
                        "INSERT INTO order_statuses (id, name) SELECT 5, 'IN TRANSIT' WHERE not exists(SELECT * FROM order_statuses WHERE id=5)",
                        [],
                        function (err) {
                          if (err) console.log(err);
                        }
                      );
                    }
                  }
                );
              }
            }
          );
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

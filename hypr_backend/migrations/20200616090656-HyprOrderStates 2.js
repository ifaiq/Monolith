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
    "INSERT INTO order_statuses (id, name) SELECT 6, 'PACKER CANCELLED' WHERE not exists(SELECT * FROM order_statuses WHERE id=6)",
    [],
    function (err) {
      if (err) console.log(err);
      else {
        return db.runSql(
          "INSERT INTO order_statuses (id, name) SELECT 7, 'RETURNED' WHERE not exists(SELECT * FROM order_statuses WHERE id=7)",
          [],
          function (err) {
            if (err) console.log(err);
            else {
              return db.runSql(
                "INSERT INTO order_statuses (id, name) SELECT 8, 'PARTIAL DELIVERED' WHERE not exists(SELECT * FROM order_statuses WHERE id=8)",
                [],
                function (err) {
                  if (err) console.log(err);
                  else {
                    return db.runSql(
                      "INSERT INTO order_statuses (id, name) SELECT 9, 'DELIVERED' WHERE not exists(SELECT * FROM order_statuses WHERE id=9)",
                      [],
                      function (err) {
                        if (err) console.log(err);
                        else {
                          return db.runSql(
                            "INSERT INTO order_statuses (id, name) SELECT 10, 'CANCELLED' WHERE not exists(SELECT * FROM order_statuses WHERE id=10)",
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
          }
        );
      }
    }
  );
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};

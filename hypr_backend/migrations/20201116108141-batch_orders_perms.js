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
    "INSERT INTO permissions (id, code, api, method, created_at, updated_at) VALUES ('122', 'L_BATCH_ORDER', '/order/getBatchOrdersData', 'GET', now(), now())",
    [],
    function (err) {
      if (err) console.log(err);
      else {
        return db.runSql(
          "INSERT INTO permissions (id, code, api, method, created_at, updated_at) VALUES ('123', 'D_BATCH_ORDER', '/order/batchOrdersDump', 'GET', now(), now())",
          [],
          function (err) {
            if (err) console.log(err);
            else {
              return db.runSql(
                "INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES ( '9', '122', now(), now()),( '9', '123', now(), now())",
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
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};

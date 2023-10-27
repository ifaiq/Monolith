'use strict';

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
    "INSERT INTO permissions (code, api, method, created_at, updated_at) VALUES ('L_DELIVERY_SLOTS', '/api/v1/delivery-slots/portal', 'GET', now(), now())",
    [],
    function (err) {
      if (err) console.log(err);
      else {
        return db.runSql(
          "INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES ( '1', (select id from permissions where code = 'L_DELIVERY_SLOTS'), now(), now())",
          [],
          function (err) {
            if (err) console.log(err);
          }
        );
      }
    });
};

exports.down = function (db) {
  return db.runSql(
    "DELETE FROM permissions WHERE api = 'L_DELIVERY_SLOTS'",
    [],
    function (err) {
      if (err) console.log(err);
      else {
        return db.runSql(
          "DELETE FROM role_permissions WHERE permission_id = (select id from permissions where code = 'L_DELIVERY_SLOTS')",
          [],
          function (err) {
            if (err) console.log(err);
          });
      }
    });
};

exports._meta = {
  "version": 1
};

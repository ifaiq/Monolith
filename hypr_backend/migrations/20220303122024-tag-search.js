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

exports.up = async (db) => {
  await db.runSql(`INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES (9, (SELECT id from permissions where code = 'G_SEARCHED_PRODUCT_RBAC'), now(), now());`, []);
  return Promise.resolve();
};

exports.down = async (db) => {
  await db.runSql("SET SQL_SAFE_UPDATES = 0;");
  await db.runSql(`DELETE FROM role_permissions where permission_id =  (SELECT id from permissions where code = 'G_SEARCHED_PRODUCT_RBAC');`, []);
  await db.runSql("SET SQL_SAFE_UPDATES = 1;");
  return null;
};

exports._meta = {
  "version": 1
};

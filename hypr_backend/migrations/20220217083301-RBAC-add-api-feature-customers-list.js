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

exports.up = async function (db) {
  await db.runSql(
    // eslint-disable-next-line max-len
    `INSERT INTO permissions (name, code, api, method, created_at, updated_at) VALUES ('RBAC', 'G_FEATURE_CUSTOMERS_LIST', '/api/v1/user/featureCustomersList', 'GET', now(), now());`,
    [],
  );
  await db.runSql(
    // eslint-disable-next-line max-len
    `INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES (1, (SELECT id from permissions where code = 'G_FEATURE_CUSTOMERS_LIST'), now(), now());`,
    [],
  );
  await db.runSql(
    // eslint-disable-next-line max-len
    `INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES (9, (SELECT id from permissions where code = 'G_FEATURE_CUSTOMERS_LIST'), now(), now());`,
    [],
  );
  return Promise.resolve();
};

exports.down = async function (db) {
  await db.runSql("SET SQL_SAFE_UPDATES = 0;");
  await db.runSql(
    // eslint-disable-next-line max-len
    `DELETE FROM role_permissions where permission_id =  (SELECT id from permissions where code = 'G_FEATURE_CUSTOMERS_LIST');`,
    [],
  );
  await db.runSql(`DELETE FROM permissions WHERE code = 'G_FEATURE_CUSTOMERS_LIST';`, []);
  await db.runSql("SET SQL_SAFE_UPDATES = 1;");
  return null;
};

exports._meta = {
  version: 1,
};

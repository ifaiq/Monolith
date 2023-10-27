/* eslint-disable max-len */
"use strict";

let dbm;
let type;
let seed;


/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.runSql(`INSERT INTO permissions (name, code, api, method, created_at, updated_at) VALUES ('RBAC', 'P_EINVOICE_LOGISTICS_RBAC', '/api/v1/e-invoice/logistics', 'GET', now(), now());`, []);
  await db.runSql(`INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES (6, (SELECT id from permissions where code = 'P_EINVOICE_LOGISTICS_RBAC'), now(), now());`, []);
  return Promise.resolve();
};

exports.down = async db => {
  await db.runSql("SET SQL_SAFE_UPDATES = 0;");
  await db.runSql(`DELETE FROM permissions WHERE code = 'P_EINVOICE_LOGISTICS_RBAC';`, []);
  await db.runSql(`DELETE FROM role_permissions where permission_id =  (SELECT id from permissions where code = 'P_EINVOICE_LOGISTICS_RBAC');`, []);
  await db.runSql("SET SQL_SAFE_UPDATES = 1;");
  return null;
};

exports._meta = {
  version: 1,
};

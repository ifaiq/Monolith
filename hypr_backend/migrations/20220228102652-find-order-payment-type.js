"use strict";

var dbm;
var type;
var seed;
let Promise;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
};

exports.up = async db => {
  await db.runSql(`INSERT INTO permissions (name, code, api, method, created_at, updated_at) VALUES 
  ('RBAC', 'P_FIND_ORDER_PAYMENT_TYPE_RBAC', '/api/v1/order/findOrderPaymentType', 'Get', now(), now());`, []);
  await db.runSql(`INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES 
  (6, (SELECT id from permissions where code = 'P_FIND_ORDER_PAYMENT_TYPE_RBAC'), now(), now());`, []);
  return Promise.resolve();
};

exports.down = async db => {
  await db.runSql("SET SQL_SAFE_UPDATES = 0;");
  await db.runSql(`DELETE FROM permissions WHERE code = 'P_FIND_ORDER_PAYMENT_TYPE_RBAC';`, []);
  await db.runSql("SET SQL_SAFE_UPDATES = 1;");
  return null;
};


exports._meta = {
  version: 1,
};

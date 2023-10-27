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

exports.up = function (db) {
  return db.runSql(
    "INSERT INTO permissions (code, api, method, created_at, updated_at) VALUES ('G_PRODUCT_BY_SKU', '/api/v1/product/getProductsFromSkus', 'GET', now(), now())",
    [],
    err => {
      if (err) console.log(err);
      else {
        return db.runSql(
          "INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES ( '1', (select id from permissions where code = 'G_PRODUCT_BY_SKU'), now(), now()), ( '8', (select id from permissions where code = 'G_PRODUCT_BY_SKU'), now(), now()), ( '9', (select id from permissions where code = 'G_PRODUCT_BY_SKU'), now(), now())",
          [],
          err => {
            if (err) console.log(err);
          },
        );
      }
    },
  );
};

exports.down = function (db) {
  return db.runSql(
    "DELETE FROM permissions WHERE api = 'G_PRODUCT_BY_SKU'",
    [],
    err => {
      if (err) console.log(err);
      else {
        return db.runSql(
          "DELETE FROM role_permissions WHERE permission_id = (select id from permissions where code = 'G_PRODUCT_BY_SKU')",
          [],
          err => {
            if (err) console.log(err);
          },
        );
      }
    },
  );
};

exports._meta = {
  version: 1,
};

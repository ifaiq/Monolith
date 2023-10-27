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

const TABLE_NAME = "customer_sku_report";

exports.up = async db =>
  await db.createTable(TABLE_NAME, {
    id: { type: "int", primaryKey: true, autoIncrement: true },
    customer_id: { type: "string", notNull: true },
    product_id: { type: "string", notNull: true },
    updated_by: { type: "string", notNull: true },
    file_url: { type: "string", notNull: true },
    created_at: { type: "datetime", defaultValue: null },
    updated_at: { type: "datetime", defaultValue: null },
    deleted_at: { type: "datetime", defaultValue: null },
  });

exports.down = async db => await db.dropTable(TABLE_NAME);

exports._meta = {
  version: 1,
};

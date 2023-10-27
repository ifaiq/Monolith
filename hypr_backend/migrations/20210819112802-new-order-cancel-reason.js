'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const TABLE_NAME = 'order_status_reason';

exports.setup = function (options, seedLink) {
    dbm = options.dbmigrate;
    type = dbm.dataType;
    seed = seedLink;
};

exports.up = async (db) => {
    await db.runSql(`INSERT INTO ${TABLE_NAME} (reason, description, created_at, updated_at, tag) VALUES ('Discount Issue', 'Discount Issue', now(), now(), 'CA')`, []);
    return Promise.resolve();
};

exports.down = async db => {
    await db.runSql(`DELETE FROM ${TABLE_NAME} WHERE reason = 'Discount Issue'`, []);
    return Promise.resolve();
};

exports._meta = {
    "version": 1
};

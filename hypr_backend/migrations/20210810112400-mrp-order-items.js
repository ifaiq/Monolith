
'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const TABLE_NAME = 'order_items';

exports.setup = function (options, seedLink) {
    dbm = options.dbmigrate;
    type = dbm.dataType;
    seed = seedLink;
};

exports.up = async db => {
    await db.addColumn(TABLE_NAME, 'mrp', { type: type.DECIMAL, precision: 10, scale: 2 });
    return Promise.resolve();
};

exports.down = async db => {
    await db.removeColumn(TABLE_NAME, 'mrp');
    return Promise.resolve();
};

exports._meta = {
    "version": 1
};
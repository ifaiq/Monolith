'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'batch_performances';

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
  await db.createTable(TABLE_NAME, {
    id: { type: type.INTEGER, unsigned: true, notNull: true, primaryKey: true, autoIncrement: true },
    delivered_gmv: { type: type.INTEGER, unsigned: true, notNull: true },
    delivered_orders: { type: type.INTEGER, unsigned: true, notNull: true },
    delivered_touchpoints: { type: type.INTEGER, unsigned: true, notNull: true },
    total_orders: { type: type.INTEGER, unsigned: true, notNull: true },
    total_gmv: { type: type.INTEGER, unsigned: true, notNull: true },
    total_touchpoints: { type: type.INTEGER, unsigned: true, notNull: true },
    agent_id: {
      type: type.INTEGER,
      foreignKey: {
        name: "batch_performance_agent_id_fk",
        table: "users",
        rules: {
          onDelete: "CASCADE",
          onUpdate: "RESTRICT",
        },
        mapping: "id",
      },
    },
    batch_id: {
      type: type.INTEGER,
      foreignKey: {
        name: "batch_performance_batch_id_fk",
        table: "delivery_batches",
        rules: {
          onDelete: "CASCADE",
          onUpdate: "RESTRICT",
        },
        mapping: "id",
      },
    },
    created_at: { type: type.DATE_TIME, defaultValue: null },
    updated_at: { type: type.DATE_TIME, defaultValue: null },
    deleted_at: { type: type.DATE_TIME, defaultValue: null },
  });
};

exports.down = async db => await db.dropTable(TABLE_NAME);

exports._meta = {
  version: 1,
};

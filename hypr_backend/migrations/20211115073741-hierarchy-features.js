'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'hierarchy_features';

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
    business_unit_id: {
      type: type.INTEGER,
      foreignKey: {
        name: "hierarchy_features_business_unit_id_fk",
        table: "business_units",
        rules: {
          onDelete: "CASCADE",
          onUpdate: "RESTRICT",
        },
        mapping: "id",
      },
    },
    location_id: {
      type: type.INTEGER,
      foreignKey: {
        name: "hierarchy_features_location_id_fk",
        table: "locations",
        rules: {
          onDelete: "CASCADE",
          onUpdate: "RESTRICT",
        },
        mapping: "id",
      },
    },
    feature_id: {
      type: type.INTEGER,
      foreignKey: {
        name: "hierarchy_features_feature_id_fk",
        table: "features",
        rules: {
          onDelete: "CASCADE",
          onUpdate: "RESTRICT",
        },
        mapping: "id",
      },
    },
    disabled: { type: type.BOOLEAN, defaultValue: false },
    created_at: { type: type.DATE_TIME, defaultValue: null },
    updated_at: { type: type.DATE_TIME, defaultValue: null },
    deleted_at: { type: type.DATE_TIME, defaultValue: null },
  });
}

exports.down = async db => await db.dropTable(TABLE_NAME);

exports._meta = {
  "version": 1
};

'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'credit_note_invoices';

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
    title: { type: type.STRING, defaultValue: null },
    invoice_number: { type: type.STRING, notNull: true },
    customer_id: {
      type: type.INTEGER,
      foreignKey: {
        name: "cn_invoices_cid_fk",
        table: "customers",
        rules: {
          onDelete: "CASCADE",
          onUpdate: "RESTRICT",
        },
        mapping: "id",
      },
    },
    order_id: {
      type: type.INTEGER,
      foreignKey: {
        name: "cn_invoices_order_id_fk",
        table: "orders",
        rules: {
          onDelete: "CASCADE",
          onUpdate: "RESTRICT",
        },
        mapping: "id",
      },
    },
    business_unit_id: {
      type: type.INTEGER,
      foreignKey: {
        name: "cn_invoices_bu_id_fk",
        table: "business_units",
        rules: {
          onDelete: "CASCADE",
          onUpdate: "RESTRICT",
        },
        mapping: "id",
      },
    },
    invoice_id: {
      type: type.INTEGER
    },
    invoice_issue_date: { type: type.DATE_TIME, defaultValue: null },
    total_amount: { type: type.DECIMAL, precision: 10, scale: 2, defaultValue: null },
    discount: { type: type.DECIMAL, precision: 10, scale: 2, defaultValue: null },
    total_tax_amount: { type: type.DECIMAL, precision: 10, scale: 2, defaultValue: null },
    total_amount_due: { type: type.DECIMAL, precision: 10, scale: 2, defaultValue: null },
    pdf_path: { type: type.STRING, defaultValue: null },
    xml_path: { type: type.STRING, defaultValue: null },
    thermal_pdf: { type: type.STRING, defaultValue: null },
    version: { type: type.STRING, defaultValue: "v1" },
    created_at: { type: type.DATE_TIME, defaultValue: null },
    updated_at: { type: type.DATE_TIME, defaultValue: null },
    deleted_at: { type: type.DATE_TIME, defaultValue: null },
  });
};

exports.down = async db => await db.dropTable(TABLE_NAME);

exports._meta = {
  "version": 1
};

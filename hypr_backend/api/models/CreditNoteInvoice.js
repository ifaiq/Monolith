module.exports = {
  tableName: "credit_note_invoices",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number",
      columnType: "integer",
      required: false,
      autoIncrement: true,
    },
    title: {
      type: "string",
      allowNull: false,
    },
    invoice_number: {
      type: "string",
      allowNull: false,
    },
    customer_id: {
      type: "number",
      allowNull: true
      // model: "Customer",
    },
    order_id: {
      model: "Order",
    },
    business_unit_id: {
      type: "number",
    },
    invoice_id: {
      model: "Invoice",
    },
    invoice_issue_date: {
      type: "ref",
      columnType: "datetime",
    },
    total_amount: {
      type: "number",
      columnType: "float",
      allowNull: true,
    },
    discount: {
      type: "number",
      columnType: "float",
      allowNull: true,
    },
    total_tax_amount: {
      type: "number",
      columnType: "float",
      allowNull: true,
    },
    total_amount_due: {
      type: "number",
      columnType: "float",
      allowNull: true,
    },
    pdf_path: {
      type: "string",
      allowNull: true,
    },
    xml_path: {
      type: "string",
      allowNull: true,
    },
    thermal_pdf: {
      type: "string",
      allowNull: true,
    },
    version: {
      type: "string",
      allowNull: false,
    },
    net_discount: {
      type: "number",
      columnType: "float",
      allowNull: true,
    },
    ajil_handling_fee: {
      type: "number",
      columnType: "float",
      allowNull: true,
    }
  },
};

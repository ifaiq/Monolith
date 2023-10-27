module.exports = {
  tableName: "product_audit_history",
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
    product_id: {
      model: "Product",
    },
    updated_by: {
      type: "number",
      allowNull: true
      // model: "User",
    },
    source: {
      type: "string",
      allowNull: true
    },
    old_JSON: {
      type: "string",
      allowNull: true,
      columnType: "JSON"
    },
    new_JSON: {
      type: "string",
      allowNull: true,
      columnType: "JSON"
    },
    reason: {
      type: "string"
    }
  },
  beforeCreate: async (productHistory, next) => {
     try {
      productHistory.created_at =
        typeof productHistory.created_at == "string"
          ? productHistory.created_at.split(".")[0]
          : productHistory.created_at;
      productHistory.updated_at =
        typeof productHistory.updated_at == "string"
          ? productHistory.updated_at.split(".")[0]
          : productHistory.updated_at;
      productHistory.deleted_at =
        typeof productHistory.deleted_at == "string"
          ? productHistory.deleted_at.split(".")[0]
          : productHistory.deleted_at;
    } catch (err) {
      console.log("PRODUCT AUDIT HISTORY HOOK ERROR", err);
    } finally {
      next();
    }
  },
};

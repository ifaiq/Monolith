module.exports = {
    tableName: "delivery_batches",
    created_at: true,
    updated_at: true,
    deleted_at: true,
    attributes: {
        id: {
            type: "number",
            columnType: "integer",
            autoIncrement: true,
        },
        status_id: {
            model: "DeliveryBatchStatus"
        },
        location_id: {
            type: "number",
        },
        products: { 
            type: "string", 
            columnType: "JSON", 
            allowNull: true 
        },
        assigned_to: {
            type: "number",
            // model: "User"
        },
        completed_at: { 
            type: "ref",
            columnType: "datetime",
            // columnName: "completed_at"
        },
        cash_collected: {
            type: "number",
            allowNull: true,
            columnType: "float",
        },
        non_cash_collected: {
            type: "number",
            allowNull: true,
            columnType: "float",
        },
        non_cash_type: {
            type: "number",
            allowNull: true,
            columnType: "integer",
        },
        difference_reason: {
            type: "number",
            allowNull: true,
            columnType: "integer",
        },
        cash_receivable: {
            type: "number",
            allowNull: true,
            columnType: "float",
        },
        inventory_shortage_amount: {
            type: "number",
            allowNull: true,
            columnType: "float",
        },
        rtg_agent_id: {
            type: "number",
            allowNull: true,
            columnType: "integer",
        },
        rtg_status_id: {
          model: "RtgStatus"
        },
        is_red: {
          type: "boolean",
          allowNull: true,
          columnType: "boolean",
        },
        missing: {
          type: "number",
          allowNull: true,
          columnType: "integer",
        },
        damages: {
          type: "number",
          allowNull: true,
          columnType: "integer",
        },
        inventory_loss: {
          type: "number",
          allowNull: true,
          columnType: "float",
        },
        rtg_start_time: {
          type: "ref",
          columnType: "datetime",
        },
        rtg_end_time: {
          type: "ref",
          columnType: "datetime",
        },
    },
    beforeCreate: async (deliveryBatch, next) => {
        try {
            deliveryBatch.created_at =
                typeof deliveryBatch.created_at == "string"
                ? deliveryBatch.created_at.split(".")[0]
                : deliveryBatch.created_at;
            deliveryBatch.updated_at =
                typeof deliveryBatch.updated_at == "string"
                ? deliveryBatch.updated_at.split(".")[0]
                : deliveryBatch.updated_at;
            deliveryBatch.deleted_at =
                typeof deliveryBatch.deleted_at == "string"
                ? deliveryBatch.deleted_at.split(".")[0]
                : deliveryBatch.deleted_at;
        } catch (err) {
            sails.log.error("DELIVERY BATCH MODEL HOOK ERROR", err);
        } finally {
            next();
        }
    }
};
module.exports = {
    tableName: "batch_cash_collected",
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
        batch_id: {
            model: "DeliveryBatch",
        },
        amount: {
            type: "number",
            columnType: "integer",
            required: true,
        },
        
    },
};

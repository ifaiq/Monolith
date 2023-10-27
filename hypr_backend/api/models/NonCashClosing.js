module.exports = {
    tableName: "non_cash_collected",
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
            model: "DeliveryBatch"
        },
        order_id: {
            model: "Order"
        },
        amount: {
            type: "number",
            columnType: "integer",
            required: true,
        },
        payment_type: {
            type: "string",
            columnType: "string",
            required: true,
        },
        bank_name: {
            type: "string",
            columnType: "string",
            required: true,
        },
        transaction_id: {
            type: "number",
            columnType: "integer",
            required: true,
        },
        attachment: {
            type: "JSON",
            columnType: "json",
            required: false,
        },

    },
};
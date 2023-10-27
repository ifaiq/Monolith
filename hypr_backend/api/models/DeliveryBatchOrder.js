module.exports = {
    tableName: "delivery_batch_orders",
    created_at: true,
    updated_at: true,
    deleted_at: true,
    attributes: {
        id: {
            type: "number",
            columnType: "integer",
            autoIncrement: true,
        },
        order_id: {
            type: "number",
            columnType: "int",
            required: true
        },
        batch_id: {
            model: "DeliveryBatch"
        },
        delivery_priority: {
            type: "number",
            columnType: "int",
            allowNull: true
        }
    }
};
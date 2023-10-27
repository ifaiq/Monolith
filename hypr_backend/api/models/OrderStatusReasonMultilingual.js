module.exports = {
    tableName: "order_status_reason_multilingual",
    created_at: true,
    updated_at: true,
    deleted_at: true,
    attributes: {
        id: {
            type: "number",
            columnType: 'int',
            required: false,
            autoIncrement: true,
            columnName: "id"
        },
        language: {
            type: "string",
            required: true,
            columnType: "varchar(4)",
            columnName: "language"
        },
        value: {
            type: "string",
            required: true,
            columnType: "varchar(255)",
            columnName: "value"
        },
        orderStatusReasonId: {
            required: true,
            columnName: "order_status_reason_id",
            model: 'OrderStatusReasons'
        },
        attributeName: {
            required: true,
            type: "string",
            columnType: "VARCHAR(40)",
            columnName: "attribute_name"
        }
    },
};
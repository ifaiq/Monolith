module.exports = {
    tableName: "generic_products",
    created_at: true,
    updated_at: true,
    attributes: {
        id: {
            type: "number",
            columnType: "integer",
            autoIncrement: true,
        },
        product_ids: {
            type: "string",
            required: true
        },
        location_id: {
            type: "number",
            required: true
        }
    }
};

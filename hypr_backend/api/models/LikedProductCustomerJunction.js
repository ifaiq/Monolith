module.exports = {
    tableName: "liked_products_customer_junction",
    created_at: true,
    updated_at: true,
    attributes: {
        id: {
            type: "number",
            columnType: "integer",
            autoIncrement: true,
        },
        product_id: {
            model: "Product"
        },
        customer_id: {
            type: "number",
            allowNull: true
            // model: "Customer",
        }
    }
};

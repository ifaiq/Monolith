/* Replace with your SQL commands */

ALTER TABLE user_notifications
DROP FOREIGN KEY user_notification_customer_id_fk,
DROP KEY user_notification_customer_id_fk_idx;

ALTER TABLE invoices
DROP FOREIGN KEY invoices_customer_id_fk,
DROP KEY invoices_customer_id_fk;

ALTER TABLE customer_retailer_locations
DROP FOREIGN KEY customer_retailer_locations_customer_id_fk,
DROP KEY customer_retailer_locations_customer_id_fk;

ALTER TABLE coupon_customers
DROP FOREIGN KEY coupon_customers_customer_id_fk,
DROP KEY coupon_customers_customer_id_fk;

ALTER TABLE sessions
DROP FOREIGN KEY sessions_customer_id_fk,
DROP KEY sessions_customer_id_fk;

ALTER TABLE liked_products_customer_junction
DROP FOREIGN KEY lpc_junction_customer_id_fk,
DROP KEY lpc_junction_customer_id_fk;

ALTER TABLE orders
DROP FOREIGN KEY orders_customer_id_fk,
DROP KEY orders_customer_id_fk;

ALTER TABLE user_roles
DROP FOREIGN KEY user_roles_user_id_fk,
DROP KEY user_roles_user_id_fk;

ALTER TABLE user_notifications
DROP FOREIGN KEY user_notification_user_id_fk,
DROP KEY user_notification_user_id_fk;

ALTER TABLE auth_store
DROP FOREIGN KEY auth_store_user_id_fk,
DROP KEY auth_store_user_id_fk;

ALTER TABLE app_versions
DROP FOREIGN KEY app_versions_user_id_fk,
DROP KEY app_versions_user_id_fk;

ALTER TABLE sessions
DROP FOREIGN KEY sessions_user_id_fk,
DROP KEY sessions_user_id_fk;

ALTER TABLE product_audit_history
DROP FOREIGN KEY user_audit_id_fk,
DROP KEY user_audit_id_fk;

ALTER TABLE orders
DROP FOREIGN KEY orders_deleted_by_fk,
DROP KEY orders_deleted_by_fk;

ALTER TABLE orders
DROP FOREIGN KEY orders_sales_agent_id_fk,
DROP KEY orders_sales_agent_id_fk;

ALTER TABLE orders
DROP FOREIGN KEY orders_packer_id_fk,
DROP KEY orders_packer_id_fk;

ALTER TABLE orders
DROP FOREIGN KEY orders_delivery_boy_id_fk,
DROP KEY orders_delivery_boy_id_fk;
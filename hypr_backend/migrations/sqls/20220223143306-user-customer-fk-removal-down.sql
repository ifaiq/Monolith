/* Replace with your SQL commands */
ALTER TABLE user_notifications
ADD INDEX user_notification_customer_id_fk_idx (customer_id),
ADD CONSTRAINT user_notification_customer_id_fk
FOREIGN KEY (customer_id)
REFERENCES customers(id);

ALTER TABLE invoices
ADD CONSTRAINT invoices_customer_id_fk
FOREIGN KEY (customer_id)
REFERENCES customers(id);

ALTER TABLE customer_retailer_locations
ADD CONSTRAINT customer_retailer_locations_customer_id_fk
FOREIGN KEY (customer_id)
REFERENCES customers(id);

ALTER TABLE coupon_customers
ADD CONSTRAINT coupon_customers_customer_id_fk
FOREIGN KEY (customer_id)
REFERENCES customers(id);

ALTER TABLE sessions
ADD CONSTRAINT sessions_customer_id_fk
FOREIGN KEY (customer_id)
REFERENCES customers(id);

ALTER TABLE liked_products_customer_junction
ADD CONSTRAINT lpc_junction_customer_id_fk
FOREIGN KEY (customer_id)
REFERENCES customers(id);

ALTER TABLE orders
ADD CONSTRAINT orders_customer_id_fk
FOREIGN KEY (customer_id)
REFERENCES customers(id);

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fk
FOREIGN KEY (user_id)
REFERENCES users(id);

ALTER TABLE user_notifications
ADD CONSTRAINT user_notification_user_id_fk
FOREIGN KEY (user_id)
REFERENCES users(id);

ALTER TABLE auth_store
ADD CONSTRAINT auth_store_user_id_fk
FOREIGN KEY (user_id)
REFERENCES users(id);

ALTER TABLE app_versions
ADD CONSTRAINT app_versions_user_id_fk
FOREIGN KEY (updated_by)
REFERENCES users(id);

ALTER TABLE sessions
ADD CONSTRAINT sessions_user_id_fk
FOREIGN KEY (user_id)
REFERENCES users(id);

ALTER TABLE product_audit_history
ADD CONSTRAINT user_audit_id_fk
FOREIGN KEY (updated_by)
REFERENCES users(id);

ALTER TABLE orders
ADD CONSTRAINT orders_deleted_by_fk
FOREIGN KEY (deleted_by)
REFERENCES users(id);

ALTER TABLE orders
ADD CONSTRAINT orders_sales_agent_id_fk
FOREIGN KEY (sales_agent_id)
REFERENCES users(id);

ALTER TABLE orders
ADD CONSTRAINT orders_packer_id_fk
FOREIGN KEY (packer_id)
REFERENCES users(id);

ALTER TABLE orders
ADD CONSTRAINT orders_delivery_boy_id_fk
FOREIGN KEY (delivery_boy_id)
REFERENCES users(id);

/* Replace with your SQL commands */

ALTER TABLE coupon_usage_history
ADD CONSTRAINT coupon_usage_history_customer_id_fk
FOREIGN KEY (customer_id)
REFERENCES customers(id);

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_customer_id_fk
FOREIGN KEY (customer_id)
REFERENCES customers(id);

ALTER TABLE customer_feature_junction
ADD INDEX customer_id_FK_idx (customer_id),
ADD CONSTRAINT customer_id_FK
FOREIGN KEY (customer_id)
REFERENCES customers(id);


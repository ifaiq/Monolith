/* Replace with your SQL commands */

ALTER TABLE coupon_usage_history
DROP FOREIGN KEY coupon_usage_history_customer_id_fk,
DROP KEY coupon_usage_history_customer_id_fk;

ALTER TABLE user_roles
DROP FOREIGN KEY user_roles_customer_id_fk,
DROP KEY user_roles_customer_id_fk;

ALTER TABLE customer_feature_junction
DROP FOREIGN KEY customer_id_FK,
DROP KEY customer_id_FK_idx;
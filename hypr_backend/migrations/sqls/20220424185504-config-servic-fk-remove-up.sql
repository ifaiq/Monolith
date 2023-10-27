/* Replace with your SQL commands */

ALTER TABLE account_events
DROP FOREIGN KEY account_events_company_id_fk,
DROP KEY account_events_company_id_fk;

ALTER TABLE account_settings
DROP FOREIGN KEY account_settings_company_id_fk,
DROP KEY account_settings_company_id_fk;

ALTER TABLE account_settings
DROP FOREIGN KEY account_settings_business_unit_id_fk,
DROP KEY account_settings_business_unit_id_fk;

ALTER TABLE account_settings
DROP FOREIGN KEY account_settings_location_id_fk,
DROP KEY account_settings_location_id_fk;

ALTER TABLE app_roles
DROP FOREIGN KEY app_roles_app_id_fk_idx,
DROP KEY app_roles_app_id_fk_idx;

ALTER TABLE auth_store
DROP FOREIGN KEY auth_store_company_id_fk,
DROP KEY auth_store_company_id_fk;

ALTER TABLE auth_store
DROP FOREIGN KEY auth_store_bu_id_fk,
DROP KEY auth_store_bu_id_fk;

ALTER TABLE auth_store
DROP FOREIGN KEY auth_store_location_id_fk,
DROP KEY auth_store_location_id_fk;

ALTER TABLE catalogue
DROP FOREIGN KEY catalogue_company_id_fk,
DROP KEY catalogue_company_id_fk;

ALTER TABLE categories
DROP FOREIGN KEY location_category_id_fk,
DROP KEY location_category_id_fk;

ALTER TABLE customer_retailer_locations
DROP FOREIGN KEY customer_retailer_locations_location_id_fk,
DROP KEY customer_retailer_locations_location_id_fk;

ALTER TABLE generic_products
DROP FOREIGN KEY generic_products_location_id_fk,
DROP KEY generic_products_location_id_fk;

ALTER TABLE hierarchy_features
DROP FOREIGN KEY hierarchy_features_business_unit_id_fk,
DROP KEY hierarchy_features_business_unit_id_fk;

ALTER TABLE hierarchy_features
DROP FOREIGN KEY hierarchy_features_location_id_fk,
DROP KEY hierarchy_features_location_id_fk;

ALTER TABLE invoices
DROP FOREIGN KEY invoices_business_unit_id_fk,
DROP KEY invoices_business_unit_id_fk;

ALTER TABLE orders
DROP FOREIGN KEY orders_location_id_fk,
DROP KEY orders_location_id_fk;

ALTER TABLE products
DROP FOREIGN KEY products_location_id_fk,
DROP KEY products_location_id_fk;

ALTER TABLE roles_taxonomy
DROP FOREIGN KEY roles_taxonomy_company_id_fk,
DROP KEY roles_taxonomy_company_id_fk;

ALTER TABLE store_events_timing
DROP FOREIGN KEY store_events_timing_location_id_fk,
DROP KEY store_events_timing_location_id_fk;

ALTER TABLE store_operating_days
DROP FOREIGN KEY store_operating_days_location_id_fk,
DROP KEY store_operating_days_location_id_fk;
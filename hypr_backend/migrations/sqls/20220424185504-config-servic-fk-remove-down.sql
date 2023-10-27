/* Replace with your SQL commands */

ALTER TABLE account_events
ADD INDEX account_events_company_id_fk (company_id),
ADD CONSTRAINT account_events_company_id_fk
FOREIGN KEY (company_id)
REFERENCES companies(id);

ALTER TABLE account_settings
ADD INDEX account_settings_company_id_fk (company_id),
ADD CONSTRAINT account_settings_company_id_fk
FOREIGN KEY (company_id)
REFERENCES companies(id);

ALTER TABLE account_settings
ADD INDEX account_settings_business_unit_id_fk (business_unit_id),
ADD CONSTRAINT account_settings_business_unit_id_fk
FOREIGN KEY (business_unit_id)
REFERENCES business_units(id);

ALTER TABLE account_settings
ADD INDEX account_settings_location_id_fk (location_id),
ADD CONSTRAINT account_settings_location_id_fk
FOREIGN KEY (location_id)
REFERENCES locations(id);

ALTER TABLE app_roles
ADD INDEX app_roles_app_id_fk_idx (app_id),
ADD CONSTRAINT app_roles_app_id_fk_idx
FOREIGN KEY (app_id)
REFERENCES app_versions(id);

ALTER TABLE auth_store
ADD INDEX auth_store_company_id_fk (company_id),
ADD CONSTRAINT auth_store_company_id_fk
FOREIGN KEY (company_id)
REFERENCES companies(id);

ALTER TABLE auth_store
ADD INDEX auth_store_bu_id_fk (business_unit_id),
ADD CONSTRAINT auth_store_bu_id_fk
FOREIGN KEY (business_unit_id)
REFERENCES business_units(id);

ALTER TABLE auth_store
ADD INDEX auth_store_location_id_fk (location_id),
ADD CONSTRAINT auth_store_location_id_fk
FOREIGN KEY (location_id)
REFERENCES locations(id);

ALTER TABLE catalogue
ADD INDEX catalogue_company_id_fk (company_id),
ADD CONSTRAINT catalogue_company_id_fk
FOREIGN KEY (company_id)
REFERENCES companies(id);

ALTER TABLE categories
ADD INDEX location_category_id_fk (location_id),
ADD CONSTRAINT location_category_id_fk
FOREIGN KEY (location_id)
REFERENCES locations(id);

ALTER TABLE customer_retailer_locations
ADD INDEX customer_retailer_locations_location_id_fk (location_id),
ADD CONSTRAINT customer_retailer_locations_location_id_fk
FOREIGN KEY (location_id)
REFERENCES locations(id);

ALTER TABLE generic_products
ADD INDEX generic_products_location_id_fk (location_id),
ADD CONSTRAINT generic_products_location_id_fk
FOREIGN KEY (location_id)
REFERENCES locations(id);

ALTER TABLE hierarchy_features
ADD INDEX hierarchy_features_business_unit_id_fk (business_unit_id),
ADD CONSTRAINT hierarchy_features_business_unit_id_fk
FOREIGN KEY (business_unit_id)
REFERENCES business_units(id);

ALTER TABLE hierarchy_features
ADD INDEX hierarchy_features_location_id_fk (location_id),
ADD CONSTRAINT hierarchy_features_location_id_fk
FOREIGN KEY (location_id)
REFERENCES locations(id);

ALTER TABLE invoices
ADD INDEX invoices_business_unit_id_fk (business_unit_id),
ADD CONSTRAINT invoices_business_unit_id_fk
FOREIGN KEY (business_unit_id)
REFERENCES business_units(id);

ALTER TABLE orders
ADD INDEX orders_location_id_fk (location_id),
ADD CONSTRAINT orders_location_id_fk
FOREIGN KEY (location_id)
REFERENCES locations(id);

ALTER TABLE products
ADD INDEX products_location_id_fk (location_id),
ADD CONSTRAINT products_location_id_fk
FOREIGN KEY (location_id)
REFERENCES locations(id);

ALTER TABLE roles_taxonomy
ADD INDEX roles_taxonomy_company_id_fk (company_id),
ADD CONSTRAINT roles_taxonomy_company_id_fk
FOREIGN KEY (company_id)
REFERENCES companies(id);

ALTER TABLE store_events_timing
ADD INDEX store_events_timing_location_id_fk (location_id),
ADD CONSTRAINT store_events_timing_location_id_fk
FOREIGN KEY (location_id)
REFERENCES locations(id);

ALTER TABLE store_operating_days
ADD INDEX store_operating_days_location_id_fk (location_id),
ADD CONSTRAINT store_operating_days_location_id_fk
FOREIGN KEY (location_id)
REFERENCES locations(id);

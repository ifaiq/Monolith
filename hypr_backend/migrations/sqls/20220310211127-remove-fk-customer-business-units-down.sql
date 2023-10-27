/* Replace with your SQL commands */

ALTER TABLE customers
ADD INDEX customers_bu_id_fk (company_id),
ADD CONSTRAINT customers_bu_id_fk
FOREIGN KEY (business_unit_id)
REFERENCES busniess_units(id);


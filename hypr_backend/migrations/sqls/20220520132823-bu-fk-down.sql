/* Replace with your SQL commands */

ALTER TABLE credit_note_invoices
ADD INDEX cn_invoices_bu_id_fk (business_unit_id),
ADD CONSTRAINT cn_invoices_bu_id_fk
FOREIGN KEY (business_unit_id)
REFERENCES business_units(id);
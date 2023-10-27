/* Replace with your SQL commands */

ALTER TABLE credit_note_invoices
ADD INDEX cn_invoices_cid_fk (customer_id),
ADD CONSTRAINT cn_invoices_cid_fk
FOREIGN KEY (customer_id)
REFERENCES customers(id);

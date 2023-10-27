/* Replace with your SQL commands */

ALTER TABLE credit_note_invoices
DROP FOREIGN KEY cn_invoices_cid_fk,
DROP KEY cn_invoices_cid_fk;
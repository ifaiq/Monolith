/* Replace with your SQL commands */

ALTER TABLE credit_note_invoices
DROP FOREIGN KEY cn_invoices_bu_id_fk,
DROP KEY cn_invoices_bu_id_fk;
/* Replace with your SQL commands */

ALTER TABLE customers
ADD INDEX customer_company_id_fk (company_id),
ADD CONSTRAINT customer_company_id_fk
FOREIGN KEY (company_id)
REFERENCES companies(id);

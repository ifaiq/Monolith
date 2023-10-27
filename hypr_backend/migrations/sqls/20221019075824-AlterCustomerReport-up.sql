/* Replace with your SQL commands */

ALTER TABLE customer_sku_report CHANGE COLUMN file_url file_name varchar(255);
ALTER TABLE customer_sku_report ADD file_url varchar(255) DEFAULT null AFTER file_name;
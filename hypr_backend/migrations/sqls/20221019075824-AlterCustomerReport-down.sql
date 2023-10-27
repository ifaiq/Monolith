/* Replace with your SQL commands */
ALTER TABLE customer_sku_report DROP COLUMN file_url;
ALTER TABLE customer_sku_report CHANGE COLUMN file_name file_url varchar(255);


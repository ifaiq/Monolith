/* Replace with your SQL commands */
ALTER TABLE `customer_retailer_shop_details`
ADD COLUMN `shop_open_time` VARCHAR(45) NULL DEFAULT NULL,
ADD COLUMN `shop_close_time` VARCHAR(45) NULL DEFAULT NULL ,
ADD COLUMN `shop_preferred_delivery_time` VARCHAR(225) NULL DEFAULT NULL,
ADD COLUMN `shop_closed_days` VARCHAR(225) NULL DEFAULT NULL,


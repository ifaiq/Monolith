/* Replace with your SQL commands */
ALTER TABLE `account_settings`
ADD COLUMN `orders_disabled` INT(11) NULL DEFAULT '0' AFTER `location_id`;
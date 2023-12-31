/* Replace with your SQL commands */
ALTER TABLE `locations`
ADD COLUMN `owner_name` VARCHAR(255) NULL DEFAULT NULL,
ADD COLUMN `owner_cnic` VARCHAR(255) NULL DEFAULT NULL ,
ADD COLUMN `pos_required` TINYINT(1) NULL DEFAULT 0,
ADD COLUMN `owner_cnic_picture` VARCHAR(255) NULL DEFAULT NULL,
ADD COLUMN `subscription_fee` INT(11) NULL DEFAULT 0,
ADD COLUMN `account_type` VARCHAR(255) NULL DEFAULT NULL,
ADD COLUMN `account_number` VARCHAR(255) NULL DEFAULT NULL,
ADD COLUMN `chillers_count` INT(11) NULL DEFAULT 0,
ADD COLUMN `customers_count` INT(11) NULL DEFAULT 0,
ADD COLUMN `checkout_counters_count` INT(11) NULL DEFAULT 0,
ADD COLUMN `sims_count` INT(11) NULL DEFAULT 0,
ADD COLUMN `shop_size` VARCHAR(1000) NULL DEFAULT NULL,
ADD COLUMN `shop_pictures` VARCHAR(1000) NULL DEFAULT NULL,
ADD COLUMN `shop_facia_size` VARCHAR(1000) NULL DEFAULT NULL,
ADD COLUMN `shop_facia_pictures` VARCHAR(1000) NULL DEFAULT NULL,
ADD COLUMN `advertising_spaces` VARCHAR(1000) NULL DEFAULT NULL


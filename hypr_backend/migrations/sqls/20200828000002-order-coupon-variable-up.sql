ALTER TABLE `orders` 
ADD COLUMN `coupon_id` INT(11) NULL DEFAULT NULL AFTER `delivery_charge_value`,
ADD COLUMN `coupon_discount` DECIMAL(10, 2) DEFAULT 0 AFTER `coupon_id`;
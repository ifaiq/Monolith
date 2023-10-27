ALTER TABLE `orders` ADD COLUMN `service_charge_type` varchar(255) DEFAULT NULL AFTER `delivered_time`,
ADD COLUMN `service_charge_value` DECIMAL(10, 2) DEFAULT 0 AFTER `service_charge_type`,
ADD COLUMN `delivery_charge_type` varchar(255) DEFAULT NULL AFTER `service_charge_value`,
ADD COLUMN `delivery_charge_value` DECIMAL(10, 2) DEFAULT 0 AFTER `delivery_charge_type`;
-- MySQL Workbench Synchronization

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';


ALTER TABLE `app_versions` 
DROP FOREIGN KEY `app_versions_user_id_fk`;

ALTER TABLE `auth_store` 
DROP FOREIGN KEY `auth_store_user_id_fk`;

ALTER TABLE `coupon_customers` 
DROP FOREIGN KEY `coupon_customers_customer_id_fk`;


ALTER TABLE `customer_feature_junction` 
DROP FOREIGN KEY `customer_id_FK`;

ALTER TABLE `customer_retailer_locations` 
DROP FOREIGN KEY `customer_retailer_locations_customer_id_fk`;

ALTER TABLE `liked_products_customer_junction` 
DROP FOREIGN KEY `lpc_junction_customer_id_fk`;

ALTER TABLE `orders` 
DROP FOREIGN KEY `orders_sales_agent_id_fk`,
DROP FOREIGN KEY `orders_packer_id_fk`,
DROP FOREIGN KEY `orders_delivery_boy_id_fk`,
DROP FOREIGN KEY `orders_deleted_by_fk`,
DROP FOREIGN KEY `orders_customer_id_fk`,
DROP FOREIGN KEY `order_rejection_reason_id_fk`;

ALTER TABLE `sessions` 
DROP FOREIGN KEY `sessions_user_id_fk`,
DROP FOREIGN KEY `sessions_customer_id_fk`;

ALTER TABLE `user_notifications` 
DROP FOREIGN KEY `user_notification_user_id_fk`,
DROP FOREIGN KEY `user_notification_customer_id_fk`;

ALTER TABLE `user_roles` 
DROP FOREIGN KEY `user_roles_user_id_fk`,
DROP FOREIGN KEY `user_roles_customer_id_fk`;

ALTER TABLE `coupon_usage_history`
DROP FOREIGN KEY `coupon_usage_history_customer_id_fk`;


CREATE TABLE IF NOT EXISTS `account_emails` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `company_id` INT(11) NULL DEFAULT NULL,
  `emails` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` DATETIME NULL DEFAULT NULL,
  `updated_at` DATETIME NULL DEFAULT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `company_account_email_id_fk` (`company_id` ASC),
  CONSTRAINT `company_account_email_id_fk`
    FOREIGN KEY (`company_id`)
    REFERENCES `companies` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

ALTER TABLE `account_settings` 
CHANGE COLUMN `product_led` `product_led` TINYINT(1) NULL DEFAULT '0' ,
CHANGE COLUMN `messaging_service` `messaging_service` VARCHAR(500) NULL DEFAULT 'HYPR' ;

ALTER TABLE `app_versions` 
DROP INDEX `app_versions_user_id_fk` ;


ALTER TABLE `auth_store` 
DROP INDEX `auth_store_user_id_fk` ;


ALTER TABLE `companies` 
CHANGE COLUMN `type` `type` VARCHAR(255) NULL DEFAULT 'B2C' AFTER `service_charge_value`,
CHANGE COLUMN `emails` `emails` VARCHAR(255) NULL DEFAULT NULL AFTER `type`;

ALTER TABLE `coupon_customers` 
DROP INDEX `coupon_customers_customer_id_fk` ;



ALTER TABLE `coupons` 
CHANGE COLUMN `discount_value` `discount_value` DECIMAL(10,2) NULL DEFAULT NULL ;

ALTER TABLE `customer_feature_junction` 
DROP INDEX `customer_id_FK_idx` ;


ALTER TABLE `customer_retailer_locations` 
ADD COLUMN `created_at` DATETIME NULL DEFAULT NULL AFTER `location_id`,
ADD COLUMN `updated_at` DATETIME NULL DEFAULT NULL AFTER `created_at`,
ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL AFTER `updated_at`,
DROP INDEX `customer_retailer_locations_customer_id_fk` ;


ALTER TABLE `customers` 
ADD COLUMN `player_id` VARCHAR(255) NULL DEFAULT NULL AFTER `customer_location`,
ADD COLUMN `stripe_key` VARCHAR(255) NULL DEFAULT NULL AFTER `supervisor_id`;


ALTER TABLE `liked_products_customer_junction` 
DROP INDEX `lpc_junction_customer_id_fk` ;


ALTER TABLE `locations` 
CHANGE COLUMN `catalogue_id` `catalogue_id` INT(11) NULL DEFAULT NULL AFTER `service_charge_value`,
CHANGE COLUMN `polygon_coords` `polygon_coords` longtext NULL DEFAULT NULL ;

ALTER TABLE `notification_messages` 
CHANGE COLUMN `text` `text` LONGTEXT CHARACTER SET 'utf8' NULL DEFAULT NULL ;

ALTER TABLE `order_items` 
ADD COLUMN `name` VARCHAR(255) NULL DEFAULT NULL AFTER `mrp`,
ADD COLUMN `tax_percentage` DECIMAL(10,2) NULL DEFAULT NULL AFTER `name`,
CHANGE COLUMN `volume_based_price` `volume_based_price` DECIMAL(10,0) NULL DEFAULT '0' ;

ALTER TABLE `orders` 
ADD COLUMN `shipment_id` VARCHAR(255) NULL DEFAULT NULL AFTER `is_invoice_downloaded`,
ADD COLUMN `app_version` VARCHAR(255) NULL DEFAULT NULL AFTER `device_id`,
CHANGE COLUMN `deleted_at` `deleted_at` DATETIME NULL DEFAULT NULL AFTER `disabled`,
CHANGE COLUMN `retailo_order_id` `retailo_order_id` VARCHAR(255) NULL DEFAULT NULL AFTER `is_updated`,
CHANGE COLUMN `delivered_time` `delivered_time` DATETIME NULL DEFAULT NULL ,
ADD INDEX `order_status_reason_id_fk` (`status_reason_id` ASC),
DROP INDEX `order_rejection_reason_id_fk` ,
-- DROP INDEX `orders_customer_id_fk` ,
DROP INDEX `orders_sales_agent_id_fk` ,
DROP INDEX `orders_delivery_boy_id_fk` ,
DROP INDEX `orders_packer_id_fk` ,
DROP INDEX `orders_deleted_by_fk` ;


ALTER TABLE `products` 
CHANGE COLUMN `priority` `priority` INT(11) NULL DEFAULT NULL AFTER `tax_inclusive`,
CHANGE COLUMN `description` `description` VARCHAR(10000) NULL DEFAULT NULL ;

ALTER TABLE `recommended_products_sql` 
CHANGE COLUMN `product_ids` `product_ids` VARCHAR(10000) NULL DEFAULT NULL ;

ALTER TABLE `role_permissions` 
ADD INDEX `role_permissions_permission_id_fk` (`permission_id` ASC);


ALTER TABLE `sessions` 
CHANGE COLUMN `token` `token` VARCHAR(10000) NULL DEFAULT NULL ,
DROP INDEX `sessions_user_id_fk` ,
DROP INDEX `sessions_customer_id_fk` ;


ALTER TABLE `user_notifications` 
DROP INDEX `user_notification_user_id_fk` ,
DROP INDEX `user_notification_customer_id_fk` ;


ALTER TABLE `user_roles` 
DROP INDEX `user_roles_user_id_fk` ,
DROP INDEX `user_roles_customer_id_fk` ;

ALTER TABLE `coupon_usage_history`
DROP INDEX  `coupon_usage_history_customer_id_fk`;


ALTER TABLE `volume_based_product_price` 
CHANGE COLUMN `price` `price` DECIMAL(10,0) NOT NULL ,
CHANGE COLUMN `quantity_to` `quantity_to` INT(11) NOT NULL ;

ALTER TABLE `orders` 
ADD CONSTRAINT `order_status_reason_id_fk`
  FOREIGN KEY (`status_reason_id`)
  REFERENCES `order_status_reason` (`id`)
  ON DELETE CASCADE;

ALTER TABLE `role_permissions` 
ADD CONSTRAINT `role_permissions_permission_id_fk`
  FOREIGN KEY (`permission_id`)
  REFERENCES `permissions` (`id`)
  ON DELETE CASCADE;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

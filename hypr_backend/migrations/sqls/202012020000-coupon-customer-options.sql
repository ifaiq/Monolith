CREATE TABLE `coupon_customer_options` (`id` INT NOT NULL AUTO_INCREMENT,`name` VARCHAR(45) NOT NULL,`value` VARCHAR(45) NOT NULL, `created_at` DATETIME NULL,`updated_at` DATETIME NULL,`deleted_at` DATETIME NULL,PRIMARY KEY (`id`));
INSERT INTO `coupon_customer_options` (`id`, `name`,`value`,`created_at`, `updated_at`) VALUES ('1', 'Everyone','everyone',now(), now());
INSERT INTO `coupon_customer_options` (`id`, `name`,`value`,`created_at`, `updated_at`) VALUES ('2', 'Selected Customers','selected', now(), now());

ALTER TABLE `coupons` ADD COLUMN `coupon_customer_option_id` INT(11) NOT NULL DEFAULT 2 AFTER `company_id`;

ALTER TABLE `coupons` 
ADD INDEX `coupon_customer_option_id_fk_idx` (`coupon_customer_option_id` ASC);
ALTER TABLE `coupons` 
ADD CONSTRAINT `coupon_customer_option_id_fk` FOREIGN KEY (`coupon_customer_option_id`) REFERENCES `coupon_customer_options` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
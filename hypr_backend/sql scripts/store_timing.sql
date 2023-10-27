CREATE TABLE `week_days` (
  `id` INT NOT NULL,
  `name` VARCHAR(45) NOT NULL,
PRIMARY KEY (`id`));
INSERT INTO `week_days` (`id`, `name`) VALUES ('1', 'Sunday');
INSERT INTO `week_days` (`id`, `name`) VALUES ('2', 'Monday');
INSERT INTO `week_days` (`id`, `name`) VALUES ('3', 'Tuesday');
INSERT INTO `week_days` (`id`, `name`) VALUES ('4', 'Wednesday');
INSERT INTO `week_days` (`id`, `name`) VALUES ('5', 'Thrusday');
INSERT INTO `week_days` (`id`, `name`) VALUES ('6', 'Friday');
INSERT INTO `week_days` (`id`, `name`) VALUES ('7', 'Saturday');
CREATE TABLE `store_operating_days` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `day_id` INT(11) NOT NULL,
  `start_time` VARCHAR(45) NULL,
  `end_time` VARCHAR(45) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_store_operating_days_1_idx` (`day` ASC),
  CONSTRAINT `fk_store_operating_days_1`
    FOREIGN KEY (`day_id`)
    REFERENCES `week_days` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);
ALTER TABLE `store_operating_days` 
ADD COLUMN `location_id` INT(11) NOT NULL AFTER `day_end_time`;
ALTER TABLE `locations` 
ADD COLUMN `is_day_wise_time` TINYINT(1) NULL DEFAULT 0 AFTER `location_id`,
ADD COLUMN `delivery_time` TIME NULL DEFAULT NULL AFTER `is_day_wise_time`;
ALTER TABLE `store_operating_days` 
ADD COLUMN `created_at` DATETIME NULL DEFAULT NULL AFTER `location_id`,
ADD COLUMN `updated_at` DATETIME NULL DEFAULT NULL AFTER `created_at`,
ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL AFTER `updated_at`;
ALTER TABLE `store_operating_days` 
ADD COLUMN  `disabled` TINYINT(1) NOT NULL AFTER `is_day_wise_time`;

CREATE TABLE `store_events_timing` (
  `id` INT(11) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `start_time` TIME NULL,
  `end_time` TIME NULL,
  `location_id` INT(11) NOT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`));
ALTER TABLE `store_events_timing` 
ADD COLUMN `disabled` TINYINT(1) NULL DEFAULT 0 AFTER `deleted_at`;
ALTER TABLE `store_events_timing` 
CHANGE COLUMN `id` `id` INT(11) NOT NULL AUTO_INCREMENT ;







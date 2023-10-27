/* Replace with your SQL commands */

ALTER TABLE `order_rejection_reason`
  RENAME TO `order_status_reason`;

ALTER TABLE `order_status_reason` 
ADD COLUMN tag VARCHAR(255) NULL;

ALTER TABLE `orders` CHANGE `rejection_reason_id` `status_reason_id` INT(11);
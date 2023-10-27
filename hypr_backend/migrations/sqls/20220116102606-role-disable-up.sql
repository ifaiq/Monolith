/* Replace with your SQL commands */

ALTER TABLE `roles`
ADD COLUMN `disabled` INT(11) NULL DEFAULT '0' AFTER `name`;


UPDATE `roles` SET `disabled` = 1 WHERE (`id` not in ('1', '6', '8', '9', '16'));

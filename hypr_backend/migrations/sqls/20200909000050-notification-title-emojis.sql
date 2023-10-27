ALTER TABLE `notification_messages` 
CHARACTER SET = utf8mb4 , COLLATE = utf8mb4_unicode_ci ;
ALTER TABLE `notification_messages` 
CHANGE COLUMN `title` `title` VARCHAR(255) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL ;
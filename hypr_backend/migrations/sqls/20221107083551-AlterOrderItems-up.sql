/* Replace with your SQL commands */

ALTER TABLE `order_items`
ADD COLUMN `pricing_rule_history_id` INT(11) DEFAULT NULL,
ALGORITHM=INPLACE, LOCK=NONE;
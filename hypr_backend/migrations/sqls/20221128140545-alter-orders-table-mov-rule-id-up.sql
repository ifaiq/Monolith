/* Replace with your SQL commands */
ALTER TABLE `orders`
ADD COLUMN `mov_rule_id` INT(11) DEFAULT NULL,
ALGORITHM=INPLACE, LOCK=NONE;
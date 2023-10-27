/* Replace with your SQL commands */
ALTER TABLE `orders`
DROP COLUMN `mov_rule_id`,
ALGORITHM=INPLACE, LOCK=NONE;
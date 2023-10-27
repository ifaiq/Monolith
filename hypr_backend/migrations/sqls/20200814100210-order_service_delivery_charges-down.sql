/* Replace with your SQL commands */
ALTER TABLE
    `orders` DROP COLUMN `service_charge_type`,
    DROP COLUMN `service_charge_value`,
    DROP COLUMN `delivery_charge_type`,
    DROP COLUMN `delivery_charge_value`;
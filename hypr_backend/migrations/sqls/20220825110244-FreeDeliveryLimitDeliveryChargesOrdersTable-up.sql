/* Replace with your SQL commands */
ALTER TABLE
  orders
ADD
  COLUMN location_delivery_charges DECIMAL(10, 2) DEFAULT 0.00,
ADD
  COLUMN location_free_delivery_limit DECIMAL(10, 2) DEFAULT 0.00;

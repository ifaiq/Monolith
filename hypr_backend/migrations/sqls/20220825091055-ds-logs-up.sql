ALTER TABLE delivery_slots_audit_history DROP FOREIGN KEY `delivery_slots_audit_history_delivery_slots_id_fk`;

ALTER TABLE delivery_slots_audit_history DROP `delivery_slots_id`;
ALTER TABLE delivery_slots_audit_history DROP `old_JSON`;
ALTER TABLE delivery_slots_audit_history DROP `new_JSON`;
ALTER TABLE delivery_slots_audit_history DROP `updated_by`;
ALTER TABLE delivery_slots_audit_history DROP `created_at`;
ALTER TABLE delivery_slots_audit_history DROP `updated_at`;
ALTER TABLE delivery_slots_audit_history DROP `deleted_at`;

ALTER TABLE delivery_slots_audit_history ADD `delivery_slot_id` INT NOT NULL;
ALTER TABLE delivery_slots_audit_history ADD `action` VARCHAR(10);
ALTER TABLE delivery_slots_audit_history ADD `performed_by` INT NOT NULL;
ALTER TABLE delivery_slots_audit_history ADD `location_id` INT NOT NULL;
ALTER TABLE delivery_slots_audit_history ADD `date` DATE NOT NULL;
ALTER TABLE delivery_slots_audit_history ADD `cut_off` DATETIME NOT NULL;
ALTER TABLE delivery_slots_audit_history ADD `touchpoint_capacity` INT NOT NULL;
ALTER TABLE delivery_slots_audit_history ADD `disabled` BOOLEAN NOT NULL;
ALTER TABLE delivery_slots_audit_history ADD `created_at` DATETIME NULL;
ALTER TABLE delivery_slots_audit_history ADD `updated_at` DATETIME NULL;
ALTER TABLE delivery_slots_audit_history ADD `deleted_at` DATETIME NULL;
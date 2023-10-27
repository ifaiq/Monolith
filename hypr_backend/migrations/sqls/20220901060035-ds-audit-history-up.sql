ALTER TABLE delivery_slots_audit_history DROP `touchpoint_capacity`;
ALTER TABLE delivery_slots_audit_history DROP `disabled`;
ALTER TABLE delivery_slots_audit_history DROP `created_at`;
ALTER TABLE delivery_slots_audit_history DROP `updated_at`;
ALTER TABLE delivery_slots_audit_history DROP `deleted_at`;

ALTER TABLE delivery_slots_audit_history ADD `touchpoint_capacity` BOOLEAN;
ALTER TABLE delivery_slots_audit_history ADD `disabled` BOOLEAN;
ALTER TABLE delivery_slots_audit_history ADD `manually_overridden` BOOLEAN;
ALTER TABLE delivery_slots_audit_history ADD `created_at` DATETIME NULL;
ALTER TABLE delivery_slots_audit_history ADD `updated_at` DATETIME NULL;
ALTER TABLE delivery_slots_audit_history ADD `deleted_at` DATETIME NULL;
/* Replace with your SQL commands */

UPDATE order_status_reason 
SET deleted_at = now()
WHERE 
reason = 'Wrong location'
AND tag = 'OH';

INSERT INTO
    order_status_reason (reason, description, created_at, updated_at, tag)
VALUES
    ('Wrong location', 'Wrong location', now(), now(), 'CA');
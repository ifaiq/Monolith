/* Replace with your SQL commands */

UPDATE order_status_reason 
SET deleted_at = now()
WHERE 
reason = 'Service fee issue'
AND tag = 'CA';

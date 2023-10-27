/* Replace with your SQL commands */

UPDATE order_status_reason 
SET deleted_at = NULL
WHERE 
reason = 'Wrong location'
AND tag = 'OH';
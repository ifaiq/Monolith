
DELETE FROM delivery_batch_statuses where id = (select id from delivery_batch_statuses where name = 'CANCELED');

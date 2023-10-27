CREATE DEFINER=`root`@`%` PROCEDURE `GetOrders`(IN pOrderID VARCHAR(255))
BEGIN
	
    IF (pOrderID REGEXP '^[0-9]+$') = 0
	THEN
		
        DROP TABLE IF EXISTS TempOnlyProduct;
        
        CREATE TEMPORARY TABLE IF NOT EXISTS TempOnlyProduct
        SELECT
			p.id
		FROM
			`products` p
		WHERE
			p.sku = pOrderID
			OR p.name = pOrderID;
            
		SELECT
			O.order_id AS id
        FROM
			TempOnlyProduct OP
            INNER JOIN `order_items` OI ON OP.id = OI.product_id;
    
    ELSE 
    
		DROP TABLE IF EXISTS TempOrders;
		CREATE TEMPORARY TABLE IF NOT EXISTS TempOrders
		AS
		SELECT
			o.id
		FROM
			`orders` AS o
		WHERE
			o.id = pOrderID;
	
		DROP TABLE IF EXISTS TempOrderItems;        
		CREATE TEMPORARY TABLE IF NOT EXISTS TempOrderItems
		AS
		SELECT
			oi.order_id,
			oi.product_id
		FROM
			`order_items` oi
		WHERE
			oi.product_id = pOrderID;
			
		SELECT
			o.id
		FROM
			TempOrders AS o
		UNION
        SELECT
			oi.order_id
        FROM
			TempOrderItems AS oi;
            
        END IF;

END
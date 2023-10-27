DROP PROCEDURE IF EXISTS stp_get_delivery_slots_portal;

CREATE PROCEDURE `stp_get_delivery_slots_portal`(
	IN pLocationID INT,
    IN pCurrentDate DATE,
    IN pIncrementedDate DATE
)
BEGIN
	
    SET @vCurrentDate = pCurrentDate;
	SET @vIncrementedDate = pIncrementedDate;
    
	/*--------------------------------------------------------*/

    CREATE TEMPORARY TABLE IF NOT EXISTS TempDeliverySlots
    AS
	SELECT
		ds.id,
        ds.location_id AS locationId,
        ds.date,
        ds.cut_off AS cutOff,
        ds.touchpoint_capacity AS touchpointCapacity,
        ds.disabled,
        ds.manually_overridden AS manuallyOverridden
	FROM 
		delivery_slots as ds
	WHERE
		location_id = pLocationID
		AND date BETWEEN @vCurrentDate AND @vIncrementedDate;

    /*--------------------------------------------------------*/
    
    CREATE TEMPORARY TABLE TempTouchPointDetails
    AS
    SELECT
		DS.date,
        COUNT(DISTINCT customer_id) AS touchpointBooked,
		IFNULL(SUM(oi.quantity * p.weight),0) AS kgBooked
    FROM
		TempDeliverySlots DS
        LEFT JOIN orders O ON DS.date = CAST(delivery_time AS DATE) AND O.status_id IN (1,2,3,4,5,12) AND O.location_id = pLocationID 	
		LEFT JOIN order_items oi ON oi.order_id=O.id
        LEFT JOIN products p ON oi.product_id = p.id
	GROUP BY
		DS.date;
	
	/*--------------------------------------------------------*/
    
    SELECT
		DS.id,
        DS.locationId,
        DS.date,
        DS.cutOff,
        DS.touchpointCapacity,
        DS.disabled,
        DS.manuallyOverridden,
        PD.touchpointBooked,
        PD.kgBooked
    FROM
		TempDeliverySlots DS
        INNER JOIN TempTouchPointDetails PD ON DS.date = PD.date;
    
    
    DROP TABLE IF EXISTS TempDeliverySlots;
    DROP TABLE IF EXISTS TempTouchPointDetails;

END
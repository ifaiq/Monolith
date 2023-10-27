DROP PROCEDURE IF EXISTS stp_get_delivery_slots;

CREATE PROCEDURE `stp_get_delivery_slots`(
	IN pLocationID INT,
    IN pCurrentDate DATE,
    IN pIncrementedDate DATE
)
BEGIN
	
    SET @vCurrentDate = pCurrentDate;
	SET @vIncrementedDate = pIncrementedDate;
	SET @vCurrentSystemDateTime = UTC_TIMESTAMP();
    
	/*--------------------------------------------------------*/

    DROP TABLE IF EXISTS TempDeliverySlots;
    
    CREATE TEMPORARY TABLE IF NOT EXISTS TempDeliverySlots
    AS
	SELECT
		date,
        cut_off,
        touchpoint_capacity
	FROM 
		delivery_slots as ds
	WHERE
		location_id = pLocationID
		AND disabled = false
		AND date BETWEEN @vCurrentDate AND @vIncrementedDate;

    /*--------------------------------------------------------*/
    
    DROP TABLE IF EXISTS TempOrderDetails;
    
    CREATE TEMPORARY TABLE IF NOT EXISTS TempOrderDetails
    AS
    SELECT
		DS.date,
        COUNT(DISTINCT customer_id) AS touchpoint_booked
    FROM
		TempDeliverySlots DS
        LEFT JOIN orders O ON DS.date = CAST(delivery_time AS DATE) AND O.status_id IN (1,2,3,4,5,12) AND O.location_id = pLocationID 	
	GROUP BY
		DS.date;
		        
	/*--------------------------------------------------------*/
    
    SELECT
		DS.date
    FROM
		TempDeliverySlots DS
        INNER JOIN TempOrderDetails O ON DS.date = O.date
	WHERE
		cut_off >= @vCurrentSystemDateTime
		AND O.touchpoint_booked < DS.touchpoint_capacity;
    
	/*--------------------------------------------------------*/
	
    DROP TABLE IF EXISTS TempDeliverySlots;
	DROP TABLE IF EXISTS TempOrderDetails;

END
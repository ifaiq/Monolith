CREATE PROCEDURE `stp_get_delivery_slots_v1`(
	IN pLocationID INT,
    IN pCurrentDate DATE,
    IN pIncrementedDate DATE,
    IN pCustomerID INT
)
BEGIN
    
    SET @vCurrentDate = pCurrentDate;
	SET @vIncrementedDate = pIncrementedDate;
	SET @vCurrentSystemDateTime = UTC_TIMESTAMP();
    
	/*--------------------------------------------------------*/

    DROP TEMPORARY TABLE IF EXISTS TempDeliverySlots;
    
    CREATE TEMPORARY TABLE TempDeliverySlots
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
    
    DROP TEMPORARY TABLE IF EXISTS TempOrderDetails;
    
    CREATE TEMPORARY TABLE TempOrderDetails
    AS
    SELECT
		FDS.date,
        FDS.customer_id,
        COUNT(FDS.customer_id) OVER(PARTITION BY FDS.date) AS touchpoint_booked
    FROM
    (
		SELECT DISTINCT
			DS.date,
			O.customer_id
		FROM
			TempDeliverySlots DS
			LEFT JOIN orders O ON DS.date = CAST(delivery_time AS DATE) AND O.status_id IN (1,2,3,4,5,12) AND O.location_id = pLocationID
    )FDS;

	/*--------------------------------------------------------*/
        
    SELECT DISTINCT
		DS.date
    FROM
		TempDeliverySlots DS
        INNER JOIN TempOrderDetails O ON DS.date = O.date
	WHERE
		cut_off >= @vCurrentSystemDateTime
        AND (O.touchpoint_booked < DS.touchpoint_capacity OR O.customer_ID = pCustomerID);
   
	/*--------------------------------------------------------*/
	
    DROP TEMPORARY TABLE IF EXISTS TempDeliverySlots;
	DROP TEMPORARY TABLE IF EXISTS TempOrderDetails;
    
END

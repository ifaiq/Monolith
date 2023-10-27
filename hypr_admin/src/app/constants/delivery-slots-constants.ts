export class DeliverySlotsAPIConstants {
  public static BUSINESSUNIT = "/config/businessunit/getAll";
  public static LOCATION = "/config/location/getAll";
  public static GETDELIVERYSLOT = "/api/v1/delivery-slots/portal";
  public static UPDATEDELIVERYSLOT = "/api/v1/delivery-slots";
  public static ACTIVEDELIVERYSLOT = "/config/location/";
}

export class DeliverySlotDays {
  public static DAYS = Array.from(Array(8).keys());
}

export class DeliverySlotCutOffTimes {
  public static TIMES = [
    {
      value: -24,
      view: "Day-1 00:00",
    },
    {
      value: -23,
      view: "Day-1 01:00",
    },
    {
      value: -22,
      view: "Day-1 02:00",
    },
    {
      value: -21,
      view: "Day-1 03:00",
    },
    {
      value: -20,
      view: "Day-1 04:00",
    },
    {
      value: -19,
      view: "Day-1 05:00",
    },
    {
      value: -18,
      view: "Day-1 06:00",
    },
    {
      value: -17,
      view: "Day-1 07:00",
    },
    {
      value: -16,
      view: "Day-1 08:00",
    },
    {
      value: -15,
      view: "Day-1 09:00",
    },
    {
      value: -14,
      view: "Day-1 10:00",
    },
    {
      value: -13,
      view: "Day-1 11:00",
    },
    {
      value: -12,
      view: "Day-1 12:00",
    },
    {
      value: -11,
      view: "Day-1 13:00",
    },
    {
      value: -10,
      view: "Day-1 14:00",
    },
    {
      value: -9,
      view: "Day-1 15:00",
    },
    {
      value: -8,
      view: "Day-1 16:00",
    },
    {
      value: -7,
      view: "Day-1 17:00",
    },
    {
      value: -6,
      view: "Day-1 18:00",
    },
    {
      value: -5,
      view: "Day-1 19:00",
    },
    {
      value: -4,
      view: "Day-1 20:00",
    },
    {
      value: -3,
      view: "Day-1 21:00",
    },
    {
      value: -2,
      view: "Day-1 22:00",
    },
    {
      value: -1,
      view: "Day-1 23:00",
    },
    {
      value: 0,
      view: "Day 00:00",
    },
    {
      value: 1,
      view: "Day 01:00",
    },
    {
      value: 2,
      view: "Day 02:00",
    },
    {
      value: 3,
      view: "Day 03:00",
    },
    {
      value: 4,
      view: "Day 04:00",
    },
    {
      value: 5,
      view: "Day 05:00",
    },
    {
      value: 6,
      view: "Day 06:00",
    },
    {
      value: 7,
      view: "Day 07:00",
    },
    {
      value: 8,
      view: "Day 08:00",
    },
    {
      value: 9,
      view: "Day 09:00",
    },
    {
      value: 10,
      view: "Day 10:00",
    },
    {
      value: 11,
      view: "Day 11:00",
    },
    {
      value: 12,
      view: "Day 12:00",
    },
    {
      value: 13,
      view: "Day 13:00",
    },
    {
      value: 14,
      view: "Day 14:00",
    },
    {
      value: 15,
      view: "Day 15:00",
    },
    {
      value: 16,
      view: "Day 16:00",
    },
    {
      value: 17,
      view: "Day 17:00",
    },
    {
      value: 18,
      view: "Day 18:00",
    },
  ];
}

export class DeliverySlotsMessages {
  public static SUCCESS = "Updated successfully!";
  public static EMPTYCSV = "File was empty";
  public static DATEREQUIRED = "Date field is required";
  public static DATEFORMAT = "The format for date sould be 'YYYY-MM-DD'";
  public static TPCAPACITYREQUIRED = "Touch point capacity is required";
  public static TPCAPACITYFORMAT = "Touch point capacity should be an integer";
  public static CUTOFFFORMAT = "The format for cutoff sould be 'YYYY-MM-DD HH:MM:SS'";
  public static FILEVALIDATION = "File validated! Uploading...";
  public static LOCATIONERROR = "Please select business unit and location";
  public static CUTOFFSAMEDAY = "Cut-off time can not be greater than 6:00 pm for the same day";
  public static CUTOFFDIFFERENTDAY = "Cut-off date should be same or one day before delivery slot date";
}

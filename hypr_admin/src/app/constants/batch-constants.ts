export class BatchStatusConstants {
  public static PENDING = 1;
  public static ACCEPTED = 2;
  public static ONBOARDED = 3;
  public static IN_TRANSIT = 4;
  public static COMPLETED = 5;
  public static CLOSED = 6;
}

export class ReturnReasons {
  public static MISSING_INVENTORY = 1;
  public static LOST_INVENTORY = 2;
  public static DAMAGED_INVENTORY = 3;
}

export class NonCashTypes {
  public static BANK_TRANSFER = 1;
  public static CHEQUE = 2;
  public static DIGITAL_WALLET = 3;
  public static FINJA_PAYMENTS = 4;
  public static PENDING_PAYMENTS = 5;
}

export class DifferenceReasons {
  public static THEFT = 1;
  public static LOST_MONEY = 2;
  public static LOST_ITEMS = 3;
  public static DO_NOT_KNOW_REASON = 4;
  public static DID_NOT_TAKE_INVENTORY = 5;
  public static OTHERS = 6;
}

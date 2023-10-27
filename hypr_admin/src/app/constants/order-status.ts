export class OrderStatusConstants {
    public static SALE_ORDER = 1;
    public static RESERVED = 2;
    public static PACKER_ASSIGNED = 3;
    public static PACKED = 4;
    public static IN_TRANSIT = 5;
    public static PACKER_CANCELLED = 6;
    public static RETURNED = 7;
    public static PARTIAL_DELIVERED = 8;
    public static DELIVERED = 9;
    public static CANCELLED = 10;
    public static REJECTED = 11;
    public static ON_HOLD = 12;
    public static MissingID = 99;
}

export class OrderPaymentMethodsConstants {
    public static COD = 'COD';
    public static CREDIT = 'CREDIT';
    public static COD_WALLET = 'COD_WALLET';
    public static SADAD = 'SADAD'
    public static SADAD_WALLET = 'SADAD_WALLET'
}

export class OrderPaymentOptionsText {
    public static IN_TRANSIT = 'IN TRANSIT';
}
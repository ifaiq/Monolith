import { Injectable } from "@angular/core";

@Injectable()
export class OrderService {
    constructor() {}

    getTotalCharges(order) {
        let charges = 0.0;
        if (order.service_charge) {
            charges += parseFloat(order.service_charge);
        }
        if (order.delivery_charge) {
            charges += parseFloat(order.delivery_charge);
        }
        return charges;
    }

    getTotalOrderAmount(order) {
        let tip = this.getOrderTip(order);
        let orderTotal = +order.grand_total;

        return (+tip + +orderTotal).toFixed(2);
    }

    getOrderTip(order) {
        if (!order.tip_type || order.tip_type === "FLAT")
            return order.tip_amount ? order.tip_amount.toFixed(2) : 0.0;
        else
            return (
                (order.total_price +
                    order.tax +
                    order.service_charge +
                    order.delivery_charge -
                    parseFloat(order.coupon_discount || 0.0)) *
                (order.tip_amount ? order.tip_amount / 100 : 0.0)
            ).toFixed(2);
    }
}

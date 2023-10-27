import { Component, OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared/services/shared-function.service";
import { OrderStatusConstants } from "../../../constants/order-status";
import { OrderService } from "../order.service";
import { AccountSettingService } from "../../../shared/services/account-settings";

@Component({
    selector: "app-cancelled-orders",
    templateUrl: "./cancelled-orders.component.html",
    styleUrls: ["./cancelled-orders.component.scss"],
})
export class CancelledOrdersComponent implements OnInit {
    orders = [];
    tableData = [];
    loading = true;
    locations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    search = "";
    searchCopy = "";
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "cancelledOrderPage";
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        public sharedFunctions: SharedFunctionsService,
        private orderService: OrderService,
        public accountService: AccountSettingService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.selectedBusinessUnitId = "";
        this.selectedLocationId = "";
        this.getbusinessUnits();
        this.getlocations();
        this.getCancelledOrders();
    }
    pagination(event) {
        this.currentPage = event;
        this.getCancelledOrders();
    }

    resetLocations() {
        this.selectedLocationId = "";
        this.locations = [];
    }

    getlocations() {
        this.resetLocations();
        var params = {};
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.selectedBusinessUnitId,
                true
            )
        ) {
            params["businessUnitId"] = this.selectedBusinessUnitId;
        } else if (this.sharedFunctions.isBUListPerm()) {
            return;
        }
        var path = "/config/location/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe((data) => {
            if (data && data.data && data.data.locations) {
                this.locations = data.data.locations;
            } else {
                this.locations = [];
            }
        });
    }

    getbusinessUnits() {
        var path = "/config/businessunit/getAll";
        this.sharedFunctions.getRequest(path).subscribe((data) => {
            if (data.code == "OK") {
                try {
                    if (data.data && data.data.length) {
                        this.businessUnits = data.data;
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        });
    }

    refresh(isRefresh?) {
        this.resetPager();
        this.loading = true;
        if (isRefresh) {
            this.ngOnInit();
        } else {
            this.getCancelledOrders();
        }
    }

    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
        this.tableData = [];
    }

    setActiveIndex(param, index) {
        if (this[param] == index) {
            this[param] = -1;
        } else {
            this[param] = index;
        }
    }

    getCancelledOrders() {
        var path = "/order/getOrdersByStatus";

        let params = {
            status_id: OrderStatusConstants.CANCELLED,
            per_page: this.itemsPerPage,
            page: this.currentPage,
            search: this.searchCopy,
            sortCriteria: "placed_at desc",
        };
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.selectedBusinessUnitId,
                true
            )
        ) {
            params["business_unit_id"] = this.selectedBusinessUnitId;
        }
        if (
            !this.sharedFunctions.emptyOrAllParam(this.selectedLocationId, true)
        ) {
            params["location_id"] = this.selectedLocationId;
        }
        this.sharedFunctions.getRequest(path, params).subscribe((data) => {
            if (data.code == "OK") {
                if (data.data && data.data.orders) {
                    this.orders = data.data.orders;
                    var i = 0;
                    var tableData = [];
                    for (var order of this.orders) {
                        var locationname = "";
                        if (order.location_id) {
                            locationname = order.location_id.name;
                        } else {
                            locationname = "No Location";
                        }
                        tableData.push({
                            id: order.id,
                            name: order.customer_id.name,
                            phone: this.sharedFunctions.getFormattedPhoneNumber(
                                order.customer_id.phone
                            ),
                            currency: order.location_id.business_unit_id
                                .currency
                                ? order.location_id.business_unit_id.currency
                                : this.accountService.currency,
                            grand_total: this.orderService.getTotalOrderAmount(
                                order
                            ),
                            placed_at: this.sharedFunctions.getFormattedDate(
                                order.placed_at,
                                2
                            ),
                            payment_method: order.payment_type,
                            status: order.status_id.name,
                            status_id: order.status_id.id,
                            order_items: order.items,
                            address: order.customer_id.address,
                            cell_name: locationname,
                            history: order.history,
                            index: i,
                            delivery_address: order.customer_address_id
                                ? order.customer_address_id.address_line1
                                : "NONE",
                            rowCount: this.sharedFunctions.getRowCount(
                                this.itemsPerPage,
                                this.currentPage,
                                i
                            ),
                            status_reason_id: order.status_reason_id,
                            total_price: order.total_price,
                            coupon_discount: order.coupon_discount,
                            volume_based_discount: order.volume_based_discount
                                ? parseFloat(order.volume_based_discount)
                                : 0.0,
                        });
                        i++;
                    }
                    this.tableData = tableData;
                    this.totalItems = data.data.totalCount;
                } else {
                    this.orders = [];
                    this.tableData = [];
                    this.totalItems = 0;
                }
            }
            this.loading = false;
        }, err => {
            this.toastr.error(err.error.message);
            this.loading = false;
        });
    }

    SearchOrders() {
        this.loading = true;
        this.searchCopy = this.search;
        if (this.searchCopy[0] == "0" && this.searchCopy[1] == "3") {
            this.searchCopy = this.searchCopy.replace("03", "923");
        }
        this.resetPager();
        this.getCancelledOrders();
    }

    undoSearch() {
        this.loading = true;
        this.resetPager();
        this.search = "";
        this.SearchOrders();
    }

    refundOrder(index) {
        console.log("index to update order " + index);
        this.loading = true;
        var order = this.orders[index];
        var obj = {
            order_id: order.id,
            location_id: order.location_id.id,
        };
        this.sharedFunctions.postRequest("/order/refund", obj).subscribe(
            (data) => {
                this.loading = false;
                if (data.success) {
                    for (var i in this.tableData) {
                        if (order.id == this.tableData[i].id) {
                            this.tableData.splice(parseInt(i), 1);
                            this.totalItems -= 1;
                        }
                    }
                    this.toastr.success("Order Refunded");
                } else {
                    this.toastr.error(data.message);
                }
            },
            (err) => {
                console.log(err);

                this.loading = false;
                this.toastr.error("Error while refunding");
            }
        );
    }

    canOrderRefund(index) {
        var order = this.orders[index];
        if (
            order.payment_reference &&
            order.payment_reference.startsWith("pi_")
        )
            // checks if order paid by stripe payment method
            return true;
        else return false;
    }

    getAmount(item) {
        if (item.price == null || item.price == "") {
            return "N/A";
        } else {
            var total = parseFloat(item.price) * parseInt(item.quantity);
            return total;
        }
    }
}

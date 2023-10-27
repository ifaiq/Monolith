import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared/services/shared-function.service";
import { OrderStatusConstants } from "../../../constants/order-status";
import Swal from "sweetalert2";

@Component({
    selector: "end-state-orders",
    templateUrl: "./end-state-orders.component.html",
    styleUrls: ["./end-state-orders.component.scss"],
})
export class EndStateOrdersComponent implements OnInit {
    loading = false;
    startDate;
    endDate;
    currentPage = 1;
    itemsPerPage = 20;
    totalItems = 0;
    paginationId = "EndStateOrdersPage";
    locations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    orders = [];
    activeIndex = -1;
    search = "";
    searchCopy = "";
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        public sharedFunctions: SharedFunctionsService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getbusinessUnits();
        this.getEndStateOrders(true);
    }

    getbusinessUnits() {
        this.resetBUUnit();
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

    resetLocations() {
        this.selectedLocationId = "";
        this.locations = [];
    }

    resetBUUnit() {
        this.businessUnits = [];
        this.selectedBusinessUnitId = "";
        this.resetLocations();
    }

    searchOrders() {
        this.searchCopy = this.search;
        if (this.searchCopy[0] == "0" && this.searchCopy[1] == "3") {
            this.searchCopy = this.searchCopy.replace("03", "923");
        }
        this.getEndStateOrders(true);
    }
    undoSearch() {
        this.search = "";
        this.searchCopy = "";
        this.getEndStateOrders(true);
    }

    getEndStateOrders(reset) {
        if (this.loading) {
            return;
        }
        if (reset) {
            this.currentPage = 1;
        }
        this.orders = [];
        this.totalItems = 0;
        this.loading = true;
        var params = {
            page: this.currentPage,
            per_page: this.itemsPerPage,
            sortCriteria: 'placed_at desc',
            search: this.searchCopy,
            status_id: [
                OrderStatusConstants.CANCELLED,
                OrderStatusConstants.DELIVERED,
                OrderStatusConstants.PARTIAL_DELIVERED,
                OrderStatusConstants.ON_HOLD,
            ]
        }
        if (this.startDate) {
            params["startDate"] = this.sharedFunctions.getStartDate(this.startDate);
        }
        if (this.endDate) {
            params["endDate"] = this.sharedFunctions.getEndDate(this.endDate);
        }
        if (this.selectedLocationId) {
            params["location_id"] = this.selectedLocationId;
        }
        this.sharedFunctions
            .getRequest("/order/getOrdersByStatus", params)
            .subscribe((data) => {
                if (data.success == true) {
                    this.orders = data.data.orders;
                    this.totalItems = data.data.totalCount;
                    this.loading = false;
                } else {
                    this.orders = [];
                    this.totalItems = 0;
                    this.loading = false;
                    if (data.message) {
                        this.toastr.error(data.message);
                    } else {
                        this.toastr.error("Something went wrong");
                    }
                }
            }, (err) => {
                this.orders = [];
                this.loading = false;
                this.toastr.error(err.error.message);
            });
    }

    setActiveIndex(param, index) {
        this[param] = this[param] == index ? -1 : index;
    }

    refresh() {
        this.startDate = null;
        this.endDate = null;
        this.getbusinessUnits();
        this.undoSearch();
    }

    getAmount(item) {
        if (item.price == null || item.price == "") {
            return "N/A";
        } else {
            var total = parseFloat(item.price) * parseInt(item.quantity);
            return total;
        }
    }

    pagination(event) {
        this.currentPage = event;
        this.getEndStateOrders(false);
    }

    putInTransit(order) {
        this.loading = true;
        this.sharedFunctions
            .putRequest("/api/v1/order/v2/setOrderStatusPortal", {
                orderId: order.id,
                statusId: OrderStatusConstants.IN_TRANSIT,
                orderItems: order.items,
            })
            .subscribe(
                (data) => {
                    if (data["success"] == true) {
                        this.toastr.success(
                            "Order Status Changed Successfully"
                        );
                        this.loading = false;
                        this.getEndStateOrders(true);
                    }
                },
                (err) => {
                    this.loading = false;
                    this.toastr.error(err.error.message);
                }
            );
    }

    askForPermission(order) {
        Swal(
            order.payment_type !== "CREDIT"
                ? {
                      title: "Are you sure?",
                      text: "This order will be changed to In-Transit",
                      type: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Yes",
                      cancelButtonText: "No",
                  }
                : {
                      title: "Operation not allowed!!",
                      text: "Credit-buy order's status cannot be changed to In-Transit",
                      type: "error",
                      showConfirmButton: false,
                      showCancelButton: true,
                  }
        ).then((result) => {
            if (result.value) this.putInTransit(order);
        });
    }
}

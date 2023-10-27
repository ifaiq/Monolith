import { Component, OnInit, ViewChild } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared/services/shared-function.service";
import { RoleConstants } from "../../../constants/roles-constants";
import { OrderStatusConstants } from "../../../constants/order-status";
import { OrderService } from "../order.service";
import { AccountSettingService } from "../../../shared/services/account-settings";

@Component({
    selector: "app-onhold-orders",
    templateUrl: "./onhold-orders.component.html",
    styleUrls: ["./onhold-orders.component.scss"],
})
export class OnHoldOrdersComponent implements OnInit {
    @ViewChild("fileInput") fileInput;
    orders = [];
    tableData = [];
    loading = true;
    locations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    itemsPerPage = 20;
    currentPage = 1;
    file;
    file_name = "";
    totalItems = 0;
    paginationId = "onholdOrderPage";
    activeIndex = -1;
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
        this.getOnHoldOrders();
    }
    pagination(event) {
        this.currentPage = event;
        this.getOnHoldOrders();
    }

    resetLocations() {
        this.selectedLocationId = "";
        this.locations = [];
    }

    getlocations() {
        var params = {};
        this.resetLocations();
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
        var params = {};
        var path = "/config/businessunit/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe((data) => {
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
        this.loading = true;
        this.resetPager();
        if (isRefresh) {
            this.ngOnInit();
        } else {
            this.getOnHoldOrders();
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

    getOnHoldOrders() {
        var params = {
            status_id: OrderStatusConstants.ON_HOLD,
            per_page: this.itemsPerPage,
            page: this.currentPage,
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
        this.sharedFunctions
            .getRequest("/order/getOrdersByStatus", params)
            .subscribe(
                (data) => {
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
                                        ? order.location_id.business_unit_id
                                              .currency
                                        : this.accountService.currency,
                                    total_price: parseFloat(order.total_price),
                                    grand_total: this.orderService.getTotalOrderAmount(
                                        order
                                    ),
                                    tip: this.orderService.getOrderTip(order),
                                    tax: parseFloat(order.tax),
                                    total_charges: this.orderService.getTotalCharges(
                                        order
                                    ),
                                    sub_total: order.sub_total,
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
                                    rowCount: this.sharedFunctions.getRowCount(
                                        this.itemsPerPage,
                                        this.currentPage,
                                        i
                                    ),
                                    coupon_discount: order.coupon_discount,
                                    volume_based_discount: order.volume_based_discount
                                        ? parseFloat(order.volume_based_discount)
                                        : 0.0,
                                });
                                i++;
                            }
                            this.tableData = tableData;
                            this.totalItems = data.data.totalCount;
                        }
                    } else {
                        this.orders = [];
                        this.tableData = [];
                        this.totalItems = 0;
                    }
                    this.loading = false;
                },
                (err) => {
                    this.toastr.error(err.error.message);
                    this.loading = false;
                }
            );
    }

    markOrderStatus(orderIndex) {
        let order = this.orders[orderIndex];
        this.sharedFunctions
            .putRequest("/api/v1/order/v2/setOrderStatusPortal", {
                orderId: order.id,
                statusId: OrderStatusConstants.PACKED,
            })
            .subscribe((data) => {
                for (var i in this.tableData) {
                    if (order.id == this.tableData[i].id) {
                        this.tableData.splice(parseInt(i), 1);
                        this.totalItems -= 1;
                    }
                }
                this.toastr.success("Order Marked Successfully");
                this.refresh();
            }, err => {
                this.toastr.error(err.error.message);
                this.loading = false;
            });
    }

    onChange(event: EventTarget) {
        let eventObj: MSInputMethodContext = <MSInputMethodContext>event;
        let target: HTMLInputElement = <HTMLInputElement>eventObj.target;
        let files: FileList = target.files;
        this.file = files[0];
    }

    upload() {
        let formData = new FormData();
        formData.append("file", this.file);
        this.sharedFunctions
            .postRequest("/upload/uploadFileToS3", formData)
            .subscribe(
                (data) => {
                    if (data.success) {
                        console.log("RESPONSE DATA", data);
                        this.file_name = data.data.name;
                        this.toastr.success("File uploaded successfully");
                        this.bulkPackOrders(data.data);
                    }
                },
                (err) => {}
            );
    }

    bulkPackOrders(data) {
        let user = JSON.parse(localStorage.getItem("userData"));
        let obj = {
            file_name: data.name,
            user_id: user.id,
            file_url: data.file[0].extra.Location,
        };
        this.sharedFunctions
            .postRequest("/order/bulkPackOrders", obj)
            .subscribe((data) => {
                this.toastr.info("Bulk Packing Orders In Progress!");
            });
    }
}

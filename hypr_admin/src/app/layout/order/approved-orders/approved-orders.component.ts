import { Component, OnInit, ViewChild } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared/services/shared-function.service";
import { OrderStatusConstants } from "../../../constants/order-status";
import { OrderService } from "../order.service";
import { AccountSettingService } from "../../../shared/services/account-settings";

import Swal from "sweetalert2";
import { RoleConstants } from "app/constants/roles-constants";

@Component({
    selector: "app-approved-orders",
    templateUrl: "./approved-orders.component.html",
    styleUrls: ["./approved-orders.component.scss"],
})
export class ApprovedOrdersComponent implements OnInit {
    @ViewChild("fileInput") fileInput;
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
    file;
    file_name = "";
    paginationId = "approveOrderPage";
    userLocations: any = JSON.parse(localStorage.getItem("userLocations"));
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    userCompanies: any = JSON.parse(localStorage.getItem("userCompanies"));
    company_code: any = "RET";
    cancellationReasons = [];
    selectedReason = "";
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
        this.getApprovedOrders();
        this.getOrderCancellationReasons();
    }
    pagination(event) {
        this.currentPage = event;
        this.getApprovedOrders();
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
            /*this.resetPager();
            this.getApprovedOrders();*/
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
        this.loading = true;
        this.resetPager();
        if (isRefresh) {
            this.ngOnInit();
        } else {
            this.getApprovedOrders();
        }
    }

    setActiveIndex(param, index) {
        if (this[param] == index) {
            this[param] = -1;
        } else {
            this[param] = index;
        }
    }

    getApprovedOrders() {
        var path = "/order/getOrdersByStatus";

        let params = {
            status_id: OrderStatusConstants.RESERVED,
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
                            location_id: order.location_id.id,
                            history: order.history,
                            index: i,
                            rowCount: this.sharedFunctions.getRowCount(
                                this.itemsPerPage,
                                this.currentPage,
                                i
                            ),
                            delivery_address: order.customer_address_id
                                ? order.customer_address_id.address_line1
                                : "NONE",
                            coupon_discount: order.coupon_discount
                                ? parseFloat(order.coupon_discount)
                                : 0.0,
                            volume_based_discount: order.volume_based_discount
                                ? parseFloat(order.volume_based_discount)
                                : 0.0,
                            call_centre_status: order.call_centre_status,
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

    removeItem(orderIndex, itemIndex) {
        this.orders[orderIndex].items[itemIndex]["removed"] = true;
    }

    changeItemQuantity(orderIndex, item, op) {
        let itemIndex = this.orders[orderIndex].items.indexOf(item);
        if (op === "+") {
            let item = this.orders[orderIndex].items[itemIndex];
            let quantity = this.orders[orderIndex].items[itemIndex].quantity;
            if (++quantity > item.original_quantity) return false;
            this.orders[orderIndex].items[itemIndex].quantity = quantity++;
        } else if (op === "-") {
            let quantity = this.orders[orderIndex].items[itemIndex].quantity;
            if (--quantity < 1) return false;
            this.orders[orderIndex].items[itemIndex].quantity--;
        }
    }

    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
        this.tableData = [];
    }

    SearchOrders() {
        this.loading = true;
        this.searchCopy = this.search;
        if (this.searchCopy[0] == "0" && this.searchCopy[1] == "3") {
            this.searchCopy = this.searchCopy.replace("03", "923");
        }
        this.resetPager();
        this.getApprovedOrders();
    }

    undoSearch() {
        this.loading = true;
        this.resetPager();
        this.search = "";
        this.SearchOrders();
    }

    makeOrderEditable(orderIndex) {
        this.orders[orderIndex]["isEditable"] = !this.orders[orderIndex][
            "isEditable"
        ];
    }

    askForPermission(orderIndex) {
        Swal({
            title: "Are you sure?",
            text: "You want to pack this order?",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No, continue editing",
        }).then((result) => {
            if (result.value) this.markOrderStatus(orderIndex, OrderStatusConstants.PACKED);
        });
    }
    updateOrderlocation(orderIndex, loc_id) {
        let order = this.orders[orderIndex];
        order.location_id = loc_id;

        let orderItems = order.items.map((item) => {
            return item.product_id.sku;
        });
        this.sharedFunctions
            .postRequest("/order/updateOrderLocation", {
                order_id: order.id,
                product_skus: orderItems,
                location_id: order.location_id,
                is_packed: false,
            })
            .subscribe((data) => {
                console.log(data);
                this.toastr.success("Order Location Changed  Successfully");
                this.refresh();
            });
    }

    markOrderStatus(orderIndex, status_id) {
        let order = this.orders[orderIndex];
        order.items.forEach((item) => {
            item.product_id = item.product_id.id;
        });
        let obj = {
            orderId: order.id,
            statusId: status_id,
            orderItems: order.items.map(item => {
                return {
                    id: item.id,
                    productId: item.product_id,
                    quantity: item.quantity,
                    removed: item.removed,
                }
            })
        };
        if (
            status_id == OrderStatusConstants.CANCELLED &&
            !this.selectedReason
        ) {
            this.toastr.error("Please select cancellation reason");
            return false;
        } else if (
            status_id == OrderStatusConstants.CANCELLED &&
            this.selectedReason
        )
            obj["statusReasonId"] = +this.selectedReason;
        this.loading = true;
        this.sharedFunctions
            .putRequest("/api/v1/order/v2/setOrderStatusPortal", obj)
            .subscribe((data) => {
                for (var i in this.tableData) {
                    if (order.id == this.tableData[i].id) {
                        this.tableData.splice(parseInt(i), 1);
                        this.totalItems -= 1;
                    }
                }
                this.toastr.success("Order Marked Successfully");
                this.loading = false;
                this.refresh();
            }, err => {
                this.toastr.error(err.error.message);
                this.loading = false;
            });
    }
    markOrderConfirm(orderIndex) {
        let order = this.orders[orderIndex];
        this.sharedFunctions
            .postRequest("/order/setCallCentreStatus", {
                order_id: order.id,
            })
            .subscribe((data) => {
                this.toastr.success("Order Confirmed Successfully");
                this.refresh();
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
    getOrderCancellationReasons() {
        this.sharedFunctions
            .getRequest("/order/getStatusReasons")
            .subscribe((data) => {
                if (data && data.data && data.data.reasons) {
                    this.cancellationReasons = data.data.reasons.filter(
                        (reason) => {
                            return reason.tag == "CA";
                        }
                    );
                } else {
                    this.cancellationReasons = [];
                }
            });
    }
}

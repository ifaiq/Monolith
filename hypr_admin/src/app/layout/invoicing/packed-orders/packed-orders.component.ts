import { Component, OnInit, ViewChild } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared/services/shared-function.service";
import { RoleConstants } from "../../../constants/roles-constants";
import { OrderStatusConstants } from "../../../constants/order-status";
import { OrderService } from "../order.service";
import { AccountSettingService } from "../../../shared/services/account-settings";
import { CompanyTypeConstants } from "app/constants/company_types";

@Component({
    selector: "app-packed-orders",
    templateUrl: "./packed-orders.component.html",
    styleUrls: ["./packed-orders.component.scss"],
})
export class PackedOrdersComponent implements OnInit {
    @ViewChild("fileInput") fileInput;
    orders = [];
    deliveryBoys = [];
    tableData = [];
    loading = true;
    locations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    selectedDeliveryBoyId = "";
    search = "";
    searchCopy = "";
    itemsPerPage = 20;
    currentPage = 1;
    file;
    fileDataType = "customerId";
    file_name = "";
    totalItems = 0;
    paginationId = "packedOrderPage";
    activeIndex = -1;
    isRetailo: any;
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    userLocations: any = JSON.parse(localStorage.getItem("userLocations"));
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        public sharedFunctions: SharedFunctionsService,
        private orderService: OrderService,
        public accountService: AccountSettingService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
        if (
            [
                RoleConstants.CS_REPRESENTATIVE,
                RoleConstants.STORE_MANAGER,
            ].includes(JSON.parse(localStorage.getItem("userData")).role.id)
        ) {
            this.selectedLocationId = this.userLocations[0].id;
            this.getDeliveryBoys();
        }
        this.isCompanyRetailo();
    }

    isCompanyRetailo() {
        let companies = this.sharedFunctions.getUserCompanies();
        companies = companies.filter(comp => comp.code == CompanyTypeConstants.retailo);
        if (companies.length > 0) {
            this.isRetailo = true;
        } else {
            this.isRetailo = false;
        }
    }

    ngOnInit() {
        this.selectedBusinessUnitId = "";
        this.selectedLocationId = "";
        this.selectedDeliveryBoyId = "";
        this.getbusinessUnits();
        this.getlocations();
        this.getPackedOrders();
    }
    pagination(event) {
        this.currentPage = event;
        this.getPackedOrders();
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
            params["business_unit_id"] = this.selectedBusinessUnitId;
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
            this.getPackedOrders();
            this.getDeliveryBoys();*/
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
            this.getPackedOrders();
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

    getPackedOrders() {
        var params = {
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
        this.getDeliveryBoys();
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
                                    delivery_address: order.customer_address_id
                                        ? order.customer_address_id
                                            .address_line1
                                        : "NONE",
                                    coupon_discount: order.coupon_discount
                                        ? parseFloat(order.coupon_discount)
                                        : 0.0,
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

    getDeliveryBoys() {
        let params = {
            roleId: [RoleConstants.DELIVERY],
            allData: true
        };
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.selectedBusinessUnitId,
                true
            )
        ) {
            params["businessUnitId"] = this.selectedBusinessUnitId;
        }
        if (
            !this.sharedFunctions.emptyOrAllParam(this.selectedLocationId, true)
        ) {
            params["locationId"] = this.selectedLocationId;
        } else {
            this.deliveryBoys = [];
            this.selectedDeliveryBoyId = "";
            return;
        }
        this.sharedFunctions
            .getRequest("/user/user/byRole", params)
            .subscribe((data) => {
                this.deliveryBoys = data.data;
                if (this.deliveryBoys.length > 0)
                    this.selectedDeliveryBoyId = this.deliveryBoys[0].id;
            });
    }

    updateOrder(index) {
        if (!this.selectedDeliveryBoyId) {
            this.toastr.error("Select delivery boy to assign");
            return;
        }
        var order = this.orders[index];
        var obj = {
            order_id: order.id,
            delivery_boy_id: this.selectedDeliveryBoyId,
        };
        this.sharedFunctions
            .postRequest("/order/assignOrderToDeliveryBoy", obj)
            .subscribe((data) => {
                for (var i in this.tableData) {
                    if (order.id == this.tableData[i].id) {
                        this.tableData.splice(parseInt(i), 1);
                        this.totalItems -= 1;
                    }
                }
                this.toastr.success("Order Assigned");
            });
    }

    markOrderStatus(orderIndex) {
        let order = this.orders[orderIndex];
        this.sharedFunctions
            .putRequest("/api/v1/order/v2/setOrderStatusPortal", {
                orderId: order.id,
                statusId: OrderStatusConstants.ON_HOLD,
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

    SearchOrders() {
        this.loading = true;
        this.searchCopy = this.search;
        if (this.searchCopy[0] == "0" && this.searchCopy[1] == "3") {
            this.searchCopy = this.searchCopy.replace("03", "923");
        }
        this.resetPager();
        this.getPackedOrders();
    }

    undoSearch() {
        this.loading = true;
        this.resetPager();
        this.search = "";
        this.SearchOrders();
    }

    onChange(event: EventTarget) {
        let eventObj: MSInputMethodContext = <MSInputMethodContext>event;
        let target: HTMLInputElement = <HTMLInputElement>eventObj.target;
        let files: FileList = target.files;
        this.file = files[0];
    }

    upload() {
        if (this.file == undefined || this.file == null || !this.fileInput.nativeElement.value) {
            this.toastr.error("Please Select File To Upload");
            return false;
        }

        let formData = new FormData();
        formData.append("file", this.file);
        this.loading = true;
        this.sharedFunctions
            .postRequest("/upload/uploadFileToS3", formData)
            .subscribe(
                (data) => {
                    if (data.success) {
                        console.log("RESPONSE DATA", data);
                        this.file_name = data.data.name;
                        this.toastr.success("File uploaded successfully");
                        this.bulkAssignRiders(data.data);
                    }
                },
                (err) => {
                    this.loading = false;
                }
            );
    }

    bulkAssignRiders(data) {
        let user = JSON.parse(localStorage.getItem("userData"));
        let obj = {
            file_name: data.name,
            user_id: user.id,
            file_url: data.file[0].extra.Location,
            location_id: this.selectedLocationId,
            data_type: this.fileDataType,
        };
        let url = "/api/v1/e-invoice/bulk-generate-cn";
        this.sharedFunctions
            .postRequest(url, obj)
            .subscribe((data) => {
                this.toastr.info("Bulk Assigning Riders In Progress!");
                this.loading = false
                this.fileInput.nativeElement.value = '';
            },
                (err) => {
                    this.loading = false;
                    if (this.sharedFunctions.isEmpty(err.error.message)) {
                        this.toastr.error("Internal Server Error");
                    } else {
                        this.toastr.error(err.error.message);
                    }
                    this.fileInput.nativeElement.value = '';
                });
    }
}

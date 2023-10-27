import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { NgZone } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../shared/services/shared-function.service";
import { AccountSettingService } from "../../shared/services/account-settings";
import { OrderStatusConstants } from "../../constants/order-status";
import { OrderService } from "./order.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: "app-order",
    templateUrl: "./order.component.html",
    styleUrls: ["./order.component.scss"],
})
export class OrderComponent implements OnInit {
    orders = [];
    loading = true;
    locations = [];
    businessUnits = [];
    statuses = [];
    tableData = [];
    value = -1;
    search = "";
    startDate = "";
    endDate = "";
    optionSelected = "";
    total_pages = false;
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    selectedStatus = "";
    refModalOrderExport: any;
    searchCopy = "";
    date: Date = new Date();
    settings = {
        bigBanner: true,
        timePicker: false,
        format: "dd-MM-yyyy",
        defaultOpen: true,
    };
    requestSent = false;
    companyId = "";
    companies = [];
    activeIndex = -1;
    editingOrderIndex = -1;
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "orderPages";
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    inTransitId = OrderStatusConstants.IN_TRANSIT;
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        lc: NgZone,
        public sharedFunctions: SharedFunctionsService,
        public accountService: AccountSettingService,
        private orderService: OrderService,
        private modalService: NgbModal
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    refresh() {
        this.loading = true;
        this.resetPager();
        this.ngOnInit();
    }

    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
        this.tableData = [];
    }
    printOrder(order) {
        const printContent = document.getElementById(order.rowCount);
        const WindowPrt = window.open(
            "",
            "",
            "left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0"
        );
        WindowPrt.document.write(printContent.innerHTML);
        WindowPrt.document.close();
        WindowPrt.focus();
        WindowPrt.print();
        WindowPrt.close();
    }
    ngOnInit() {
        this.getCompanies();
        this.getbusinessUnits();
        this.getlocations();
        this.getOrders();
        this.getStatus();
    }
    getCompanies() {
        this.companyId = "";
        this.sharedFunctions.getRequest("/config/company/getAll").subscribe(
            (data) => {
                if (data && data.data && data.data.companies) {
                    this.companies = data.data.companies;
                } else {
                    this.companies = [];
                }
            },
            (error) => { }
        );
    }

    getlocations() {
        var params = {};
        this.resetLocations();
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        }
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
        this.resetBUUnit();
        this.getlocations();
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        } else if (this.sharedFunctions.isCompanyListPerm()) {
            return;
        }
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

    resetLocations() {
        this.selectedLocationId = "";
        this.locations = [];
    }
    resetBUUnit() {
        this.businessUnits = [];
        this.selectedBusinessUnitId = "";
        this.resetLocations();
    }

    getStatus() {
        this.sharedFunctions
            .getRequest("/status/getAllOrderStatuses")
            .subscribe((data) => {
                this.statuses = data.data.statuses;
                this.statuses = this.statuses.filter(
                    (item) => item.id !== OrderStatusConstants.SALE_ORDER
                );
            });
    }
    getStatusParamValue() {
        let statusParamValue;
        if (!this.sharedFunctions.emptyOrAllParam(this.selectedStatus, true)) {
            statusParamValue = this.selectedStatus;
        } else {
            statusParamValue = [
                OrderStatusConstants.CANCELLED,
                OrderStatusConstants.DELIVERED,
                OrderStatusConstants.IN_TRANSIT,
                OrderStatusConstants.MissingID,
                OrderStatusConstants.PACKED,
                OrderStatusConstants.PACKER_ASSIGNED,
                OrderStatusConstants.PACKER_CANCELLED,
                OrderStatusConstants.PARTIAL_DELIVERED,
                OrderStatusConstants.REJECTED,
                OrderStatusConstants.RESERVED,
                OrderStatusConstants.RETURNED,
                OrderStatusConstants.ON_HOLD,
            ];
        }
        return statusParamValue;
    }
    getOrders() {
        this.requestSent = true;
        this.loading = true;
        var path = "/order/getAllOrders";
        let params = {
            per_page: this.itemsPerPage,
            page: this.currentPage,
            search: this.searchCopy,
            startDate: this.startDate
                ? this.sharedFunctions.getStartDate(this.startDate)
                : "",
            endDate: this.endDate
                ? this.sharedFunctions.getEndDate(this.endDate)
                : "",
            sortCriteria: "placed_at desc",
        };
        params["orderStatusId"] = this.getStatusParamValue();
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["company_id"] = this.companyId;
        }
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
            if (data.data && data.data.orders) {
                this.orders = data.data.orders;
                var tableData = [];
                var index = 0;
                for (var order of this.orders) {
                    var locationname = "";
                    if (order.location_id) {
                        locationname = order.location_id.name;
                    } else {
                        locationname = "No Location";
                    }
                    let currency = order.location_id.business_unit_id.currency
                        ? order.location_id.business_unit_id.currency
                        : this.accountService.currency;
                    tableData.push({
                        id: order.id,
                        name: order.customer_id.name,
                        phone: order.customer_id.phone && this.editNumber(order.customer_id.phone),
                        total_price: order.total_price,
                        currency: currency,
                        sub_total: order.sub_total,
                        placed_at: this.sharedFunctions.getFormattedDate(
                            order.placed_at,
                            1
                        ),
                        payment_method: order.payment_type,
                        grand_total: this.orderService.getTotalOrderAmount(
                            order
                        ),
                        tip: this.orderService.getOrderTip(order),
                        status: order.status_id.name,
                        status_id: order.status_id.id,
                        items: order.items,
                        cell_name: locationname,
                        history: order.history,
                        removedItems: [],
                        copyOrderItems: JSON.parse(JSON.stringify(order.items)),
                        location_id: order.location_id,
                        tax: order.tax,
                        service_charge: order.service_charge,
                        delivery_charge: order.delivery_charge,
                        total_charges: this.orderService.getTotalCharges(order),
                        packer_name: order.packer_id
                            ? order.packer_id.name
                            : "",
                        delivery_address: order.customer_address_id
                            ? order.customer_address_id.address_line1
                            : "NONE",
                        rowCount: this.sharedFunctions.getRowCount(
                            this.itemsPerPage,
                            this.currentPage,
                            index
                        ),
                        packed_quantity: order.packed_quantity,
                        coupon_discount: order.coupon_discount
                            ? parseFloat(order.coupon_discount)
                            : 0.0,
                        volume_based_discount: order.volume_based_discount
                            ? parseFloat(order.volume_based_discount)
                            : 0.0,
                        waiver: order.waiver ? order.waiver : { amount: null, reason: null },
                        from_web: order.from_web
                    });
                    index += 1;
                }
                this.tableData = tableData;
                this.totalItems = data.data.totalCount;
            } else {
                this.orders = [];
                this.tableData = [];
                this.totalItems = 0;
            }
            this.requestSent = false;
            this.loading = false;
        }, err => {
            this.toastr.error(err.error.message);
            this.loading = false;
        });
    }

    getSubTotal(order) {
        var sum = 0;
        for (var item of order.items) {
            sum = sum + parseFloat(item.price);
        }
        return sum;
    }

    DisableOrders(order) {
        this.sharedFunctions
            .postRequest("/order/disableOrder", { order_id: order.id })
            .subscribe(
                (data) => {
                    this.toastr.success("Update success");
                },
                (err) => {
                    if (this.sharedFunctions.isEmpty(err.error.message)) {
                        this.toastr.error("Internal Server Error");
                    } else {
                        this.toastr.error(err.error.message);
                    }
                }
            );
    }

    editNumber(number) {
        return number.replace("923", "03");
    }

    SearchOrders() {
        this.loading = true;
        this.searchCopy = this.search;
        if (this.searchCopy[0] == "0" && this.searchCopy[1] == "3") {
            this.searchCopy = this.searchCopy.replace("03", "923");
        }
        this.resetPager();
        this.getOrders();
    }

    undoSearch() {
        this.loading = true;
        this.resetPager();
        this.search = "";
        this.SearchOrders();
    }

    editOrder(order) {
        this.sharedFunctions.postRequest("/order/editOrder", order).subscribe(
            (data) => {
                this.toastr.success("Order Edited");
                this.editingOrderIndex = -1;
            },
            (err) => {
                if (this.sharedFunctions.isEmpty(err.error.message)) {
                    this.toastr.error("Internal Server Error");
                } else {
                    this.toastr.error(err.error.message);
                }
            }
        );
    }

    setActiveIndex(param, index) {
        if (this[param] == index) {
            this[param] = -1;
        } else {
            this[param] = index;
        }
    }

    removeOrderItem(order, index, id) {
        order.items.splice(index, 1);
        order.removedItems.push(id);
        this.setOrderTotal(order);
    }

    revertEditOrder(order) {
        order.items = JSON.parse(JSON.stringify(order.copyOrderItems));
        this.setOrderTotal(order);
        this.editingOrderIndex = -1;
    }

    setOrderTotal(order) {
        var sum = 0;
        for (var item of order.items) {
            sum = sum + item.quantity * item.sku.price;
        }
        order.total_price = sum;
    }

    setOrderItemTotal(order, index) {
        order.items[index].price =
            order.items[index].quantity * order.items[index].sku.price;
        this.setOrderTotal(order);
    }

    getValue(value) {
        if (value == null || value == "" || value == undefined) {
            return "N/A";
        } else {
            return value;
        }
    }

    getAmount(item, type) {
        if (item.price == null || item.price == "") {
            return "N/A";
        } else {
            var total =
                type == 1
                    ? parseFloat(item.price)
                    : parseFloat(item.price) * parseInt(item.quantity);
            return total;
        }
    }

    pagination(event) {
        this.currentPage = event;
        this.getOrders();
    }

    exportOrders(fileType) {
        var params = {}
        params["location_id"] = this.selectedLocationId;
        params["startDate"] = this.sharedFunctions.getStartDate(this.startDate);
        params["endDate"] = this.sharedFunctions.getEndDate(this.endDate);
        params["statusId"] = this.getStatusParamValue();
        params["file_type"] = fileType;
        let url = "/order/dump";
        this.sharedFunctions.getRequest(url, params).subscribe((data) => {
            if (data.data && data.data.length) {
                window.open(data.data, "_self");
            } else {
                try {
                    if (data.data.length == 0) {
                        this.toastr.warning(
                            "No data found for selected criteria"
                        );
                    }
                } catch (err) { }
            }
        },
            (err) => {
                if (this.sharedFunctions.isEmpty(err.error.message)) {
                    this.toastr.error("Internal Server Error");
                } else {
                    this.toastr.error(err.error.message);
                }
            });
    }

    openModalOrderExport(content) {
        if (this.selectedLocationId == "") {
            this.toastr.error("Please select location");
            return false;
        }
        if (this.sharedFunctions.emptyOrAllParam(this.startDate, true)) {
            this.toastr.error("Please select start date");
            return;
        }
        if (this.sharedFunctions.emptyOrAllParam(this.endDate, true)) {
            this.toastr.error("Please select end date");
            return;
        }
        if ((this.sharedFunctions.getDateDifference(this.startDate, this.endDate)) > 13) {
            this.toastr.error("Selected date range should not exceed 2 weeks");
            return;
        }
        this.refModalOrderExport = this.modalService.open(content);
    }
    getOrderMedium(order) {
        if (order.from_web) return 'WEB'; else return 'APP';
    }
}

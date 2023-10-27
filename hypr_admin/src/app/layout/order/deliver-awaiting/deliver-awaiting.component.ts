import { Component, OnInit } from "@angular/core";
import { SharedFunctionsService } from "../../../shared/services/shared-function.service";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { OrderStatusConstants } from "../../../constants/order-status";
import { OrderService } from "../order.service";
import { AccountSettingService } from "../../../shared/services/account-settings";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { WaiverReasonConstants } from "../../../constants/waiver-constants"

@Component({
    selector: "app-deliver-awaiting",
    templateUrl: "./deliver-awaiting.component.html",
    styleUrls: ["./deliver-awaiting.component.scss"],
})
export class DeliverAwaitingComponent implements OnInit {
    orders: any;
    tableData = [];
    loading = false;
    locations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    search = "";
    searchCopy = "";
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    refModalPopup: any;
    existingWaiver = [];
    paginationId = "deliverAwaitingPage";
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    readonly WaiverReasonCommercialWeightIssue = WaiverReasonConstants.COMMERCIAL_WEIGHT_ISSUE;
    readonly WaiverReasonCommercialAppPricingError = WaiverReasonConstants.COMMERCIAL_APP_PRICING_ERROR;
    readonly WaiverReasonSalesPriceMiscommitment  = WaiverReasonConstants.SALES_PRICE_MISCOMMITMENT;
    readonly WaiverReasonDiscountIssue = WaiverReasonConstants.DISCOUNT_ISSUE;
    readonly WaiverReasonRetailerWantsExtraDiscount  = WaiverReasonConstants.RETAILER_WANTS_EXTRA_DISCOUNT;
    readonly WaiverReasonDamageIssue = WaiverReasonConstants.DAMAGE_ISSUE;
    readonly WaiverReasonPaidExtra = WaiverReasonConstants.PAID_EXTRA;
    readonly WaiverReasonCnicDiscount = WaiverReasonConstants.CNIC_DISCOUNT;
    readonly WaiverReasonReturnPolicy = WaiverReasonConstants.RETURN_POLICY;
    readonly WaiverReasonKsaCashback = WaiverReasonConstants.KSA_CASHBACK;
    readonly WaiverReasonDeliveryFeeDiscount = WaiverReasonConstants.DELIVERY_FEE_DISCOUNT;
    readonly MerchandisingRental = WaiverReasonConstants.MERCHANDISING_RENTAL;
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        public sharedFunctions: SharedFunctionsService,
        private orderService: OrderService,
        public accountService: AccountSettingService,
        private modalService: NgbModal
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.selectedBusinessUnitId = "";
        this.selectedLocationId = "";
        this.getbusinessUnits();
        this.getlocations();
        this.getDeliverAwatingOrders();
    }
    pagination(event) {
        this.currentPage = event;
        this.getDeliverAwatingOrders();
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

    setActiveIndex(param, index) {
        if (this[param] == index) {
            this[param] = -1;
        } else {
            this[param] = index;
        }
    }

    refresh(isRefresh?) {
        this.loading = true;
        this.resetPager();
        if (isRefresh) {
            this.ngOnInit();
        } else {
            this.getDeliverAwatingOrders();
        }
    }

    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
        this.tableData = [];
    }

    getDeliverAwatingOrders() {
        this.loading = true;
        var params = {
            per_page: this.itemsPerPage,
            page: this.currentPage,
            search: this.searchCopy,
            status_id: OrderStatusConstants.IN_TRANSIT,
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
                                this.existingWaiver[i] = order.waiver ? true : false;
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
                                    grand_total: this.orderService.getTotalOrderAmount(
                                        order
                                    ),
                                    tip: this.orderService.getOrderTip(order),
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
                                    delivery_time: this.sharedFunctions.getFormattedDate(
                                        order.delivery_time,
                                        2
                                    ),
                                    history: order.history,
                                    rowCount: this.sharedFunctions.getRowCount(
                                        this.itemsPerPage,
                                        this.currentPage,
                                        i
                                    ),
                                    delivery_address: order.customer_address_id
                                        ? order.customer_address_id
                                            .address_line_1
                                        : "NONE",
                                    delivery_agent: order.delivery_boy_id
                                        ? order.delivery_boy_id.id + " - " + order.delivery_boy_id.name
                                        : null,
                                    waiver: order.waiver ? order.waiver : { amount: null, reason_id: null },
                                    index: i,
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
                },
                (err) => {
                    this.toastr.error(err.error.message);
                    this.loading = false;
                }
            );
    }

    SearchOrders() {
        this.loading = true;
        this.searchCopy = this.search;
        if (this.searchCopy[0] == "0" && this.searchCopy[1] == "3") {
            this.searchCopy = this.searchCopy.replace("03", "923");
        }
        this.resetPager();
        this.getDeliverAwatingOrders();
    }

    undoSearch() {
        this.loading = true;
        this.resetPager();
        this.search = "";
        this.SearchOrders();
    }

    getAmount(item) {
        if (item.price == null || item.price == "") {
            return "N/A";
        } else {
            var total = parseFloat(item.price) * parseInt(item.quantity);
            return total;
        }
    }

    openWaiverPopup(content) {
        this.refModalPopup = this.modalService.open(content);
    }

    createWaiver(order, index) {
        this.loading = true;
        if (!order.waiver.amount) {
            this.toastr.error("Please Add Waiver Amount");
            return;
        }
        if (!order.waiver.reason_id) {
            this.toastr.error("Please Select Waiver Reason");
            return;
        }
        this.refModalPopup.close();
        const params = {
            orderId: +order.id,
            waiverAmount: +order.waiver.amount,
            waiverReasonId: +order.waiver.reason_id
        }
        if (this.existingWaiver[index] === true) {
            this.sharedFunctions.putRequest("/waiver/update", params)
                .subscribe(
                    (data) => {
                        this.toastr.success("Waiver Updated");
                        this.ngOnInit();
                    },
                    (err) => {
                        this.loading = false;
                        this.toastr.error(err.error.message);
                        this.loading = false;
                    }
                );
        } else {
            this.sharedFunctions.postRequest("/waiver/create", params)
                .subscribe(
                    (data) => {
                        this.toastr.success("Waiver Created");
                        this.ngOnInit();
                    },
                    (err) => {
                        this.loading = false;
                        this.toastr.error(err.error.message);
                        this.loading = false;
                    }
                );
        }

    }

    removeWaiver(order) {
        this.loading = true;
        this.refModalPopup.close();
        this.sharedFunctions.postRequest("/waiver/remove", { orderId: order.id })
            .subscribe(
                (data) => {
                    this.toastr.success("Waiver Removed");
                    this.ngOnInit();
                },
                (err) => {
                    this.loading = false;
                    this.toastr.error(err.error.message);
                    this.loading = false;
                }
            );
    }
}

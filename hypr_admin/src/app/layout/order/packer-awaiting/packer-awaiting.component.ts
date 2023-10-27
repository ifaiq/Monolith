import { Component, OnInit } from "@angular/core";
import { SharedFunctionsService } from "../../../shared/services/shared-function.service";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { RoleConstants } from "../../../constants/roles-constants";
import { OrderStatusConstants } from "../../../constants/order-status";
import { OrderService } from "../order.service";
import { AccountSettingService } from "../../../shared/services/account-settings";
@Component({
    selector: "app-packer-awaiting",
    templateUrl: "./packer-awaiting.component.html",
    styleUrls: ["./packer-awaiting.component.scss"],
})
export class PackerAwaitingComponent implements OnInit {
    orders: any;
    tableData = [];
    loading = false;
    locations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    selectedPackerBoyId = "";
    packerBoys: any;
    search = "";
    searchCopy = "";
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "packerAwaitingPage";
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    userLocations: any = JSON.parse(localStorage.getItem("userLocations"));
    userCompanies: any = JSON.parse(localStorage.getItem("userCompanies"));
    company_code: any = "RET";
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
            this.getPackerBoys();
        }
    }

    ngOnInit() {
        this.selectedBusinessUnitId = "";
        this.selectedLocationId = "";
        this.selectedPackerBoyId = "";
        this.getbusinessUnits();
        this.getlocations();
        this.getPackerBoys();
        this.getPakcerAwatingOrders();
    }
    pagination(event) {
        this.currentPage = event;
        this.getPakcerAwatingOrders();
    }

    getPackerBoys() {
        var path = "/user/user/byRole";

        let params = {
            roleId: [RoleConstants.PACKER],
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
            this.packerBoys = [];
            this.selectedPackerBoyId = "";
            return;
        }
        this.sharedFunctions.getRequest(path, params).subscribe((data) => {
            this.packerBoys = data.data;
            this.selectedPackerBoyId = this.packerBoys[0].id;
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
            /*this.getPackerBoys();
            this.getPakcerAwatingOrders();*/
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
            this.getPackerBoys();
            this.getPakcerAwatingOrders();
        }
    }

    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
        this.tableData = [];
    }

    getPakcerAwatingOrders() {
        this.loading = true;
        var params = {
            per_page: this.itemsPerPage,
            page: this.currentPage,
            search: this.searchCopy,
            status_id: OrderStatusConstants.PACKER_ASSIGNED,
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
                                    location_id: order.location_id.id,
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
        this.getPakcerAwatingOrders();
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
    updateOrderlocation(orderIndex, loc_id) {
        let order = this.orders[orderIndex];
        order.location_id = loc_id;

        let orderItems = order.items.map((item) => {
            return item.product_id.sku;
        });
        console.log(orderItems, order.location_id);
        this.sharedFunctions
            .postRequest("/order/updateOrderLocation", {
                order_id: order.id,
                product_skus: orderItems,
                location_id: order.location_id,
                is_packed: true,
            })
            .subscribe((data) => {
                console.log(data);
                this.toastr.success("Order Location Changed  Successfully");
                this.refresh();
            });
    }
    updateOrder(index) {
        if (!this.selectedPackerBoyId) {
            this.toastr.error("Select packer boy to assign");
            return;
        }
        console.log("index to update order " + index);
        this.loading = true;
        var order = this.orders[index];
        var obj = {
            order_id: order.id,
            packer_id: this.selectedPackerBoyId,
            location_id: this.selectedLocationId,
        };
        this.sharedFunctions
            .postRequest("/order/assignOrderToPacker", obj)
            .subscribe(
                (data) => {
                    this.loading = false;

                    for (var i in this.tableData) {
                        if (order.id == this.tableData[i].id) {
                            this.tableData.splice(parseInt(i), 1);
                            this.totalItems -= 1;
                        }
                    }
                    this.toastr.success("Order Assigned");
                },
                (err) => {
                    this.loading = false;
                    this.toastr.error("Error");
                }
            );
    }
}

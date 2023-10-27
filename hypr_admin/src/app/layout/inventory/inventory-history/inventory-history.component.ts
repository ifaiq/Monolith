import { Component, OnInit } from "@angular/core";
import { NgZone } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { SharedFunctionsService } from "../../../shared";

@Component({
    selector: "app-inventory-history",
    templateUrl: "./inventory-history.component.html",
    styleUrls: ["./inventory-history.component.scss"],
})
export class InventoryHistoryComponent implements OnInit {
    loading = false;
    searchParam = "";
    inventoryHistory = [];
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    startDate = "";
    endDate = "";
    locations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    paginationId = "inventoryHistoryPage";
    constructor(
        private sharedFunctions: SharedFunctionsService,
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private modalService: NgbModal,
        lc: NgZone
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getbusinessUnits();
    }

    pagination(event) {
        this.currentPage = event;
        this.getInvHistory();
    }

    reset() {
        this.loading = false;
        this.inventoryHistory = [];
        this.currentPage = 1;
        this.totalItems = 0;
    }

    searchInvHistory() {
        this.reset();
        this.getInvHistory();
    }

    getbusinessUnits() {
        var path = "/config/businessunit/getAll";
        this.sharedFunctions.getRequest(path).subscribe(
            (data) => {
                if (data.code == "OK") {
                    try {
                        if (data.data && data.data.length) {
                            this.businessUnits = data.data;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
                this.reset();
            },
            (error) => {}
        );
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
            params["business_unit_id"] = this.selectedBusinessUnitId;
        }
        else if(this.sharedFunctions.isBUListPerm()){
            return;
        }
        var path = "/config/location/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data && data.data && data.data.locations) {
                    this.locations = data.data.locations;
                }
                if (this.locations.length == 1)
                    this.selectedLocationId = this.locations[0].id;
            },
            (error) => {}
        );
    }

    getInvHistory() {
        if (this.loading) {
            return false;
        }
        if (this.selectedLocationId == "" || !this.selectedLocationId) {
            this.toastr.error("PLEASE SELECT LOCATION");
            return false;
        }
        this.loading = true;
        this.sharedFunctions.getRequest("/inventory/getInventoryHistory", {
                location_id: this.selectedLocationId,
                search: this.searchParam,
                startDate: this.startDate ? this.sharedFunctions.getStartDate(this.startDate) : "",
                endDate: this.endDate ? this.sharedFunctions.getEndDate(this.endDate) : "",
                per_page: this.itemsPerPage,
                page: this.currentPage,
            })
            .subscribe((data) => {
                var index = 0;
                var inventoryHistory = [];
                for (var inv of data.data.products) {
                    inv.rowCount = this.sharedFunctions.getRowCount(
                        this.itemsPerPage,
                        this.currentPage,
                        index
                    );
                    let new_JSON = JSON.parse(inv.new_JSON);
                    let old_JSON = JSON.parse(inv.old_JSON);
                    inv.name = old_JSON.name;
                    inv.sku = old_JSON.sku;
                    inv.brand = old_JSON.brand;
                    inv.previous_qty = old_JSON.stock_quantity ? old_JSON.stock_quantity: 0;
                    inv.updated_qty = new_JSON.stock_quantity ? new_JSON.stock_quantity: 0;
                    inv.qty_change = inv.updated_qty - inv.previous_qty;
                    inventoryHistory.push(inv);
                    index += 1;
                }
                this.inventoryHistory = inventoryHistory;
                this.totalItems = data.data.totalCount;
                this.loading = false;
            }, err => {
                this.toastr.error(err.error.message);
                this.loading = false;
            }
        );
    }

    undoInvSearch() {
        this.searchParam = "";
        this.reset();
        this.getInvHistory();
    }
}

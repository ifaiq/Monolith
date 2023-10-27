import { Component, OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared";

@Component({
    selector: "bu-management",
    templateUrl: "./bu-management.component.html",
    styleUrls: ["./bu-management.component.scss"],
})
export class BUManagementComponent implements OnInit {
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "buListPage";
    businessUnits = [];
    activeIndex = -1;
    BUCopy = null;
    loading = false;
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        public sharedFunctions: SharedFunctionsService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getBusinessUnits();
    }

    pagination(event) {
        this.currentPage = event;
        this.getBusinessUnits();
    }

    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
    }

    rowClick(i) {
        if (this.activeIndex == i) {
            this.activeIndex = -1;
            this.businessUnits[i] = JSON.parse(JSON.stringify(this.BUCopy));
        } else {
            this.activeIndex = i;
            this.BUCopy = JSON.parse(JSON.stringify(this.businessUnits[i]));
        }
    }

    updateBusinessUnit(index) {
        var unit = this.businessUnits[index];
        if (unit.name) unit.name.trim();
        if (!unit.name) {
            this.toastr.error("Business Unit name is required");
            return;
        }
        if (!unit.currency) {
            this.toastr.error("Business Unit currency is required");
            return;
        }
        let url = "/config/businessunit/" + unit.id;
        var param = {
            name: unit.name,
            currency: unit.currency,
            disabled: unit.disabled,
        };
        this.sharedFunctions.putRequest(url, param).subscribe(
            (data) => {
                this.BUCopy = JSON.parse(JSON.stringify(unit));
                this.toastr.success("Business Unit Updated");
            },
            (err: any) => {
                if (this.sharedFunctions.isEmpty(err.error.message)) {
                    this.toastr.error("Internal Server Error");
                } else {
                    this.toastr.error(err.error.message);
                }
            }
        );
    }

    getBusinessUnits(isRefresh?) {
        this.loading = true;
        this.businessUnits = [];
        if (isRefresh) {
            this.resetPager();
        }
        var params = {
            limit: this.itemsPerPage,
            pageNo: this.currentPage,
        };
        this.sharedFunctions.getRequest("/config/businessunit/getAll", params).subscribe(
            (data) => {
                if (data.code == "OK") {
                    try {
                        if (
                            data.data &&
                            data.data.length
                        ) {
                            this.businessUnits = data.data;
                            this.totalItems = data.pagination.totalCount;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
                this.loading = false;
            },
            (error) => {
                this.toastr.error(error.error.message);
                this.loading = false;
            }
        );
    }
}

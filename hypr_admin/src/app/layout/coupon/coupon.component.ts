import { Component } from '@angular/core';
import { CouponService } from './coupon.service';
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../shared/services/shared-function.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as _ from 'lodash';

@Component({
    templateUrl: 'coupon.component.html',
    selector: 'coupon',
    styleUrls: ["coupon.component.scss"],
})
export class CouponComponent {

    tableData = [];
    loading = true;
    locations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    search = "";
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "couponListPage";
    couponCopy: any;
    activeIndex = -1;
    coupon = {
        coupon_customer: [],
        company_id: 0,
        index: 0
    };
    refCustomerSelectionModel: any = null;
    file_name = "";
    file: any;
    companies = [];
    companyId = "";
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        public sharedFunctions: SharedFunctionsService,
        private modalService: NgbModal,
        private couponService: CouponService) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.companyId = ""
        this.selectedBusinessUnitId = "";
        this.selectedLocationId = "";
        this.getCompanies();
        this.getbusinessUnits();
        this.getlocations();
        this.getCoupons();
    }

    getCompanies() {
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

    resetBUUnit() {
        this.businessUnits = [];
        this.selectedBusinessUnitId = "";
        this.resetLocations();
    }

    pagination(event) {
        this.currentPage = event;
        this.getCoupons();
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
                this.companyId,
                true
            )
        ) {
            params["companyId"] = this.companyId;
        }
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.selectedBusinessUnitId,
                true
            )
        ) {
            params["businessUnitId"] = this.selectedBusinessUnitId;
        }
        else if (this.sharedFunctions.isBUListPerm()) {
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
        this.resetBUUnit();
        var path = "/config/businessunit/getAll";
        let params = {};
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.companyId,
                true
            )
        ) {
            params["companyId"] = this.companyId;
        }
        else if (this.sharedFunctions.isCompanyListPerm()) {
            return;
        }
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
        this.search = "";
        this.resetPager();
        if (isRefresh) {
            this.ngOnInit();
        }
        else {
            this.getCoupons();
        }
    }

    setActiveIndex(param, index) {

        if (this[param] == index) {
            this[param] = -1;
            this.tableData[index] = this.couponCopy;
        } else {
            if (this[param] >= 0 && this.couponCopy) {
                this.tableData[this[param]] = JSON.parse(JSON.stringify(this.couponCopy));
            }
            this[param] = index;
            this.couponCopy = JSON.parse(JSON.stringify(this.tableData[index]));
        }
    }

    getCoupons() {
        this.loading = true;
        var path = "/coupons/";
        let params = {
            perPage: this.itemsPerPage,
            page: this.currentPage
        };
        if (
            this.search
        ) {
            params["search"] = this.search;
        }
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.companyId,
                true
            )
        ) {
            params["companyId"] = this.companyId;
        }
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
        }
        this.activeIndex = -1;
        this.sharedFunctions.getRequest(path, params).subscribe((data) => {
            if (data.success == true) {
                if (data.data && data.data.coupons) {
                    this.tableData = [];
                    for (let index = 0; index < data.data.coupons.length; index++) {
                        let coupon = _.clone(data.data.coupons[index]);
                        coupon.rowCount = this.sharedFunctions.getRowCount(
                            this.itemsPerPage,
                            this.currentPage,
                            index
                        );
                        coupon.startDate = this.couponService.getFormattedDate(coupon.startDate);
                        coupon.endDate = this.couponService.getFormattedDate(coupon.endDate);
                        coupon.status = this.getCouponStatus(coupon.disabled, coupon.startDate, coupon.endDate),
                        this.tableData.push(coupon);
                    }
                    this.totalItems = data.data.totalCount;
                } else {
                    this.tableData = [];
                    this.totalItems = 0;
                }
            }
            this.loading = false;
        });
    }

    getCouponStatus(disabled, startDate, endDate) {
        let today = this.couponService.getDateWithOutTime(new Date());
        if (today > endDate) {
            return "Expired";
        }
        else if (disabled) {
            return "Disabled";
        }
        else if (startDate > today) {
            return "In Active";
        }
        else {
            return "Active";
        }

    }

    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
        this.tableData = [];
    }

    updateCoupon(coupon) {
        this.loading = true;
        const params = {
            description: coupon.description,
            disabled: coupon.disabled,
            hideOnWallet: coupon.hideOnWallet,
        }
        this.sharedFunctions.putRequest("/coupons/" + coupon.id, params).subscribe(
            (data) => {
                if (data["success"] == true) {
                    this.toastr.success("Coupon updated successfully");
                    this.refresh();
                }
            },
            (err: any) => {
                this.loading = false;
                if (this.sharedFunctions.isEmpty(err.error.message)) {
                    this.toastr.error("Internal Server Error");
                } else {
                    this.toastr.error(err.error.message);
                }
            }
        );
    }

    cancelUpdate(index) {
        this.tableData[index] = this.couponCopy;
        this.setActiveIndex("activeIndex", this.activeIndex);
    }

    searchCoupons() {
        this.resetPager();
        this.getCoupons();
    }

    undoSearch() {
        this.loading = true;
        this.resetPager();
        this.search = "";
        this.getCoupons();
    }
}

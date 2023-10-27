import { Component, OnInit, ViewChild } from "@angular/core";
import { NgZone } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Globals } from "../../../globals";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared";
import { RoleConstants } from "../../../constants/roles-constants";

@Component({
    selector: "app-si-history",
    templateUrl: "./si-history.component.html",
    styleUrls: ["./si-history.component.scss"],
})
export class SiHistoryComponent implements OnInit {
    locations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    //isAdmin = false;
    allProcs = [];
    startDate = new Date();
    endDate = new Date();
    companyId = "";
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "siHistoryPage";
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    constructor(
        private http: HttpClient,
        private globals: Globals,
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        lc: NgZone,
        public sharedFunctions: SharedFunctionsService
    ) {}

    ngOnInit() {
        this.getbusinessUnits();
        this.getAllLocations();
        this.getAllProcs();
    }

    pagination(event) {
        this.currentPage = event;
        this.getAllProcs();
    }

    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
        this.allProcs = [];
    }

    getAllLocations() {
        var params = {};
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
        }
        var path = "/config/location/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data && data.data && data.data.locations) {
                    this.locations = data.data.locations;
                }
                else{
                    this.locations = [];
                }
                this.resetPager();
                this.getAllProcs();
            },
            (error) => {}
        );
    }

    getbusinessUnits() {
        var params = {};
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        }
        var path = "/config/businessunit/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
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
            },
            (error) => {}
        );
    }

    getAllProcs() {
        var path = "/inventory/getAllProcs";

        let params = {
            endDate: this.endDate,
            startDate: this.startDate,
            per_page: this.itemsPerPage,
            page: this.currentPage,
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
            this.allProcs = data.allProcs;
            this.totalItems = data.totalCount;
        });
    }
}

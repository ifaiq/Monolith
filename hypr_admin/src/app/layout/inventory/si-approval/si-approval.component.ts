import { Component, OnInit, ViewChild } from "@angular/core";
import { HttpHeaders } from "@angular/common/http";
import { Globals } from "../../../globals";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared";
import { AuthInterceptor } from "../../../http-interceptors/auth-interceptor";
import { RoleConstants } from "../../../constants/roles-constants";

@Component({
    selector: "app-si-approval",
    templateUrl: "./si-approval.component.html",
    styleUrls: ["./si-approval.component.scss"],
})
export class SiApprovalComponent implements OnInit {
    locations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    smartProcs = [];
    modified = 0;
    closeResult: string;
    itemsPerPage = 2;
    currentPage = 1;
    totalItems = 0;
    paginationId = "siApprovalPage";
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    constructor(
        private http: AuthInterceptor,
        private globals: Globals,
        private toastr: ToastsManager,
        public sharedFunctions: SharedFunctionsService
    ) {}

    ngOnInit() {
        this.getbusinessUnits();
        this.getAllLocations();
        this.getSmartProcs();
    }

    pagination(event) {
        this.currentPage = event;
        this.getSmartProcs();
    }

    resetPager() {
        this.currentPage = 1;
        this.smartProcs = [];
        this.totalItems = 0;
    }

    getAllLocations() {
        var path = "/config/location/getAll";
        var params = {};
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.selectedBusinessUnitId,
                true
            )
        ) {
            params["business_unit_id"] = this.selectedBusinessUnitId;
        }
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data && data.data && data.data.locations) {
                    this.locations = data.data.locations;
                }
                this.resetPager();
                this.getSmartProcs();
            },
            (error) => {}
        );
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
            },
            (error) => {}
        );
    }
    getSmartProcs() {
        var path = "/inventory/getSmartProcs";

        let params = {
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
            this.smartProcs = data.smartProcs;
            var smartProcs = data;
            this.totalItems = data.totalCount;
            for (var proc of smartProcs) {
                proc["modified"] = proc["quantity"];
            }
        });
    }
    approveSmartProc(proc) {
        var obj = {
            sku: proc.product_sku.sku,
            reqQty: proc.quantity,
            procQty: parseFloat(proc.modified),
            loc: this.selectedLocationId,
        };
        let headers = new HttpHeaders({
            Authorization: localStorage.getItem("authToken"),
        });
        this.http
            .post(
                this.globals.backendURI + "/inventory/approveSmartProc",
                obj,
                { headers: headers }
            )
            .map((response) => response)
            .subscribe((data) => {
                this.toastr.success("Approved");
                this.getSmartProcs();
            });
    }
    removeSmartProc(proc) {
        var obj = {
            sku: proc.product_sku.sku,
            loc: this.selectedLocationId,
        };
        let headers = new HttpHeaders({
            Authorization: localStorage.getItem("authToken"),
        });
        this.http
            .post(this.globals.backendURI + "/inventory/removeSmartProc", obj, {
                headers: headers,
            })
            .map((response) => response)
            .subscribe((data) => {
                this.toastr.success("Removed");
                this.getSmartProcs();
            });
    }
}

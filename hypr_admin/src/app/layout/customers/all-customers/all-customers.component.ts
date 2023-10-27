import { Component, OnInit, NgZone, ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { Router } from "@angular/router";
import { ActivatedRoute } from '@angular/router';
import { SharedFunctionsService } from "../../../shared";
import { NgxPermissionsService } from 'ngx-permissions';
import { RoleConstants } from "app/constants/roles-constants";
import { CompanyTypeConstants } from "app/constants/company_types";

@Component({
    selector: "app-all-customers",
    templateUrl: "./all-customers.component.html",
    styleUrls: ["./all-customers.component.scss"],
})
export class CustomersComponent implements OnInit {
    customers = [];
    search = "";
    block = "";
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    companyId = "";
    companies = [];
    startDate: any;
    endDate: any;
    isB2B = false;
    paginationId = "allCustomersPage";
    loading = false;
    constructor(
        private sharedFunctions: SharedFunctionsService,
        private toastr: ToastsManager,
        private route: ActivatedRoute,
        vRef: ViewContainerRef,
        private router: Router,
        lc: NgZone,
        private permissionsService: NgxPermissionsService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.route.queryParams.subscribe(
            (params: any) => {
                this.startDate = params['startDate'];
                this.endDate = params['endDate'];
                this.getCustomers();
                this.getCompanies();
                let userData = JSON.parse(localStorage.getItem('userData'));
                let user_company = JSON.parse(localStorage.getItem('userCompanies'));
                let check_ret = user_company.filter(comp => comp.type == CompanyTypeConstants.B2B);
                if (
                    [
                        RoleConstants.COMPANY_OWNER,
                        RoleConstants.LEADS,
                        RoleConstants.LOGISTICS,
                        RoleConstants.CARE,
                        RoleConstants.COMMERCIAL,
                        RoleConstants.GROWTH_SALES,
                        RoleConstants.MONTREAL_INTERN,
                    ].includes(
                        typeof userData.role.id == "string"
                            ? parseInt(userData.role.id)
                            : userData.role.id
                    ) &&
                    check_ret &&
                    check_ret.length > 0
                ) {
                    this.isB2B = true;
                }
            });
    }
    pagination(event) {
        this.currentPage = event;
        this.getCustomers();
    }
    getCompanies() {
        this.sharedFunctions.getRequest("/config/company/getAll").subscribe(
            (data) => {
                if (data && data.data && data.data.companies) {
                    this.companies = data.data.companies;
                }
                else {
                    this.companies = [];
                }
            },
            (error) => { }
        );
    }
    setCompanyType() {
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            let ref = this;
            let selected_company = this.companies.filter(function (comp) { return comp.id == ref.companyId })
            this.isB2B = selected_company && selected_company.length > 0 && selected_company[0].type == CompanyTypeConstants.B2B;
        }
    }

    getCustomers(isRefresh?) {
        if (isRefresh) {
            this.resetPager();
        }
        this.loading = true;
        var search = this.search;
        if (search[0] == "0" && search[1] == "3") {
            search = search.replace("03", "923");
        }
        let path = "/user/customer/getAll";
        let params = {
            pageNo: this.currentPage,
            limit: this.itemsPerPage,
            searchOnAttributes: 'name,phone',
            searchValue: search,
            block: this.block,
        };
        if (!this.sharedFunctions.emptyOrAllParam(this.startDate, true)) {
            params["startDate"] = this.sharedFunctions.getStartDate(this.startDate);
        }
        if (!this.sharedFunctions.emptyOrAllParam(this.endDate, true)) {
            params["endDate"] = this.sharedFunctions.getEndDate(this.endDate);
        }
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        }
        this.sharedFunctions.getRequest(path, params).subscribe((data) => {
            if (data && data.data && data.data.customers.length > 0) {
                var index = 0;
                var customers = [];
                for (var customer of data.data.customers) {
                    customer.rowCount = this.sharedFunctions.getRowCount(
                        this.itemsPerPage,
                        this.currentPage,
                        index
                    );
                    if (customer.addresses && customer.addresses.length > 0) {
                        customer.address = customer.addresses[0].address_line1 + " " + customer.addresses[0].address_line2
                        customer.city_area = customer.addresses[0].city_area;
                    }
                    customer.company_name = customer.company_id ? customer.company_id.name : "";
                    customers.push(customer);
                    index += 1;
                }
                this.customers = customers;
                this.totalItems = data.data.totalCount;
            } else {
                this.customers = [];
                this.totalItems = 0;
            }
            this.loading = false;
        }, (err) => {
            this.toastr.error(err.error.message);
            this.loading = false;
        });
    }

    async rowClick(id) {
        let ref = this;
        this.permissionsService.hasPermission('*').then(function (admin_perm) {
            ref.permissionsService.hasPermission('R_CUST_PROF').then(function (route_perm) {
                if (admin_perm || route_perm) {
                    ref.router.navigateByUrl(
                        "customers/get-customer/" + id
                    );
                }
            })
        })

    }
    exportNewAppCustomers() {
        let url = "/customer/getCustomerOnNewApp";
        let params = {}
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["company_id"] = this.companyId;
        }
        if (!this.sharedFunctions.emptyOrAllParam(this.startDate, true)) {
            params["startDate"] = this.sharedFunctions.getStartDate(this.startDate);
        }
        if (!this.sharedFunctions.emptyOrAllParam(this.endDate, true)) {
            params["endDate"] = this.sharedFunctions.getEndDate(this.endDate);
        }
        this.sharedFunctions.getRequest(url, params).subscribe((data) => {
            if (data.data) {
                window.open(data.data, "_self");
            }
        }, (err) => {
            if (this.sharedFunctions.isEmpty(err.error.message)) {
                this.toastr.error("Internal Server Error");
            } else {
                this.toastr.error(err.error.message);
            }
        });
    }

    undoSearch() {
        this.search = "";
        this.startDate = "";
        this.endDate = "";
        this.resetPager();
        this.getCustomers();
    }

    searchCustomers() {
        this.resetPager();
        this.getCustomers();
    }

    resetPager() {
        this.currentPage = 1;
        this.customers = [];
        this.totalItems = 0;
    }
}

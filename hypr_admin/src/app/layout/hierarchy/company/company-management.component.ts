import { Component, OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared";

@Component({
    selector: "company-management",
    templateUrl: "./company-management.component.html",
})
export class CompanyManagementComponent implements OnInit {
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "companyListPage";
    companies = [];
    activeIndex = -1;
    companyCopy = null;
    loading = false;
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private sharedFunctions: SharedFunctionsService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getCompanies();
    }

    pagination(event) {
        this.currentPage = event;
        this.getCompanies();
    }

    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
    }

    rowClick(i) {
        if (this.activeIndex == i) {
            this.activeIndex = -1;
            this.companies[i] = JSON.parse(JSON.stringify(this.companyCopy));
        } else {
            this.activeIndex = i;
            this.companyCopy = JSON.parse(JSON.stringify(this.companies[i]));
        }
    }

    updateCompany(index) {
        var company = this.companies[index];
        if (company.name) company.name.trim();
        if (company.code) company.code = company.code.trim();
        if (!company.name) {
            this.toastr.error("Company name is required");
            return;
        }
        if (!company.code) {
            this.toastr.error("Company code is required");
            return;
        }
        let url = "/company/" + company.id;
        var data = {
            id: company.id,
            disabled: company.disabled,
            image_url: company.image_url,
            name: company.name,
            code: company.code,
            emails: company.emails
        }
        this.sharedFunctions.putRequest(url, data).subscribe(
            (data) => {
                this.companyCopy = JSON.parse(JSON.stringify(company));
                this.toastr.success("Company Updated");
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

    getCompanies(isRefresh?) {
        this.loading = true;
        if (isRefresh) {
            this.resetPager();
        }
        var params = {
            limit: this.itemsPerPage,
            pageNo: this.currentPage,
        };
        this.sharedFunctions.getRequest("/config/company/getAll", params).subscribe(
            (data) => {
                if (data.code == "OK") {
                    try {
                        if (data.data.companies && data.data.companies.length) {
                            this.companies = data.data.companies;
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

import { Component, OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared";
import { Router } from "@angular/router";

@Component({
    selector: "create-bu",
    templateUrl: "./create-bu.component.html",
})
export class CreateBUComponent implements OnInit {
    business_unit = {
        name: "",
        disabled: false,
        company_id: 0,
    };
    companies = [];
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private sharedFunctions: SharedFunctionsService,
        private router: Router
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getCompanies();
    }

    createBU() {
        let url = "/config/businessunit";
        if (this.business_unit.name)
            this.business_unit.name = this.business_unit.name.trim();
        if (!this.business_unit.name) {
            this.toastr.error("Business unit name is required");
            return;
        }
        if (this.business_unit.company_id < 1) {
            this.toastr.error("Please select company for business unit");
            return;
        }
        this.sharedFunctions.postRequest(url, {
            name: this.business_unit.name,
            disabled: this.business_unit.disabled,
            companyId: this.business_unit.company_id
        }).subscribe(
            (data) => {
                if(data.data.token){
                    localStorage.setItem("authToken", data.data.token);
                    let authData = this.sharedFunctions.getAuthData();
                    authData.token = data.data.token;
                    this.sharedFunctions.setAuthData(authData);
                }
                this.toastr.success("Business unit created successfully");
                this.router.navigateByUrl("/hierarchy/business-unit");
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

    getCompanies() {
        this.companies = [];
        this.sharedFunctions.getRequest("/config/company/getAll").subscribe(
            (data) => {
                if (data && data.data && data.data.companies) {
                    this.companies = data.data.companies;
                    this.business_unit.company_id = this.companies[0].id;
                }
                else {
                    this.companies = [];
                }
            },
            (error) => { }
        );
    }
}

import { Component, OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared";
import { Router } from "@angular/router";

@Component({
    selector: "create-company",
    templateUrl: "./create-company.component.html",
})
export class CreateCompanyComponent implements OnInit {
    company = {
        name: "",
        disabled: false,
        code: ""
    };
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private sharedFunctions: SharedFunctionsService,
        private router: Router
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {}

    createCompany() {
        let url = "/company";
        if (this.company.name) this.company.name = this.company.name.trim();
        if (this.company.code) this.company.code = this.company.code.trim();
        if (!this.company.name) {
            this.toastr.error("Company name is required");
            return;
        }
        if (!this.company.code) {
            this.toastr.error("Company code is required");
            return;
        }
        this.sharedFunctions.postRequest(url, this.company).subscribe(
            (data) => {
                if(data.code == "CREATED"){
                    this.toastr.success("Company created successfully");
                    this.router.navigateByUrl("/hierarchy/company");
                }
                else{
                    this.toastr.error("Company already exists with this name");
                }
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
}

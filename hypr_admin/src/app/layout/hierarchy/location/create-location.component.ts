import { Component, OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared";
import { Router } from "@angular/router";
import { LocationService } from "../location/location-service";

@Component({
    selector: "create-location",
    templateUrl: "./create-location.component.html",
    providers: [ LocationService ]
})
export class CreateLocationComponent implements OnInit {
    location = {
        name: "",
        disabled: false,
        service_charge_type: 'FLAT',
        service_charge_value: 0,
        delivery_charge_type: 'FLAT',
        delivery_charge_value: 0,
        company_id: 0,
        business_unit_id: 0,
        phone: "",
        image_url: "",
        is_day_wise_time: 0,
        start_time: {
            hour: 0,
            minute: 0
        },
        end_time: {
            hour: 23,
            minute: 59
        },
        delivery_time:{
            hour: 0,
            minute: 0
        },
        operating_days:[],
        warehouse_address: "",
    };
    companies = [];
    business_units = [];
    Event = {
        target: {
            files: [],
        },
    };
    imageFileName = "";
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private sharedFunctions: SharedFunctionsService,
        private router: Router,
        private locService: LocationService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        // if user has permission to list companies, to avoid 401
        this.getCompanies();
        this.getbusinessUnits();
    }
    checkPositive(val) {
        return parseFloat(this.location[val]) < 0 ? this.location[val] = 0 : null
    }

    createLocation() {
        let url = "/config/location";
        if (this.location.name) this.location.name = this.location.name.trim();
        if (this.location.company_id < 1 && this.location.business_unit_id > 0) {
            let selectedUnit = this.business_units.filter(item => item.id == this.location.business_unit_id);
            if (selectedUnit.length > 0) {
                this.location.company_id = selectedUnit[0].company_id;
            }
        }
        if (!this.location.name) {
            this.toastr.error("Location name is required");
            return;
        }
        if (this.location.company_id < 1) {
            this.toastr.error("Please select company");
            return;
        }
        if (this.location.business_unit_id < 1) {
            this.toastr.error("Please select business unit");
            return;
        }
        if (!this.location.service_charge_type) {
            this.toastr.error("Please Select Service Charge Type");
            return;
        }
        if (!this.location.delivery_charge_type) {
            this.toastr.error("Please Select Delivery Charge Type");
            return;
        }
        // let msg = this.locService.validateStoreTimings(this.location);
        // if(msg){
        //     this.toastr.error(msg);
        //     return;
        // }
        // let data = this.locService.getDataToSave(this.location);
        this.sharedFunctions.postRequest(url, {
            name: this.location.name,
            disabled: this.location.disabled,
            imageUrl: this.location.image_url,
            serviceChargeType: this.location.service_charge_type,
            serviceChargeValue: this.location.service_charge_value,
            deliveryChargeType: this.location.delivery_charge_type,
            deliveryChargeValue: this.location.delivery_charge_value,
            warehouseAddress: this.location.warehouse_address,
            companyId: this.location.company_id,
            businessUnitId: this.location.business_unit_id
        }).subscribe(
            (data) => {
                if (data.data.token) {
                    localStorage.setItem("authToken", data.data.token);
                    let authData = this.sharedFunctions.getAuthData();
                    authData.token = data.data.token;
                    this.sharedFunctions.setAuthData(authData);
                }
                this.toastr.success("Location added successfully");
                this.router.navigateByUrl("/hierarchy/location");
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
        this.sharedFunctions.getRequest("/config/company/getAll").subscribe(
            (data) => {
                if (data && data.data && data.data.companies) {
                    this.companies = data.data.companies;
                    this.location.company_id = this.companies[0].id;
                    this.getbusinessUnits();
                }
                else {
                    this.companies = [];
                }
            },
            (error) => { }
        );
    }

    getbusinessUnits() {
        var params = {};
        this.business_units = [];
        this.location.business_unit_id = 0;
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.location.company_id,
                true
            )
        ) {
            params["companyId"] = this.location.company_id;
        }
        else if (this.sharedFunctions.isCompanyListPerm()) {
            return;
        }
        var path = "/config/businessunit/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data.code == "OK") {
                    try {
                        if (data.data && data.data.length) {
                            this.business_units = data.data;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            },
            (error) => {
                console.log(error);
            }
        );
    }

    uploadFile(index) {
        let fileBrowser = this.Event.target;
        if (fileBrowser.files && fileBrowser.files[0]) {
            let formData = new FormData();
            var reqPath = "/upload/uploadUserImageToS3";
            formData.append("picture", fileBrowser.files[0]);
            this.sharedFunctions.postRequest(reqPath, formData).subscribe(
                (data) => {
                    if (data.success) {
                        this.toastr.success("File/Image uploaded successfully");
                        if (data.data.link) {
                            this.location.image_url = data.data.link;
                            this.removeFile();
                        }
                    } else {
                        this.toastr.error(data.message);
                    }
                },
                (err) => { }
            );
        }
    }
    removeFile() {
        this.Event = {
            target: {
                files: [],
            },
        };
        this.imageFileName = "";
    }
    onFileChange(event) {
        this.Event = event;
        let fileBrowser = this.Event.target;
        if (fileBrowser.files && fileBrowser.files[0]) {
            this.imageFileName = fileBrowser.files[0].name;
        }
    }


}

import { Component, OnInit } from "@angular/core";
import { CouponService } from "../coupon.service";
import { Router } from "@angular/router";
import { SharedFunctionsService } from "../../../shared";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { ViewContainerRef } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: "add-coupon",
    templateUrl: "./add-coupon.component.html",
    styleUrls: ["../coupon.component.scss"],
})
export class AddCouponComponent implements OnInit {
    coupon :any = {
        name: "",
        description: "",
        startDate: new Date(),
        endDate: new Date(),
        couponCustomers: [],
        discountValue: 0,
        disabled: false,
        hideOnWallet: false,
        discountTypeId: 1,
        locationId: "",
        businessUnitId: "",
        companyId: "",
        couponCustomerOptionId: 1,
        productsListType: 0,
        minCouponLimit: 0,
        maxDiscountValue: 0,
        maxUsagePerCustomer: 0,
        userTypeId: '8'
    };
    business_units = [];
    locations = [];
    selectedCustomer = "";
    refCustomerSelectionModel: any = null;
    customer_file_name = "";
    customer_file: any;
    sku_data = [];
    loading = false;
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private router: Router,
        public couponService: CouponService,
        public sharedFunctions: SharedFunctionsService,
        private modalService: NgbModal,
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getbusinessUnits();
        this.getlocations();
    }

    locationChanged() {
        if (this.coupon.locationId) {
            let selectedLocation = this.locations.filter(
                (item) => item.id == this.coupon.locationId
            );
            if (selectedLocation.length > 0) {
                if (this.coupon.companyId != selectedLocation[0].company_id) {
                    this.coupon.couponCustomers = [];
                }
                this.coupon.companyId = selectedLocation[0].company_id;
            }
        }
    }

    getlocations() {
        var params = {};
        this.coupon.locationId = "";
        this.coupon.couponCustomers = [];
        this.locations = [];
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.coupon.businessUnitId,
                true
            )
        ) {
            params["business_unit_id"] = this.coupon.businessUnitId;
        } else if (this.sharedFunctions.isBUListPerm()) {
            return;
        }
        var path = "/config/location/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe((data) => {
            if (data && data.data && data.data.locations) {
                this.locations = data.data.locations;
                if (this.locations.length > 0) {
                    this.coupon.locationId = this.locations[0].id;
                    this.locationChanged();
                }
            } else {
                this.locations = [];
            }
        });
    }

    getbusinessUnits() {
        var params = {};
        this.business_units = [];
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

    createCoupon() {
        if (!this.sharedFunctions.isBUListPerm()) {
            if (this.coupon.locationId) {
                let location = this.locations.filter(
                    (item) => item.id == this.coupon.locationId
                );
                if (location.length > 0) {
                    this.coupon.businessUnitId = location[0].business_unit_id;
                    this.coupon.companyId = location[0].company_id;
                }
            }
        }
        let msg = this.couponService.validateCoupon(this.coupon, this.customer_file);
        if (msg) {
            this.toastr.error(msg);
            return;
        }
        if (
            !this.customer_file ||
            this.coupon.couponCustomerOptionId !=
            this.couponService.selectedCustomerOption
        ) {
            this.saveCoupon();
        } else {
            this.upload();
        }
    }

    removeSelectedCustomer(customer) {
        this.couponService.removeSelectedCustomer(this.coupon, customer);
    }

    openCustomerSelectionPopover(customerSelection) {
        if (
            this.sharedFunctions.emptyOrAllParam(this.coupon.locationId, true)
        ) {
            this.toastr.error("Please select location for coupon first");
            return;
        }
        this.refCustomerSelectionModel = this.modalService.open(
            customerSelection
        );
    }

    closeCustomerSelection(event) {
        if (event && event.isAdd) {
            setTimeout(() => {
                this.coupon.couponCustomers = event.couponCustomers;
            }, 10);
        }
        if (this.refCustomerSelectionModel) {
            this.refCustomerSelectionModel.close();
        }
    }

    onChangeCustomer(event: EventTarget) {
        let eventObj: MSInputMethodContext = <MSInputMethodContext>event;
        let target: HTMLInputElement = <HTMLInputElement>eventObj.target;
        let files: FileList = target.files;
        this.customer_file = files[0];
        this.customer_file_name = files[0].name;
    }

    onSkuListFileChange(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            const file: File = files.item(0);
            const reader: FileReader = new FileReader();
            reader.readAsText(file);
            reader.onload = (e) => {
                let csvData = reader.result;
                this.sku_data = ((<string>csvData).split("\n")
                    .filter(sku => sku != "")
                    .map(sku => {
                        return sku.trim();
                    }));
                this.sku_data.shift();
            }
        }
    }

    upload() {
        let formData = new FormData();
        formData.append("file", this.customer_file);
        this.sharedFunctions
            .postRequest("/upload/uploadFileToS3", formData)
            .subscribe(
                (data) => {
                    if (data.success) {
                        this.customer_file_name = data.data.name;
                        let file = {
                            fileName: data.data.name,
                            fileUrl: data.data.file[0].extra.Location,
                        };
                        this.saveCoupon(file);
                    }
                },
                (err) => { }
            );
    }

    clearFileCustomer() {
        try {
            let fileForm: any = document.getElementById("fileFormCustomer");
            fileForm.reset();
            this.customer_file = null;
            this.customer_file_name = "";
        } catch (e) { }
    }

    clearFileSku() {
        try {
            let fileForm: any = document.getElementById("fileFormSku");
            fileForm.reset();
            this.sku_data = [];
        } catch (e) { }
    }

    saveCoupon(file?) {
        this.loading = true;
        const userTypeId = this.coupon.userTypeId.split(',').map(Number) 
        let url = "/coupons/";
        let data = this.couponService.getCouponToSave(this.coupon);
        data.userTypeId = JSON.stringify(userTypeId);
        if (file) {
            data.file = file;
        }
        if (this.sku_data.length != 0 && this.coupon.discountTypeId == this.couponService.coupon_discount_types[0].id) {
            data.couponSkus = this.sku_data;
        }
        this.sharedFunctions.postRequest(url, data).subscribe(
            (data) => {
                this.loading = false;
                this.toastr.success("Coupon created successfully");
                this.router.navigateByUrl("/coupon")
                this.clearFileCustomer();
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

    setNumberToOneDecimal(id) {
        let value = document.getElementById(id)["value"];
        if (value % 1 != 0 && value.split('.')[1].length > 1) {
            value = value.split('.');
            value[1] = value[1][0];
            value = value[0] + '.' + value[1];
            document.getElementById(id)['value'] = parseFloat(value);
        }

        if (parseInt(this.coupon.discountTypeId) === this.couponService.coupon_discount_types[0].id && this.coupon.discountValue > 100) {
            document.getElementById(id)['value'] = 100;
        }
    }
}

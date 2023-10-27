import _ from "lodash";
import { Component } from "@angular/core";
import { OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { ActivatedRoute } from "@angular/router";
import { SharedFunctionsService } from "../../../shared";
import { CompanyTypeConstants } from "../../../constants/company_types";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: "app-get-customer",
    templateUrl: "./get-customer.component.html",
    styleUrls: ["./get-customer.component.scss"],
})
export class GetCustomerComponent implements OnInit {
    shop_open_time = { hour: null, minute: null };
    shop_close_time = { hour: null, minute: null };
    shop_preferred_delivery_time = {
        morning: false,
        afternoon: false,
        evening: false,
        night: false,
    };
    shop_closed_days = {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
    };
    loading = true;
    isB2B = false;
    refModal1: any;
    businessUnits = [];
    customer = {
        name: "",
        totalCompletedOrders: 0,
        totalValue: 0,
        pendingOrders: 0,
        mostOrderedItems: 0,
        totalOrders: 0,
        phone: "",
        customer_address_id: 0,
        address: "",
        city_area: "",
        shop_name: "",
        order_mode_name: "",
        order_mode: 0,
        shop_type: "",
        shop_type_id: 0,
        shop_id: 0,
        shop_open_time: "",
        shop_close_time: "",
        shop_preferred_delivery_time: "",
        shop_closed_days: "",
        company: "",
        business_unit_id: 0,
        bu_name: "",
        cnic: "",
        popularItems: 0,
        company_id: null,
        customer_location_id: { location: "", images: "" },
        cnic_picture: "",
        shop_picture: "",
        tax_id: "",
        customer_type: "",
        taxGroupId: "",
    };
    userId;
    currentLongitude;
    currentLatitude;
    latitude;
    longitude;
    newLongitude;
    newLatitude;
    images = [];
    cityAreas = [];
    orderModes = [];
    shopTypes = [];
    customerID;
    cnic_picture = {
        event: null,
        file_name: "",
    };

    shop_picture = {
        event: null,
        file_name: "",
    };
    taxGroups = [];
    taxInformation = [];

    constructor(
        private sharedFunctions: SharedFunctionsService,
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private activatedRoute: ActivatedRoute,
        private modalService: NgbModal
    ) {
        this.toastr.setRootViewContainerRef(vRef);
        this.activatedRoute.params.subscribe((params) => {
            this.userId = params["id"];
        });
    }

    ngOnInit() {
        this.sharedFunctions
            .getRequest(
                "/user/customer/profile?id=" + this.userId
            )
            .subscribe(
                (data) => {
                    this.customer = data.data.customer;
                    this.isB2B =
                        data.data.customer.company_id.type ==
                        CompanyTypeConstants.B2B;
                    if (this.isB2B) {
                        this.getCityAreas();
                        this.getOrderModes();
                        this.getbusinessUnits();
                        this.getShopTypes();
                    }
                    if (this.customer.business_unit_id == 4) {
                        this.customerID = 'CNIC';
                    }
                    if (this.customer.business_unit_id == 26) {
                        this.customerID = 'CR';
                    }
                    if (this.customer.customer_type === "Business") {
                        this.customer.customer_type = "1";
                    }
                    if (this.customer.customer_type === "Individual") {
                        this.customer.customer_type = "2";
                    }
                    if (
                        !this.sharedFunctions.emptyOrAllParam(
                            this.customer.shop_open_time
                        )
                    ) {
                        this.shop_open_time["hour"] = Number(
                            this.customer.shop_open_time.substr(0, 2)
                        );
                        this.shop_open_time["minute"] = Number(
                            this.customer.shop_open_time.substr(2, 4)
                        );
                    }
                    if (
                        !this.sharedFunctions.emptyOrAllParam(
                            this.customer.shop_close_time
                        )
                    ) {
                        this.shop_close_time["hour"] = Number(
                            this.customer.shop_close_time.substr(0, 2)
                        );
                        this.shop_close_time["minute"] = Number(
                            this.customer.shop_close_time.substr(2, 4)
                        );
                    }
                    if (
                        !this.sharedFunctions.emptyOrAllParam(
                            this.customer.shop_preferred_delivery_time
                        )
                    ) {
                        var time_obj = this.customer
                            .shop_preferred_delivery_time;
                        const values = Object.keys(time_obj).map(
                            (key) => time_obj[key]
                        );
                        const shop_preferred_delivery_time = values
                            .join(",")
                            .split(",")
                            .filter((item) => item);
                        for (const item in shop_preferred_delivery_time) {
                            let i = 0;
                            for (const time in this
                                .shop_preferred_delivery_time) {
                                if (
                                    i.toString() ===
                                    shop_preferred_delivery_time[item]
                                ) {
                                    this.shop_preferred_delivery_time[
                                        time
                                    ] = true;
                                }
                                i = i + 1;
                            }
                        }
                    }
                    if (
                        !this.sharedFunctions.emptyOrAllParam(
                            this.customer.shop_closed_days
                        )
                    ) {
                        var day_obj = this.customer.shop_closed_days;
                        const values = Object.keys(day_obj).map(
                            (key) => day_obj[key]
                        );
                        const shop_closed_days = values
                            .join(",")
                            .split(",")
                            .filter((item) => item);
                        for (const item in shop_closed_days) {
                            let j = 0;
                            for (const day in this.shop_closed_days) {
                                if (j.toString() === shop_closed_days[item]) {
                                    this.shop_closed_days[day] = true;
                                }
                                j = j + 1;
                            }
                        }
                    }
                    if (
                        data.data.customer.addresses &&
                        data.data.customer.addresses.length > 0
                    ) {
                        this.customer.address = data.data.customer.addresses[0].address_line1;
                        (this.customer.customer_address_id =
                            data.data.customer.addresses[0].id),
                            (this.customer.city_area =
                                data.data.customer.addresses[0].city_area);
                        var coords = JSON.parse(
                            data.data.customer.addresses[0].location_cordinates
                        );
                        if (coords.cordinates) {
                            coords = coords.cordinates;
                        }
                        this.currentLongitude = coords.longitude;
                        this.currentLatitude = coords.latitude;
                        if (this.isB2B) {
                            this.newLongitude = this.currentLongitude;
                            this.newLatitude = this.currentLatitude;
                        }
                        this.longitude = coords.longitude;
                        this.latitude = coords.latitude;
                    }
                    if (!this.customer.hasOwnProperty("customer_location_id")) {
                        this.customer.customer_location_id = {
                            location: "",
                            images: "",
                        };
                    } else {
                        if (
                            this.customer.customer_location_id.images &&
                            this.customer.customer_location_id.images != ""
                        ) {
                            this.images = JSON.parse(
                                this.customer.customer_location_id.images
                            );
                        }
                    }
                    // Tax Group API call
                    const customerTaxGroupsUrl = "/taxation/api/v1/customer-tax-groups/" + this.userId;
                    this.sharedFunctions.getRequest(customerTaxGroupsUrl)
                    .subscribe((data) => {
                        this.customer.taxGroupId = data.data.taxGroup.id;
                        if (data.data.taxGroup.id) {
                            this.onChangeTaxGroup(data.data.taxGroup.id);
                        }
                    },
                    (err) => {
                        // Temporary Commenting this out, will be used once we made TaxGroup field mandatory
                        // this.toastr.error('TAX GROUP ' + err.error.errors[0].name);
                    }
                    );
                    this.loading = false;
                },
                (err) => {
                    this.toastr.error(err.error.message);
                    this.loading = false;
                }
            );
            this.fetchTaxGroups();
    }

    updateCustomer() {
        let shopType = this.shopTypes.filter(
            (item) => item.name == this.customer.shop_type
        );
        if (shopType.length > 0) {
            this.customer.shop_type_id = shopType[0].id;
        }
        if (!this.customer.name) {
            this.toastr.error("Customer name required");
            return;
        }
        if (!this.customer.address) {
            this.toastr.error("Customer address required");
            return;
        }

        if (this.customer.tax_id == '0' || Number(this.customer.tax_id) < 0) {
            this.toastr.error("Enter a valid VAT number");
            return;
        }

        if (this.customer.tax_id) {
            if (String(this.customer.tax_id).length !== 15) {
                this.toastr.error("Customer VAT number should be of 15 digits long.");
                return;
            }
            else if (_.uniq(String(this.customer.tax_id)).length === 1) {
                this.toastr.error("Enter a valid VAT number");
                return;
            }
        }
        if (this.customer.customer_type === "1") {
            this.customer.customer_type = "Business"
        }
        if (this.customer.customer_type === "2") {
            this.customer.customer_type = "Individual"
        }
        if (this.newLatitude && this.newLongitude) {
            this.customer["customer_location_id"].location = JSON.stringify({
                longitude: this.newLongitude,
                latitude: this.newLatitude,
            });
        } else {
            this.customer["customer_location_id"].location = "";
        }
        function toTwoDiggit(time) {
            if (time.length === 1) {
                time = "0" + time;
            }
            return time;
        }
        if (
            this.shop_open_time.hour !== null &&
            this.shop_open_time.minute !== null
        ) {
            var shop_open_hour = toTwoDiggit(
                this.shop_open_time.hour.toString()
            );
            var shop_open_minute = toTwoDiggit(
                this.shop_open_time.minute.toString()
            );
            this.customer.shop_open_time = shop_open_hour + shop_open_minute;
        }
        if (
            this.shop_close_time.hour !== null &&
            this.shop_close_time.minute !== null
        ) {
            var shop_close_hour = toTwoDiggit(
                this.shop_close_time.hour.toString()
            );
            var shop_close_minute = toTwoDiggit(
                this.shop_close_time.minute.toString()
            );
            this.customer.shop_close_time = shop_close_hour + shop_close_minute;
        }
        this.customer.shop_preferred_delivery_time = null;
        let shop_preferred_delivery_time = [];
        let i = 0;
        for (const value in this.shop_preferred_delivery_time) {
            if (this.shop_preferred_delivery_time[value]) {
                shop_preferred_delivery_time.push(i);
            }
            i = i + 1;
        }
        this.customer.shop_preferred_delivery_time = shop_preferred_delivery_time.toString();
        let shop_closed_days = [];
        let j = 0;
        for (const value in this.shop_closed_days) {
            if (this.shop_closed_days[value]) {
                shop_closed_days.push(j);
            }
            j = j + 1;
        }
        this.customer.shop_closed_days = shop_closed_days.toString();
        let customer = JSON.parse(JSON.stringify(this.customer));
        if (this.customer.company_id)
            customer.company_id = this.customer.company_id.id;
        if (this.customer.company_id.code == "RET") customer["B2B"] = true;
        const customerTaxGroupUrl = "/taxation/api/v1/customer-tax-groups";
        this.sharedFunctions
            .postRequest("/user/customer/updateCustomerProfile", customer)
            .subscribe(
                (data) => {
                    if (this.customer.taxGroupId) {
                        this.sharedFunctions.postRequest(customerTaxGroupUrl, {
                            customerId: Number(this.userId),
                            taxGroupId: this.customer.taxGroupId
                        }).subscribe((data) => {
                            this.toastr.success("Customer updated successfully");
                        }, (err) => {
                            this.toastr.error('TAX GROUP ' + err.error.errors[0].name);
                        })
                    } else {
                        this.toastr.success("Customer updated successfully");
                    }
                },
                (err) => {
                    if (this.sharedFunctions.isEmpty(err.error.message)) {
                        this.toastr.error("Internal Server Error");
                    } else {
                        this.toastr.error(err.error.message);
                    }
                }
            );
    }

    getRedIcon() {
        return "/assets/images/marked_houses.png";
    }

    getGreenIcon() {
        return "/assets/images/placed_order.png";
    }
    openModal1(content) {
        this.refModal1 = this.modalService.open(content);
    }

    closeModal() {
        if (this.refModal1) this.refModal1.close();
    }

    mapClicked($event) {
        console.log($event);
        if (this.isB2B) {
            return false;
        }
        this.newLatitude = $event.coords.lat;
        this.newLongitude = $event.coords.lng;
    }

    getCityAreas() {
        let url = "/city/areas";
        this.sharedFunctions.getRequest(url).subscribe((data) => {
            if (data.data && data.data.length > 0) {
                this.cityAreas = data.data;
            }
        });
    }

    getOrderModes() {
        let url = "/user/order-mode";
        this.sharedFunctions.getRequest(url).subscribe((data) => {
            if (
                data.data &&
                data.data.orderModes &&
                data.data.orderModes.length > 0
            ) {
                this.orderModes = data.data.orderModes;
            }
        });
    }

    orderModeChanged() {
        let selectedMode: any = this.orderModes.filter(
            (item) => item.id == this.customer.order_mode
        );
        this.customer.order_mode_name = selectedMode.name;
    }

    BUChanged() {
        let selectedBU: any = this.businessUnits.filter(
            (item) => item.id == this.customer.business_unit_id
        );
        this.customer.bu_name = selectedBU.name;
        this.fetchTaxGroups();
    }

    getbusinessUnits() {
        var params = {};
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.customer.company_id.id,
                true
            )
        ) {
            params["companyId"] = this.customer.company_id.id;
        } else if (this.sharedFunctions.isCompanyListPerm()) {
            return;
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
            (error) => { }
        );
    }

    getShopTypes() {
        let url = "/user/shop-type";
        this.sharedFunctions.getRequest(url).subscribe((data) => {
            if (
                data.data &&
                data.data.shopTypes &&
                data.data.shopTypes.length > 0
            ) {
                this.shopTypes = data.data.shopTypes;
            }
        });
    }

    uploadFile(picture, field) {
        let fileBrowser = picture.event.target;
        if (fileBrowser.files && fileBrowser.files[0]) {
            let formData = new FormData();
            var reqPath = "/upload/uploadUserImageToS3";
            formData.append("picture", fileBrowser.files[0]);
            this.sharedFunctions.postRequest(reqPath, formData).subscribe(
                (data) => {
                    if (data.success) {
                        this.toastr.success("File/Image uploaded successfully");
                        if (data.data.link) {
                            this.customer[field] = data.data.link;
                            this.removeFile(field);
                        }
                    } else {
                        this.toastr.error(data.message);
                    }
                },
                (err) => { }
            );
        }
    }
    removeFile(key) {
        this[key].event = {
            target: {
                files: [],
            },
        };
        this[key].file_name = "";
    }
    onFileChange(event, key) {
        this[key].event = event;
        let fileBrowser = this[key].event.target;
        if (fileBrowser.files && fileBrowser.files[0]) {
            this[key].file_name = fileBrowser.files[0].name;
        }
    }
    fetchTaxGroups() {
        const url = "/taxation/api/v1/tax-groups";
        let params = {};
        params["type"] = "customer";
        if (!this.sharedFunctions.emptyOrAllParam(this.customer.business_unit_id)) {
            params["locationId"] = this.customer.business_unit_id;
          }
        this.sharedFunctions.getRequest(url, params).subscribe((data) => {
            if (data && data.data) {
              this.taxGroups = data.data;
            }
            this.loading = false;
          }, err => {
              this.loading = false;
              console.log(err);
          });
    }
    onChangeTaxGroup(value) {
        const url = '/taxation/api/v1/tax-groups/' + value;
        this.loading = true;
        this.sharedFunctions.getRequest(url).subscribe((data) => {
            this.taxInformation = data.data.taxCodes;
            this.loading = false;
        });
    }
}

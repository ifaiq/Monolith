import { Component, OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared";
import { LocationService } from "../location/location-service";

@Component({
    selector: "location-management",
    templateUrl: "./location.management.component.html",
    styleUrls: ["./location-management.component.scss"],
    providers: [LocationService],
})
export class LocationManagementComponent implements OnInit {
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "locationListPage";
    locations = [];
    activeIndex = -1;
    locationCopy = null;
    loading = false;
    Event = {
        target: {
            files: [],
        },
    };
    imageFileName = "";

    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        public sharedFunctions: SharedFunctionsService,
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getAllLocations();
    }

    pagination(event) {
        this.currentPage = event;
        this.getAllLocations();
    }

    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
    }

    rowClick(i) {
        if (this.activeIndex == i) {
            this.activeIndex = -1;
            this.locations[i] = JSON.parse(JSON.stringify(this.locationCopy));
        } else {
            this.activeIndex = i;
            this.removeFile();
            this.locationCopy = JSON.parse(JSON.stringify(this.locations[i]));
        }
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
                            this.locations[index].image_url = data.data.link;
                            this.updateLocation(index);
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
    checkPositive(val, index) {
        return parseFloat(this.locations[index][val]) < 0
            ? (this.locations[index][val] = 0)
            : null;
    }

    updateLocation(index) {
        var location = this.locations[index];
        if (location.name) location.name.trim();
        if (!location.name) {
            this.toastr.error("Location name is required");
            return;
        }
        if (!location.service_charge_type) {
            this.toastr.error("Please Select Service Charge Type");
            return;
        }
        if (!location.min_order_limit) {
            this.toastr.error("Please Select Minimum Order Limit");
            return;
        }
        const minOrderFreeDeliveryCheck = parseFloat(location.free_delivery_limit) 
        && !!location.min_order_limit 
        && parseFloat(location.free_delivery_limit) < parseFloat(location.min_order_limit);
        if (minOrderFreeDeliveryCheck) {
            this.toastr.error("Free Delivery Limit cannot be less than Min. Order Limit");
            return;
        }

        if (!location.delivery_charge_type) {
            this.toastr.error("Please Select Delivery Charge Type");
            return;
        }
        if (location.max_order_limit && location.min_order_limit > location.max_order_limit) {
            this.toastr.error("Minimum Order Limit Cannot Exceed Maximum Order Limit");
            return;
        }
        let url = "/config/location/" + location.id;
        // let msg = this.locService.validateStoreTimings(location);
        // if (msg) {
        //     this.toastr.error(msg);
        //     return;
        // }
        // msg = this.locService.validateEvents(location);
        // if (msg) {
        //     this.toastr.error(msg);
        //     return;
        // }
        // let dataToSave = this.locService.getDataToSave(location);
        var param = {
            name: location.name,
            // priority: location.priority,
            disabled: location.disabled,
            // company_id: location.company_id.id,
            imageUrl: location.image_url,
            // business_unit_id: location.business_unit_id.id,
            serviceChargeType: location.service_charge_type,
            serviceChargeValue: location.service_charge_value,
            deliveryChargeType: location.delivery_charge_type,
            deliveryChargeValue: location.delivery_charge_value,
            minOrderLimit: location.min_order_limit,
            maxOrderLimit: location.max_order_limit,
            freeDeliveryLimit: location.free_delivery_limit,
            // is_day_wise_time: dataToSave.is_day_wise_time ? true : false,
            // delivery_time: dataToSave.delivery_time,
            // operating_days: dataToSave.operating_days,
            // events: dataToSave.events,
            warehouseAddress: location.warehouse_address,
        };
        this.sharedFunctions.putRequest(url, param).subscribe(
            (data) => {
                if (data['data'].id) {
                    // dataToSave["operating_days"] = data['data'].operating_days;
                    // dataToSave["events"] = data['data'].events;
                    // this.locations[index] = this.locService.setDataForLocation(
                    //     dataToSave
                    // );
                    // this.locationCopy = JSON.parse(
                    //     JSON.stringify(this.locations[index])
                    // );
                }
                this.toastr.success("Location Updated");
                this.getAllLocations();
                this.activeIndex = -1;
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

    onFileChange(event) {
        this.Event = event;
        let fileBrowser = this.Event.target;
        if (fileBrowser.files && fileBrowser.files[0]) {
            this.imageFileName = fileBrowser.files[0].name;
        }
    }

    getAllLocations(isRefresh?) {
        this.loading = true;
        this.locations = [];
        if (isRefresh) {
            this.resetPager();
        }
        var params = {
            limit: this.itemsPerPage,
            pageNo: this.currentPage,
        };
        this.sharedFunctions
            .getRequest("/config/location/getAll", params)
            .subscribe(
                (data) => {
                    if (data.code == "OK") {
                        try {
                            if (
                                data.data.locations &&
                                data.data.locations.length
                            ) {
                                this.locations = data.data.locations;
                                // for (
                                //     var index = 0;
                                //     index < tempData.length;
                                //     index++
                                // ) {
                                //     this.locations.push(
                                //         this.locService.setDataForLocation(
                                //             tempData[index]
                                //         )
                                //     );
                                // }
                                // console.log("LOCATIONS", this.locations);
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

import { Component, OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared";
import { RoleConstants } from "../../../constants/roles-constants";
@Component({
    selector: "app-inventory-in",
    templateUrl: "./inventory-in.component.html",
    styleUrls: ["./inventory-in.component.scss"],
})
export class InventoryInComponent implements OnInit {
    locations = [];
    cellLocations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    requestSent = false;
    Products = [];
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    paginationId = "inventoryINPage";
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        public sharedFunctions: SharedFunctionsService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getbusinessUnits();
        this.getlocations();
        this.getPackages();
        this.getPriceUpdates();
    }

    pagination(event) {
        this.currentPage = event;
        this.getPackages();
    }

    getPriceUpdates() {
        this.sharedFunctions
            .getRequest("/price/getProductUpdatePriceRequests")
            .subscribe(
                (data) => {
                    this.Products = data.products;
                },
                (error) => {}
            );
    }
    getlocations() {
        var path = "/config/location/getAll";
        var params = {}
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
                if (data.code == "OK") {
                    if (data.data && data.data.locations) {
                        this.cellLocations = data.data.locations;
                    }
                }
                this.getPackages();
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

    getPackages() {
        var path = "/store/getStorePackages";

        let params = {
            per_page: this.itemsPerPage,
            page: this.totalItems,
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
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                this.locations = data.locations;
                this.totalItems = data.totalCount;
                if (this.locations.length == 0 && this.currentPage == 1) {
                    this.toastr.error("No packages Found");
                }
            },
            (error) => {}
        );
    }

    setQuantity(quantity, locIndex, itemIndex) {
        if (
            this.locations[locIndex].items[itemIndex].quantity + quantity >
                -1 &&
            quantity == -1
        ) {
            this.locations[locIndex].items[itemIndex].quantity += quantity;
        } else if (
            this.locations[locIndex].items[itemIndex].quantity + quantity <=
                this.locations[locIndex].items[itemIndex].original_quantity &&
            quantity == 1
        ) {
            this.locations[locIndex].items[itemIndex].quantity += quantity;
        } else {
            return false;
        }
    }

    updateInventory(index) {
        if (this.requestSent) {
            return false;
        }

        var items = this.locations[index].items;
        var location_id = this.locations[index].location_id;
        var package_ids = this.locations[index].package_ids;
        var stockIn = [],
            costPriceUpdateList = [];

        for (var item of items) {
            stockIn.push({
                product_sku: item.sku,
                quantity: item.quantity,
                location_id: location_id,
            });

            costPriceUpdateList.push({
                sku: item.sku,
                price: item.price,
                location_id: this.selectedLocationId,
            });
        }

        this.requestSent = true;
        this.updateCostPrice(costPriceUpdateList);

        this.sharedFunctions
            .postRequest("/package/markPackageStatus", {
                package_ids: package_ids,
                status: "Received_By_SM",
                forStockIn: stockIn,
            })
            .subscribe(
                (data) => {
                    this.locations.splice(index, 1);
                    this.totalItems -= 1;
                    this.requestSent = false;
                },
                (error) => {
                    var body = JSON.parse(error._body);
                    this.toastr.error(body.message);
                    this.requestSent = false;
                }
            );
    }

    accept(item, status) {
        var obj = {
            request_id: item.id,
            sku: item.sku.sku,
            status: status,
            location_id: this.selectedLocationId,
            new_price: item.price,
        };
        this.sharedFunctions
            .postRequest("/price/updateProductPriceUpdateRequest", obj)
            .subscribe(
                (data) => {
                    var index = this.Products.indexOf(item);
                    this.Products.splice(index, 1);
                    this.toastr.success("Request " + status);
                },
                (error) => {
                    this.toastr.error("Can not update price");
                }
            );
    }

    updateCostPrice(list) {
        this.sharedFunctions
            .postRequest("/product/updateCostPrices", list)
            .subscribe(
                (data) => {},
                (error) => {}
            );
    }
}

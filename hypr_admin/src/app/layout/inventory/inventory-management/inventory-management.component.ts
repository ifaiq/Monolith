import { Component, OnInit, ViewChild } from "@angular/core";
import { NgZone } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { SharedFunctionsService } from "../../../shared";
@Component({
    selector: "app-inventory-management",
    templateUrl: "./inventory-management.component.html",
    styleUrls: ["./inventory-management.component.scss"],
})
export class InventoryManagementComponent implements OnInit {
    @ViewChild("fileInput") fileInput;
    products = [];
    search = "";
    userLocation = "";
    loading = false;
    searchProductStr = "";
    page = 1;
    per_page = 10;
    file;
    file_name = "";
    closeResult: string;
    requestSSent = false;
    requestSent = false;
    inventoryEntries = [];
    locations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    inventory = [];
    selectedStatus = "";
    selectedvalue = "";
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "inventoryManagePage";
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private modalService: NgbModal,
        lc: NgZone,
        public sharedFunctions: SharedFunctionsService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    pagination(event) {
        this.currentPage = event;
        this.getInventory("");
    }

    resetPager() {
        this.currentPage = 1;
        this.loading = false;
        this.totalItems = 0;
        this.inventory = [];
    }

    ngOnInit() {
        this.getbusinessUnits();
        this.getlocations();
        this.getInventory("");
        this.searchProduct();
    }

    refresh() {
        this.loading = true;
        this.search = "";
        this.selectedStatus = "";
        this.selectedLocationId = "";
        this.selectedBusinessUnitId = "";
        this.selectedvalue = "";
        this.page = 1;
        this.resetPager();
        this.ngOnInit();
    }

    onBoard(data) {
        let user = JSON.parse(localStorage.getItem("userData"));
        let obj = {
            file_name: data.name,
            user_id: user.id,
            file_url: data.file[0].extra.Location,
            bulk: true,
        };
        this.sharedFunctions
            .postRequest("/inventory/CSVStockIn", obj)
            .subscribe((data) => {
                this.toastr.info("Inventory on-boarding in progress");
            });
    }

    onChange(event: EventTarget) {
        let eventObj: MSInputMethodContext = <MSInputMethodContext>event;
        let target: HTMLInputElement = <HTMLInputElement>eventObj.target;
        let files: FileList = target.files;
        this.file = files[0];
    }

    upload() {
        let formData = new FormData();
        formData.append("file", this.file);
        this.sharedFunctions
            .postRequest("/upload/uploadFileToS3", formData)
            .subscribe(
                (data) => {
                    if (data.success) {
                        console.log("RESPONSE DATA", data);
                        this.file_name = data.data.name;
                        this.toastr.success("File uploaded successfully");
                        this.onBoard(data.data);
                    }
                },
                (err) => {}
            );
    }

    getInventory(value) {
        if (this.loading) {
            return false;
        }
        if (value == "search") {
            this.resetPager();
        }
        this.loading = true;
        var path = "/inventory/getall";

        let params = {
            page: this.currentPage,
            per_page: this.itemsPerPage,
        };
        if (!this.sharedFunctions.emptyOrAllParam(this.search))
            params["search"] = this.search;
        if (!this.sharedFunctions.emptyOrAllParam(this.selectedStatus))
            params["disabled"] = this.selectedStatus;
        if (!this.sharedFunctions.emptyOrAllParam(this.selectedvalue))
            params["quantity"] = this.selectedvalue;

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
            var index = 0;
            var inventory = [];
            data = data.data;
            for (var inv of data.inventory) {
                inv.rowCount = this.sharedFunctions.getRowCount(
                    this.itemsPerPage,
                    this.currentPage,
                    index
                );
                inventory.push(inv);
                index += 1;
            }
            this.inventory = inventory;
            this.totalItems = data.totalCount;
            this.loading = false;
        }, err => {
            this.toastr.error(err.error.message);
            this.loading = false;
        });
    }

    searchProduct(search = "") {
        if (search === "clear") {
            this.searchProductStr = "";
        }

        if (search === "loadMore") {
            this.page++;
        } else {
            this.products = [];
            this.page = 1;
        }

        this.selectedStatus === "" ?
            "" : this.selectedStatus === "0" ?
                "true" : "false";

        var path = "/product/getAllProducts";

        let params = {
            search: this.searchProductStr,
            page: this.page,
            per_page: this.per_page,
            disabled: this.selectedStatus,
            isAdmin: 1
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
            var products = data.data.products;
            if (products.length > 0) {
                for (var product of products) {
                    this.products.push(product);
                }
            }
        });
    }

    resetLocations() {
        this.selectedLocationId = "";
        this.locations = [];
    }

    getlocations() {
        this.resetLocations();
        var params = {};
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.selectedBusinessUnitId,
                true
            )
        ) {
            params["business_unit_id"] = this.selectedBusinessUnitId;
        }
        else if(this.sharedFunctions.isBUListPerm()){
            return;
        }
        var path = "/config/location/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data && data.data && data.data.locations) {
                    this.locations = data.data.locations;
                }
                if (this.locations.length == 1)
                    this.selectedLocationId = this.locations[0].id;
                /*this.resetPager();
                this.getInventory("");*/
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
                this.getInventory("");
            },
            (error) => {}
        );
    }

    undoInvSearch() {
        this.search = "";
        this.resetPager();
        this.getInventory("");
    }

    open(content) {
        if (this.selectedLocationId == "" || !this.selectedLocationId) {
            this.toastr.error("PLEASE SELECT LOCATION");
            return false;
        }
        this.modalService.open(content).result.then(
            (result) => {
                this.closeResult = `Closed with: ${result}`;
            },
            (reason) => {
                this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
            }
        );
    }

    private getDismissReason(reason: any): string {
        if (reason === ModalDismissReasons.ESC) {
            return "by pressing ESC";
        } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
            return "by clicking on a backdrop";
        } else {
            return `with: ${reason}`;
        }
    }

    stockin() {
        if (this.requestSSent) {
            return false;
        }
        if (this.inventoryEntries.length == 0) {
            this.toastr.error("Please select atleast one item to update stock");
            return false;
        }
        let data = [];
        var quantity_check = true;
        var reason_check = true;
        for (var i in this.inventoryEntries) {
            let product = this.inventoryEntries[i];
            if (!product.quantity){
                quantity_check = false;
            }
            if (!product.reason){
                reason_check = false;
            }
            data.push({
                id: product.id,
                stock_quantity: product.quantity,
                change_reason: product.reason,
                location_id: product.product_id.location_id,
                sku: product.product_id.sku,
            });
        }
        if (!quantity_check) {
            this.toastr.error("Please add quantity");
            return;
        }
        if (!reason_check) {
            this.toastr.error("Please add reason");
            return;
        }
        this.requestSSent = true;
        this.sharedFunctions.postRequest("/inventory/stockin", data).subscribe(
            (data) => {
                this.inventoryEntries = [];
                this.toastr.success("Inventory Added");
                this.requestSSent = false;
                this.undoInvSearch();
                this.searchProduct();
            },
            (err) => {
                if (this.sharedFunctions.isEmpty(err.error.message)) {
                    this.toastr.error("Internal Server Error");
                } else {
                    this.toastr.error(err.error.message);
                }
                this.requestSSent = false;
            }
        );
    }

    updateInventory(item) {
        if (this.requestSent) {
            return false;
        }
        this.requestSent = true;
        this.sharedFunctions
            .postRequest("/inventory/updateInventory", item)
            .subscribe((data) => {
                this.toastr.success("Inventory Updated");
                this.requestSent = false;
            });
    }

    addProduct(product) {
        var exists = false;
        for (var item of this.inventoryEntries) {
            if (item.id == product.id) {
                this.toastr.error("Product already exists");
                exists = true;
            }
        }
        if (!exists) {
            this.inventoryEntries.push({ product_id: product, id: product.id });
        }
    }

    removeProduct(i) {
        this.inventoryEntries.splice(i, 1);
    }

    /*getStockLevel(product) {
    var inventories = product.product_id.product_inventory;
    var filterArr = inventories.filter(inventory => inventory.location_id == this.selectedLocationId);
    if (filterArr.length) {
      return filterArr[0].stock_quantity;
    } else {
      return 0;
    }
  }*/

    exportInventory() {
        var params = {}
        if (this.sharedFunctions.emptyOrAllParam(this.selectedBusinessUnitId, true)) {
            this.toastr.error("Please select business unit");
            return;
        }
        if (!this.sharedFunctions.emptyOrAllParam(this.selectedLocationId, true)) {
            params["location_id"] = this.selectedLocationId;
        } else {
            this.toastr.error("Please select location");
            return;
        }
        if (this.selectedStatus) {
            params["status_id"] = this.selectedStatus;
        }
        if (this.selectedvalue) {
            params["value_id"] = this.selectedvalue;
        }
        let url = "/inventory/dump";
        this.sharedFunctions.getRequest(url, params).subscribe((data) => {
            if (data.data && data.data.length) {
                window.open(data.data, "_self");
            } else {
                try {
                    if (data.data.length == 0) {
                        this.toastr.warning("No data found for selected criteria");
                    }
                }
                catch (err) {
                }
            }
        });
    }
}

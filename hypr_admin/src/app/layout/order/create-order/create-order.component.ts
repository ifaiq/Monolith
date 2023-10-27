import { Component, OnInit, ViewContainerRef, ViewChild } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared/services/shared-function.service";
@Component({
    selector: "app-create-order",
    templateUrl: "./create-order.component.html",
    styleUrls: ["./create-order.component.scss"],
})
export class CreateOrderComponent implements OnInit {
    @ViewChild("fileInput") fileInput;
    @ViewChild("imageInput") imageInput;
    products = [];
    orderObj = {
        product: "",
        quantity: "",
    };
    orders = [];
    customerPhone = "";
    customerExists = false;
    customerId = "";
    orderDate = new Date();
    paymentType: "";
    locations = [];
    selectedLocationId = "";
    deliveryTime = new Date();
    constructor(
        private sharedFunctions: SharedFunctionsService,
        private toastr: ToastsManager,
        vRef: ViewContainerRef
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getlocations();
        this.sharedFunctions
            .getRequest("/product/getAllProducts")
            .subscribe((data) => {
                this.products = data.products;
                this.orders.push(JSON.parse(JSON.stringify(this.orderObj)));
            });
    }
    getlocations() {
        this.locations = [];
        this.selectedLocationId = "";
        this.sharedFunctions.getRequest("/config/location/getAll").subscribe(
            (data) => {
                if (data.code == "OK") {
                    if (data.data && data.data.locations) {
                        this.locations = data.data.locations;
                        if (this.locations.length > 0) {
                            this.selectedLocationId = this.locations[0].id;
                        }
                    }
                }
            },
            (err) => {
            }
        );
    }

    createOrder() {
        var items = [];
        var sum = 0;
        for (var item of this.orders) {
            if (!(item.product > -1 && item.quantity > 0)) {
                this.toastr.error("Please add items");
                return false;
            }
            items.push({
                sku: this.products[item.product].sku,
                quantity: item.quantity,
                price: item.quantity * this.products[item.product].price,
                name: this.products[item.product].name,
            });
            sum = sum + item.quantity * this.products[item.product].price;
        }
        if (this.customerExists) {
            this.sharedFunctions
                .postRequest("/order/createAdminOrder", {
                    order_items: items,
                    customerId: this.customerId,
                    orderTotal: sum,
                    orderDate: this.orderDate,
                    paymentType: this.paymentType,
                    deliveryTime: this.deliveryTime,
                })
                .subscribe(
                    (data) => {
                        this.toastr.success("Order created successfully");
                    },
                    (err) => {
                        if (this.sharedFunctions.isEmpty(err.error.message)) {
                            this.toastr.error("Internal Server Error");
                        } else {
                            this.toastr.error(err.error.message);
                        }
                    }
                );
        } else {
            this.toastr.error("Add correct customer phone number");
        }
    }

    addItem() {
        this.orders.push(JSON.parse(JSON.stringify(this.orderObj)));
    }

    checkCustomer() {
        this.sharedFunctions
            .getRequest(
                "/customer/getCustomerByPhone?phone=" + this.customerPhone
            )
            .subscribe(
                (data) => {
                    this.toastr.success("Customer found");
                    this.customerExists = true;
                    this.customerId = data.customer.id;
                },
                (err) => {
                    this.toastr.error("Customer does not exist");
                    this.customerExists = false;
                }
            );
    }

    upload() {
        let fileBrowser = this.fileInput.nativeElement;
        if (fileBrowser.files && fileBrowser.files[0]) {
            let formData = new FormData();
            formData.append("file", fileBrowser.files[0]);
            this.sharedFunctions
                .postRequest("/upload/uploadFileToS3", formData)
                .subscribe(
                    (data) => {
                        if (data.success) {
                            this.toastr.success("File uploaded successfully");
                            this.sharedFunctions
                                .postRequest("/order/createOrdersFromOrderFile", {
                                    file_name: data.data.name,
                                })
                                .subscribe((data) => {
                                    this.toastr.success("Order upload in progress");
                                });
                        } else {
                            this.toastr.error(data.message);
                        }
                    },
                    (err) => { }
                );
        }
    }
}

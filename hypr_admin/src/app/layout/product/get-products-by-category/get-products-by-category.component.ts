import { Component, OnInit, NgZone } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { ActivatedRoute } from "@angular/router";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import Swal from "sweetalert2";
import { SharedFunctionsService } from "../../../shared/services/shared-function.service";

@Component({
    selector: "app-get-products-by-category",
    templateUrl: "./get-products-by-category.component.html",
    styleUrls: ["./get-products-by-category.component.scss"],
})
export class GetProductsByCategoryComponent implements OnInit {
    categoryid = "";
    loading = true;
    addedProducts = [];
    products = [];
    search = "";
    disabled = "";
    closeResult: string;
    deletedRows = [];
    deletedPromotions = [];
    settings = {
        bigBanner: true,
        timePicker: true,
        format: "dd-MMM-yyyy hh:mm a ",
        defaultOpen: false,
    };
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "addProductCategoryPage";
    itemsPerPagePopup = 10;
    currentPagePopup = 1;
    totalItemsPopup = 0;
    paginationIdPopup = "addProductPopupPage";
    constructor(
        private sharedFunctions: SharedFunctionsService,
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private activatedRoute: ActivatedRoute,
        private modalService: NgbModal
    ) {
        this.toastr.setRootViewContainerRef(vRef);
        this.activatedRoute.params.subscribe((params) => {
            this.categoryid = params["id"];
        });
    }

    ngOnInit() {
        this.getProductsByCategory();
        this.SearchProduct("");
    }

    getProductsByCategory() {
        this.sharedFunctions
            .getRequest(
                "/product/getProductByCategory?category_id=" +
                    this.categoryid +
                    "&per_page=" +
                    this.itemsPerPage +
                    "&page=" +
                    this.currentPage
            )
            .subscribe((data) => {
                var products = [];
                for (var product of data.data.products) {
                    if (product.active_promotions) {
                        product["promotions"] = product.active_promotions;
                    } else {
                        product["promotions"] = [];
                    }
                    products.push({
                        product_id: product,
                        category_id: this.categoryid,
                    });
                }
                this.addedProducts = products;
                this.totalItems = this.addedProducts.length;
            });
    }

    pagination(event) {
        this.currentPage = event;
        //this.getProductsByCategory();
    }
    paginationPopup(event) {
        this.currentPagePopup = event;
        this.SearchProduct("");
    }
    getItemNumber(index) {
        return index + (this.currentPage - 1) * this.itemsPerPage;
    }
    resetPopupPager() {
        this.currentPagePopup = 1;
        this.totalItemsPopup = 0;
        this.products = [];
    }
    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
        this.products = [];
    }
    SearchProduct(refresh?: string) {
        if (refresh && refresh == "reload") {
            this.search = "";
            this.resetPopupPager();
        } else if (refresh == "clearProducts") {
            this.resetPopupPager();
        }

        let url = "/product/getAllProducts";
        let params = {
            search: this.search,
            disabled: this.disabled,
            page: this.currentPagePopup,
            per_page: this.itemsPerPagePopup,
        };
        this.sharedFunctions.getRequest(url, params).subscribe((data) => {
            this.products = data.data.products;
            this.loading = false;
            this.totalItemsPopup = data.data.totalCount;
        });
    }

    open(content) {
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

    AddProduct(product) {
        var exists = false;
        for (var item of this.addedProducts) {
            if (item.product_id && item.product_id.id == product.id) {
                this.toastr.error("Productr already exists");
                exists = true;
            }
        }

        if (!exists) {
            if (product.active_promotions) {
                product["promotions"] = product.active_promotions;
            } else {
                product["promotions"] = [];
            }
            this.addedProducts.push({
                product_id: product,
                category_id: this.categoryid,
            });
            this.totalItems += 1;
        }
    }

    addNewPromotion(i) {
        var item = this.addedProducts[i].product_id;
        this.addedProducts[i].product_id.promotions.push({
            start_time: new Date(),
            end_time: new Date(),
            sku: item.sku,
            max_quantity: 1,
            price: item.price,
            total_quantity: 1,
        });
    }

    updateCategory() {
        var obj = {
            deletedRows: this.deletedRows,
            products: this.addedProducts,
            deletedPromotions: this.deletedPromotions,
            category_id: this.categoryid,
        };
        this.sharedFunctions
            .postRequest("/product/updateProductsCategory", obj)
            .subscribe(
                (data) => {
                    this.toastr.success("Category Updated");
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

    removeItem(i) {
        Swal({
            title: "Are you sure?",
            text: "You will not be able to recover this action!",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, keep it",
        }).then((result) => {
            if (result.value) {
                var item = this.addedProducts[i];
                this.addedProducts.splice(i, 1);
                if (item.id) {
                    this.deletedRows.push(item.id);
                }
                this.totalItems = this.totalItems - 1;
                Swal("Deleted");
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                Swal("Cancelled");
            }
        });
    }

    removePromotion(item, i) {
        Swal({
            title: "Are you sure?",
            text: "You will not be able to recover this action!",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, keep it",
        }).then((result) => {
            if (result.value) {
                if (item.product_id.promotions[i].id) {
                    this.deletedPromotions.push(
                        item.product_id.promotions[i].id
                    );
                }
                item.product_id.promotions.splice(i, 1);
                Swal("Deleted");
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                Swal("Cancelled");
            }
        });
    }
}

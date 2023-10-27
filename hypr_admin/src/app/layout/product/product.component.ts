import { Globals } from './../../globals';
import { Component, OnInit, NgZone, ViewChild, ElementRef, ViewChildren } from "@angular/core";
import { ViewContainerRef, QueryList } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../shared";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { RoleConstants } from "app/constants/roles-constants";
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl, Validators } from '@angular/forms';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { TaxCategoryConstants } from "app/constants/tax-categrories"
import { languages, attributes } from "../../constants/language-constants";
import { cloneDeep } from 'lodash';
import { SkuPurchaseStatusConstants } from "app/constants/sku-purchase-status";
@Component({
    selector: "app-product",
    templateUrl: "./product.component.html",
    styleUrls: ["./product.component.scss"],
})
export class ProductComponent implements OnInit {
    visible = true;
    selectable = true;
    removable = true;
    taxGroups = [];
    selectedTaxGroupId = '';
    productTaxGroupId: number = null;
    separatorKeysCodes: number[] = [ENTER, COMMA];
    filteredTags = [];
    tagCtrl = new FormControl('', Validators.required);
    allTags = [];
    taxInformation = [];

    Event = {
        target: {
            files: [],
        },
    };
    sortOptions = [
        {
            sortBy: "",
            sortOrder: "",
            sort: "All",
        },
        {
            sortBy: "name",
            sortOrder: "asc",
            sort: "Name(A-Z)",
        },
        {
            sortBy: "name",
            sortOrder: "desc",
            sort: "Name(Z-A)",
        },
        {
            sortBy: "brand",
            sortOrder: "asc",
            sort: "Brand Name(A-Z)",
        },
        {
            sortBy: "brand",
            sortOrder: "desc",
            sort: "Brand Name(Z-A)",
        },
    ];
    selectedSortIndex = 0;
    productForm = {
        name: "",
        categories: [],
        price: null,
        size: "",
        unit: "",
        brand: "",
        urdu_name: "",
        urdu_size: "",
        urdu_brand: "",
        urdu_unit: "",
        disabled: false,
        mrp: null,
        trade_price: null,
        barcode: "",
        cost_price: null,
        sku: "",
        description: "",
        tax_percent: null,
        tax_inclusive: false,
        consent_required: false,
        tax_category: null,
        multilingual: [],
        quantity_limit: null,
        is_volume_based_price_enabled: false,
        volume_based_prices: [],
        reason: ""
    };
    reasons= [];
    is_deactivated=false;
    tax_on_price = TaxCategoryConstants.TAX_ON_PRICE;
    tax_on_mrp = TaxCategoryConstants.TAX_ON_MRP;
    no_tax = TaxCategoryConstants.NO_TAX;
    isMerchantProduct = false;
    products = [];
    vendor_sku = "";
    vendor_price = "";
    vendor_index = "";
    vendors = [];
    search = "";
    disabled = "";
    loading = false;
    selectedCategory = "";
    selectedSubCategory = "";
    categories = [];
    selectedCategories = [];
    mappedCategories = [];
    mapIds = [];
    selectedSubCat = false;
    subCategories = [];
    location = {
        price: "",
        cost_price: "",
        mrp: "",
        selectedLocationId: "",
        selectedBusinessUnitId: "",
        business_unit_id: "",
        sku: "",
        location_id: {},
    };
    locations = [];
    businessUnits = [];
    activeIndex = -1;
    closeResult: string;
    refModalProductOnboarding: any;
    refModalCreateProduct: any;
    refModalProductExport: any;
    refHelpModal: any;
    refAddSubCategoryModel: any;
    refAddCategoryModel: any;
    checkUploadType: any;
    newCatForm = true;
    newCategory = "";
    companyId = "";
    companies = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    arrayOfUrls = [];
    showSubCat = false;
    @ViewChild("imageInput") imageInput;
    @ViewChild("newFileInput") newFileInput;
    @ViewChild("existingFileInput") existingFileInput;
    @ViewChildren("tagInput") tagInput: QueryList<ElementRef>;
    @ViewChild("auto") matAutocomplete: MatAutocomplete;
    selectedCatId = "";
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "productListPage";
    selectedFileName = "";
    editCategoryOption = {
        isEdit: false,
        copyCategories: [],
    };
    editProductCategories = [];
    subcategorySelectionData = {
        mainCategory: "",
        mainCatIndex: -1,
        productIndex: -1,
        subCategoryListToShow: [],
    };
    categorySelectionData = {
        productIndex: -1,
        categoryList: [],
        activeCategories: [],
    };
    addProductCategoryData = {
        categoryList: [],
        activeCategories: [],
        mappedCategories: [],
    };
    catalogues = [];
    selectedCatalogueId = "";
    languages = languages;
    attributes = attributes;
    languageNotSelected = 'Please select language';
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    productsList = [];
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        lc: NgZone,
        public sharedFunctions: SharedFunctionsService,
        private modalService: NgbModal,
        private globals: Globals
    ) {
        this.toastr.setRootViewContainerRef(vRef);
        this.redirectToProductPortal();
    }

    updateSelectedLanguage(product) {
        product.selectedLanguage = this.languages.find(language => language.code == product.selectedLanguageCode);
        const languageNameExists = product.multilingual.filter(
            language => (language.language == product.selectedLanguageCode && language.attributeName == attributes.name));
        const languageDescriptionExists = product.multilingual.filter(
            language => (language.language == product.selectedLanguageCode && language.attributeName == attributes.description));
        if (languageNameExists.length == 0) {
            let productLanguageName = { language: product.selectedLanguageCode, value: '', attributeName: attributes.name };
            if (product.id) {
                productLanguageName['productId'] = product.id;
            }
            product.multilingual.push(productLanguageName);
        }
        if (languageDescriptionExists.length == 0) {
            let productLanguageDescription = { language: product.selectedLanguageCode, value: '', attributeName: attributes.description };
            if (product.id) {
                productLanguageDescription['productId'] = product.id;
            }
            product.multilingual.push(productLanguageDescription);
        }
    }

    addTag(event: MatChipInputEvent, productIndex): void {
        const input = event.input;
        const tagName = event.value.trim();
        if (tagName) {
            const index = this.filteredTags.findIndex(filteredTag => filteredTag.name.toLowerCase() === tagName.toLowerCase());
            if (index > -1) {
                const selectedTagEvent = {option: {value: {
                    name: this.filteredTags[index].name,
                    id: this.filteredTags[index].id
                }}};
                this.selectedTag(selectedTagEvent, productIndex);
            } else {
                this.products[productIndex].tags.push({
                    name: tagName,
                    new_tag: true
                })
            }
        }
        if (input) {
            input.value = '';
        }
        this.tagInput['_results'][productIndex].nativeElement.value = '';
        this.tagCtrl.setValue(null);
        this.filteredTags = [];
    }

    removeTag(tag, productIndex) {
        const tagIndex = this.products[productIndex].tags.indexOf(tag);
        if (tagIndex >= 0) {
            if(tag.status) {
                this.products[productIndex].removed_tags.push(tag.id);
            }
            this.products[productIndex].tags.splice(tagIndex, 1);
        }
    }

    selectedTag(event, productIndex) {
        const selectedTag = event.option.value;
        if (this.products[productIndex].tags.findIndex(productTag => productTag.id === selectedTag.id) === -1) {
            this.products[productIndex].tags.push({ id: selectedTag.id, name: selectedTag.name });
            const removedIndex = this.products[productIndex].removed_tags.indexOf(selectedTag.id)
            if (removedIndex > -1) {
                this.products[productIndex].removed_tags.splice(removedIndex, 1)
            }
        }
        this.tagInput['_results'][productIndex].nativeElement.value = '';
        this.tagCtrl.setValue(null);
        this.filteredTags = [];
    }

    searchFilter(tag) {
        if (tag != '' && tag != null && typeof (tag) === 'string') {
            if (tag.charAt(0) != '%' && tag.length > 2) {
                const params = { tag: tag }
                this.sharedFunctions.getRequest('/tag/search', params).subscribe(
                    (data) => {
                        this.filteredTags = [];
                        if (data && data.data && data.data.length) {
                            data.data.forEach(tag => {
                                this.filteredTags.push({
                                    name: tag.name,
                                    id: tag.id
                                })
                            });
                        }
                    },
                    (error) => {
                        console.log(error);
                    }
                );
            }
        }
    }
    
    pagination(event) {
        this.currentPage = event;
        this.SearchProduct("");
    }

    resetPager() {
        this.products = [];
        this.currentPage = 1;
        this.totalItems = 0;
    }

    ngOnInit() {
        this.getCompanies();
        this.getbusinessUnits();
        this.getlocations();
        this.SearchProduct();
        this.fetchTaxGroups();
    }

    redirectToProductPortal() {
        const authToken = localStorage.getItem("authToken");
        const redirectUrl = `${this.globals.productURI}?token=${authToken}`;
        window.location.href = redirectUrl;
    }

    onChangeQuantityRestriction(quantity:string){
        this.productForm.quantity_limit = quantity;
    }

    getCompanies() {
        this.sharedFunctions.getRequest("/config/company/getAll").subscribe(
            (data) => {
                if (data && data.data && data.data.companies) {
                    this.companies = data.data.companies;
                    let user = JSON.parse(localStorage.getItem("userData"));
                    if (user.role.id == RoleConstants.COMPANY_OWNER) {
                        this.companyId = this.companies[0].id;
                        this.getbusinessUnits();
                    }
                } else {
                    this.companies = [];
                }
            },
            (error) => {}
        );
    }

    getSkuDeactivationReasons(event) {
        let reasonType = "";
        this.reasons = [];
        if (event) {
            reasonType = SkuPurchaseStatusConstants.DISABLED
        }
        else {
            reasonType = SkuPurchaseStatusConstants.ENABLED
        }
        this.sharedFunctions.getRequest(`/api/v1/sku-deactivation-reason?type=${reasonType}`).subscribe(
            (data) => {
                if (data && data.data) {
                    this.reasons = data.data;
                } 
            },
            (error) => {}
        );
    }

    resetLocations() {
        this.selectedLocationId = "";
        this.locations = [];
        this.resetCategory();
    }

    resetBUUnit() {
        this.businessUnits = [];
        this.selectedBusinessUnitId = "";
        this.resetLocations();
    }

    resetCategory() {
        this.selectedCategory = "";
        this.selectedSubCategory = "";
        this.categories = [];
        this.subCategories = [];
    }

    getlocations() {
        var params = {};
        this.resetLocations();
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        }
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.selectedBusinessUnitId,
                true
            )
        ) {
            params["businessUnitId"] = this.selectedBusinessUnitId;
        } else if (this.sharedFunctions.isBUListPerm()) {
            return;
        }
        var path = "/config/location/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data && data.data && data.data.locations) {
                    this.locations = data.data.locations;
                } else {
                    this.locations = [];
                }
            },
            (error) => {}
        );
    }

    getbusinessUnits() {
        this.resetBUUnit();
        var params = {};
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        } else if (this.sharedFunctions.isCompanyListPerm()) {
            return;
        }
        var path = "/config/businessunit/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe((data) => {
            if (data.code == "OK") {
                try {
                    if (data.data && data.data.length) {
                        this.businessUnits = data.data;
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        });
    }

    fetchCategories() {
        if (
            !this.sharedFunctions.emptyOrAllParam(this.selectedLocationId, true)
        ) {
            this.getCategories(false);
        } else {
            this.resetCategory();
        }
    }
    reload() {
        this.loading = true;
        this.activeIndex = -1;
        this.selectedBusinessUnitId = "";
        this.companyId = "";
        this.selectedLocationId = "";
        this.resetCategory();
        this.resetPager();
        this.search = "";
        this.ngOnInit();
    }

    refresh() {
        this.loading = true;
        this.resetPager();
        this.activeIndex = -1;
        this.fetchCategories();
        this.SearchProduct("");
        this.fetchTaxGroups();
    }

    captureBarocde(product) {
        const printContent = document.getElementById(product.index);
        const WindowPrt = window.open(
            "",
            "",
            "left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0"
        );
        WindowPrt.document.write(printContent.innerHTML);
        WindowPrt.document.close();
        WindowPrt.focus();
        WindowPrt.print();
        WindowPrt.close();
    }

    SearchProduct(refresh?: string) {
        this.loading = true;
        this.activeIndex = -1;
        let url = "/product/getAllProducts";
        let params = {
            search: this.search,
            page: this.currentPage,
            per_page: this.itemsPerPage,
            isAdmin: 1,
        };
        if (this.disabled == "0" || this.disabled == "1") {
            params["disabled"] = Number(this.disabled);
        }
        if (
            this.companyId &&
            this.companyId != "" &&
            this.companyId != "all" &&
            this.companyId != "All" &&
            this.companyId != "0"
        ) {
            params["company_id"] = this.companyId;
        }
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
        if (refresh && refresh == "reload") this.search = "";
        if (this.selectedSortIndex) {
            params["sortBy"] = this.sortOptions[this.selectedSortIndex].sortBy;
            params["sortOrder"] = this.sortOptions[
                this.selectedSortIndex
            ].sortOrder;
        }
        if (this.selectedSubCategory) {
            params["category_id"] = this.selectedSubCategory;
        } else if (this.selectedCategory) {
            params["category_id"] = this.selectedCategory;
        }
        this.sharedFunctions.getRequest(url, params).subscribe((data) => {
            this.totalItems = data.data.totalCount;
            this.loading = false;
            var products = [];
            let ref = this;
            if (data.data.products.length > 0) {
                data.data.products.forEach(function (product, index) {
                    product["index"] = index;
                    if (product.barcode == "" || product.barcode == null) {
                        product["hasBarcode"] = false;
                    } else {
                        product["hasBarcode"] = true;
                    }
                    product.consent_required = product.consent_required
                        ? true
                        : false;
                    product["cost_price"] = parseFloat(product["cost_price"]);
                    product["mrp"] = parseFloat(
                        product["mrp"]
                    );
                    product["rowCount"] = ref.sharedFunctions.getRowCount(
                        ref.itemsPerPage,
                        ref.currentPage,
                        index
                    );
                    product["active_categories"] = JSON.parse(
                        JSON.stringify(
                            ref.sortActiveCategories(product.active_categories)
                        )
                    );
                    if (!product.multilingual) {
                        product.multilingual = [];
                    }
                    if (!product.tags) {
                        product.tags = [];
                    }
                    product.existingCategories = product.active_categories;
                    product.removed_tags = [];
                    products.push(product);
                    index++;
                });
            }
            this.products = cloneDeep(products);
            this.productsList = cloneDeep(this.products);
            this.loading = false;
        }, err => {
            this.toastr.error(err.error.message);
            this.loading = false;
        });
    }

    getCategories(isEditProductCategories, locationId?) {
        var params = {};
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
            if (!isEditProductCategories) {
                params["location_id"] = this.selectedLocationId;
            } else {
                params["location_id"] = locationId;
            }
        } else {
            params["location_id"] = locationId;
        }
        params["avoidPagination"] = 1;
        params["isAdmin"] = 1;
        this.sharedFunctions
            .getRequest("/categories/getAllAdminCategories", params)
            .subscribe((data) => {
                var categories = data.data;
                for (var category of categories) {
                    category["selected"] = false;
                    if (category.sub_categories) {
                        for (var subCat of category.sub_categories) {
                            subCat["selected"] = false;
                        }
                    }
                }
                if (!isEditProductCategories) {
                    this.selectedCategory = "";
                    this.selectedSubCategory = "";
                    this.categories = categories;
                } else {
                    this.editProductCategories = categories;
                }
            });
    }
    editBarcode(product) {
        product.hasBarcode = false;
    }

    validateProduct(product) {
        let msg = "";
        if (
            (!product.tax_percent && product.tax_percent != 0) ||
            !product.name ||
            (!product.price && product.price != 0) ||
            !product.sku
        ) {
            msg = "Required Field Missing";
        } else if (
            product.cost_price < 0 ||
            product.mrp < 0 ||
            product.price < 0
        ) {
            msg = "Price cannot be negative";
        }
        return msg;
    }

    priorityCheck(category) {
        if (!category.product_max_priority) category.product_max_priority = 1;
        if (category.product_priority > category.product_max_priority) {
            category.max_priority = true;
        } else {
            delete category['max_priority'];
        }
        if (category.product_priority <= 0) {
            category.invalid_priority = true;
        } else {
            delete category['invalid_priority'];
        }
    }

    validateReason (skuDeactivationReason, isDeactivated) {
        if(!Boolean(isDeactivated) && skuDeactivationReason.length === 0) return false
        return !skuDeactivationReason || this.reasons.filter(e => e.reason === skuDeactivationReason).length == 0
    }

    Update(item, itemIndex) {
        this.loading = true;
        const productTaxGroupUrl = "/taxation/api/v1/product-tax-groups";
        let user = JSON.parse(localStorage.getItem("userData"));
        item["updated_by"] = user.id;
        let prod_location = this.selectedLocationId
            ? this.selectedLocationId
            : item.location_id;
        var catIds = [];
        var invalidPriority = false;
        item.active_categories.forEach((item) => {
            if (item.product_priority > item.product_max_priority || item.product_priority <= 0) {
                invalidPriority = true;
                return;
            }
            catIds.push({ category_id: item.category_id.id, priority: item.product_priority, location_id: item.category_id.location_id });

        });
        if (invalidPriority) {
            this.toastr.error("Invalid Priority");
            return;
        }
        if (catIds.length == 0) {
            this.toastr.error("Please add atleast one Category");
            return;
        }
        item["categoriesToEdit"] = catIds;
        item["isCategoryEdit"] = true;
        delete item.stock_quantity;
        delete item.selectedLanguageCode;
        delete item.selectedLanguage;
        delete item.existingCategories;
        if (item['multilingual']) {
            item['multilingual'] = item['multilingual'].filter(language => !(language.value == '' && !language.created_at)); // Remove empty languages
        }
        item.tax_category = +item.tax_category;
        item.reason = item.reason ? item.reason : '';
        let isReasonValidated = this.validateReason(item.reason, item.is_deactivated);
        if (isReasonValidated) {
            this.toastr.error('Please add reason to update');
            this.loading = false;
            return false
        }
        item.is_deactivated = item.is_deactivated;
        item.name = item.name.trim();
        let msg = this.validateProduct(item);    
        // Convert number to boolean
        if (item.is_volume_based_price_enabled) {
            item.is_volume_based_price_enabled = true;
        } else {
            item.is_volume_based_price_enabled = false;
        }
        if (item.is_volume_based_price_enabled) {
            msg = this.validateVBP(item);
        }
        if (msg) {
            this.toastr.error(msg);
            this.loading = false;
            return false;
        }      
        this.sharedFunctions
            .postRequest(
                "/product/updateProduct?location_id=" + prod_location,
                item
            )
            .subscribe(
                (data) => {
                    item.hasBarcode = true;
                    this.editCategoryOption.copyCategories =
                        item.active_categories;
                    this.editCategoryOption.isEdit = false;
                    this.rowClick(itemIndex);
                    this.SearchProduct();
                    if (item.tax_group) {
                        this.sharedFunctions.postRequest(productTaxGroupUrl, {
                            productId: Number(item.id),
                            taxGroupId: item.tax_group
                        }).subscribe((data) => {
                            this.toastr.success("Product updated successfully");
                        }, (err) => {
                            this.toastr.error('TAX GROUP ' + err.error.errors[0].name);
                        })
                    } else {
                        this.toastr.success("Product updated successfully");
                    }
                },
                (err) => {
                    item.hasBarcode = false;
                    if (this.sharedFunctions.isEmpty(err.error.message)) {
                        this.toastr.error("Internal Server Error");
                    } else {
                        this.toastr.error(err.error.message);
                    }
                }
            );
    }

    rowClick(index) {
        const productTaxGroupUrl = "/taxation/api/v1/product-tax-groups/" + this.products[index].id;
        if (this.activeIndex == index) {
            this.activeIndex = -1;
            this.editCategoryOption.isEdit = false;
            this.products[
                index
            ].active_categories = this.editCategoryOption.copyCategories;
            // Incase of cancel assign default values from the API
            this.products[index] = cloneDeep(this.productsList[index]);
        } else {
            if (!this.products[index].active_categories) {
                this.products[index].active_categories = [];
            }
            this.activeIndex = index;
            this.editProductCategories = [];
            this.getCategories(true, this.products[index].location_id);
            this.editCategoryOption.isEdit = false;
            this.editCategoryOption.copyCategories = JSON.parse(
                JSON.stringify(this.products[index].active_categories)
            );
            this.getSkuDeactivationReasons(this.products[index].is_deactivated);
            this.loading = true;
            this.sharedFunctions.getRequest(productTaxGroupUrl).subscribe((data) => {
                this.products[index].tax_group = data.data.taxGroup.id;
                this.loading = false;
            }, (err) => {
                this.loading = false;
                this.toastr.error('TAX GROUP ' + err.error.errors[0].name);
            })
        }

    }

    onFileChange(event, check) {
        this.Event = event;
        this.checkUploadType = check;
        if (event.target && event.target.files && event.target.files[0]) {
            this.selectedFileName = event.target.files[0].name;
        }
    }
    removeFile() {
        this.selectedFileName = "";
        this.checkUploadType = null;
        this.Event = {
            target: {
                files: [],
            },
        };
    }
    uploadFile() {
        this.loading = true;
        let fileBrowser = this.Event.target;
        if (fileBrowser.files && fileBrowser.files[0]) {
            let formData = new FormData();
            switch (this.checkUploadType) {
                case 1:
                    var reqPath = "/upload/uploadUserImageToS3";
                    formData.append("picture", fileBrowser.files[0]);
                    break;
                case 2:
                case 3:
                case 5:
                case 7:
                case 6:
                    var reqPath = "/upload/uploadFileToS3";
                    formData.append("file", fileBrowser.files[0]);
                    break;
                case 4:
                    this.uploadImage();
                    break;
            }
            this.closeModalProductOnboarding();
            this.sharedFunctions.postRequest(reqPath, formData).subscribe(
                (data) => {
                    this.loading = false;
                    if (data.success) {
                        this.toastr.success("File/Image uploaded successfully");
                        switch (this.checkUploadType) {
                            case 1:
                                this.products[this.activeIndex].image_url =
                                    data.data.link;
                                break;
                            case 2:
                                this.onBoardProducts(data.data);
                                break;
                            case 3:
                                this.updateOldProducts(data.data);
                                break;
                            case 5:
                                this.updateLocationPricesAndStock(data.data);
                                break;
                            case 6:
                                this.updatePoductLanguages(data.data.name);
                                break;
                            case 7:
                                this.updateProductDisplayPriority(data.data.name);
                                break;
                        }
                        this.removeFile();
                    } else {
                        this.toastr.error(data.message);
                    }
                },
                (err) => {
                    this.loading = false;
                }
            );
        } else {
            this.loading = false;
        }
    }
    updateLocationPricesAndStock(data) {
        let user = JSON.parse(localStorage.getItem("userData"));
        // sending arguments for history
        var obj = {
            file_name: data.name,
            file_url: data.file[0].extra.Location,
            user_id: user.id,
            bulk: true,
        };

        this.sharedFunctions
            .postRequest("/product/updateMultipleLocationPrices", obj)
            .subscribe((data) => {
                this.toastr.info("Product Pricing updation in progress");
            });
    }
    onBoardProducts(data) {
        let user = JSON.parse(localStorage.getItem("userData"));
        // sending arguments for history
        var obj = {
            file_name: data.name,
            file_url: data.file[0].extra.Location,
            user_id: user.id,
            bulk: true,
        };
        this.sharedFunctions.postRequest("/product/onBoardProducts", obj).subscribe((data) => {
            this.toastr.info("Product on boarding in progress");
        });
    }

    updateOldProducts(data) {
        let user = JSON.parse(localStorage.getItem("userData"));
        // sending arguments for history
        var obj = {
            file_name: data.name,
            file_url: data.file[0].extra.Location,
            user_id: user.id,
            bulk: true,
        };

        this.sharedFunctions
            .postRequest("/product/updateProducts", obj)
            .subscribe((data) => {
                this.toastr.info("Product updating in progress");
            });
    }

    uploadImage() {
        let fileBrowser = this.Event.target;
        if (fileBrowser.files && fileBrowser.files[0]) {
            for (var file of fileBrowser.files) {
                let formData = new FormData();
                formData.append("file", file);
                this.sharedFunctions
                    .postRequest(
                        "/upload/uploadProductImageToS3?location_id=" +
                            this.selectedLocationId,
                        formData
                    )
                    .subscribe(
                        (data) => {
                            this.toastr.success(
                                "File uploaded successfully. Your changes will be reflected soon"
                            );
                            this.removeFile();
                        },
                        (err) => {
                            this.toastr.error("File upload failed");
                        }
                    );
            }
        }
    }

    findProduct(value) {
        if (value == "removeSearch") {
            this.search = "";
        }
        this.resetPager();
        this.SearchProduct("");
    }

    getCategoryName(cat_id) {
        var filteredArr = this.categories.filter((_cat) => _cat.id == cat_id);
        if (filteredArr.length) {
            return filteredArr[0].name;
        }
        return "-";
    }

    openModalProductOnboarding(content) {
        if (this.selectedLocationId == "") {
            this.toastr.error("Please select location");
            return false;
        }
        this.refModalProductOnboarding = this.modalService.open(content);
    }

    openModalProductExport(content) {
        if (this.selectedLocationId == "") {
            this.toastr.error("Please select location");
            return false;
        }
        this.refModalProductExport = this.modalService.open(content);
    }

    closeModalProductOnboarding() {
        if (this.refModalProductOnboarding)
            this.refModalProductOnboarding.close();
    }

    openSubCategorySelection(content, cat, product, catIndex) {
        if (this.editProductCategories.length > 0) {
            this.subcategorySelectionData.mainCategory = cat.category_id.name;
            var category = this.editProductCategories.filter(
                (item) => item.id == cat.category_id.id
            );
            debugger;
            if (category.length > 0) {
                var subCategoriesList = JSON.parse(
                    JSON.stringify(category[0].sub_categories)
                );
                var newList = [];
                subCategoriesList.forEach((element) => {
                    var isAlreadySelected = product.active_categories.filter(
                        (item) => item.category_id.id == element.id
                    );
                    if (isAlreadySelected.length == 0) {
                        newList.push(element);
                    }
                });
                this.subcategorySelectionData.subCategoryListToShow = newList;
                this.subcategorySelectionData.mainCatIndex = catIndex;
                this.subcategorySelectionData.productIndex = product.index;
                this.refAddSubCategoryModel = this.modalService.open(content);
            } else {
                debugger;
                cat.addmore = false;
            }
        }
    }

    addSelectedSubCategories() {
        var product = this.products[this.subcategorySelectionData.productIndex];
        if (product) {
            var catIds = [];
            var index = this.subcategorySelectionData.mainCatIndex + 1;
            this.subcategorySelectionData.subCategoryListToShow.forEach(
                (item) => {
                    if (item.selected) {
                        catIds.push(item.id);
                        var cat = JSON.parse(JSON.stringify(item));
                        try {
                            delete cat.selected;
                        } catch (e) {}
                        cat["label"] = "L2";
                        cat["parent_id"] = cat.parent;
                        cat["promotion"] = 0;
                        var category = {
                            product_id: this.products[
                                this.subcategorySelectionData.productIndex
                            ].sku,
                            category_id: cat,
                            product_max_priority: cat.maxProductPriority ? cat.maxProductPriority + 1 : 1,
                            product_priority: 1,
                        };
                        product.active_categories.splice(index, 0, category);
                        index += 1;
                    }
                }
            );
            if (catIds.length > 0) {
                product.active_categories[
                    this.subcategorySelectionData.mainCatIndex
                ].addmore = false;
            }
        }
        if (this.refAddSubCategoryModel) {
            this.refAddSubCategoryModel.close();
        }
    }

    closeSubCategorySelection() {
        if (this.refAddSubCategoryModel) {
            this.refAddSubCategoryModel.close();
        }
    }

    removeCategory(product, catIndex) {
        var categoryToRemove = JSON.parse(
            JSON.stringify(product.active_categories[catIndex])
        );
        if (categoryToRemove.category_id.parent_id != null) {
            let parentFound = [];
            let emptyL1 = true;
            product.active_categories.forEach((item) => {
                if (
                    item.category_id.id ==
                    categoryToRemove.category_id.parent_id
                ) {
                    parentFound.push(item);
                    return;
                }
            });
            if (parentFound.length) {
                parentFound[0].addmore = true;
            }
            product.active_categories.splice(catIndex, 1);
            product.active_categories.forEach((item) => {
                if (categoryToRemove.category_id.parent_id == item.category_id.parent_id) {
                    emptyL1 = false;
                }
            });
            if (emptyL1) {
                catIndex = product.active_categories.indexOf(parentFound[0]);
                product.active_categories.splice(catIndex, 1);
            }
        } else {
            product.active_categories = product.active_categories.filter(
                (item) => {
                    if (
                        item.category_id.parent_id !=
                        categoryToRemove.category_id.id
                    ) {
                        return item;
                    }
                }
            );
            product.active_categories.splice(catIndex, 1);
        }
    }

    openModalCreateProduct(content) {
        this.refModalProductOnboarding.close();
        this.addProductCategoryData.categoryList = JSON.parse(
            JSON.stringify(this.categories)
        );
        var newCategories = [];
        this.mapIds = [];
        this.addProductCategoryData.mappedCategories.forEach((item) => {
            var isExist = this.addProductCategoryData.categoryList.filter(
                (inner) => inner.id == item.id
            );
            if (isExist.length > 0) {
                newCategories.push(item);
                this.mapIds.push(item.id);
                if (item.sub_categories)
                    item.sub_categories.forEach((subele) => {
                        this.mapIds.push(subele.id);
                    });
            }
        });
        this.addProductCategoryData.mappedCategories = newCategories;
        this.isMerchantProduct = false;
        this.productForm.barcode =
            "HYPR" + Math.floor(100000000 + Math.random() * 900000000);
        this.refModalCreateProduct = this.modalService.open(content);
    }

    closeModalCreateProduct() {
        if (this.refModalCreateProduct) this.refModalCreateProduct.close();
    }

    openHelpModal(content) {
        this.refModalProductOnboarding.close();
        this.refHelpModal = this.modalService.open(content);
    }

    closeHelpModal(content) {
        this.refHelpModal.close();
        this.refModalProductOnboarding = this.modalService.open(content);
    }

    toggleSwitch() {
        this.isMerchantProduct = !this.isMerchantProduct;
        this.productForm.barcode == ""
            ? (this.productForm.barcode =
                  "HYPR" + Math.floor(100000000 + Math.random() * 900000000))
            : (this.productForm.barcode = "");
    }

    toggle(variable) {
        this[variable] = !this[variable];
    }

    invert() {
        this.showSubCat = !this.showSubCat;
    }

    createCategory() {
        if (this.newCategory == "") {
            this.toastr.error("Please enter category name");
            return false;
        }
        this.sharedFunctions
            .postRequest("/product/createProductCategory", {
                name: this.newCategory,
            })
            .subscribe(
                (data) => {
                    this.toastr.success("Category addded successfully");
                    var findIndex = this.categories.findIndex(
                        (cat) => cat.id == data.id
                    );
                    if (findIndex != -1) {
                        this.categories.splice(findIndex, 1);
                    }
                    this.categories.unshift({
                        id: data.id,
                        name: this.newCategory,
                    });
                    this.newCategory = "";
                    this.newCatForm = !this.newCatForm;
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

    resetCategoriesSelection() {
        for (var cat of this.categories) {
            cat["selected"] = false;
            if (cat.sub_categories) {
                for (var sub_cat of cat.sub_categories) {
                    sub_cat["selected"] = false;
                }
            }
        }
        this.selectedCategories = [];
        this.selectedSubCat = false;
    }

    validateSKU(sku: string){
        return sku && /\s/.test(sku);
    }

    createProduct(form) {
        form.categories = this.mapIds;
        if (form.disabled == true) {
            form.disabled = 1;
        } else {
            form.disabled = 0;
        }
        if (form.categories.length == 0) {
            this.toastr.error("Add at-least one category in product");
            return false;
        }
        if (
            form.tax_percent == null ||
            form.name == "" ||
            form.tax_percent < 0 ||
            form.sku == "" ||
            (!form.cost_price && form.cost_price != 0) ||
            (!form.mrp && form.mrp != 0) ||
            (!form.price && form.price != 0) ||
            form.cost_price < 0 ||
            form.mrp < 0 ||
            form.price < 0 ||
            form.tax_category == null
        ) {
            this.toastr.error("Required Field Missing");
            return false;
        }
        let msg = "";
        if (form.is_volume_based_price_enabled) {
            msg = this.validateVBP(form);
        }

        if(this.validateSKU(form.sku)){
            msg = "Remove spaces from custom SKU field";
        }

        if (msg) {
            this.toastr.error(msg);
            return false;
        }
        form["location_id"] = this.selectedLocationId;
        let user = JSON.parse(localStorage.getItem("userData"));
        form["updated_by"] = user.id;
        delete form.selectedLanguageCode;
        delete form.selectedLanguage;
        if (form['multilingual']) {
            form['multilingual'] = form['multilingual'].filter(language => !(language.value == '' && !language.created_at)); // Remove empty languages
        }
        this.sharedFunctions
            .postRequest("/product/createProduct", form)
            .subscribe(
                (data) => {
                    this.toastr.success("Product created successfully");
                    const productTaxGroup = {
                        productId: data.data && data.data.data.id,
                        taxGroupId: this.selectedTaxGroupId,
                    }
                    if (this.selectedTaxGroupId) {
                        this.sharedFunctions.postRequest("/taxation/api/v1/product-tax-groups", productTaxGroup)
                        .subscribe(() => {
                            this.resetProductForm();
                            this.mapIds = [];
                            this.addProductCategoryData.mappedCategories = [];
                            this.isMerchantProduct = false;
                            this.refModalCreateProduct.close();
                            this.resetCategoriesSelection();
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
                },
                (err) => {
                    if (this.sharedFunctions.isEmpty(err.error.message)) {
                        this.toastr.error("Internal Server Error");
                    } else {
                        this.toastr.error(err.error.message);
                    }
                    this.isMerchantProduct = false;
                    this.resetCategoriesSelection();
                }
            );
        this.loading = false;
    }

    resetProductForm() {
        this.productForm = {
            name: "",
            categories: [],
            price: null,
            size: "",
            unit: "",
            brand: "",
            urdu_name: "",
            urdu_size: "",
            urdu_brand: "",
            urdu_unit: "",
            disabled: false,
            mrp: null,
            trade_price: null,
            barcode: "",
            cost_price: null,
            sku: "",
            description: "",
            tax_percent: null,
            tax_inclusive: false,
            consent_required: false,
            tax_category: null,
            multilingual: [],
            quantity_limit: null,
            is_volume_based_price_enabled: false,
            volume_based_prices: [],
            reason: ""
        };
    }
    getOneActiveCategoryName(categories) {
        var catName = "";
        if (categories && categories.length > 0) {
            var selectedCategory = categories.filter(
                (item) => !item.category_id.parent_id
            );
            if (selectedCategory.length > 0) {
                catName = selectedCategory[0].category_id.name;
            } else {
                catName = categories[0].category_id.name;
            }
        }
        return catName;
    }
    openCategorySelection(categorySelection, productIndex) {
        this.categorySelectionData.productIndex = productIndex;
        this.categorySelectionData.activeCategories = JSON.parse(
            JSON.stringify(this.products[productIndex].active_categories)
        );
        this.categorySelectionData.categoryList = JSON.parse(
            JSON.stringify(this.editProductCategories)
        );
        this.refAddCategoryModel = this.modalService.open(categorySelection);
    }

    closeCategorySelection(event) {
        if (event && event.isAdded) {
            var cats = this.sortActiveCategories(event.newList);
            this.products[
                this.categorySelectionData.productIndex
            ].active_categories = cats;
        }
        if (this.refAddCategoryModel) {
            this.refAddCategoryModel.close();
        }
    }

    sortActiveCategories(list) {
        if (list && list.length) {
            var newList = [];
            var parentCats = list.filter(
                (item) => item.category_id.parent_id == null
            );
            parentCats.forEach((ele) => {
                newList.push(ele);
                var childCats = list.filter(
                    (item) => item.category_id.parent_id == ele.category_id.id
                );
                childCats.forEach((subCat) => {
                    newList.push(subCat);
                });
            });
            list.forEach((ele) => {
                var isCat = list.filter(
                    (item) => item.category_id.id == ele.category_id.id
                );
                if (isCat.length == 0) {
                    newList.push(ele);
                }
            });
            return newList;
        } else {
            return [];
        }
    }

    categoriesUpdated(event) {
        this.mapIds = [];
        this.addProductCategoryData.mappedCategories.forEach((ele) => {
            this.mapIds.push({id: ele.id, product_priority: null});
            if (ele.sub_categories)
                ele.sub_categories.forEach((subele) => {
                    this.mapIds.push({id: subele.id, product_priority: 'maxPriority'});
                });
        });
    }
    categoryChanged(event) {
        var selectedCategory = this.categories.filter(
            (item) => item.id == this.selectedCategory
        );
        this.subCategories = [];
        this.selectedSubCategory = "";
        if (selectedCategory.length > 0) {
            if (selectedCategory[0].sub_categories)
                this.subCategories = selectedCategory[0].sub_categories;
        }
    }

    exportProduct(fileType) {
        if (
            this.sharedFunctions.emptyOrAllParam(this.selectedLocationId, true)
        ) {
            this.toastr.error("Please select location");
            return;
        }
        var params = {
            location_id: this.selectedLocationId,
            file_type: fileType,
        };
        let url = "/product/getProductDump";
        this.sharedFunctions.getRequest(url, params).subscribe((data) => {
            if (data.data) {
                window.open(data.data, "_self");
            }
        });
    }
    getCompanyCatalogues() {
        this.catalogues = [];
        var params = {};
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["company_id"] = this.companyId;
        } else if (this.sharedFunctions.isCompanyListPerm()) {
            return;
        }
        var path = "/getCompanyCatalogues?company_id=" + this.companyId;
        this.sharedFunctions.getRequest(path, params).subscribe((data) => {
            if (data.code == "OK") {
                try {
                    if (data.data && data.data.catalogues.length) {
                        this.catalogues = data.data.catalogues;
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        });
    }
    exportMasterCatalogue(forUpdate) {
        if (this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            this.toastr.error("please select company");
            return;
        }
        if (
            this.sharedFunctions.emptyOrAllParam(this.selectedCatalogueId, true)
        ) {
            this.toastr.error("please select catalogue to take dump");
            return;
        }
        var path =
            "/master/dump?catalogue_id=" +
            +this.companyId +
            "&forUpdate=" +
            forUpdate;
        this.sharedFunctions.getRequest(path, {}).subscribe((data) => {
            if (data.data) {
                window.open(data.data, "_self");
            }
        });
    }
    updatePoductLanguages(data) {
        const obj = {
            fileName: data,
            locationId: +this.selectedLocationId
        };

        this.sharedFunctions
            .putRequest("/api/v1/product/multilingual", obj)
            .subscribe((data) => {
                this.toastr.info("Product languages updating in progress");
            });
    }
    addVbpSegment(product) {
        product.volume_based_prices.push({
            quantityFrom: null,
            quantityTo: null,
            price: null,
            disabled: false,
        });
    }
    removeVbpSegment(product, i) {
        product.volume_based_prices.splice(i, 1);
    }
    invertVbpValue(vbp) {
        vbp.disabled = !vbp.disabled;
    }
    validateVBP(product) {
        let msg = "";
        if (product.volume_based_prices.length < 2) {
            msg = "Please add a minimum of two pricing segments in VBP"
            return msg;
        }
        for (let i = 0; i < product.volume_based_prices.length; i++) {
            let firstSlab = false;
            let lastSlab = false;
            if (i === 0) firstSlab = true;
            if (i === (product.volume_based_prices.length - 1)) lastSlab = true;

            if (!product.volume_based_prices[i].price) {
                msg = `Required field 'Price' is missing in segment ${i+1} of VBP`
                break;
            }
            if (!product.volume_based_prices[i].quantityFrom) {
                msg = `Required field 'Quantity From' missing in segment ${i+1} of VBP`
                break;
            }
            if (!product.volume_based_prices[i].quantityTo && !lastSlab) {
                msg = `Required field 'Quantity To' missing in segment ${i+1} of VBP`
                break;
            }
            if (product.volume_based_prices[i].quantityTo && lastSlab) {
                msg = "The 'Quantity To' of last segment of VBP should be empty"
                break;
            }
            if (firstSlab) {
                if (product.volume_based_prices[i].price !== product.price) {
                    msg = "The 'Price' of first segment of VBP should be equal to the price of product";
                    break;
                }
                if (product.volume_based_prices[i].quantityFrom !== 1) {
                    msg = "The 'Quantity From' of first segment of VBP should be 1";
                    break;
                }
            } else {
                if (product.volume_based_prices[i].quantityFrom >= product.volume_based_prices[i].quantityTo && !lastSlab) {
                    msg = `The 'Quantity To' should be greater than 'Quantity From' in segment ${i+1} of VBP`;
                    break;
                }
                if (product.volume_based_prices[i-1].quantityTo !== (product.volume_based_prices[i].quantityFrom - 1)) {
                    msg = `The difference between 'Quantity To' of segment ${i} and 'Quantity From' of segment ${i+1} should be 1 in VBP`;
                    break;
                }
                if (product.volume_based_prices[i-1].price <= product.volume_based_prices[i].price) {
                    msg = `The 'Price' of segment ${i+1} should be less than 'Price' of segment ${i} in VBP`
                    break;
                }
            }
        }
        return msg;
    }
    updateProductDisplayPriority(fileName){
        const body = {
            file_name: fileName,
            location_id: this.selectedLocationId, //may not be needed
        };
        this.sharedFunctions.postRequest("/product/bulkUpdateProductPriorities", body)
        .subscribe((data) => {
            this.toastr.info(data.message);
        }, error =>  this.toastr.error(error.error.message))
    }

    fetchTaxGroups() {
        const url = "/taxation/api/v1/tax-groups";
        let params = {}
        params["type"] = "product";
        if(!this.sharedFunctions.emptyOrAllParam(this.selectedLocationId)) {
            params["locationId"] = this.selectedLocationId;
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
        this.selectedTaxGroupId = value;
        this.loading = true;
        this.sharedFunctions.getRequest(url).subscribe((data) => {
            this.taxInformation = data.data.taxCodes;
            this.loading = false;
        });
    }
}

import { Component, OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { Router } from "@angular/router";
import { SharedFunctionsService } from "../../../shared/services/shared-function.service";
import { RoleConstants } from "../../../constants/roles-constants";

@Component({
    selector: "app-brand",
    templateUrl: "./brand.component.html",
    styleUrls: ["./brand.component.scss"],
})
export class BrandComponent implements OnInit {
    Event = {
        target: {
            files: [],
        },
    };
    categories = [];
    subcatPriorityUpdateOptions = [];
    categoryName = "";
    loading = true;
    subCategoryName = "";
    start_time = new Date().toISOString();
    end_time = new Date().toISOString();
    settings = {
        bigBanner: true,
        timePicker: true,
        format: "dd-MMM-yyyy hh:mm a ",
        defaultOpen: false,
    };
    searchCategory = "";
    updateDisabled = false;

    cat = {
        name: "",
        start_date: this.start_time,
        end_date: this.end_time,
        priority: null,
        sub_categories: [],
        image_url: "",
        imageFileName: "",
        imageFile: "",
    };
    locations = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    locationIds = [];
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "productCategoryPage";
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));

    constructor(
        private sharedFunctions: SharedFunctionsService,
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private router: Router
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getlocations();
        this.getAllCategories();
    }
    pagination(event) {
        this.currentPage = event;
        this.getAllCategories();
    }
    resetPager() {
        this.totalItems = 0;
        this.currentPage = 1;
        this.categories = [];
    }
    refresh() {
        this.loading = true;
        this.resetPager();
        this.cat = {
            name: "",
            priority: null,
            start_date: this.start_time,
            end_date: this.end_time,
            sub_categories: [],
            image_url: "",
            imageFileName: "",
            imageFile: "",
        };
        this.getAllCategories();
    }

    getlocations() {
        var path = "/config/location/getAll";
        this.sharedFunctions.getRequest(path).subscribe(
            (data) => {
                this.locationIds = [];
                if (data && data.data && data.data.locations) {
                    this.locations = data.data.locations;
                    this.locations.forEach((location) => {
                        this.locationIds.push(location.id);
                    });
                }
                else {
                    this.locations = [];
                }
                this.resetPager();
                this.getAllCategories();
            },
            (error) => { }
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
            (error) => { }
        );
    }

    addLocation() {
        this.locationIds = [];
        if (this.selectedLocationId == "" || this.selectedLocationId == "All") {
            this.locations.forEach((location) => {
                this.locationIds.push(location.id);
            });
        } else {
            this.locationIds.push(this.selectedLocationId);
        }
        this.getAllCategories();
    }
    getAllCategories() {
        let params = {
            search: this.searchCategory,
            per_page: this.itemsPerPage,
            page: this.currentPage,
            type: "BRAND"
        };
        if (this.searchCategory == "") {
            this.updateDisabled = false;
        } else {
            this.updateDisabled = true;
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
        params["isAdmin"] = 1;
        this.sharedFunctions
            .getRequest("/categories/getAllAdminCategories", params)
            .subscribe((data) => {
                this.categories = data.data;
                this.cat.priority = data.totalwithoutSearch + 1;
                this.subcatPriorityUpdateOptions = [];

                for (var category of this.categories) {
                    category["disabled"] = category["disabled_at"]
                        ? true
                        : false;
                    if (category.sub_categories) {
                        category.sub_categories.sort((a, b) =>
                            a.priority > b.priority ? 1 : -1
                        );
                        for (var sub_cat of category.sub_categories) {
                            this.subcatPriorityUpdateOptions.push({
                                buttonStatus: true,
                                buttonText: "Edit",
                            });
                            sub_cat["disabled"] = sub_cat["disabled_at"]
                                ? true
                                : false;
                        }
                    }
                }
                this.totalItems = data.totalCount;
                this.loading = false;
            }, err => {
                this.toastr.error(err.error.message);
                this.loading = false;
            });
    }

    emptySearch() {
        this.searchCategory = "";
        this.resetPager();
        this.getAllCategories();
    }

    createCategory() {
        if (this.cat.name) {
            this.cat.name = this.cat.name.trim();
        }
        if (this.cat.name == "") {
            this.toastr.error("Please add brand (L1) name");
            return;
        }
        if (!this.isValidCatName(this.cat.name)) {
            this.toastr.error("brand (L1) name must not contain all dots");
            return;
        }
        if (this.selectedLocationId == "All" || this.selectedLocationId == "") {
            this.toastr.error("Please select location");
            return;
        }
        var valueArr = this.cat.sub_categories.map(function (item) {
            return item.name.trim();
        });
        var isDuplicate = valueArr.some(function (item, idx) {
            return valueArr.indexOf(item) != idx;
        });
        if (isDuplicate) {
            this.toastr.error("Sub brand cannot have same name!");
            return;
        }
        this.cat["location_id"] = parseInt(this.selectedLocationId);
        this.cat["type"] = "BRAND";
        this.deleteImageFile(this.cat);
        if (this.cat.sub_categories.length > 0) {
            for (var sub_cat of this.cat.sub_categories) {
                if (sub_cat.name) sub_cat.name = sub_cat.name.trim();
                if (sub_cat.name == "") {
                    this.toastr.error("Please add brand (L2) name");
                    return;
                }
                if (!this.isValidCatName(sub_cat.name)) {
                    this.toastr.error(
                        "brand (L2) name must not contain all dots"
                    );
                    return;
                }
                sub_cat["location_id"] = parseInt(this.selectedLocationId);
                sub_cat["start_date"] = this.cat.start_date;
                sub_cat["end_date"] = this.cat.end_date;
                sub_cat["type"] = "BRAND";
                this.deleteImageFile(sub_cat);
            }
        }

        this.sharedFunctions
            .postRequest("/categories/createProductCategory", this.cat)
            .subscribe(
                (data) => {
                    this.toastr.success("Created brand successfully");
                    this.refresh();
                },
                (error) => {
                    this.toastr.error(error.error.message);
                }
            );
    }

    updateCategories() {
        this.sharedFunctions
            .postRequest("/categories/updateCategories", {
                categories: this.categories,
            })
            .subscribe(
                (data) => {
                    this.toastr.success("Categories updated successfully");
                },
                (err) => {
                    this.toastr.error(err.Error);
                }
            );
    }

    updateSubCategoryPriority(category, index) {
        this.deleteImageFile(category);
        if (this.subcatPriorityUpdateOptions[index].buttonText === "Edit") {
            this.subcatPriorityUpdateOptions[index].buttonStatus = false;
            this.subcatPriorityUpdateOptions[index].buttonText = "Update";
        } else {
            this.sharedFunctions
                .postRequest("/categories/updateSubCategoryPriority", category)
                .subscribe(
                    (data) => {
                        this.toastr.success("Categories updated successfully");
                        this.refresh();
                    },
                    (err) => {
                        if (this.sharedFunctions.isEmpty(err.error.message) && this.sharedFunctions.isEmpty(err.error.trace)) {
                            this.toastr.error("Internal Server Error");
                        } else {
                            if (err.error.message) {
                                this.toastr.error(err.error.message);
                            } else {
                                this.toastr.error(err.error.trace);
                            }
                        }
                    }
                );
        }
    }

    updateCategory(category) {
        console.log("updating brand", category);
        var index = this.categories.indexOf(category);
        var categories = this.categories.map(function (item) {
            return {
                name: item.name,
                location_id: item.location_id,
                disabled: item.disabled_at,
            };
        });
        categories.splice(index, 1);
        this.deleteImageFile(category);
        var isDuplicateCategory = categories.some(function (item, idx) {
            if (item.name == category.name && item.location_id == category.location_id && item.disabled == null) {
                return true;
            }
        });
        if (category.name) category.name = category.name.trim();
        if (category.name == "") {
            this.toastr.error("brand name missing!");
            return;
        }
        if (!category.priority) {
            this.toastr.error("brand (L1) priority missing!");
            return;
        }
        if (!this.isValidCatName(category.name)) {
            this.toastr.error("brand (L1) name must not contain all dots");
            return;
        }
        if (category.sub_categories) {
            let priorityMissing = false;
            let maxPriority = category.sub_categories.length;
            let maxPriorityError = false;
            let minPriorityError = false;
            var sub_categories = category.sub_categories.map(function (item) {
                if (!item.priority) {
                    priorityMissing = true;
                }
                else if (item.priority > maxPriority) {
                    maxPriorityError = true;
                }
                else if (item.priority < 1) {
                    minPriorityError = true;
                }
                return item.name.trim();
            });
            var isDuplicateSubCategory = sub_categories.some(function (
                item,
                idx
            ) {
                return sub_categories.indexOf(item) != idx;
            });
            var isNameEmpty = sub_categories.some(function (item, idx) {
                if (item == "") {
                    return true;
                }
            });
            var that = this;
            var isNameInValid = sub_categories.some(function (item, idx) {
                if (!that.isValidCatName(item)) {
                    return true;
                }
            });
            category.sub_categories.forEach((cat) => {
                this.deleteImageFile(cat);
            });
            if (isDuplicateCategory || isDuplicateSubCategory) {
                this.toastr.error(
                    "category/sub-category already exist with this name!"
                );
                return;
            }
            if (isNameEmpty) {
                this.toastr.error("sub-brand name missing!");
                return;
            }
            if (isNameInValid) {
                this.toastr.error(
                    "brand (L2) name must not contain all dots"
                );
                return;
            }
            if (priorityMissing) {
                this.toastr.error(
                    "brand (L2) priority missing!"
                );
                return;
            }
            if (maxPriorityError) {
                this.toastr.error(
                    "BRAND (L2) MAX PRIORITY " + maxPriority + " ALLOWED"
                );
                return;
            }
            if (minPriorityError) {
                this.toastr.error(
                    "BRAND (L2) MIN PRIORITY " + 1 + " ALLOWED"
                );
                return;
            }
        }
        this.sharedFunctions
            .postRequest("/categories/updateCategory", category)
            .subscribe(
                (data) => {
                    this.refresh();
                    this.toastr.success("BRAND updated successfully");
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

    isValidCatName(name: any) {
        var re = new RegExp("^[. ]+$");
        if (re.test(name)) {
            return false;
        } else {
            return true;
        }
    }

    goToCategory(id) {
        this.router.navigateByUrl("product/get-products/" + id);
    }
    addSubCat(category) {
        if (!category.sub_categories) {
            category.sub_categories = [];
        }
        let sub_cat: any = {
            name: "",
            priority: category.sub_categories.length + 1,
            image_url: "",
            location_id: category.location_id,
            type: "BRAND"
        }
        sub_cat.disabled = category.disabled;
        if (sub_cat.disabled) {
            this.disableCategory(sub_cat, false)
        }
        category.sub_categories.push(sub_cat);
    }

    removeSubCat(category, index) {
        category.sub_categories.splice(index, 1);

        for (var subcat of category.sub_categories) {
            if (!subcat.id)
                subcat.priority = category.sub_categories.indexOf(subcat) + 1;
        }
    }

    disableCategory(category, check) {
        var user = JSON.parse(localStorage.getItem("userData"));
        if (check) {
            category.disabled_at = category.disabled
                ? null
                : new Date().toISOString();
            category.disabled_by = category.disabled ? null : user.id;
            category.disabled = !category.disabled;
            for (var subCat of category.sub_categories) {
                subCat.disabled_at = subCat.disabled
                    ? null
                    : new Date().toISOString();
                subCat.disabled_by = subCat.disabled ? null : user.id;
                subCat.disabled = category.disabled ? true : false;
            }
        } else {
            category.disabled_at = category.disabled
                ? null
                : new Date().toISOString();
            category.disabled_by = category.disabled ? null : user.id;
        }
    }
    onFileChange(event, cat) {
        this.Event = event;
        if (event.target && event.target.files && event.target.files[0]) {
            cat.imageFileName = event.target.files[0].name;
            cat.imageFile = event.target.files[0];
        } else {
            cat.imageFileName = "";
            cat.imageFile = null;
        }
    }
    removeFile(cat) {
        cat.imageFileName = "";
        cat.imageFile = null;
    }
    uploadFile(type, index, category, imagecat) {
        if (imagecat && imagecat.imageFile) {
            let formData = new FormData();
            var reqPath = "/upload/uploadUserImageToS3";
            formData.append("picture", imagecat.imageFile);
            this.sharedFunctions.postRequest(reqPath, formData).subscribe(
                (data) => {
                    if (data.success) {
                        this.toastr.success("File/Image uploaded successfully");
                        imagecat.imageFileName = "";
                        imagecat.imageFile = null;
                        if (category) {
                            if (type == 1) category.image_url = data.data.link;
                            else if (type == 2) category.image_url = data.data.link;
                        } else {
                            if (type == 1) this.cat.image_url = data.data.link;
                            else
                                this.cat.sub_categories[index].image_url =
                                    data.data.link;
                        }
                        if (category && category.id) this.updateCategory(category);
                    }
                    else {
                        this.toastr.error(data.message);
                    }
                },
                (err) => { }
            );
        }
    }

    deleteImageFile(cat) {
        try {
            cat["start_date"] = new Date(cat["start_date"]).toISOString();
            cat["end_date"] = new Date(cat["end_date"]).toISOString();
        } catch (e) { }
        try {
            delete cat["imageFileName"];
            delete cat["imageFile"];
            delete cat["disabled"];
        } catch (e) { }
    }
}

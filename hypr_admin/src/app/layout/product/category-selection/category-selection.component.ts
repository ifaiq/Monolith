import { Component, OnInit, Input, EventEmitter, Output } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import * as _ from 'lodash';

@Component({
    selector: "product-category-selection",
    templateUrl: "./category-selection.component.html",
    styleUrls: ["../product.component.scss"],
})
export class ProductCategorySelection implements OnInit {
    @Input() categoryList = [];
    @Input() activeCategories = [];
    @Input() product;
    @Input() isAddMore = false;
    @Output() closeCategorySelection = new EventEmitter();
    showSubCat = false;
    subCategories = [];
    @Input() mappedCategories = [];
    constructor(private toastr: ToastsManager) {}
    ngOnInit() {
        this.setSelectedCategories();
    }

    setSelectedCategories() {
        var newList = [];
        this.categoryList.forEach((ele) => {
            var isSelected = false;
            var isAlreadySelected = this.activeCategories.filter((item) => {
                if (item.category_id.id == ele.id) {
                    return item;
                }
            });
            if (isAlreadySelected.length > 0) {
                isSelected = true;
            }
            var sub_categories = [];
            if (ele.sub_categories)
                ele.sub_categories.forEach((subele) => {
                    var isAlreadyAdded = this.activeCategories.filter(
                        (item) => item.category_id.id == subele.id
                    );
                    if (isAlreadyAdded.length == 0) {
                        sub_categories.push(subele);
                    }
                });
            var tempCat = JSON.parse(JSON.stringify(ele));
            if (isSelected && sub_categories.length > 0) {
                tempCat.sub_categories = sub_categories;
                newList.push(tempCat);
            } else if (!isSelected) {
                newList.push(tempCat);
            }
        });
        this.categoryList = newList;
    }
    toggleSelection(cat) {
        if (cat.selected) {
            this.categoryList.forEach((ele) => {
                if (ele.id != cat.id) {
                    if (ele.selected) {
                        ele.selected = false;
                        if (ele.sub_categories)
                            this.removeSubCategorySelection(cat.sub_categories);
                    }
                }
            });
            this.subCategories = cat.sub_categories;
            this.showSubCat = true;
        } else {
            if (cat.sub_categories)
                this.removeSubCategorySelection(cat.sub_categories);
            this.showSubCat = false;
        }
    }

    removeSubCategorySelection(sub_categories) {
        sub_categories.forEach((subele) => {
            subele.selected = false;
        });
    }
    removeSubCatSelection(subcat) {
        var selected = !subcat.selected;
        if (selected) {
            var selectedCat = this.mappedCategories.filter(
                (item) => item.id == subcat.parent
            );
            if (selectedCat.length > 0) {
                var isSubSelected = false;
                selectedCat[0].sub_categories.forEach((subele) => {
                    if (subele.id == subcat.id) {
                        isSubSelected = true;
                    }
                });
                if (!isSubSelected) {
                    subcat.selected = selected;
                } else {
                    this.toastr.error("Category Already Selected");
                }
            } else {
                subcat.selected = selected;
            }
        } else {
            subcat.selected = selected;
        }
        if (!this.isAddMore) {
            this.closeCategorySelection.emit({
                mappedCategories: this.mappedCategories,
            });
        }
    }
    addCategory() {
        var index = -1;
        var isSelected = false;
        this.categoryList.forEach((ele) => {
            index += 1;
            var subCategories = [];
            if (ele.selected) {
                isSelected = true;
                if (ele.sub_categories)
                    ele.sub_categories.forEach((subele) => {
                        if (subele.selected) {
                            subCategories.push(subele);
                        }
                        subele.selected = false;
                    });
                if (subCategories.length > 0) {
                    var alreadyInList = this.mappedCategories.filter(
                        (item) => item.id == ele.id
                    );
                    if (alreadyInList.length) {
                        alreadyInList[0].sub_categories = alreadyInList[0].sub_categories.concat(
                            subCategories
                        );
                    } else {
                        var tempCat = JSON.parse(JSON.stringify(ele));
                        tempCat.sub_categories = subCategories;
                        this.mappedCategories.push(tempCat);
                    }
                    if (!this.isAddMore) {
                        this.closeCategorySelection.emit({
                            mappedCategories: this.mappedCategories,
                        });
                    } else {
                        this.addInProduct();
                    }
                } else {
                    this.toastr.error("Please Select Atleast 1 Sub-Category");
                }
            }
        });
        if (!isSelected) {
            this.toastr.error("Please select Category");
        }
    }
    removeSelectedCat(cat, subcatId) {
        if (!subcatId) {
            this.mappedCategories = this.mappedCategories.filter(
                (item) => item.id != cat.id
            );
        } else {
            var index = -1;
            var selectedIndex = -1;
            cat.sub_categories.forEach((subele) => {
                index += 1;
                if (subele.id == subcatId) {
                    selectedIndex = index;
                }
            });
            cat.sub_categories.splice(selectedIndex, 1);
            if (cat.sub_categories.length == 0) {
                this.mappedCategories = this.mappedCategories.filter(
                    (item) => item.id != cat.id
                );
            }
        }
        if (!this.isAddMore) {
            this.closeCategorySelection.emit({
                mappedCategories: this.mappedCategories,
            });
        }
    }

    addInProduct() {
        var newList = [];
        this.mappedCategories.forEach((ele) => {
            var isAlreadyInProduct = this.activeCategories.filter(
                (item) => item.category_id.id == ele.id
            );
            var mainCat = JSON.parse(JSON.stringify(ele));
            var sub_categories = JSON.parse(
                JSON.stringify(mainCat.sub_categories)
            );
            if (isAlreadyInProduct.length == 0) {
                mainCat["label"] = "L1";
                mainCat["parent_id"] = null;
                mainCat["sub_categories"] = [];
                var category = {
                    product_id: this.product.id,
                    category_id: mainCat,
                    product_max_priority: this.assignProductMaxPriority(this.product, mainCat),
                    product_priority: 1,
                };
                newList.push(category);
            }
            sub_categories.forEach((subele) => {
                var isAlreadyInProduct = this.activeCategories.filter(
                    (item) => item.category_id.id == subele.id
                );
                if (isAlreadyInProduct.length == 0) {
                    subele["label"] = "L2";
                    subele["parent_id"] = mainCat.id;
                    var category = {
                        product_id: this.product.id,
                        category_id: subele,
                        product_max_priority: this.assignProductMaxPriority(this.product, subele),
                        product_priority: 1,
                    };
                    newList.push(category);
                }
            });
        });
        var list = JSON.parse(JSON.stringify(this.activeCategories));
        list = list.concat(newList);
        this.closeCategorySelection.emit({ newList: list, isAdded: true });
    }

    cancel() {
        this.closeCategorySelection.emit({ isAdded: false });
    }

    assignProductMaxPriority(product, category) {
        let priority = 1;
        let categoryReadded = [];
        if (!_.isEmpty(product.existingCategories)) {
            categoryReadded = product.existingCategories.filter(existingCategory => existingCategory.category_id.id === category.id)
        }
        if (_.isEmpty(categoryReadded)) {
            console.log(category.maxProductPriority)
            priority = category.maxProductPriority ? category.maxProductPriority + 1 : 1;
        } else {
            priority = category.maxProductPriority ? category.maxProductPriority : 1;
        }
        return priority;
    }
}

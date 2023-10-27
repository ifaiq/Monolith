import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SharedFunctionsService } from '../../../shared';


@Component({
    selector: 'customer-selection',
    templateUrl: './customer-selection.component.html'
})
export class CustomerSelectionComponent implements OnInit {
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "customerSelectionListPage";
    customers = [];
    loading = true;
    allChecked = false;
    @Input() company_id = 0;
    @Input() coupon_customers = [];
    @Output() closeCustomerSelection = new EventEmitter();
    search = "";

    constructor(private sharedFunctions: SharedFunctionsService, private toastr: ToastsManager) { }

    ngOnInit() {
        this.coupon_customers = JSON.parse(JSON.stringify(this.coupon_customers));
        this.getCustomersByLocation();
    }

    pagination(event) {
        this.allChecked = false;
        this.currentPage = event;
        this.getCustomersByLocation();
    }

    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
    }

    findIndexBYCustomerId(customerId) {
        return this.coupon_customers.map(function (e) { return e.id; }).indexOf(customerId);
    }

    toggleAllSelection() {
        for (var index = 0; index < this.customers.length; index++) {
            this.customers[index].checked = this.allChecked;
            let existingIndex = this.findIndexBYCustomerId(this.customers[index].id);
            if (this.allChecked && existingIndex == -1) {
                this.coupon_customers.push({
                    id: this.customers[index].id,
                    name: this.customers[index].name,
                    phone: this.customers[index].phone
                });
            }
            if (!this.allChecked && existingIndex != -1) {
                this.coupon_customers.splice(existingIndex, 1);
            }
        }
    }

    selectionChanged(i) {
        let selectedCustomer = this.customers[i];
        let existingIndex = this.findIndexBYCustomerId(selectedCustomer.id);
        if (selectedCustomer.checked && existingIndex == -1) {
            this.coupon_customers.push({
                id: selectedCustomer.id,
                name: selectedCustomer.name,
                phone: selectedCustomer.phone
            });
        }
        if (!selectedCustomer.checked && existingIndex != -1) {
            this.coupon_customers.splice(existingIndex, 1);
        }
        let selectedCustomers = this.customers.filter(item => item.checked == true);
        if (selectedCustomers.length == this.customers.length) {
            this.allChecked = true;
        }
        else {
            this.allChecked = false;
        }
    }

    undoSearch() {
        this.search = "";
    }

    getCustomersByLocation() {

        var params = {
            limit: this.itemsPerPage,
            pageNo: this.currentPage,
        };
        if (this.search) {
            params["searchOnAttributes"] = 'name,phone';
            params["searchValue"] = this.search.trim();
        }
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.company_id,
                true
            )
        ) {
            params['companyId'] = this.company_id;
            params['select'] = 'id,name,phone,email,address'
        }
        var path = "/user/customer/byLocation";
        this.sharedFunctions.getRequest(path, params).subscribe((data) => {
            if (data && data.data && data.data.customers) {
                let tempData = JSON.parse(JSON.stringify(data.data.customers));
                let customers = [];
                for (var index = 0; index < tempData.length; index++) {
                    let existingIndex = this.findIndexBYCustomerId(tempData[index].id);
                    customers.push({
                        rowCount: this.sharedFunctions.getRowCount(
                            this.itemsPerPage,
                            this.currentPage,
                            index
                        ),
                        name: tempData[index].name,
                        phone: tempData[index].phone,
                        id: tempData[index].id,
                        checked: existingIndex > -1 ? true : false
                    })
                }
                this.totalItems = data.data.totalCount;
                this.customers = customers;
                let selectedCustomers = this.customers.filter(item => item.checked == true);
                if (selectedCustomers.length == this.customers.length) {
                    this.allChecked = true;
                }
                else {
                    this.allChecked = false;
                }
            }
            this.loading = false;
        },
            (error) => {
                this.toastr.error(error.error.message);
                this.loading = false;
            });

    }

    add() {
        this.closeCustomerSelection.emit({ isAdd: true, couponCustomers: this.coupon_customers });
    }
}

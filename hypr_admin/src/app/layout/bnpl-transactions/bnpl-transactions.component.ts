import { Component, OnInit, ViewChild } from "@angular/core";
import { routerTransition } from "../../router.animations";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../shared";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
@Component({
    selector: "app-dashboard",
    templateUrl: "./bnpl-transactions.component.html",
    styleUrls: ["./bnpl-transactions.component.scss"],
    animations: [routerTransition()],
})
export class BnplTransactions implements OnInit {
    tableData = [];
    transactions = [];
    startDate: any;
    endDate: any;
    itemsPerPage = 10;
    currentPage = 1;
    totalItems = 0;
    paginationId = "approveTransactionPage";
    @ViewChild("fileInput") fileInput;
    file: any;
    file_name = "";
    loading = false;
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private modalService: NgbModal,
        public sharedFunctions: SharedFunctionsService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.startDate = new Date().toISOString().split("T")[0];
        this.endDate = new Date().toISOString().split("T")[0];
        this.getTransactions();
    }
    refresh() {
        this.resetPager();
        this.loading = true;
        this.startDate = new Date().toISOString().split("T")[0];
        this.endDate = new Date().toISOString().split("T")[0];
        this.getTransactions();
        this.clearFileCustomer();
    }
    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
        this.tableData = [];
    }
    pagination(event) {
        this.currentPage = event;
        this.getTransactions();
    }
    clearFileCustomer() {
        try {
            let fileForm: any = document.getElementById("fileFormCustomer");
            fileForm.reset();
            this.file = null;
            this.file_name = "";
        } catch (e) {}
    }

    getTransactions() {
        this.loading = true;
        var params = {
            startDate: this.sharedFunctions.getStartDate(this.startDate),
            endDate: this.sharedFunctions.getEndDate(this.endDate),
            perPage: this.itemsPerPage,
            page: this.currentPage,
        };
        var path = "/loanTransaction/repaymentTransactions";
        this.sharedFunctions.getRequest(path, params, true).subscribe(
            (data) => {
                if (data.code == "OK") {
                    if (data.data && data.data.transactions) {
                        this.tableData = data.data.transactions;
                        var tableData = [];
                        for (
                            var index = 0;
                            index < data.data.transactions.length;
                            index++
                        ) {
                            tableData.push({
                                rowCount: this.sharedFunctions.getRowCount(
                                    this.itemsPerPage,
                                    this.currentPage,
                                    index
                                ),
                                id: data.data.transactions[index].id,
                                date: data.data.transactions[index]
                                    .loanTransaction_transaction_date,
                                retailerId:
                                    data.data.transactions[index]
                                        .loanTransaction_retailer_id,
                                amount: data.data.transactions[index]
                                    .loanTransaction_transaction_amount,
                                currency:
                                    data.data.transactions[index]
                                        .loanTransaction_currency_code,
                            });
                        }
                        this.tableData = tableData;
                        this.totalItems = data.data.totalCount;
                    } else {
                        this.tableData = [];
                        this.totalItems = 0;
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
    onChange(event: EventTarget) {
        let eventObj: MSInputMethodContext = <MSInputMethodContext>event;
        let target: HTMLInputElement = <HTMLInputElement>eventObj.target;
        let files: FileList = target.files;
        this.file = files[0];
    }

    upload() {
        let formData = new FormData();

        formData.append("file", this.file, this.file.name);
        this.sharedFunctions
            .postRequest(
                "/bulk-operations/bulkCreateLoanRepayment",
                formData,
                true
            )
            .subscribe(
                (data) => {
                    if (data.success) {
                        this.getTransactions();
                        this.toastr.info("File uploaded SuccessFully");
                        this.clearFileCustomer();
                    }
                },
                (err) => {
                    this.clearFileCustomer();
                    console.log(err);
                    this.toastr.error(err.error.message);
                }
            );
    }
}

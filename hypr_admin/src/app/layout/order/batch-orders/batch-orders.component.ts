import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { NgZone } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared/services/shared-function.service";
import { RoleConstants } from "../../../constants/roles-constants";
import { BatchStatusConstants, NonCashTypes, DifferenceReasons, ReturnReasons } from "../../../constants/batch-constants";
import Swal from "sweetalert2";
import { OrderPaymentMethodsConstants, OrderPaymentOptionsText } from "../../../constants/order-status";

@Component({
  selector: "batch-orders",
  templateUrl: "./batch-orders.component.html",
  styleUrls: ["./batch-orders.component.scss"],
})
export class BatchOrdersComponent implements OnInit {
  loading = false;
  startDate;
  endDate;
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;
  paginationId = "BatchesPage";
  settings = {
    bigBanner: true,
    timePicker: false,
    format: "dd-MM-yyyy",
    defaultOpen: false,
  };
  locations = [];
  businessUnits = [];
  selectedLocationId = "";
  selectedBusinessUnitId = "";
  allDeliveryAgents = [];
  selectedDeliveryAgentId = "";
  batchDeliveryAgents = [];
  newDeliveryAgentId = "";
  batchTableData = [];
  batches = [];
  batch_no = "";
  activeIndex = -1;
  readonly batchStatusPending = BatchStatusConstants.PENDING;
  readonly batchStatusCompleted = BatchStatusConstants.COMPLETED;
  readonly batchStatusClosed = BatchStatusConstants.CLOSED;
  readonly ReturnReasonMissingInventory = ReturnReasons.MISSING_INVENTORY;
  readonly ReturnReasonLostInventory = ReturnReasons.LOST_INVENTORY;
  readonly ReturnReasonDamagedInventory = ReturnReasons.DAMAGED_INVENTORY;
  readonly NonCashTypeBankTransfer = NonCashTypes.BANK_TRANSFER;
  readonly NonCashTypeCheque = NonCashTypes.CHEQUE;
  readonly NonCashTypeDigitalWallet = NonCashTypes.DIGITAL_WALLET;
  readonly NonCashTypeFinjaPayments = NonCashTypes.FINJA_PAYMENTS;
  readonly NonCashTypePendingPayments = NonCashTypes.PENDING_PAYMENTS;
  readonly DifferenceReasonTheft = DifferenceReasons.THEFT;
  readonly DifferenceReasonLostMoney = DifferenceReasons.LOST_MONEY;
  readonly DifferenceReasonLostItems = DifferenceReasons.LOST_ITEMS;
  readonly DifferenceReasonDoNotKnowReason = DifferenceReasons.DO_NOT_KNOW_REASON;
  readonly DifferenceReasonDidNotTakeInventory = DifferenceReasons.DID_NOT_TAKE_INVENTORY;
  readonly DifferenceReasonOther = DifferenceReasons.OTHERS;
  search = "";
  constructor(
    private toastr: ToastsManager,
    vRef: ViewContainerRef,
    lc: NgZone,
    public sharedFunctions: SharedFunctionsService
  ) {
    this.toastr.setRootViewContainerRef(vRef);
  }

  ngOnInit() {
    this.getbusinessUnits();
    this.getBatchOrders(true);
  }

  getbusinessUnits() {
    this.resetBUUnit();
    var path = "/config/businessunit/getAll";
    this.sharedFunctions.getRequest(path).subscribe((data) => {
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

  getlocations() {
    this.resetLocations();
    var params = {};
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
    this.sharedFunctions.getRequest(path, params).subscribe((data) => {
      if (data && data.data && data.data.locations) {
        this.locations = data.data.locations;
      } else {
        this.locations = [];
      }
    });
  }

  resetLocations() {
    this.selectedLocationId = "";
    this.locations = [];
    this.resetDeliveryAgents();
  }
  resetBUUnit() {
    this.businessUnits = [];
    this.selectedBusinessUnitId = "";
    this.resetLocations();
  }

  formatNumber(num) {
    let number = Number(num)
    return number.toLocaleString();
  }

  searchBatches() {
    this.getBatchOrders(true);
  }

  undoSearch() {
    this.search = "";
    this.getBatchOrders(true);
  }

  getBatchOrders(reset) {
    if (this.loading) {
      return;
    }
    if (reset) {
      this.currentPage = 1;
    }
    this.batchDeliveryAgents = [];
    this.batchTableData = [];
    this.loading = true;
    var params = { isAdmin: true, page: this.currentPage, per_page: this.itemsPerPage }
    if (this.startDate) {
      params["startDate"] = this.sharedFunctions.getStartDate(this.startDate);
    }
    if (this.endDate) {
      params["endDate"] = this.sharedFunctions.getEndDate(this.endDate);
    }
    if (this.selectedLocationId) {
      params["locationId"] = this.selectedLocationId;
    }
    if (this.selectedDeliveryAgentId) {
      params["assignedTo"] = this.selectedDeliveryAgentId;
    }
    if (this.search != "") {
      params["search"] = this.search;
    }
    this.sharedFunctions
      .getRequest("/batch/getBatches", params)
      .subscribe((data) => {
        if (data.success == true) {
          this.batches = data.data.batches;
          this.batches.map((batch, index) => {
            this.batchDeliveryAgents[index] = batch.agent_id;
            this.batchTableData.push({
              rowCount: this.sharedFunctions.getRowCount(
                this.itemsPerPage,
                this.currentPage,
                index,
              ),
              id: batch.id,
              status_name: batch.status_name,
              status_id: batch.status_id,
              location: batch.store_name,
              date: this.sharedFunctions.getFormattedDate(
                batch.created_at,
                1
              ),
              delivery_agent: batch.agent_name,
              orders: this.mapOrders(batch.orders),
              products: this.mapProducts(batch.products),
              cash_collected: batch.cash_collected ? batch.cash_collected : 0,
              non_cash_collected: batch.non_cash_collected ? batch.non_cash_collected : 0,
              non_cash_type: batch.non_cash_type ? batch.non_cash_type : null,
              difference_reason: batch.difference_reason ? batch.difference_reason : null,
            });
            this.batchTableData[index]['cash_receivable'] = this.batchTableData[index].orders.reduce((acc, obj) => {
              switch(obj.payment_type) {
                case OrderPaymentMethodsConstants.COD_WALLET:
                  return acc + obj.wallet_amount + obj.total_amount;
                case OrderPaymentMethodsConstants.SADAD:
                case OrderPaymentMethodsConstants.SADAD_WALLET:
                  return acc + obj.wallet_amount + obj.sadad_amount + obj.total_amount;
                default:
                  return acc + obj.cash_received;

              }
            }, 0);
            this.batchTableData[index]['inventory_shortage'] = batch.inventory_shortage_amount ? batch.inventory_shortage_amount : this.calculateMissingCash(this.batchTableData[index]);
            this.batchTableData[index]['payment_wallet_balance'] = this.batchTableData[index].orders.reduce((acc, obj) => acc + obj.wallet_amount, 0);
            this.batchTableData[index]['payment_sadad_balance'] = this.batchTableData[index].orders.reduce((acc, obj) => acc + obj.sadad_amount, 0);
          });
          this.totalItems = data.data.total_count;
          this.loading = false;
        } else {
          this.batches = [];
          this.batchTableData = [];
          this.loading = false;
          if (data.message) {
            this.toastr.error(data.message);
          } else {
            this.toastr.error("Something went wrong");
          }
        }
      }, (err) => {
        this.batches = [];
        this.batchTableData = [];
        this.loading = false;
        this.toastr.error(err.error.message);
      });
  }

  getTotalAmount(order) {
    switch(order.payment_type) {
      case OrderPaymentMethodsConstants.COD_WALLET:
        return order.order_status === OrderPaymentOptionsText.IN_TRANSIT ? 0 : order.amountPayable || 0;
      case OrderPaymentMethodsConstants.SADAD:
      case OrderPaymentMethodsConstants.SADAD_WALLET:
        return order.cashAmount || 0;
      default:
        return order.cash_received || 0;
    }
  }

  mapOrders(orders) {
    let order_array = [];
    Object.keys(orders).reduce((order: any, order_id, index) => {
      order = orders[order_id];
      order_array.push({
        rowCount: (index + 1).toString(),
        id: order_id,
        customer_name: order.customer_name,
        shop_name: order.shop_name,
        payment_type: order.payment_type,
        customer_address: order.customer_address,
        sadad_amount: order.sadadAmount || 0,
        wallet_amount: order.walletAmount || 0 ,
        total_amount: this.getTotalAmount(order),
        coupon_discount_amount: order.cash_received ? order.coupon_discount_amount : 0,
        coupon_discount_type: order.coupon_discount_type,
        waiver_amount: order.cash_received ? order.waiver_amount : 0,
        cash_received: order.cash_received,
        order_date: this.sharedFunctions.getFormattedDate(
          order.order_date,
          1
        ),
        order_status: order.order_status
      });
    }, {});
    return order_array;
  }

  mapProducts(products) {
    let product_array = [];
    products.map((product, index) => {
      product_array.push({
        rowCount: (index + 1).toString(),
        id: product.id,
        name: product.name,
        onboarded: product.onboarded_quantity,
        current: product.current_quantity,
        received: product.hasOwnProperty('return_quantity') && product.return_quantity ? product.return_quantity : product.current_quantity,
        price: product.price,
        reason: product.return_reason ? product.return_reason : null,
        onHoldQuantity: product.onHoldQuantity ? product.onHoldQuantity : 0
      });
    });
    return product_array;
  }

  setActiveIndex(param, index) {
    this[param] = this[param] == index ? -1 : index;
  }

  resetDeliveryAgents() {
    this.allDeliveryAgents = [];
    this.selectedDeliveryAgentId = "";
  }

  getDeliveryAgents() {
    const params = {
      roleId: [RoleConstants.DELIVERY],
      locationId: this.selectedLocationId,
      allData: true
    };
    this.allDeliveryAgents = [];
    this.selectedDeliveryAgentId = "";
    this.sharedFunctions
      .getRequest("/user/user/byRole", params)
      .subscribe((data) => {
        this.allDeliveryAgents = data.data;
      });
  }

  refresh() {
    this.selectedDeliveryAgentId = "";
    this.startDate = null;
    this.endDate = null;
    this.getbusinessUnits();
    this.getBatchOrders(true);
  }

  // Code to be used in future release. Do not remove.

  // updateDeliveryAgent(index) {
  //   this.batchDeliveryAgents[index] = this.newDeliveryAgentId;
  //   const batch = this.batches[index];
  //   const obj = {
  //     batchId: batch.id,
  //     agentId: this.newDeliveryAgentId,
  //   };
  //   this.sharedFunctions
  //     .postRequest("/batch/assign", obj)
  //     .subscribe((data) => {
  //       this.toastr.success("Delivery Agent Changed Successfully");
  //     });
  // }

  askForPermission(batch, cancel) {
    if (cancel) {
      Swal({
        title: "Are you sure?",
        text: "You want to cancel this batch?",
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      }).then((result) => {
        if (result.value) this.cancelBatch(batch);
      });
    } else {
      Swal({
        title: "Are you sure?",
        text: "You want to close this batch?",
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      }).then((result) => {
        if (result.value) this.closeBatch(batch);
      });
    }
  }

  cancelBatch(batch) {
    const obj = {
      batch: batch,
    };
    this.sharedFunctions
      .postRequest("/batch/cancel", obj)
      .subscribe((data) => {
        this.toastr.success("Batch Cancelled Successfully");
        this.getBatchOrders(false);
      }, (err) => {
        this.toastr.error(err.error.message);
      });
  }

  closeBatch(batch) {
    if (batch.cash_collected === null) {
      this.toastr.error("Please Enter Cash Collected Amount.");
      return;
    }
    if (batch.non_cash_collected === null) {
      this.toastr.error("Please Enter Non Cash Collected Amount.");
      return;
    }
    if (+batch.non_cash_collected > 0 && !batch.non_cash_type) {
      this.toastr.error("Please Select Non Cash Source.");
      return;
    }
    let obj = {
      cashCollected: +batch.cash_collected,
      nonCashCollected: +batch.non_cash_collected,
      cashReceivable: +batch.cash_receivable,
      inventoryShortageAmount: +batch.inventory_shortage,
      products: batch.products.map(product => {
        return {
          id: +product.id,
          currentQuantity: +product.current,
          returnQuantity: +product.received,
          returnReason: +product.reason,
        }
      })
    };
    if ((+batch.cash_collected + +batch.non_cash_collected - +batch.cash_receivable - +batch.inventory_shortage
          + +batch.payment_wallet_balance + +batch.payment_sadad_balance) != 0) {
      if (!JSON.parse(batch.difference_reason)) {
        this.toastr.error("Please Select Difference Reason.");
        return;
      } else {
        obj['differenceReason'] = +batch.difference_reason;
      }
    }
    if (+batch.non_cash_collected > 0 && batch.non_cash_type) {
      obj['nonCashType'] = +batch.non_cash_type;
    }
    let productCheck = false;
    obj.products.forEach(product => {
      if (product.currentQuantity != product.returnQuantity) {
        if (!product.returnReason) {
          productCheck = true;
        }
      } else {
        delete product.returnReason;
      }
    });
    if (productCheck) {
      this.toastr.error("Please Select Reason For Product Quantity Change.");
      return;
    }
    this.sharedFunctions
      .putRequest(`/api/v1/batch/${+batch.id}`, obj)
      .subscribe((data) => {
        this.toastr.success("Batch Closed Successfully");
        this.getBatchOrders(false);
      }, (err) => {
        this.toastr.error(err.error.message);
      });
  }

  pagination(event) {
    this.currentPage = event;
    this.getBatchOrders(false);
  }

  changeReceivedQuantity(batch, product, add) {
    if (add) {
      if (product.current > product.received) {
        product.received = product.received + 1;
      }
    } else {
      if (product.received > 0) {
        product.received = product.received - 1;
      }
    }
    batch.inventory_shortage = this.calculateMissingCash(batch);
  }

  calculateMissingCash(batch) {
    let inventory_shortage = 0;
    batch.products.forEach(product => {
      inventory_shortage += product.price * (product.current - product.received);
    });
    return +inventory_shortage;
  }

  findBatchDifferenceReason(difference_reason) {
    let reason = "";
    switch (difference_reason) {
      case this.DifferenceReasonTheft:
        reason = "Theft";
        break;
      case this.DifferenceReasonLostMoney:
        reason = "Lost money";
        break;
      case this.DifferenceReasonLostItems:
        reason = "Lost Items";
        break;
      case this.DifferenceReasonDoNotKnowReason:
        reason = "Don't Know The Reason";
        break;
      case this.DifferenceReasonDidNotTakeInventory:
        reason = "Didn't Take Inventory";
        break;
      case this.DifferenceReasonOther:
        reason = "Other";
        break;
    }
    return reason;
  }
}

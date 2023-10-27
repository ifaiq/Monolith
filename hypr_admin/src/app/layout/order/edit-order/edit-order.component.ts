import { Component, OnInit, ViewChild } from '@angular/core';
import { SharedFunctionsService } from '../../../shared/services/shared-function.service';
import { ViewContainerRef } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit-order',
  templateUrl: './edit-order.component.html',
  styleUrls: ['./edit-order.component.scss']
})
export class EditOrderComponent implements OnInit {
  orderId = '';

  order = {
    total_price: 0,
    items: [],
    removedItems: [],
    id:0
  };

  constructor(private sharedFunctions: SharedFunctionsService, private toastr: ToastsManager, vRef: ViewContainerRef, private activatedRoute: ActivatedRoute) {
    this.toastr.setRootViewContainerRef(vRef);
    this.activatedRoute.params.subscribe(params => {
      this.orderId = params['id'];
    });
  }

  ngOnInit() {
      this.sharedFunctions.getRequest('/order/getOrderById?order_id=' + this.orderId)
      .subscribe(data => {
      this.order = data.order;
      this.order['removedItems'] = [];
    })
  }

  editOrder(){
      this.sharedFunctions.postRequest('/order/editOrder', this.order)
      .subscribe(data => {
      this.toastr.success('Order Edited');
    },
    (err) => {
        if (this.sharedFunctions.isEmpty(err.error.message)) {
            this.toastr.error("Internal Server Error");
        } else {
            this.toastr.error(err.error.message);
        }
    });
  }

  setItemTotal(index){
    this.order.items[index].price = this.order.items[index].quantity *  this.order.items[index].sku.price;
    this.setOrderTotal();
  }

  setOrderTotal(){
    var sum = 0;
    for(var item of this.order.items){
      sum  = sum + (item.quantity * item.sku.price);
    }
    this.order.total_price = sum;
  }

  removeItem(index, id){
    this.order.items.splice(index, 1);
    this.order.removedItems.push(id);
    this.setOrderTotal();
  }

}

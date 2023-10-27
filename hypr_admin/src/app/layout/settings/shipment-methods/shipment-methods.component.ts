import { Component, OnInit } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SharedFunctionsService } from '../../../shared';

@Component({
  selector: 'app-shipment-method',
  templateUrl: './shipment-methods.component.html',
  styleUrls: ['./shipment-methods.component.scss']
})
export class ShipmentMethodComponent implements OnInit {
  shipmentMethods = [];

  constructor(private sharedFunctions: SharedFunctionsService, private toastr: ToastsManager, vRef: ViewContainerRef) {
    this.toastr.setRootViewContainerRef(vRef);
  }

  ngOnInit() {

    this.sharedFunctions.getRequest('/appType/getShipmentMethods')
      .subscribe((data) => {
        if (data.success) {
          this.shipmentMethods = data.data.shipmentMethods;
        } else {
          this.toastr.error("Something went wrong");
        }
      })
  }

  updateType(type) {

    this.sharedFunctions.postRequest('/appType/updateShipmentMethod', type)
      .subscribe((data) => {
        if(data.data.success){
          this.toastr.success("Type Updated Successfully");
        }else{
          this.toastr.success("Something went wrong");
        }
      },
        (err) => {
        });
  }
}

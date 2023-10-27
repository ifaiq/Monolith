import { Component, OnInit } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SharedFunctionsService } from '../../../shared';

@Component({
  selector: 'app-app-type',
  templateUrl: './app-type.component.html',
  styleUrls: ['./app-type.component.scss']
})
export class AppTypeComponent implements OnInit {
  appTypes = [];

  constructor(private sharedFunctions: SharedFunctionsService, private toastr: ToastsManager, vRef: ViewContainerRef) {
    this.toastr.setRootViewContainerRef(vRef);
  }

  ngOnInit() {

    this.sharedFunctions.getRequest('/appType/getAppTypes')
      .subscribe((data) => {
        if (data.success) {
          this.appTypes = data.data.appTypes;
        } else {
          this.toastr.error("Something went wrong");
        }
      })
  }

  updateType(type) {

    this.sharedFunctions.postRequest('/appType/updateAppType', type)
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

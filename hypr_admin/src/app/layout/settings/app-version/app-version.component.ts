import { Component, OnInit } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SharedFunctionsService } from '../../../shared';

@Component({
  selector: 'app-app-version',
  templateUrl: './app-version.component.html',
  styleUrls: ['./app-version.component.scss']
})
export class AppVersionComponent implements OnInit {
  appVersions = [];

  constructor(private sharedFunctions: SharedFunctionsService, private toastr: ToastsManager, vRef: ViewContainerRef) {
    this.toastr.setRootViewContainerRef(vRef);
  }

  ngOnInit() {

    this.sharedFunctions.getRequest('/appVersion/getAppVersions')
      .subscribe((data) => {
        if (data.success) {
          this.appVersions = data.data.appVersions;
        } else {
          this.toastr.error("Something went wrong");
        }
      })
  }

  updateVersion(version) {

    this.sharedFunctions.postRequest('/appVersion/updateAppVersion', version)
      .subscribe((data) => {
        if(data.success){
          this.toastr.success("App Updated Successfully");
        }else{
          this.toastr.success("Something went wrong");
        }
      },
        (err) => {
        });
  }
}

import { Component, OnInit } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SharedFunctionsService } from '../../../shared';

@Component({
  selector: 'app-role_api_perm',
  templateUrl: './role_api_perm.component.html',
  styleUrls: ['./role_api_perm.component.scss']
})
export class RolePermComponent implements OnInit {
  perms = [];

  constructor(private sharedFunctions: SharedFunctionsService, private toastr: ToastsManager, vRef: ViewContainerRef) {
    this.toastr.setRootViewContainerRef(vRef);
  }

  ngOnInit() {

    this.sharedFunctions.getRequest('/permission/listPermission')
      .subscribe((data) => {
        if (data.success) {
          this.perms = data.data;
        } else {
          this.toastr.error("Something went wrong");
        }
      })
  }
}

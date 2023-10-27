import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { Router } from '@angular/router';
import { SharedFunctionsService } from '../../../shared';

@Component({
  selector: 'app-user-permission',
  templateUrl: './user-permission.component.html',
  styleUrls: ['./user-permission.component.scss']
})
export class UserPermissionComponent implements OnInit {
  role_name = '';

  constructor(private sharedFunctions: SharedFunctionsService, private toastr: ToastsManager, vRef: ViewContainerRef, private router: Router) {
    this.toastr.setRootViewContainerRef(vRef);
  }

  ngOnInit() {
  }

  createNewRole(name) {
    if(name == ''){
      this.toastr.success('Please Enter Name');
      return false;
    }
    this.sharedFunctions.postRequest('/roles/createRole', { name: name })
      .subscribe((data) => {
        this.toastr.success('Created Successfully');
        this.router.navigateByUrl("/user/edit");
      });
  }

}

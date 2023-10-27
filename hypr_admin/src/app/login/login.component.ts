import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { routerTransition } from "../router.animations";
import { Router } from "@angular/router";
import { HttpHeaders } from "@angular/common/http";
import { Globals } from "../globals";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { NgxPermissionsService } from "ngx-permissions";
import { AccountSettingService } from "../shared/services/account-settings";
import { AuthInterceptor } from "../http-interceptors/auth-interceptor";
import { SharedFunctionsService } from "../shared";
import { RoleConstants } from "../constants/roles-constants";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  animations: [routerTransition()],
})
export class LoginComponent implements OnInit {
  username = "";
  password = "";

  constructor(
    public router: Router,
    private http: AuthInterceptor,
    private sharedFunctions: SharedFunctionsService,
    private globals: Globals,
    private toastr: ToastsManager,
    vRef: ViewContainerRef,
    public accountService: AccountSettingService,
    private permissionsService: NgxPermissionsService
  ) {
    this.toastr.setRootViewContainerRef(vRef);
  }

  ngOnInit() {
    var check = localStorage.getItem("isLoggedin");
    if (check == "true") {
      this.router.navigate(["/product"]);
    } else {
      localStorage.clear();
      this.sharedFunctions.removeAuthData();
    }
  }
  
  onLoggedin() {
    const body = {
      username: this.username,
      password: this.password,
      role_id: [RoleConstants.ADMIN, RoleConstants.COMPANY_OWNER],
    };
    this.sharedFunctions.postRequest("/auth/signin", body).subscribe(
      (result) => {
        if (result.code == "OK") {
          let data = result.data;
          let user = data.user;
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("isLoggedin", "true");
          this.sharedFunctions.setAuthData(data);
          this.sharedFunctions
            .getRequest("/rbac/permissions/getRolePermissionCodes", {
              roleId: user.role.id,
            })
            .subscribe((perm) => {
              this.toastr.success("Logged in as " + data.user.name, "Success!");
              this.permissionsService.flushPermissions();
              this.permissionsService.loadPermissions(perm.data);
              data.user["perms"] = perm.data;
              localStorage.setItem("userData", JSON.stringify(data.user));
              this.sharedFunctions.setAuthData({ token: data.token, user: data.user });
              this.setUserHierarcyData();
              this.accountService.setUserAccountSettings();
              setTimeout(() => {
                this.router.navigate(["/product"]);
              }, 1000);
            });
        } else {
          this.toastr.error("Something went wrong");
        }
      },
      (err) => {
        this.toastr.error(err.error.message);
      }
    );
  }

  setUserHierarcyData() {
    this.sharedFunctions
      .getRequest("/config/location")
      .subscribe((data) => {
        if (data && data.data && data.data) {
          localStorage.setItem(
            "userLocations",
            JSON.stringify(data.data)
          );
          localStorage.setItem(
            "company_code",
            "RET" // move this to constants
          );
        } else {
          localStorage.setItem("userLocations", JSON.stringify([]));
        }
      });
    this.sharedFunctions.getRequest("/config/businessunit").subscribe((data) => {
      if (data && data.data && data.data.length) {
        localStorage.setItem("userBUs", JSON.stringify(data.data));
      } else {
        localStorage.setItem("userBUs", JSON.stringify([]));
      }
    });
    this.sharedFunctions
      .getRequest("/config/company")
      .subscribe((data) => {
        if (data && data.data && data.data) {
          localStorage.setItem(
            "userCompanies",
            JSON.stringify(data.data)
          );
        } else {
          localStorage.setItem("userCompanies", JSON.stringify([]));
        }
      });
  }
}

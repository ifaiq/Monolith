import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { Router } from "@angular/router";
import { SharedFunctionsService } from "app/shared/services/shared-function.service";
import { NgxPermissionsService } from "ngx-permissions";
import { AccountSettingService } from "../../shared/services/account-settings";


@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private permissionsService: NgxPermissionsService,
        public accountService: AccountSettingService,
        private sharedFunctions: SharedFunctionsService,
    ) { }

    canActivate() {
        const { token, user } = this.sharedFunctions.getAuthData();
        if (token && token.length > 0) {
            localStorage.setItem("authToken", token);
            localStorage.setItem("isLoggedin", "true");
            if (!user["perms"]) {
                this.sharedFunctions.getRequest("/rbac/permissions/getRolePermissionCodes", {
                    roleId: user["role"].id,
                }).subscribe((perm) => {
                    this.permissionsService.flushPermissions();
                    this.permissionsService.loadPermissions(perm.data);
                    user["perms"] = perm.data;
                    this.sharedFunctions.setAuthData({ token, user });
                });
            }
            localStorage.setItem("userData", JSON.stringify(user));
            this.accountService.setUserAccountSettings();
            return true;
        }
        this.sharedFunctions.removeAuthData();
        localStorage.setItem("isLoggedin", "false");
        this.router.navigate(["/login"]);
        return false;
    }
}
